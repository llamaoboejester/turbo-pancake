import { useGameStore } from '../store'
import type { PlayerState, GridPosition, VendorCard, VenueCard, Icon } from '../types'
import { GRID_BONUSES } from '../types'
import { CardView } from './CardView'
import { IconChip, ICON_NAMES } from './IconChip'
import { IconBar } from './IconBar'
import styles from './PlayerBoard.module.css'

const BONUS_LABELS = { draw2: 'Draw 2', book: 'Book', coins3: '+3 Coins', none: 'Venue' }
const POSITIONS: GridPosition[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

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
  const selectSwapPosition = useGameStore((s) => s.selectSwapPosition)
  const discardFromStaging = useGameStore((s) => s.discardFromStaging)
  const skipBonus = useGameStore((s) => s.skipBonus)
  const turnNumber = useGameStore((s) => s.turnNumber)

  const isActive = activePlayer === playerId
  const isBooking = isActive && (phase === 'booking' || phase === 'bonus_book')
  const isSwapping = isActive && phase === 'swapping'
  const isTaking = isActive && (phase === 'taking_cards' || phase === 'bonus_draw2')
  const isBonusPhase = isActive && (phase === 'bonus_book' || phase === 'bonus_draw2')

  const selectedBookCard = isBooking && pendingAction && 'card' in pendingAction
    ? (pendingAction as { card: VendorCard | VenueCard | null }).card
    : null

  const swapReplacePosition = isSwapping && pendingAction?.type === 'swap'
    ? (pendingAction as { type: 'swap'; replacePosition: GridPosition | null }).replacePosition
    : null

  // Correct per-player turn counter
  const p1TurnsTaken = Math.ceil((turnNumber - 1) / 2)
  const p2TurnsTaken = Math.floor((turnNumber - 1) / 2)
  const turnsTaken = playerId === 1 ? p1TurnsTaken : p2TurnsTaken
  const turnsRemaining = 12 - turnsTaken

  function iconCounts(): Record<Icon, number> {
    const counts: Record<Icon, number> = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
    for (const card of Object.values(player.grid)) {
      if (card) card.icons.forEach((ic) => counts[ic]++)
    }
    return counts
  }

  function canBookToPosition(pos: GridPosition): boolean {
    if (!isBooking || !selectedBookCard) return false
    if (player.grid[pos] !== null) return false
    if (selectedBookCard.type === 'venue' && pos !== 5) return false
    if (selectedBookCard.type === 'vendor' && pos === 5) return false
    if (player.coins < selectedBookCard.cost) return false
    return true
  }

  function isSwapTarget(pos: GridPosition): boolean {
    if (!isSwapping || swapReplacePosition !== null) return false
    const card = player.grid[pos]
    return card !== null && card.type === 'vendor'
  }

  const counts = iconCounts()

  return (
    <div className={`${styles.board} ${isActive ? styles.active : ''}`}>
      <div className={styles.header}>
        <span className={styles.playerLabel}>Player {playerId}</span>
        <span className={styles.coins}>💰 {player.coins}</span>
        <span className={styles.turns}>{turnsRemaining} turns left</span>
        {isActive && <span className={styles.activeBadge}>Active</span>}
        {isBonusPhase && (
          <button className={styles.skipBtn} onClick={skipBonus}>Skip Bonus</button>
        )}
      </div>

      <IconBar counts={counts} />

      <ThemeDisplay player={player} />

      <div className={styles.grid}>
        {POSITIONS.map((pos) => {
          const card = player.grid[pos]
          const bonus = GRID_BONUSES[pos]
          const canBook = canBookToPosition(pos)
          const canSwap = isSwapTarget(pos)
          const isSelectedSwap = swapReplacePosition === pos

          return (
            <div
              key={pos}
              className={[
                styles.cell,
                canBook ? styles.canBook : '',
                canSwap ? styles.canSwap : '',
                isSelectedSwap ? styles.swapSelected : '',
                card ? styles.filled : '',
              ].join(' ')}
              onClick={
                canBook ? () => bookCard(pos) :
                canSwap ? () => selectSwapPosition(pos) :
                undefined
              }
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
                  selected={selectedBookCard?.id === card.id}
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

        {player.stagingVenues.length > 0 && (
          <div className={styles.stagingSection}>
            <span className={styles.sectionLabel}>Venues ({player.stagingVenues.length}/2)</span>
            <div className={styles.stagingCards}>
              {player.stagingVenues.map((card) => (
                <div key={card.id} className={styles.stagingCard}>
                  <CardView
                    card={card}
                    selected={selectedBookCard?.id === card.id}
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
              <span key={i} className={styles.themeIconRow}>
                <IconChip icon={ic} size="sm" />
                <span className={styles.themeIconName}>{ICON_NAMES[ic]}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
