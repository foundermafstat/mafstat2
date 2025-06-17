import { query } from "../lib/db"

/**
 * Comprehensive database seed script for Mafia Game Application
 *
 * This script populates the database with realistic data for all models:
 * - Federations
 * - Clubs
 * - Players
 * - Games
 * - Game Players
 * - Game Stages
 * - Social Networks
 * - Game Side Referees
 */

// Configuration
const FEDERATION_COUNT = 3
const CLUBS_PER_FEDERATION = 3
const PLAYERS_PER_CLUB = 10
const GAMES_COUNT = 20
const PLAYERS_PER_GAME = 10

// Game types and roles
const GAME_TYPES = ["rating", "tournament", "regular", "test"]
const ROLES = ["peaceful", "mafia", "don", "sheriff"]
const GAME_RESULTS = ["peaceful_win", "mafia_win", "draw", null]
const STAGE_TYPES = ["day", "night"]
const SOCIAL_NETWORK_TYPES = ["facebook", "twitter", "instagram", "vk", "telegram", "linkedin"]
const COUNTRIES = ["USA", "Russia", "Ukraine", "Belarus", "Germany", "France", "Italy", "Spain", "UK", "Canada"]
const CITIES = [
  "New York",
  "Moscow",
  "Kyiv",
  "Minsk",
  "Berlin",
  "Paris",
  "Rome",
  "Madrid",
  "London",
  "Toronto",
  "Chicago",
  "St. Petersburg",
  "Lviv",
  "Gomel",
  "Munich",
  "Lyon",
  "Milan",
  "Barcelona",
  "Manchester",
  "Vancouver",
]

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random integer in range (inclusive)
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to get random boolean with probability
function getRandomBoolean(probability = 0.5): boolean {
  return Math.random() < probability
}

// Helper function to get random date in range
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to format date for SQL
function formatDate(date: Date): string {
  return date.toISOString()
}

// Helper function to generate random name
function generateRandomName(gender: "male" | "female"): { firstName: string; lastName: string } {
  const maleFirstNames = [
    "Alexander",
    "Michael",
    "Daniel",
    "Ivan",
    "Sergei",
    "Dmitry",
    "Vladimir",
    "Andrei",
    "Nikolai",
    "Viktor",
    "James",
    "John",
    "Robert",
    "William",
    "David",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Christopher",
  ]

  const femaleFirstNames = [
    "Anna",
    "Maria",
    "Olga",
    "Elena",
    "Natalia",
    "Tatiana",
    "Irina",
    "Svetlana",
    "Ekaterina",
    "Yulia",
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen",
  ]

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Garcia",
    "Rodriguez",
    "Wilson",
    "Ivanov",
    "Petrov",
    "Sidorov",
    "Kuznetsov",
    "Popov",
    "Vasiliev",
    "Sokolov",
    "Mikhailov",
    "Novikov",
    "Fedorov",
  ]

  const firstNames = gender === "male" ? maleFirstNames : femaleFirstNames

  return {
    firstName: getRandomItem(firstNames),
    lastName: getRandomItem(lastNames),
  }
}

// Helper function to generate random nickname
function generateRandomNickname(firstName: string): string | null {
  if (getRandomBoolean(0.7)) {
    const nicknames = [
      `${firstName.substring(0, 3)}`,
      `${firstName}_player`,
      `mafia_${firstName.toLowerCase()}`,
      `${firstName.toLowerCase()}${getRandomInt(1, 99)}`,
      `the_${firstName.toLowerCase()}`,
      `${firstName.charAt(0)}${getRandomInt(100, 999)}`,
    ]
    return getRandomItem(nicknames)
  }
  return null
}

// Helper function to generate federation additional points conditions
function generateFederationPointsConditions(federationName: string): any {
  switch (federationName) {
    case "FMAF":
      return [
        { condition: "2+ mafia", points: 0.1 },
        { condition: "3 mafia", points: 0.2 },
        { condition: "don check sheriff", points: 0.3 },
        { condition: "sheriff check mafia", points: 0.4 },
        { condition: "best move", points: 0.5 },
      ]
    case "MAF":
      return [
        { condition: "2+ mafia", points: 0.25 },
        { condition: "3 mafia", points: 0.5 },
        { condition: "don check sheriff", points: 0.75 },
        { condition: "best move", points: 1 },
      ]
    case "FIDE":
      return [
        { condition: "2+ mafia", points: 1 },
        { condition: "3 mafia", points: 2 },
        { condition: "best move", points: 3 },
      ]
    default:
      return [
        { condition: "2+ mafia", points: 0.5 },
        { condition: "3 mafia", points: 1 },
      ]
  }
}

