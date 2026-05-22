import type { PlayerState, GoalCard, Theme, Icon, VendorCategory } from './types'

interface GoalResult {
  goal: GoalCard
  points: number
  achieved: boolean
}

interface ScoreBreakdown {
  excitement: number
  goalResults: GoalResult[]
  goalTotal: number
  coins: number
  total: number
}

function bookedCards(player: PlayerState) {
  return Object.values(player.grid).filter((c) => c !== null) as NonNullable<(typeof player.grid)[keyof typeof player.grid]>[]
}

function iconCounts(player: PlayerState): Record<Icon, number> {
  const counts: Record<Icon, number> = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
  for (const card of bookedCards(player)) {
    for (const icon of card.icons) counts[icon]++
  }
  return counts
}

function scoreGuestGoal(player: PlayerState, category: VendorCategory): number {
  const count = Object.values(player.grid).filter(
    (c) => c !== null && c.type === 'vendor' && c.category === category
  ).length
  return Math.min(count * 5, 15)
}

function scoreBudgetGoal(player: PlayerState, targetCost: number): number {
  const costs = bookedCards(player).map((c) => c.cost)
  const freq: Record<number, number> = {}
  for (const c of costs) freq[c] = (freq[c] ?? 0) + 1

  const targetBucket = targetCost >= 3 ? 3 : targetCost
  const targetCount = targetCost >= 3
    ? costs.filter((c) => c >= 3).length
    : (freq[targetCost] ?? 0)

  const allCounts = [freq[1] ?? 0, freq[2] ?? 0, costs.filter((c) => c >= 3).length]
  const max = Math.max(...allCounts)
  if (targetCount === 0 || targetCount < max) return 0

  const pts: Record<number, number> = { 1: 5, 2: 10, 3: 15 }
  return pts[targetBucket] ?? 0
}

function scoreExcitementGoal(player: PlayerState, targetExcitement: number): number {
  const values = bookedCards(player).map((c) => c.excitement)
  const freq: Record<number, number> = {}
  for (const v of values) {
    const bucket = v >= 3 ? 3 : v
    freq[bucket] = (freq[bucket] ?? 0) + 1
  }

  const targetBucket = targetExcitement >= 3 ? 3 : targetExcitement
  const targetCount = freq[targetBucket] ?? 0
  const max = Math.max(...Object.values(freq))
  if (targetCount === 0 || targetCount < max) return 0

  const pts: Record<number, number> = { 1: 5, 2: 10, 3: 15 }
  return pts[targetBucket] ?? 0
}

function scoreThemeGoal(player: PlayerState, subtype: string, theme: Theme): number {
  const counts = iconCounts(player)
  const [a, b] = theme.icons
  const allValues = Object.values(counts)
  const max = Math.max(...allValues)

  switch (subtype) {
    case 'subtle':
      return (counts[a] === max && max > 0) || (counts[b] === max && max > 0) ? 10 : 0

    case 'matched':
      return counts[a] > 0 && counts[a] === counts[b] ? 10 : 0

    case 'thematic':
      return counts[a] === max && counts[b] === max && max > 0 ? 20 : 0

    case 'balanced': {
      const vals = Object.values(counts)
      const first = vals[0]
      return first !== undefined && first > 0 && vals.every((v) => v === first) ? 15 : 0
    }

    case 'unforgettable': {
      const nonThemeIcons = (Object.keys(counts) as Icon[]).filter((i) => i !== a && i !== b)
      return nonThemeIcons.every((i) => counts[i] === 0) && bookedCards(player).length > 0 ? 30 : 0
    }

    default:
      return 0
  }
}

export function calculateScore(player: PlayerState): ScoreBreakdown {
  const cards = bookedCards(player)
  const excitement = cards.reduce((sum, c) => sum + c.excitement, 0)

  const theme = player.chosenTheme

  const goalResults: GoalResult[] = player.goals.map((goal) => {
    let points = 0

    if (goal.goalType === 'guest' && goal.category !== undefined) {
      points = scoreGuestGoal(player, goal.category)
    } else if (goal.goalType === 'budget' && goal.targetCost !== undefined) {
      points = scoreBudgetGoal(player, goal.targetCost)
    } else if (goal.goalType === 'excitement' && goal.targetExcitement !== undefined) {
      points = scoreExcitementGoal(player, goal.targetExcitement)
    } else if (goal.goalType === 'theme' && goal.themeSubtype !== undefined && theme !== null) {
      points = scoreThemeGoal(player, goal.themeSubtype, theme)
    }

    return { goal, points, achieved: points > 0 }
  })

  const goalTotal = goalResults.reduce((sum, r) => sum + r.points, 0)
  const coins = player.coins

  return {
    excitement,
    goalResults,
    goalTotal,
    coins,
    total: excitement + goalTotal + coins,
  }
}

export function hasValidWedding(player: PlayerState): boolean {
  return Object.values(player.grid).some((c) => c !== null && c.type === 'venue')
}
