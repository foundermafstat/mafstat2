import { getDrizzle } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { hash } from "bcrypt"
import { z } from "zod"
import { sendSimpleRegistrationNotification } from "@/lib/email/notifications"

// Define the user registration schema
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

// Define the user update schema
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(["user", "admin", "moderator"]).optional(),
})

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: z.infer<typeof registerSchema>) {
    const db = getDrizzle()

    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, userData.email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists")
    }

    // Hash the password
    const hashedPassword = await hash(userData.password, 10)

    // Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: "user", // Default role
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })

    // Отправка уведомления о регистрации
    try {
      await sendSimpleRegistrationNotification({
        email: newUser.email,
        name: newUser.name,
      });
      console.log(`Уведомление о регистрации отправлено пользователю: ${newUser.email}`);
    } catch (error) {
      console.error('Ошибка при отправке уведомления о регистрации:', error);
      // Не выбрасываем ошибку, чтобы не блокировать процесс регистрации
    }

    return newUser
  }

  /**
   * Get a user by ID
   */
  static async getUserById(id: number) {
    const db = getDrizzle()

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user || null
  }

  /**
   * Get a user by email
   */
  static async getUserByEmail(email: string) {
    const db = getDrizzle()

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    return user || null
  }

  /**
   * Update a user
   */
  static async updateUser(id: number, userData: z.infer<typeof updateUserSchema>) {
    const db = getDrizzle()

    // Check if user exists
    const existingUser = await this.getUserById(id)
    if (!existingUser) {
      throw new Error("User not found")
    }

    // Check if email is being changed and if it's already in use
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.getUserByEmail(userData.email)
      if (emailExists) {
        throw new Error("Email is already in use")
      }
    }

    // Update the user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        email: userData.email?.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })

    return updatedUser
  }

  /**
   * Change user password
   */
  static async changePassword(id: number, newPassword: string) {
    const db = getDrizzle()

    // Check if user exists
    const existingUser = await this.getUserById(id)
    if (!existingUser) {
      throw new Error("User not found")
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10)

    // Update the password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    return true
  }

  /**
   * Delete a user
   */
  static async deleteUser(id: number) {
    const db = getDrizzle()

    // Check if user exists
    const existingUser = await this.getUserById(id)
    if (!existingUser) {
      throw new Error("User not found")
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, id))

    return true
  }

  /**
   * List all users
   */
  static async listUsers(page = 1, limit = 10) {
    const db = getDrizzle()

    const offset = (page - 1) * limit

    const usersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt)

    const [{ count }] = await db.select({ count: users.id.count() }).from(users)

    return {
      users: usersList,
      pagination: {
        total: Number(count),
        page,
        limit,
        pages: Math.ceil(Number(count) / limit),
      },
    }
  }
}
