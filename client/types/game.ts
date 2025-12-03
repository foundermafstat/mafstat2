export type Role = "civilian" | "mafia" | "don" | "sheriff"
export type GameType = "classic_10" | "classic_8" | "tournament" | "rating" | "custom"
export type GameResult = "civilians_win" | "mafia_win" | "draw"
export type StageType = "day" | "night"
export type Gender = "male" | "female" | "other"
export type SocialNetworkType = "facebook" | "twitter" | "instagram" | "vk" | "telegram" | "linkedin" | "other"

export interface Federation {
  id: number
  name: string
  url: string | null
  description: string | null
  country: string | null
  city: string | null
  additional_points_conditions: any
  created_at: string
  updated_at: string
  club_count?: number
  game_count?: number
  player_count?: number
}

export interface Club {
  id: number
  name: string
  url: string | null
  description: string | null
  country: string | null
  city: string | null
  federation_ids?: number[]
  federation_names?: string[]
  player_count?: number
  game_count?: number
  players?: {
    id: number
    name: string
    surname: string | null
    nickname: string | null
  }[]
  created_at: string
  updated_at: string
}

export interface Player {
  id: number
  name: string
  surname: string
  nickname: string | null
  country: string | null
  club_id: number | null
  club_name?: string
  birthday: string | null
  gender: Gender | null
  photo_url: string | null
  is_tournament_judge: boolean
  is_side_judge: boolean
  created_at: string
  updated_at: string
}

export interface SocialNetwork {
  id: number
  player_id: number
  type: SocialNetworkType
  url: string
  created_at: string
  updated_at: string
}

export interface GamePlayer {
	photoUrl: string;
	slot_number: any;
	photo_url: undefined;
	player_id: any;
	additional_points: any;
  id: number
  gameId: number
  playerId: number
  role: Role
  fouls: number
  additionalPoints: number
  slotNumber: number
  name?: string
  surname?: string
  nickname?: string
  club_name?: string
  createdAt: string
  updatedAt: string
}

export interface GameStage {
  id: number
  game_id: number
  type: StageType
  order_number: number
  data: any
  created_at: string
  updated_at: string
}

export interface Game {
  id: number
  name: string | null
  description: string | null
  gameType: GameType
  result: GameResult | null
  refereeId: number | null
  refereeName?: string
  refereeComments: string | null
  createdAt: string
  updatedAt: string
  players?: GamePlayer[]
  sideReferees?: any[]
  stages?: GameStage[]
}

export interface NightAction {
  mafiaShot: number | null
  mafiaMissed?: number[] // Массив номеров мафии, которые промахнулись
  donCheck: number | null
  sheriffCheck: number | null
}

export interface DayVote {
  candidates: number[]
  votes: number[]
  revote: number[]
  results: number[]
}

export interface GameState {
  id?: number
  gameId?: number // ID игры для редактирования
  players: GamePlayer[]
  federation: string
  club: string
  table: number
  dateTime: string
  judge: string
  gameType: GameType
  name?: string // Название игры
  description?: string // Описание игры
  result?: string // Результат игры (civilians_win, mafia_win, draw)
  nightActions: NightAction[]
  dayVotes: DayVote[]
  bestMove?: {
    killedPlayer: string
    nominatedPlayers: string[]
  }
}
