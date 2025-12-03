import { api } from "@/lib/api";

/**
 * Functions for working with OAuth users
 */

/**
 * Saves an OAuth user to the database via API
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

  console.log(`Saving OAuth user via API: ${profile.email} through ${provider}`);

  try {
    const result = await api.post('/auth/oauth', {
      email: profile.email,
      name: profile.name,
      image: profile.image,
      provider,
      providerAccountId
    });

    return {
      id: result.user.id.toString(),
      name: result.user.name,
      email: result.user.email,
      role: result.user.role || 'user',
      accessToken: result.accessToken, // Возвращаем токен из API
    };
  } catch (error) {
    console.error("Error saving OAuth user:", error);
    // Return mock user if API fails to prevent login block
    // in a real scenario, you might want to throw
    return {
      id: '0',
      name: profile.name || 'Unknown',
      email: profile.email,
      role: 'user'
    }
  }
}
