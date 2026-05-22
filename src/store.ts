import { create } from 'zustand'
import type {
  GameState,
  PlayerState,
  AnyCard,
  VendorCard,
  VenueCard,
  GoalCard,
  GridPosition,
  Market,
  MarketType,
  ThemeCard,
  Theme,
} from './types'
import { GRID_BONUSES } from './types'

const TURNS_PER_PLAYER = 12
const VENDOR_HAND_LIMIT = 5
const VENUE_HAND_LIMIT = 2

function emptyGrid(): PlayerState['grid'] {
  return { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null }
}

function makePlayer(id: 1 | 2): PlayerState {
  return {
    id,
    coins: 6,
    grid: emptyGrid(),
    stagingVendors: [],
    stagingVenues: [],
    goals: [],
    themeCard: null,
    chosenTheme: null,
  }
}

function makeMarket(cards: AnyCard[]): Market {
  const deck = [...cards]
  const visible: (AnyCard | null)[] = [deck.shift() ?? null, deck.shift() ?? null, deck.shift() ?? null]
  return { visible, deck }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function replenishMarket(market: Market): Market {
  const visible = [...market.visible]
  const deck = [...market.deck]
  for (let i = 0; i < visible.length; i++) {
    if (visible[i] === null && deck.length > 0) {
      visible[i] = deck.shift()!
    }
  }
  return { visible, deck }
}

function discardOldestFromMarket(market: Market): Market {
  const visible = [...market.visible]
  const deck = [...market.deck]
  // Slot 0 is oldest — discard it, slide left, draw new card
  visible.shift()
  visible.push(deck.length > 0 ? deck.shift()! : null)
  return { visible, deck }
}

export interface GameStore extends GameState {
  loadData: (vendors: VendorCard[], venues: VenueCard[], goals: GoalCard[], themes: ThemeCard[]) => void
  selectAction: (action: 'take2' | 'gain3coins' | 'book' | 'swap') => void
  takeCard: (marketType: MarketType, index: number | 'blind') => void
  confirmTake: () => void
  selectCardToBook: (card: VendorCard | VenueCard) => void
  bookCard: (position: GridPosition) => void
  selectCardToSwap: (card: VendorCard) => void
  swapCard: (marketType: MarketType, index: number | 'blind') => void
  discardFromStaging: (card: VendorCard | VenueCard) => void
  selectTheme: (theme: Theme) => void
  confirmScoring: () => void
  _applyBonus: (bonus: import('./types').GridBonus, depth: number) => void
  _resolveBonus: () => void
  _endTurn: () => void
}

const initialState: GameState = {
  phase: 'setup',
  activePlayer: 1,
  turnNumber: 1,
  roundNumber: 1,
  players: { 1: makePlayer(1), 2: makePlayer(2) },
  markets: {
    vendor: { visible: [null, null, null], deck: [] },
    venue: { visible: [null, null, null], deck: [] },
    goal: { visible: [null, null, null], deck: [] },
  },
  pendingAction: null,
  bonusBookDepth: 0,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  loadData(vendors, venues, goals, themes) {
    const shuffledVendors = shuffle(vendors)
    const shuffledVenues = shuffle(venues)
    const shuffledGoals = shuffle(goals)
    const shuffledThemes = shuffle(themes)

    const vendorMarket = makeMarket(shuffledVendors as AnyCard[])
    const venueMarket = makeMarket(shuffledVenues as AnyCard[])
    const goalMarket = makeMarket(shuffledGoals as AnyCard[])

    // Deal 2 starting vendors to each player from the vendor deck
    const p1StartVendors: VendorCard[] = []
    const p2StartVendors: VendorCard[] = []
    while (p1StartVendors.length < 2 && vendorMarket.deck.length > 0) {
      p1StartVendors.push(vendorMarket.deck.shift() as VendorCard)
    }
    while (p2StartVendors.length < 2 && vendorMarket.deck.length > 0) {
      p2StartVendors.push(vendorMarket.deck.shift() as VendorCard)
    }

    const p1ThemeCard = shuffledThemes[0] ?? null
    const p2ThemeCard = shuffledThemes[1] ?? null

    set({
      phase: 'action_select',
      activePlayer: 1,
      turnNumber: 1,
      roundNumber: 1,
      pendingAction: null,
      bonusBookDepth: 0,
      markets: {
        vendor: vendorMarket,
        venue: venueMarket,
        goal: goalMarket,
      },
      players: {
        1: { ...makePlayer(1), stagingVendors: p1StartVendors, themeCard: p1ThemeCard },
        2: { ...makePlayer(2), stagingVendors: p2StartVendors, themeCard: p2ThemeCard },
      },
    })
  },

  selectAction(action) {
    const { phase, activePlayer, players } = get()
    if (phase !== 'action_select') return

    const player = players[activePlayer]

    if (action === 'take2') {
      set({ phase: 'taking_cards', pendingAction: { type: 'take2', taken: [] } })
    } else if (action === 'gain3coins') {
      set((s) => ({
        players: {
          ...s.players,
          [activePlayer]: { ...player, coins: player.coins + 3 },
        },
      }))
      get()._endTurn()
    } else if (action === 'book') {
      set({ phase: 'booking', pendingAction: { type: 'book', card: null as unknown as VendorCard } })
    } else if (action === 'swap') {
      set({ phase: 'swapping', pendingAction: { type: 'swap', newCard: null } })
    }
  },

  takeCard(marketType, index) {
    const { phase, activePlayer, players, markets, pendingAction } = get()
    if (phase !== 'taking_cards' && phase !== 'bonus_draw2') return
    if (!pendingAction || (pendingAction.type !== 'take2' && pendingAction.type !== 'bonus_draw2')) return

    const player = players[activePlayer]
    const market = markets[marketType]
    let card: AnyCard | null = null
    let newMarket = { ...market }

    if (index === 'blind') {
      if (market.deck.length === 0) return
      card = market.deck[0]!
      newMarket = { ...market, deck: market.deck.slice(1) }
    } else {
      card = market.visible[index] ?? null
      if (!card) return
      const newVisible = [...market.visible]
      newVisible[index] = null
      newMarket = { ...market, visible: newVisible }
    }

    // Enforce hand limits before taking
    if (card.type === 'vendor' && player.stagingVendors.length >= VENDOR_HAND_LIMIT) return
    if (card.type === 'venue') {
      if (player.stagingVenues.length >= VENUE_HAND_LIMIT) return
      if (Object.values(player.grid).some((c) => c?.type === 'venue')) return
    }

    const newTaken = [...(pendingAction as { type: string; taken: AnyCard[] }).taken, card]
    const newPlayer = addCardToStaging(player, card)

    set((s) => ({
      players: { ...s.players, [activePlayer]: newPlayer },
      markets: { ...s.markets, [marketType]: newMarket },
      pendingAction: { ...pendingAction, taken: newTaken } as typeof pendingAction,
    }))

    if (newTaken.length === 2) {
      get().confirmTake()
    }
  },

  confirmTake() {
    const { phase } = get()
    if (phase === 'taking_cards') {
      get()._endTurn()
    } else if (phase === 'bonus_draw2') {
      get()._resolveBonus()
    }
  },

  selectCardToBook(card) {
    const { phase } = get()
    if (phase !== 'booking' && phase !== 'bonus_book') return
    set({ pendingAction: { type: phase === 'bonus_book' ? 'bonus_book' : 'book', card } as never })
  },

  bookCard(position) {
    const { phase, activePlayer, players, pendingAction, bonusBookDepth } = get()
    if (phase !== 'booking' && phase !== 'bonus_book') return
    if (!pendingAction) return

    const card = (pendingAction as { card: VendorCard | VenueCard | null }).card
    if (!card) return

    const player = players[activePlayer]
    if (player.coins < card.cost) return

    // Validate placement
    if (card.type === 'venue' && position !== 5) return
    if (card.type === 'vendor' && position === 5) return
    if (player.grid[position] !== null) return

    const newGrid = { ...player.grid, [position]: card }
    const newStagingVendors = card.type === 'vendor'
      ? player.stagingVendors.filter((c) => c.id !== card.id)
      : player.stagingVendors
    const newStagingVenues = card.type === 'venue'
      ? player.stagingVenues.filter((c) => c.id !== card.id)
      : player.stagingVenues

    // If booking a venue, discard remaining unbooked venues (+1 coin each)
    let coinsFromVenueDiscard = 0
    let finalStagingVenues = newStagingVenues
    if (card.type === 'venue') {
      coinsFromVenueDiscard = newStagingVenues.length
      finalStagingVenues = []
    }

    const newPlayer: PlayerState = {
      ...player,
      coins: player.coins - card.cost + coinsFromVenueDiscard,
      grid: newGrid,
      stagingVendors: newStagingVendors,
      stagingVenues: finalStagingVenues,
    }

    const bonus = GRID_BONUSES[position]

    set((s) => ({
      players: { ...s.players, [activePlayer]: newPlayer },
      pendingAction: null,
    }))

    get()._applyBonus(bonus, bonusBookDepth)
  },

  selectCardToSwap(card) {
    const { phase } = get()
    if (phase !== 'swapping') return
    set({ pendingAction: { type: 'swap', newCard: card } })
  },

  swapCard(marketType, index) {
    const { activePlayer, players, markets, pendingAction } = get()
    if (!pendingAction || pendingAction.type !== 'swap') return

    const market = markets[marketType]
    let newCard: AnyCard | null = null
    let newMarket = { ...market }

    if (index === 'blind') {
      if (market.deck.length === 0) return
      newCard = market.deck[0]!
      newMarket = { ...market, deck: market.deck.slice(1) }
    } else {
      newCard = market.visible[index] ?? null
      if (!newCard) return
      const newVisible = [...market.visible]
      newVisible[index] = null
      newMarket = { ...market, visible: newVisible }
    }

    if (!newCard || newCard.type !== 'vendor') return

    const swapTarget = (pendingAction as { type: 'swap'; newCard: VendorCard | null }).newCard
    if (!swapTarget) return

    const player = players[activePlayer]
    if (player.coins < newCard.cost) return

    // Find where the old card is in the grid
    const position = (Object.entries(player.grid) as [string, VendorCard | VenueCard | null][])
      .find(([, c]) => c?.id === swapTarget.id)?.[0]
    if (!position) return

    const gridPos = Number(position) as GridPosition
    const newGrid = { ...player.grid, [gridPos]: newCard }

    set((s) => ({
      players: {
        ...s.players,
        [activePlayer]: { ...player, coins: player.coins - newCard!.cost, grid: newGrid },
      },
      markets: { ...s.markets, [marketType]: newMarket },
      pendingAction: null,
    }))

    get()._endTurn()
  },

  discardFromStaging(card) {
    const { activePlayer, players } = get()
    const player = players[activePlayer]
    set((s) => ({
      players: {
        ...s.players,
        [activePlayer]: {
          ...player,
          coins: player.coins + 1,
          stagingVendors: card.type === 'vendor'
            ? player.stagingVendors.filter((c) => c.id !== card.id)
            : player.stagingVendors,
          stagingVenues: card.type === 'venue'
            ? player.stagingVenues.filter((c) => c.id !== card.id)
            : player.stagingVenues,
        },
      },
    }))
  },

  selectTheme(theme) {
    const { activePlayer, players } = get()
    const player = players[activePlayer]
    set((s) => ({
      players: { ...s.players, [activePlayer]: { ...player, chosenTheme: theme } },
    }))

    // Check if both players have chosen their theme
    const updated = get().players
    if (updated[1].chosenTheme && updated[2].chosenTheme) {
      set({ phase: 'endgame_scoring' })
    }
  },

  confirmScoring() {
    // No-op for now; scoring screen is final
  },

  _applyBonus(bonus, depth) {
    const { activePlayer } = get()
    if (bonus === 'coins3') {
      set((s) => ({
        players: {
          ...s.players,
          [activePlayer]: { ...s.players[activePlayer], coins: s.players[activePlayer].coins + 3 },
        },
      }))
      get()._resolveBonus()
    } else if (bonus === 'draw2') {
      set({ phase: 'bonus_draw2', pendingAction: { type: 'bonus_draw2', taken: [] } })
    } else if (bonus === 'book') {
      set({ phase: 'bonus_book', bonusBookDepth: depth + 1, pendingAction: { type: 'bonus_book', card: null } })
    } else {
      get()._resolveBonus()
    }
  },

  _resolveBonus() {
    const { phase, bonusBookDepth } = get()
    if (phase === 'bonus_book' && bonusBookDepth > 0) {
      // Bonus book was used; now resolve the turn or wait for chain
      // Phase transitions back in bookCard; here we just end turn
    }
    get()._endTurn()
  },

  _endTurn() {
    const { activePlayer, turnNumber, roundNumber, markets } = get()

    // Replenish all markets at end of turn
    const newMarkets = {
      vendor: replenishMarket(markets.vendor),
      venue: replenishMarket(markets.venue),
      goal: replenishMarket(markets.goal),
    }

    const nextPlayer = activePlayer === 1 ? 2 : 1
    const isEndOfRound = activePlayer === 2

    let finalMarkets = newMarkets
    if (isEndOfRound) {
      finalMarkets = {
        vendor: discardOldestFromMarket(newMarkets.vendor),
        venue: discardOldestFromMarket(newMarkets.venue),
        goal: discardOldestFromMarket(newMarkets.goal),
      }
    }

    const nextTurn = turnNumber + 1
    const nextRound = isEndOfRound ? roundNumber + 1 : roundNumber

    // Check if game is over (each player has had 12 turns)
    const p1Turns = activePlayer === 1 ? turnNumber : turnNumber - 1
    const p2Turns = activePlayer === 2 ? turnNumber : turnNumber - 1

    const gameOver = p1Turns >= TURNS_PER_PLAYER && p2Turns >= TURNS_PER_PLAYER

    if (gameOver) {
      set({
        phase: 'endgame_theme_select',
        activePlayer: 1,
        markets: finalMarkets,
        pendingAction: null,
        bonusBookDepth: 0,
      })
      return
    }

    set({
      phase: 'action_select',
      activePlayer: nextPlayer as 1 | 2,
      turnNumber: nextTurn,
      roundNumber: nextRound,
      markets: finalMarkets,
      pendingAction: null,
      bonusBookDepth: 0,
    })
  },
} as GameStore))

function addCardToStaging(player: PlayerState, card: AnyCard): PlayerState {
  if (card.type === 'vendor') {
    return { ...player, stagingVendors: [...player.stagingVendors, card as VendorCard] }
  } else if (card.type === 'venue') {
    return { ...player, stagingVenues: [...player.stagingVenues, card as VenueCard] }
  } else {
    return { ...player, goals: [...player.goals, card as GoalCard] }
  }
}