// Helper function to generate night action data
function generateNightActionData(playerCount: number): any {
  const mafiaShot = getRandomBoolean(0.8) ? getRandomInt(1, playerCount) : null
  const donCheck = getRandomBoolean(0.9) ? getRandomInt(1, playerCount) : null
  const sheriffCheck = getRandomBoolean(0.9) ? getRandomInt(1, playerCount) : null

  return {
    mafiaShot,
    donCheck,
    sheriffCheck,
  }
}

// Helper function to generate day vote data
function generateDayVoteData(playerCount: number): any {
  const candidates = Array(10)
    .fill(0)
    .map(() => (getRandomBoolean(0.3) ? getRandomInt(1, playerCount) : 0))

  const votes = candidates.map((candidate) => (candidate > 0 ? getRandomInt(0, 5) : 0))

  const revote = candidates.map((candidate) => (candidate > 0 && getRandomBoolean(0.3) ? getRandomInt(0, 3) : 0))

  const results = []
  const candidatesWithVotes = candidates
    .map((candidate, index) => ({ candidate, votes: votes[index] }))
    .filter((item) => item.candidate > 0 && item.votes > 0)

  if (candidatesWithVotes.length > 0) {
    // Sort by votes descending
    candidatesWithVotes.sort((a, b) => b.votes - a.votes)

    // Add top candidate to results
    results.push(candidatesWithVotes[0].candidate)

    // Sometimes add second candidate
    if (candidatesWithVotes.length > 1 && getRandomBoolean(0.3)) {
      results.push(candidatesWithVotes[1].candidate)
    }
  }

  return {
    candidates,
    votes,
    revote,
    results,
  }
}

