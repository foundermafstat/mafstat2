import { NextResponse } from "next/server"
import { neon, neonConfig } from "@neondatabase/serverless"
import WebSocket from "ws"
import type { Server } from "socket.io"

// Configure neon to use WebSockets
neonConfig.webSocketConstructor = WebSocket

// Create a connection pool
const pool = neon(process.env.DATABASE_URL!)

// Store active connections
let io: Server | null = null

export async function GET(req: Request) {
  // This endpoint will be used to establish the WebSocket connection
  if (!io) {
    // Initialize Socket.IO server if not already initialized
    const { Server } = await import("socket.io")
    const { createServer } = await import("http")
    const httpServer = createServer()

    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Handle subscription to different data types
      socket.on("subscribe", async (dataType) => {
        console.log(`Client ${socket.id} subscribed to ${dataType}`)

        // Initial data load
        try {
          const data = await fetchData(dataType)
          socket.emit(`${dataType}:data`, data)
        } catch (error) {
          console.error(`Error fetching initial ${dataType} data:`, error)
          socket.emit(`${dataType}:error`, { message: "Failed to fetch initial data" })
        }
      })

      // Handle unsubscribe
      socket.on("unsubscribe", (dataType) => {
        console.log(`Client ${socket.id} unsubscribed from ${dataType}`)
      })

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    // Start listening on a port
    const PORT = process.env.SOCKET_PORT || 3001
    httpServer.listen(PORT, () => {
      console.log(`Socket.IO server running on port ${PORT}`)
    })

    // Set up database change listeners
    setupDatabaseListeners(io)
  }

  return NextResponse.json({
    status: "ok",
    socketUrl:
      process.env.NEXT_PUBLIC_SOCKET_URL || `ws://${req.headers.get("host")?.split(":")[0] || "localhost"}:3001`,
  })
}

// Function to fetch data based on type
async function fetchData(dataType: string) {
  try {
    let query = ""

    switch (dataType) {
      case "games":
        query = `
          SELECT g.*, 
                 CASE WHEN p.name IS NOT NULL AND p.surname IS NOT NULL 
                      THEN p.name || ' ' || p.surname 
                      ELSE 'Unknown' 
                 END as referee_name
          FROM games g
          LEFT JOIN players p ON g.referee_id = p.id
          ORDER BY g.created_at DESC
        `
        break
      case "players":
        query = `
          SELECT p.*, c.name as club_name
          FROM players p
          LEFT JOIN clubs c ON p.club_id = c.id
          ORDER BY p.name ASC, p.surname ASC
        `
        break
      case "clubs":
        query = `
          SELECT c.*, f.name as federation_name
          FROM clubs c
          LEFT JOIN federations f ON c.federation_id = f.id
          ORDER BY c.name ASC
        `
        break
      case "federations":
        query = `
          SELECT f.*
          FROM federations f
          ORDER BY f.name ASC
        `
        break
      default:
        throw new Error(`Unknown data type: ${dataType}`)
    }

    const result = await pool.query(query)
    return result.rows || []
  } catch (error) {
    console.error(`Error fetching ${dataType}:`, error)
    throw error
  }
}

// Set up database change listeners using triggers and notifications
async function setupDatabaseListeners(io: Server) {
  try {
    // Create notification functions and triggers if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        -- Create notification function for games
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_game_change') THEN
          CREATE OR REPLACE FUNCTION notify_game_change()
          RETURNS trigger AS $$
          BEGIN
            PERFORM pg_notify('game_changes', row_to_json(NEW)::text);
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        END IF;
        
        -- Create notification function for players
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_player_change') THEN
          CREATE OR REPLACE FUNCTION notify_player_change()
          RETURNS trigger AS $$
          BEGIN
            PERFORM pg_notify('player_changes', row_to_json(NEW)::text);
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        END IF;
        
        -- Create notification function for clubs
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_club_change') THEN
          CREATE OR REPLACE FUNCTION notify_club_change()
          RETURNS trigger AS $$
          BEGIN
            PERFORM pg_notify('club_changes', row_to_json(NEW)::text);
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        END IF;
        
        -- Create notification function for federations
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_federation_change') THEN
          CREATE OR REPLACE FUNCTION notify_federation_change()
          RETURNS trigger AS $$
          BEGIN
            PERFORM pg_notify('federation_changes', row_to_json(NEW)::text);
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        END IF;
        
        -- Create triggers if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'games_notify_trigger') THEN
          CREATE TRIGGER games_notify_trigger
          AFTER INSERT OR UPDATE OR DELETE ON games
          FOR EACH ROW EXECUTE FUNCTION notify_game_change();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'players_notify_trigger') THEN
          CREATE TRIGGER players_notify_trigger
          AFTER INSERT OR UPDATE OR DELETE ON players
          FOR EACH ROW EXECUTE FUNCTION notify_player_change();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'clubs_notify_trigger') THEN
          CREATE TRIGGER clubs_notify_trigger
          AFTER INSERT OR UPDATE OR DELETE ON clubs
          FOR EACH ROW EXECUTE FUNCTION notify_club_change();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'federations_notify_trigger') THEN
          CREATE TRIGGER federations_notify_trigger
          AFTER INSERT OR UPDATE OR DELETE ON federations
          FOR EACH ROW EXECUTE FUNCTION notify_federation_change();
        END IF;
      END
      $$;
    `)

    // Listen for database notifications
    const notificationClient = neon(process.env.DATABASE_URL!)

    // Listen for game changes
    await notificationClient.query("LISTEN game_changes")
    notificationClient.on("notification", (msg) => {
      if (msg.channel === "game_changes" && msg.payload) {
        io.emit("games:update", JSON.parse(msg.payload))
      }
    })

    // Listen for player changes
    await notificationClient.query("LISTEN player_changes")
    notificationClient.on("notification", (msg) => {
      if (msg.channel === "player_changes" && msg.payload) {
        io.emit("players:update", JSON.parse(msg.payload))
      }
    })

    // Listen for club changes
    await notificationClient.query("LISTEN club_changes")
    notificationClient.on("notification", (msg) => {
      if (msg.channel === "club_changes" && msg.payload) {
        io.emit("clubs:update", JSON.parse(msg.payload))
      }
    })

    // Listen for federation changes
    await notificationClient.query("LISTEN federation_changes")
    notificationClient.on("notification", (msg) => {
      if (msg.channel === "federation_changes" && msg.payload) {
        io.emit("federations:update", JSON.parse(msg.payload))
      }
    })

    console.log("Database listeners set up successfully")
  } catch (error) {
    console.error("Error setting up database listeners:", error)
  }
}
