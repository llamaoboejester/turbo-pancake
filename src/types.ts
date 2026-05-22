export type Icon = 'whimsy' | 'edge' | 'nature' | 'tradition' | 'elegance'

export type VendorCategory =
  | 'attire_accessories'
  | 'ceremony'
  | 'entertainment'
  | 'favors_gifts'
  | 'flowers_decorations'
  | 'food_drink'
  | 'photography'
  | 'stationery'
  | 'transportation'

export interface VendorCard {
  id: string
  type: 'vendor'
  name: string
  category: VendorCategory
  cost: number
  excitement: number
  icons: Icon[]
}

export interface VenueCard {
  id: string
  type: 'venue'
  name: string
  cost: number
  excitement: number
  icons: Icon[]
}

export interface ScoringCard {
  id: string
  type: 'scoring'
  name: string
  category: VendorCategory
  frontFormula: string
  backIcon: Icon
}

export interface Theme {
  id: string
  name: string
  icons: [Icon, Icon]
}

export interface ThemeCard {
  id: string
  front: Theme
  back: Theme
}

export type AnyCard = VendorCard | VenueCard | ScoringCard

export type GridPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type GridBonus = 'draw2' | 'book' | 'coins3' | 'none'

export const GRID_BONUSES: Record<GridPosition, GridBonus> = {
  1: 'draw2',
  2: 'book',
  3: 'coins3',
  4: 'book',
  5: 'none',
  6: 'book',
  7: 'coins3',
  8: 'book',
  9: 'draw2',
}

export type PlayerGrid = Record<GridPosition, VendorCard | VenueCard | null>

export interface PlayerState {
  id: 1 | 2
  coins: number
  grid: PlayerGrid
  stagingVendors: VendorCard[]
  stagingVenues: VenueCard[]
  scoringCards: ScoringCard[]
  themeCard: ThemeCard | null
  chosenTheme: Theme | null
}

export type MarketType = 'vendor' | 'venue' | 'scoring'

export interface Market {
  visible: (AnyCard | null)[]
  deck: AnyCard[]
}

export type GamePhase =
  | 'setup'
  | 'action_select'
  | 'taking_cards'
  | 'booking'
  | 'swapping'
  | 'bonus_draw2'
  | 'bonus_book'
  | 'venue_bonus_take'
  | 'midgame_theme_select'
  | 'endgame_scoring'

export interface GameState {
  phase: GamePhase
  activePlayer: 1 | 2
  turnNumber: number
  roundNumber: number
  players: { 1: PlayerState; 2: PlayerState }
  markets: { vendor: Market; venue: Market; scoring: Market }
  pendingAction: PendingAction | null
  bonusBookDepth: number
}

export type PendingAction =
  | { type: 'take2'; taken: AnyCard[] }
  | { type: 'book'; card: VendorCard | VenueCard | null }
  | { type: 'swap'; replacePosition: GridPosition | null }
  | { type: 'bonus_draw2'; taken: AnyCard[] }
  | { type: 'bonus_book'; card: VendorCard | VenueCard | null }
  | { type: 'venue_bonus_take'; taken: AnyCard[] }