// Main seed function
async function seedDatabase() {
  try {
    console.log("Starting database seed process...")

    // Clear existing data (in reverse order of dependencies)
    console.log("Clearing existing data...")
    await query("DELETE FROM game_side_referees")
    await query("DELETE FROM social_networks")
    await query("DELETE FROM game_stages")
    await query("DELETE FROM game_players")
    await query("DELETE FROM games")
    await query("DELETE FROM players")
    await query("DELETE FROM clubs")
    await query("DELETE FROM federations")

    // 1. Seed Federations
    console.log("Seeding federations...")
    const federationNames = ["FMAF", "MAF", "FIDE"]
    const federationIds = []

    for (let i = 0; i < FEDERATION_COUNT; i++) {
      const name = federationNames[i] || `Federation ${i + 1}`
      const country = getRandomItem(COUNTRIES)
      const city = getRandomItem(CITIES.filter((c) => getRandomBoolean(0.7)))
      const additionalPointsConditions = JSON.stringify(generateFederationPointsConditions(name))

      const result = await query(
        `
        INSERT INTO federations (
          name, 
          description, 
          url, 
          country, 
          city, 
          additional_points_conditions, 
          created_at, 
          updated_at
        )
        VALUES (
          $1, 
          $2, 
          $3, 
          $4, 
          $5, 
          $6, 
          NOW(), 
          NOW()
        )
        RETURNING id
      `,
        [
          name,
          `${name} is an international mafia game federation established to standardize rules and organize tournaments.`,
          `https://www.${name.toLowerCase()}.org`,
          country,
          city,
          additionalPointsConditions,
        ],
      )

      federationIds.push(result.rows[0].id)
    }

    // 2. Seed Clubs
    console.log("Seeding clubs...")
    const clubIds = []
    const clubNames = [
      "Mafia Masters",
      "Night Wolves",
      "City Shadows",
      "Dark Knights",
      "Silent Killers",
      "Peaceful Citizens",
      "Truth Seekers",
      "Logic Masters",
      "Strategic Minds",
      "Game Theory",
    ]

    let clubIndex = 0
    for (const federationId of federationIds) {
      for (let i = 0; i < CLUBS_PER_FEDERATION; i++) {
        const name = clubNames[clubIndex] || `Club ${clubIndex + 1}`
        clubIndex++

        const country = getRandomItem(COUNTRIES)
        const city = getRandomItem(CITIES)

        const result = await query(
          `
          INSERT INTO clubs (
            name, 
            description, 
            url, 
            country, 
            city, 
            federation_id, 
            created_at, 
            updated_at
          )
          VALUES (
            $1, 
            $2, 
            $3, 
            $4, 
            $5, 
            $6, 
            NOW(), 
            NOW()
          )
          RETURNING id
        `,
          [
            name,
            `${name} is a club dedicated to playing and promoting the intellectual game of Mafia.`,
            `https://www.${name.toLowerCase().replace(/\s+/g, "")}.com`,
            country,
            city,
            federationId,
          ],
        )

        clubIds.push(result.rows[0].id)
      }
    }

    // 3. Seed Players
    console.log("Seeding players...")
    const playerIds = []
    const judgeIds = []

    for (const clubId of clubIds) {
      for (let i = 0; i < PLAYERS_PER_CLUB; i++) {
        const gender = getRandomBoolean() ? "male" : "female"
        const { firstName, lastName } = generateRandomName(gender)
        const nickname = generateRandomNickname(firstName)
        const country = getRandomItem(COUNTRIES)
        const birthday = formatDate(getRandomDate(new Date(1980, 0, 1), new Date(2005, 0, 1)))
        const isTournamentJudge = getRandomBoolean(0.2)
        const isSideJudge = !isTournamentJudge && getRandomBoolean(0.3)

        const result = await query(
          `
          INSERT INTO players (
            name, 
            surname, 
            nickname, 
            country, 
            club_id, 
            birthday, 
            gender, 
            photo_url, 
            is_tournament_judge, 
            is_side_judge, 
            created_at, 
            updated_at
          )
          VALUES (
            $1, 
            $2, 
            $3, 
            $4, 
            $5, 
            $6, 
            $7, 
            $8, 
            $9, 
            $10, 
            NOW(), 
            NOW()
          )
          RETURNING id
        `,
          [
            firstName,
            lastName,
            nickname,
            country,
            clubId,
            birthday,
            gender,
            null, // photo_url
            isTournamentJudge,
            isSideJudge,
          ],
        )

        const playerId = result.rows[0].id
        playerIds.push(playerId)

        if (isTournamentJudge) {
          judgeIds.push(playerId)
        }

        // Add social networks for some players
        if (getRandomBoolean(0.7)) {
          const networkCount = getRandomInt(1, 3)
          const usedTypes = new Set()

          for (let j = 0; j < networkCount; j++) {
            let networkType
            do {
              networkType = getRandomItem(SOCIAL_NETWORK_TYPES)
            } while (usedTypes.has(networkType))

            usedTypes.add(networkType)

            await query(
              `
              INSERT INTO social_networks (
                player_id, 
                type, 
                url, 
                created_at, 
                updated_at
              )
              VALUES (
                $1, 
                $2, 
                $3, 
                NOW(), 
                NOW()
              )
            `,
              [
                playerId,
                networkType,
                `https://www.${networkType}.com/${nickname || firstName.toLowerCase()}${getRandomInt(1, 999)}`,
              ],
            )
          }
        }
      }
    }

    // 4. Seed Games
    console.log("Seeding games...")
    const gameIds = []

    for (let i = 0; i < GAMES_COUNT; i++) {
      const name = `Game #${i + 1}`
      const description = getRandomBoolean(0.7)
        ? `This is a ${getRandomItem(GAME_TYPES)} game played on ${new Date().toLocaleDateString()}`
        : null
      const gameType = getRandomItem(GAME_TYPES)
      const result = getRandomItem(GAME_RESULTS)
      const refereeId = getRandomItem(judgeIds)
      const refereeComments = getRandomBoolean(0.5)
        ? `Game was ${result === "peaceful_win" ? "well balanced" : "challenging"}. Players showed good skills.`
        : null
      const tableNumber = getRandomInt(1, 10)
      const clubId = getRandomItem(clubIds)
      const federationId = getRandomItem(federationIds)
      const createdAt = formatDate(getRandomDate(new Date(2022, 0, 1), new Date()))

      const gameResult = await query(
        `
        INSERT INTO games (
          name, 
          description, 
          game_type, 
          result, 
          referee_id, 
          referee_comments, 
          table_number, 
          club_id, 
          federation_id, 
          created_at, 
          updated_at
        )
        VALUES (
          $1, 
          $2, 
          $3, 
          $4, 
          $5, 
          $6, 
          $7, 
          $8, 
          $9, 
          $10, 
          $10
        )
        RETURNING id
      `,
        [name, description, gameType, result, refereeId, refereeComments, tableNumber, clubId, federationId, createdAt],
      )

      const gameId = gameResult.rows[0].id
      gameIds.push(gameId)

      // 5. Seed Game Players
      console.log(`Seeding players for game ${gameId}...`)

      // Select random players for this game
      const availablePlayers = [...playerIds]
      const gamePlayerIds = []

      for (let j = 0; j < PLAYERS_PER_GAME; j++) {
        if (availablePlayers.length === 0) break

        // Get random player and remove from available pool
        const randomIndex = Math.floor(Math.random() * availablePlayers.length)
        const playerId = availablePlayers[randomIndex]
        availablePlayers.splice(randomIndex, 1)

        gamePlayerIds.push(playerId)
      }

      // Assign roles to players
      const roles = [
        "sheriff", // 1 sheriff
        "don", // 1 don
        "mafia",
        "mafia", // 2 mafia
      ]

      // Fill the rest with peaceful
      while (roles.length < gamePlayerIds.length) {
        roles.push("peaceful")
      }

      // Shuffle roles
      for (let j = roles.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[roles[j], roles[k]] = [roles[k], roles[j]]
      }

      // Assign players to slots with roles
      for (let j = 0; j < gamePlayerIds.length; j++) {
        const playerId = gamePlayerIds[j]
        const role = roles[j]
        const slotNumber = j + 1
        const fouls = getRandomInt(0, 3)
        const additionalPoints = getRandomBoolean(0.7) ? getRandomItem([0, 0.1, 0.2, 0.25, 0.3, 0.5, 0.75, 1]) : 0

        await query(
          `
          INSERT INTO game_players (
            game_id, 
            player_id, 
            role, 
            fouls, 
            additional_points, 
            slot_number, 
            created_at, 
            updated_at
          )
          VALUES (
            $1, 
            $2, 
            $3, 
            $4, 
            $5, 
            $6, 
            NOW(), 
            NOW()
          )
        `,
          [gameId, playerId, role, fouls, additionalPoints, slotNumber],
        )
      }

      // 6. Seed Game Stages
      console.log(`Seeding stages for game ${gameId}...`)

      // Determine number of days/nights (1-5 pairs)
      const dayNightPairs = getRandomInt(1, 5)

      for (let j = 0; j < dayNightPairs; j++) {
        // Night comes first (odd order number)
        const nightOrderNumber = j * 2 + 1
        const nightData = generateNightActionData(gamePlayerIds.length)

        await query(
          `
          INSERT INTO game_stages (
            game_id, 
            type, 
            order_number, 
            data, 
            created_at, 
            updated_at
          )
          VALUES (
            $1, 
            $2, 
            $3, 
            $4, 
            NOW(), 
            NOW()
          )
        `,
          [gameId, "night", nightOrderNumber, JSON.stringify(nightData)],
        )

        // Then day (even order number)
        const dayOrderNumber = j * 2 + 2
        const dayData = generateDayVoteData(gamePlayerIds.length)

        await query(
          `
          INSERT INTO game_stages (
            game_id, 
            type, 
            order_number, 
            data, 
            created_at, 
            updated_at
          )
          VALUES (
            $1, 
            $2, 
            $3, 
            $4, 
            NOW(), 
            NOW()
          )
        `,
          [gameId, "day", dayOrderNumber, JSON.stringify(dayData)],
        )
      }

      // 7. Seed Game Side Referees
      if (getRandomBoolean(0.7)) {
        console.log(`Seeding side referees for game ${gameId}...`)

        // Get available judges (excluding the main referee)
        const availableJudges = judgeIds.filter((id) => id !== refereeId)

        if (availableJudges.length > 0) {
          const sideRefereeCount = Math.min(getRandomInt(1, 3), availableJudges.length)

          for (let j = 0; j < sideRefereeCount; j++) {
            const sideRefereeId = availableJudges[j]

            await query(
              `
              INSERT INTO game_side_referees (
                game_id, 
                player_id, 
                created_at, 
                updated_at
              )
              VALUES (
                $1, 
                $2, 
                NOW(), 
                NOW()
              )
            `,
              [gameId, sideRefereeId],
            )
          }
        }
      }
    }

    console.log("Database seed completed successfully!")
    console.log(`Created ${federationIds.length} federations`)
    console.log(`Created ${clubIds.length} clubs`)
    console.log(`Created ${playerIds.length} players (${judgeIds.length} judges)`)
    console.log(`Created ${gameIds.length} games`)

    return {
      success: true,
      federations: federationIds.length,
      clubs: clubIds.length,
      players: playerIds.length,
      judges: judgeIds.length,
      games: gameIds.length,
    }
  } catch (error) {
    console.error("Error seeding database:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Execute the seed function
seedDatabase()
  .then((result) => {
    console.log("Seed result:", result)
    process.exit(result.success ? 0 : 1)
  })
  .catch((error) => {
    console.error("Unhandled error during seeding:", error)
    process.exit(1)
  })
