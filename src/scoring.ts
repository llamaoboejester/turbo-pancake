import type { PlayerState, ScoringCard, Theme, Icon, VendorCard, VenueCard, GridPosition, VendorCategory } from './types'

export interface RubricResult {
  name: string
  points: number
  active: boolean
  description: string
  isBonus: boolean
}

export interface ScoringCardResult {
  card: ScoringCard
  side: 'front' | 'back'
  points: number
}

export interface ScoreBreakdown {
  excitement: number
  themeScore: number
  themeResults: RubricResult[]
  scoringCardResults: ScoringCardResult[]
  tableauBonus: number
  coins: number
  leftoverCards: number
  total: number
}

function bookedCards(player: PlayerState): (VendorCard | VenueCard)[] {
  return Object.values(player.grid).filter((c): c is VendorCard | VenueCard => c !== null)
}

function bookedVendors(player: PlayerState): VendorCard[] {
  return bookedCards(player).filter((c): c is VendorCard => c.type === 'vendor')
}

function totalBookingCost(player: PlayerState): number {
  return bookedCards(player).reduce((sum, c) => sum + c.cost, 0)
}

function buildCounts(player: PlayerState): Record<Icon, number> {
  const counts: Record<Icon, number> = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
  for (const card of bookedCards(player)) {
    for (const icon of card.icons) counts[icon]++
  }
  for (const sc of player.scoringCards) {
    if ((player.scoringFlips[sc.id] ?? 'front') === 'back') {
      counts[sc.backIcon]++
    }
  }
  for (const icon of player.bonusIcons) counts[icon]++
  return counts
}

function computeRubric(counts: Record<Icon, number>, theme: Theme, hasBooked: boolean): RubricResult[] {
  const [a, b] = theme.icons
  const nonTheme = (Object.keys(counts) as Icon[]).filter((i) => i !== a && i !== b)
  const maxNonTheme = nonTheme.length > 0 ? Math.max(...nonTheme.map((i) => counts[i])) : 0

  const isUnforgettable = hasBooked && counts[a] > 0 && counts[b] > 0 && nonTheme.every((i) => counts[i] === 0)

  const allVals = Object.values(counts)
  const isBalanced = allVals[0] !== undefined && allVals[0] > 0 && allVals.every((v) => v === allVals[0])

  const aAtTop = maxNonTheme > 0 && counts[a] >= maxNonTheme
  const bAtTop = maxNonTheme > 0 && counts[b] >= maxNonTheme
  const isThematic = aAtTop && bAtTop
  const isSubtle = (aAtTop && !bAtTop) || (!aAtTop && bAtTop)

  const isMatched = counts[a] > 0 && counts[a] === counts[b]

  let activeTier: string | null = null
  if (isUnforgettable) activeTier = 'unforgettable'
  else if (isBalanced) activeTier = 'balanced'
  else if (isThematic) activeTier = 'thematic'
  else if (isSubtle) activeTier = 'subtle'

  return [
    { name: 'Unforgettable', points: 30, active: activeTier === 'unforgettable', isBonus: false, description: 'Only your 2 theme icons appear across all booked cards (both must be present)' },
    { name: 'Balanced',      points: 20, active: activeTier === 'balanced',      isBonus: false, description: 'All 5 icons appear the same number of times (non-zero)' },
    { name: 'Thematic',      points: 20, active: activeTier === 'thematic',      isBonus: false, description: 'Both theme icons outrank every other icon — nothing beats them' },
    { name: 'Subtle',        points: 10, active: activeTier === 'subtle',        isBonus: false, description: 'Exactly one of your theme icons leads — the other does not' },
    { name: 'Matched',       points: 5,  active: isMatched,                      isBonus: true,  description: 'Both theme icons appear the same number of times (+5 bonus)' },
  ]
}

const VENDOR_POSITIONS: GridPosition[] = [1, 2, 3, 4, 6, 7, 8, 9]
const CORNERS: GridPosition[] = [1, 3, 7, 9]
const ROW_COL_LINES: GridPosition[][] = [
  [1, 2, 3], [4, 5, 6], [7, 8, 9],
  [1, 4, 7], [2, 5, 8], [3, 6, 9],
]
const ALL_LINES: GridPosition[][] = [
  ...ROW_COL_LINES,
  [1, 5, 9], [3, 5, 7],
]

