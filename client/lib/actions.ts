"use server"

import { revalidatePath } from "next/cache"
import { api } from "@/lib/api"

// Helper function for consistent error handling
// Note: api.get already throws errors for non-200 responses
async function fetchFromApi(endpoint: string, errorMessage: string) {
  try {
    const data = await api.get(endpoint)
    return { data: data || [], status: 200 }
  } catch (error: any) {
    console.error(`${errorMessage}:`, error)
    return {
      error: errorMessage,
      details: error.message || "Unknown error",
      status: 500,
    }
  }
}

// Get recent games
export async function getRecentGames() {
  try {
    // Call server API
    const games = await api.get('/games?limit=6&order=desc')
    return { data: games || [], status: 200 }
  } catch (error: any) {
    console.error("Failed to fetch recent games:", error)
    // Return empty array instead of error to prevent UI crash
    return { data: [], status: 200 } // Fail gracefully
  }
}

// Get top clubs
export async function getTopClubs() {
  try {
    const clubs = await api.get('/clubs/top')
    return { data: clubs || [], status: 200 }
  } catch (error: any) {
    console.error("Failed to fetch top clubs:", error)
    return { data: [], status: 200 }
  }
}

// Get dashboard stats
export async function getDashboardStats() {
  try {
    const stats = await api.get('/stats/dashboard')
    return { data: [stats], status: 200 }
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error)
    return { 
      data: [{
        games: 0,
        players: 0,
        clubs: 0,
        federations: 0,
        judges: 0
      }], 
      status: 200 
    }
  }
}

// Generic data fetching action
export async function fetchData(dataType: string, id?: string) {
  try {
    let endpoint = ''
    
    switch (dataType) {
      case "games":
        endpoint = '/games'
        break
      case "players":
        endpoint = '/players'
        break
      case "users":
        endpoint = '/users'
        break
      case "clubs":
        endpoint = '/clubs'
        break
      case "federations":
        endpoint = '/federations'
        break
      case "game":
        if (!id) return { error: "Game ID is required", status: 400 }
        endpoint = `/games/${id}`
        break
      default:
        return { error: `Unknown data type: ${dataType}`, status: 400 }
    }

    const data = await api.get(endpoint)
    return { data: data || [], status: 200 }
  } catch (error: any) {
    console.error(`Failed to fetch ${dataType}:`, error)
    return {
      error: `Failed to fetch ${dataType}`,
      details: error.message,
      status: 500,
    }
  }
}

// Action to create or update data
export async function saveData(dataType: string, data: any, id?: string) {
  try {
    let endpoint = ''
    let method: 'post' | 'put' = id ? 'put' : 'post'
    
    switch (dataType) {
      case "game":
        endpoint = id ? `/games/${id}` : '/games'
        break
      case "player":
        endpoint = id ? `/players/${id}` : '/players'
        break
      case "club":
        endpoint = id ? `/clubs/${id}` : '/clubs'
        break
      case "federation":
        endpoint = id ? `/federations/${id}` : '/federations'
        break
      default:
        return { error: `Unknown data type: ${dataType}`, status: 400 }
    }

    const result = await api[method](endpoint, data)

    // Revalidate the path to update the UI
    revalidatePath(`/${dataType}s`)
    if (id) revalidatePath(`/${dataType}s/${id}`)

    return { success: true, data: result }
  } catch (error: any) {
    console.error(`Error saving ${dataType}:`, error)
    return {
      error: `Failed to save ${dataType}`,
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}
