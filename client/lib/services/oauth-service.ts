import { prisma } from "../prisma";
import { sendLoginNotification } from "../email/notifications";

/**
 * Functions for working with OAuth users
 */

/**
 * Saves an OAuth user to the database
 * @param {object} profile - User profile from OAuth provider
 * @param {string} provider - Name of the provider (google, github, etc.)
 * @param {string} providerAccountId - User ID in the provider system
 * @returns {Promise<{id: string, name: string, email: string, role: string}>} - User data
 */
export async function saveOAuthUser(
  profile: { name?: string; email?: string; image?: string }, 
  provider: string,
  providerAccountId?: string
) {
  if (!profile.email) {
    throw new Error("Email is required for OAuth authentication");
  }

  console.log(`Saving OAuth user: ${profile.email} through ${provider}`);

  try {
    // First step - check if there is already an account with this provider and providerAccountId
    if (providerAccountId) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          provider: provider,
          providerAccountId: providerAccountId
        },
        include: {
          user: true
        }
      });

      // If we found an account, return the associated user
      if (existingAccount?.user) {
        console.log(`Found existing account for ${provider} with ID ${providerAccountId}`);
        
        // Update profile image if it has changed
        if (profile.image && profile.image !== existingAccount.user.image) {
          await prisma.user.update({
            where: { id: existingAccount.user.id },
            data: { image: profile.image }
          });
        }

        return {
          id: existingAccount.user.id.toString(),
          name: existingAccount.user.name,
          email: existingAccount.user.email,
          role: existingAccount.user.role || 'user',
        };
      }
    }
    
    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });
    
    // If user already exists
    if (existingUser) {
      console.log(`User found in DB by email: ${existingUser.id} (${existingUser.email})`);
      
      // Обновляем поле image, если оно изменилось
      if (profile.image && profile.image !== existingUser.image) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { image: profile.image }
        });
      }
      
      // Create account record if it doesn't exist
      if (providerAccountId) {
        const accountExists = await prisma.account.findFirst({
          where: {
            userId: existingUser.id,
            provider: provider
          }
        });
        
        if (!accountExists) {
          console.log(`Создание записи аккаунта для: ${existingUser.email}, провайдер: ${provider}`);
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: 'oauth',
              provider: provider,
              providerAccountId: providerAccountId,
            }
          });
        }
      }
      
      // Send login notification
      try {
        await sendLoginNotification({
          email: existingUser.email,
          name: existingUser.name,
          provider,
        });
      } catch (error) {
        console.error('Error sending login notification:', error);
      }
      
      return {
        id: existingUser.id.toString(),
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role || 'user',
      };
    }
    
    // If user does not exist, create a new one
    const name = profile.name || profile.email.split('@')[0];
    console.log(`Creating new user: ${profile.email}, provider: ${provider}`);
    
    // Create user through Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email: profile.email.toLowerCase(),
        image: profile.image || null,
        role: 'user',
        emailVerified: new Date(), // Подтверждаем email автоматически для OAuth пользователей
      },
    });
    
    // Create account record
    if (providerAccountId) {
      console.log(`Creating account record for new user: ${newUser.email}, providerAccountId: ${providerAccountId}`);
      await prisma.account.create({
        data: {
          userId: newUser.id,
          type: 'oauth',
          provider,
          providerAccountId,
        }
      });
    }
    
    // Send login notification
    try {
      await sendLoginNotification({
        email: newUser.email,
        name: newUser.name,
        provider,
      });
    } catch (error) {
      console.error('Error sending login notification:', error);
    }
    
    return {
      id: newUser.id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'user',
    };
  } catch (error) {
    console.error("Error saving OAuth user:", error);
    throw error;
  }
}