function scoreCardFront(player: PlayerState, card: ScoringCard, opponent?: PlayerState): number {
  const grid = player.grid
  const vendors = bookedVendors(player)

  switch (card.formulaType) {
    case 'category_count': {
      return Math.min(vendors.filter(c => c.category === card.category).length * 5, 15)
    }
    case 'trio_set': {
      const sets = Math.min(...card.categories!.map(cat => vendors.filter(c => c.category === cat).length))
      return sets * 10
    }
    case 'combo_negative': {
      const posCount = vendors.filter(c => c.category === card.positiveCategory).length
      const negCount = card.negativeCategories!.reduce((sum, cat) => sum + vendors.filter(c => c.category === cat).length, 0)
      return posCount * 5 + negCount * -3
    }
    case 'row_col_same_category': {
      let score = 0
      for (const line of ROW_COL_LINES) {
        const lv = line.map(pos => grid[pos as GridPosition]).filter((c): c is VendorCard => c !== null && c.type === 'vendor')
        if (lv.length === 3 && lv.every(c => c.category === lv[0].category)) score += 15
      }
      return score
    }
    case 'corners_same_category': {
      const cv = CORNERS.map(pos => grid[pos]).filter((c): c is VendorCard => c !== null && c.type === 'vendor')
      if (cv.length === 4 && cv.every(c => c.category === cv[0].category)) return 20
      return 0
    }
    case 'line_same_cost': {
      let score = 0
      for (const line of ALL_LINES) {
        const filled = line.map(pos => grid[pos as GridPosition]).filter((c): c is VendorCard | VenueCard => c !== null)
        if (filled.length === 3 && filled.every(c => c.cost === filled[0].cost)) score += 10
      }
      return score
    }
    case 'line_same_excitement': {
      let score = 0
      for (const line of ALL_LINES) {
        const filled = line.map(pos => grid[pos as GridPosition]).filter((c): c is VendorCard | VenueCard => c !== null)
        if (filled.length === 3 && filled.every(c => c.excitement === filled[0].excitement)) score += 10
      }
      return score
    }
    case 'depth_category': {
      const catCounts: Partial<Record<VendorCategory, number>> = {}
      for (const v of vendors) catCounts[v.category] = (catCounts[v.category] ?? 0) + 1
      return Object.values(catCounts).filter(n => (n ?? 0) >= 2).length * 5
    }
    case 'breadth_8_categories': {
      return new Set(vendors.map(v => v.category)).size >= 8 ? 25 : 0
    }
    case 'all_same_category': {
      if (vendors.length < 8) return 0
      return vendors.every(v => v.category === vendors[0].category) ? 35 : 0
    }
    case 'all_same_excitement': {
      const all = bookedCards(player)
      if (all.length === 0) return 0
      return all.every(c => c.excitement === all[0].excitement) ? 25 : 0
    }
    case 'all_same_cost': {
      const all = bookedCards(player)
      if (all.length === 0) return 0
      return all.every(c => c.cost === all[0].cost) ? 25 : 0
    }
    case 'even_odd_excitement': {
      const total = bookedCards(player).reduce((sum, c) => sum + c.excitement, 0)
      return total % 2 === 0 ? 7 : 3
    }
    case 'even_odd_cost': {
      return totalBookingCost(player) % 2 === 0 ? 7 : 3
    }
    case 'missing_theme_elements': {
      const counts = buildCounts(player)
      return (Object.values(counts) as number[]).filter(v => v === 0).length * 5
    }
    case 'empty_spaces': {
      return VENDOR_POSITIONS.filter(pos => grid[pos] === null).length * 5
    }
    case 'fewer_coins_opponent': {
      if (!opponent) return 0
      return totalBookingCost(player) < totalBookingCost(opponent) ? 10 : 0
    }
    case 'minimalist': {
      return totalBookingCost(player) <= 10 ? 15 : 0
    }
    default:
      return 0
  }
}

export function calculateScore(player: PlayerState, opponent?: PlayerState): ScoreBreakdown {
  const cards = bookedCards(player)
  const excitement = cards.reduce((sum, c) => sum + c.excitement, 0)

  const theme = player.chosenTheme!
  const counts = buildCounts(player)
  const themeResults = computeRubric(counts, theme, cards.length > 0)

  const tierResult = themeResults.find((r) => !r.isBonus && r.active)
  const matchedResult = themeResults.find((r) => r.isBonus && r.active)
  const themeScore = (tierResult?.points ?? 0) + (matchedResult?.points ?? 0)

  const scoringCardResults: ScoringCardResult[] = player.scoringCards.map((sc) => {
    const side = player.scoringFlips[sc.id] ?? 'front'
    const points = side === 'front' ? scoreCardFront(player, sc, opponent) : 0
    return { card: sc, side, points }
  })

  const tableauBonus = Object.values(player.grid).every((c) => c !== null) ? 15 : 0
  const leftoverCards = player.stagingVendors.length + player.stagingVenues.length
  const scoringCardTotal = scoringCardResults.reduce((sum, r) => sum + r.points, 0)

  return {
    excitement,
    themeScore,
    themeResults,
    scoringCardResults,
    tableauBonus,
    coins: player.coins,
    leftoverCards,
    total: excitement + themeScore + scoringCardTotal + tableauBonus + player.coins + leftoverCards,
  }
}

export function evaluateLiveRubric(player: PlayerState): RubricResult[] | null {
  if (!player.chosenTheme) return null
  const counts = buildCounts(player)
  const hasBooked = bookedCards(player).length > 0
  return computeRubric(counts, player.chosenTheme, hasBooked)
}

export function hasValidWedding(player: PlayerState): boolean {
  return Object.values(player.grid).some((c) => c !== null && c.type === 'venue')
}
