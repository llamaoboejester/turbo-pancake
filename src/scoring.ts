import type { PlayerState, ScoringCard, Theme, Icon, VendorCategory } from './types'

export interface ThemeRubricResult {
  name: string
  points: number
  achieved: boolean
}

export interface ScoringCardResult {
  card: ScoringCard
  side: 'front' | 'back'
  points: number
}

export interface ScoreBreakdown {
  excitement: number
  themeScore: number
  themeResults: ThemeRubricResult[]
  scoringCardResults: ScoringCardResult[]
  tableauBonus: number
  coins: number
  leftoverCards: number
  total: number
}

function bookedCards(player: PlayerState) {
  return Object.values(player.grid).filter((c) => c !== null) as NonNullable<(typeof player.grid)[keyof typeof player.grid]>[]
}

function baseIconCounts(player: PlayerState): Record<Icon, number> {
  const counts: Record<Icon, number> = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
  for (const card of bookedCards(player)) {
    for (const icon of card.icons) counts[icon]++
  }
  return counts
}

function evaluateThemeRubric(
  counts: Record<Icon, number>,
  theme: Theme,
  hasBookedCards: boolean,
): ThemeRubricResult[] {
  const [a, b] = theme.icons
  const allValues = Object.values(counts)
  const max = Math.max(...allValues)

  const subtle = max > 0 && (counts[a] === max || counts[b] === max)
  const matched = counts[a] > 0 && counts[a] === counts[b]
  const thematic = max > 0 && counts[a] === max && counts[b] === max
  const balanced = (() => {
    const vals = Object.values(counts)
    const first = vals[0]
    return first !== undefined && first > 0 && vals.every((v) => v === first)
  })()
  const unforgettable = hasBookedCards &&
    (Object.keys(counts) as Icon[]).filter((i) => i !== a && i !== b).every((i) => counts[i] === 0)

  return [
    { name: 'Subtle', points: 10, achieved: subtle },
    { name: 'Matched', points: 10, achieved: matched },
    { name: 'Thematic', points: 20, achieved: thematic },
    { name: 'Balanced', points: 15, achieved: balanced },
    { name: 'Unforgettable', points: 30, achieved: unforgettable },
  ]
}

function scoreScoringCardFront(player: PlayerState, category: VendorCategory): number {
  const count = Object.values(player.grid).filter(
    (c) => c !== null && c.type === 'vendor' && c.category === category
  ).length
  return Math.min(count * 5, 15)
}

export function calculateScore(
  player: PlayerState,
  flips: Record<string, 'front' | 'back'>,
): ScoreBreakdown {
  const cards = bookedCards(player)
  const excitement = cards.reduce((sum, c) => sum + c.excitement, 0)

  const theme = player.chosenTheme!

  // Build icon counts including back-side scoring cards
  const counts = baseIconCounts(player)
  for (const sc of player.scoringCards) {
    if ((flips[sc.id] ?? 'front') === 'back') {
      counts[sc.backIcon]++
    }
  }

  const themeResults = evaluateThemeRubric(counts, theme, cards.length > 0)
  const themeScore = themeResults.filter((r) => r.achieved).reduce((sum, r) => sum + r.points, 0)

  const scoringCardResults: ScoringCardResult[] = player.scoringCards.map((sc) => {
    const side = flips[sc.id] ?? 'front'
    const points = side === 'front' ? scoreScoringCardFront(player, sc.category) : 0
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

export function hasValidWedding(player: PlayerState): boolean {
  return Object.values(player.grid).some((c) => c !== null && c.type === 'venue')
}
