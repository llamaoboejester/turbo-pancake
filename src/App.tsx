import { useEffect } from 'react'
import { useGameStore } from './store'
import type { VendorCard, VenueCard, ScoringCard, ThemeCard } from './types'
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
      fetch('/data/scoringCards.json').then((r) => r.json()),
      fetch('/data/themes.json').then((r) => r.json()),
    ]).then(([vendors, venues, scoringCards, themes]: [VendorCard[], VenueCard[], ScoringCard[], ThemeCard[]]) => {
      loadData(vendors, venues, scoringCards, themes)
    })
  }, [loadData])

  if (phase === 'setup') {
    return <div className={styles.loading}>Loading game data…</div>
  }

  if (phase === 'endgame_scoring') {
    return <EndgameScreen />
  }

  return <GameBoard />
}
