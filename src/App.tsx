import { useEffect } from 'react'
import { useGameStore } from './store'
import type { VendorCard, VenueCard, GoalCard, ThemeCard } from './types'
import { GameBoard } from './components/GameBoard'
import { EndgameScreen } from './components/EndgameScreen'
import styles from './App.module.css'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const loadData = useGameStore((s) => s.loadData)

  useEffect(() => {
    Promise.all([
      fetch('/data/vendors.json').then((r) => r.json()),
      fetch('/data/venues.json').then((r) => r.json()),
      fetch('/data/goals.json').then((r) => r.json()),
      fetch('/data/themes.json').then((r) => r.json()),
    ]).then(([vendors, venues, goals, themes]: [VendorCard[], VenueCard[], GoalCard[], ThemeCard[]]) => {
      loadData(vendors, venues, goals, themes)
    })
  }, [loadData])

  if (phase === 'setup') {
    return <div className={styles.loading}>Loading game data…</div>
  }

  if (phase === 'endgame_theme_select' || phase === 'endgame_scoring') {
    return <EndgameScreen />
  }

  return <GameBoard />
}
