import { useGameStore } from '../store'
import styles from './ActionBar.module.css'

export function ActionBar() {
  const phase = useGameStore((s) => s.phase)
  const activePlayer = useGameStore((s) => s.activePlayer)
  const players = useGameStore((s) => s.players)
  const selectAction = useGameStore((s) => s.selectAction)
  const pendingAction = useGameStore((s) => s.pendingAction)
  const turnNumber = useGameStore((s) => s.turnNumber)
  const roundNumber = useGameStore((s) => s.roundNumber)

  const player = players[activePlayer]
  const hasBookedVenue = Object.values(player.grid).some((c) => c?.type === 'venue')
  const hasVendorToBook = player.stagingVendors.length > 0
  const hasVenueToBook = player.stagingVenues.length > 0 && !hasBookedVenue
  const canBook = hasVendorToBook || hasVenueToBook
  const hasBookedVendor = Object.values(player.grid).some((c) => c?.type === 'vendor')

  function phaseLabel() {
    switch (phase) {
      case 'action_select': return 'Choose an action'
      case 'taking_cards': {
        const taken = pendingAction && 'taken' in pendingAction ? pendingAction.taken.length : 0
        return `Taking cards — pick ${2 - taken} more`
      }
      case 'booking': {
        const card = pendingAction && 'card' in pendingAction ? (pendingAction as { card: unknown }).card : null
        return card ? 'Click a grid space to book' : 'Select a card to book'
      }
      case 'bonus_book': {
        const card = pendingAction && 'card' in pendingAction ? (pendingAction as { card: unknown }).card : null
        return card ? 'Bonus Book: click a grid space' : 'Bonus Book: select a card'
      }
      case 'bonus_draw2': {
        const taken = pendingAction && 'taken' in pendingAction ? pendingAction.taken.length : 0
        return `Bonus Draw 2 — pick ${2 - taken} more`
      }
      case 'swapping': {
        const pa = pendingAction as { type: 'swap'; newCard: unknown } | null
        if (!pa?.newCard) return 'Swap: select a booked vendor to replace'
        return 'Swap: pick a card from the market'
      }
      default: return ''
    }
  }

  return (
    <div className={styles.bar}>
      <div className={styles.info}>
        <span>Round {roundNumber}</span>
        <span>Turn {turnNumber}/24</span>
        <span className={styles.playerTag}>Player {activePlayer}'s turn</span>
        <span className={styles.phase}>{phaseLabel()}</span>
      </div>

      {phase === 'action_select' && (
        <div className={styles.actions}>
          <button
            className={styles.btn}
            onClick={() => selectAction('take2')}
          >
            Take 2 Cards
          </button>
          <button
            className={styles.btn}
            onClick={() => selectAction('gain3coins')}
          >
            💰 Gain 3 Coins
          </button>
          <button
            className={styles.btn}
            disabled={!canBook}
            onClick={() => selectAction('book')}
          >
            Book a Card
          </button>
          <button
            className={styles.btn}
            disabled={!hasBookedVendor}
            onClick={() => selectAction('swap')}
          >
            Swap
          </button>
        </div>
      )}
    </div>
  )
}
