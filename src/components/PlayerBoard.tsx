import { useGameStore } from '../store'
import type { PlayerState, GridPosition, VendorCard, VenueCard, Icon } from '../types'
import { GRID_BONUSES } from '../types'
import { CardView } from './CardView'
import { IconChip } from './IconChip'
import styles from './PlayerBoard.module.css'

const BONUS_LABELS = { draw2: 'Draw 2', book: 'Book', coins3: '+3 Coins', none: 'Venue' }
const POSITIONS: GridPosition[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const ICONS: Icon[] = ['whimsy', 'edge', 'nature', 'tradition', 'elegance']

interface Props {
  playerId: 1 | 2
}

export function PlayerBoard({ playerId }: Props) {
  const phase = useGameStore((s) => s.phase)
  const activePlayer = useGameStore((s) => s.activePlayer)
  const player = useGameStore((s) => s.players[playerId])
  const pendingAction = useGameStore((s) => s.pendingAction)
  const bookCard = useGameStore((s) => s.bookCard)
  const selectCardToBook = useGameStore((s) => s.selectCardToBook)
  const selectCardToSwap = useGameStore((s) => s.selectCardToSwap)
  const discardFromStaging = useGameStore((s) => s.discardFromStaging)
  const turnNumber = useGameStore((s) => s.turnNumber)

  const isActive = activePlayer === playerId
  const isBooking = isActive && (phase === 'booking' || phase === 'bonus_book')
  const isSwapping = isActive && phase === 'swapping'
  const isTaking = isActive && (phase === 'taking_cards' || phase === 'bonus_draw2')

  const selectedCard = isBooking && pendingAction && 'card' in pendingAction
    ? (pendingAction as { card: VendorCard | VenueCard | null }).card
    : null

  const swapSource = isSwapping && pendingAction && pendingAction.type === 'swap'
    ? (pendingAction as { type: 'swap'; newCard: VendorCard | null }).newCard
    : null

  const turnsRemaining = 12 - Math.ceil((turnNumber - (playerId === 1 ? 1 : 0)) / 2)

  function iconCounts(): Record<Icon, number> {
    const counts = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
    for (const card of Object.values(player.grid)) {
      if (card) card.icons.forEach((ic) => counts[ic]++)
    }
    return counts
  }

  function canBookToPosition(pos: GridPosition): boolean {
    if (!isBooking || !selectedCard) return false
    if (player.grid[pos] !== null) return false
    if (selectedCard.type === 'venue' && pos !== 5) return false
    if (selectedCard.type === 'vendor' && pos === 5) return false
    if (player.coins < selectedCard.cost) return false
    return true
  }

  const counts = iconCounts()

  return (
    <div className={`${styles.board} ${isActive ? styles.active : ''}`}>
      <div className={styles.header}>
        <span className={styles.playerLabel}>Player {playerId}</span>
        <span className={styles.coins}>💰 {player.coins}</span>
        <span className={styles.turns}>↩ {turnsRemaining} turns</span>
        {isActive && <span className={styles.activeBadge}>Active</span>}
      </div>

      <div className={styles.iconBar}>
        {ICONS.map((ic) => (
          <div key={ic} className={styles.iconCount}>
            <IconChip icon={ic} size="sm" />
            <span>{counts[ic]}</span>
          </div>
        ))}
      </div>

      <ThemeDisplay player={player} />

      <div className={styles.grid}>
        {POSITIONS.map((pos) => {
          const card = player.grid[pos]
          const bonus = GRID_BONUSES[pos]
          const canBook = canBookToPosition(pos)

          return (
            <div
              key={pos}
              className={`${styles.cell} ${canBook ? styles.canBook : ''} ${card ? styles.filled : ''}`}
              onClick={canBook ? () => bookCard(pos) : undefined}
            >
              {card ? (
                <CardView card={card} compact />
              ) : (
                <span className={styles.bonusLabel}>{BONUS_LABELS[bonus]}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.staging}>
        <div className={styles.stagingSection}>
          <span className={styles.sectionLabel}>Vendors ({player.stagingVendors.length}/5)</span>
          <div className={styles.stagingCards}>
            {player.stagingVendors.map((card) => (
              <div key={card.id} className={styles.stagingCard}>
                <CardView
                  card={card}
                  selected={selectedCard?.id === card.id || swapSource?.id === card.id}
                  onClick={
                    isBooking ? () => selectCardToBook(card) :
                    isSwapping && !swapSource ? () => selectCardToSwap(card) :
                    undefined
                  }
                  compact
                />
                {isActive && !isBooking && !isSwapping && !isTaking && (
                  <button className={styles.discardBtn} onClick={() => discardFromStaging(card)} title="Discard for 1 coin">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {player.stagingVenues.length > 0 && (
          <div className={styles.stagingSection}>
            <span className={styles.sectionLabel}>Venues ({player.stagingVenues.length}/2)</span>
            <div className={styles.stagingCards}>
              {player.stagingVenues.map((card) => (
                <div key={card.id} className={styles.stagingCard}>
                  <CardView
                    card={card}
                    selected={selectedCard?.id === card.id}
                    onClick={isBooking ? () => selectCardToBook(card) : undefined}
                    compact
                  />
                  {isActive && !isBooking && !isSwapping && !isTaking && (
                    <button className={styles.discardBtn} onClick={() => discardFromStaging(card)} title="Discard for 1 coin">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {player.goals.length > 0 && (
          <div className={styles.stagingSection}>
            <span className={styles.sectionLabel}>Goals ({player.goals.length})</span>
            <div className={styles.stagingCards}>
              {player.goals.map((card) => (
                <CardView key={card.id} card={card} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ThemeDisplay({ player }: { player: PlayerState }) {
  if (!player.themeCard) return null
  const { front, back } = player.themeCard

  return (
    <div className={styles.themeDisplay}>
      {[front, back].map((theme) => (
        <div
          key={theme.id}
          className={`${styles.theme} ${player.chosenTheme?.id === theme.id ? styles.chosenTheme : ''}`}
        >
          <span className={styles.themeName}>{theme.name}</span>
          <div className={styles.themeIcons}>
            {theme.icons.map((ic, i) => (
              <span key={i} className={styles.themeIconLabel}>
                <IconChip icon={ic} size="sm" showName />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
