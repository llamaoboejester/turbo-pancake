import { useGameStore } from '../store'
import type { PlayerState, GridPosition, VendorCard, VenueCard, Icon, Theme, ScoringCard } from '../types'
import { GRID_BONUSES } from '../types'
import { CardView } from './CardView'
import { IconChip, ICON_NAMES, ICON_COLORS } from './IconChip'
import { IconBar } from './IconBar'
import { evaluateLiveRubric } from '../scoring'
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
  const discardFromStaging = useGameStore((s) => s.discardFromStaging)
  const skipBonus = useGameStore((s) => s.skipBonus)
  const selectTheme = useGameStore((s) => s.selectTheme)
  const chooseFlip = useGameStore((s) => s.chooseFlip)
  const chooseVenueIcon = useGameStore((s) => s.chooseVenueIcon)
  const turnNumber = useGameStore((s) => s.turnNumber)
  const roundNumber = useGameStore((s) => s.roundNumber)

  const isActive = activePlayer === playerId
  const isBooking = isActive && (phase === 'booking' || phase === 'bonus_book')
  const isTaking = isActive && (phase === 'taking_cards' || phase === 'bonus_draw2')
  const isBonusPhase = isActive && (phase === 'bonus_book' || phase === 'bonus_draw2')
  const isVenueIconChoice = isActive && phase === 'venue_bonus_icon'
  const isMidgame = phase === 'midgame_theme_select'
  const isSecondHalf = roundNumber > 6
  const isFlipChoice = isActive && phase === 'scoring_flip_choice'

  const selectedBookCard = isBooking && pendingAction && 'card' in pendingAction
    ? (pendingAction as { card: VendorCard | VenueCard | null }).card
    : null

  const p1TurnsTaken = Math.ceil((turnNumber - 1) / 2)
  const p2TurnsTaken = Math.floor((turnNumber - 1) / 2)
  const turnsTaken = playerId === 1 ? p1TurnsTaken : p2TurnsTaken
  const turnsRemaining = 12 - turnsTaken

  function iconCounts(): Record<Icon, number> {
    const counts: Record<Icon, number> = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
    for (const card of Object.values(player.grid)) {
      if (card) card.icons.forEach((ic) => counts[ic]++)
    }
    for (const sc of player.scoringCards) {
      if ((player.scoringFlips[sc.id] ?? 'front') === 'back') {
        counts[sc.backIcon]++
      }
    }
    for (const ic of player.bonusIcons) counts[ic]++
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

  const counts = iconCounts()
  const flipCard = isFlipChoice && pendingAction?.type === 'scoring_flip_choice'
    ? (pendingAction as { card: ScoringCard }).card
    : null

  return (
    <div className={`${styles.board} ${isActive ? styles.active : ''}`}>
      <div className={styles.header}>
        <span className={styles.playerLabel}>Player {playerId}</span>
        <span className={styles.coins}>💰 {player.coins}</span>
        <span className={styles.turns}>{turnsRemaining} turns left</span>
        {isActive && !isBonusPhase && !isFlipChoice && <span className={styles.activeBadge}>Active</span>}
        {isBonusPhase && (
          <button className={styles.skipBtn} onClick={skipBonus}>Skip Bonus</button>
        )}
      </div>

      <div className={styles.infoRow}>
        <IconBar counts={counts} />
        <div className={styles.infoPanel}>
          {isVenueIconChoice && <VenueIconPanel onChoose={chooseVenueIcon} />}
          {isFlipChoice && flipCard && <FlipChoicePanel card={flipCard} onChoose={chooseFlip} />}
          {isMidgame && (
            <ThemeSelectPanel
              player={player}
              playerId={playerId}
              onSelect={(theme) => selectTheme(playerId, theme)}
            />
          )}
          {!isMidgame && isSecondHalf && player.chosenTheme && <ScoreArea player={player} />}
          {!isMidgame && !isSecondHalf && <ThemeDisplay player={player} />}
        </div>
      </div>

      <div className={styles.grid}>
        {POSITIONS.map((pos) => {
          const card = player.grid[pos]
          const bonus = GRID_BONUSES[pos]
          const canBook = canBookToPosition(pos)

          return (
            <div
              key={pos}
              className={[
                styles.cell,
                canBook ? styles.canBook : '',
                card ? styles.filled : '',
              ].join(' ')}
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
                  selected={selectedBookCard?.id === card.id}
                  onClick={isBooking ? () => selectCardToBook(card) : undefined}
                  compact
                />
                {isActive && !isBooking && !isTaking && (
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
                  {isActive && !isBooking && !isTaking && (
                    <button className={styles.discardBtn} onClick={() => discardFromStaging(card)} title="Discard for 1 coin">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ALL_ICONS: Icon[] = ['whimsy', 'edge', 'nature', 'tradition', 'elegance']

function VenueIconPanel({ onChoose }: { onChoose: (icon: Icon) => void }) {
  return (
    <div className={styles.flipPanel}>
      <div className={styles.flipPanelTitle}>Venue bonus — choose a theme element</div>
      <div className={styles.flipOptions}>
        {ALL_ICONS.map((icon) => (
          <button key={icon} className={`${styles.flipOption} ${styles.flipFront}`} onClick={() => onChoose(icon)}>
            <IconChip icon={icon} size="md" />
            <span className={styles.flipOptionDesc}>{ICON_NAMES[icon]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function FlipChoicePanel({ card, onChoose }: { card: ScoringCard; onChoose: (side: 'front' | 'back') => void }) {
  return (
    <div className={styles.flipPanel}>
      <div className={styles.flipPanelTitle}>Choose a side — no take-backs</div>
      <div className={styles.flipPanelName}>{card.name}</div>
      <div className={styles.flipOptions}>
        <button className={`${styles.flipOption} ${styles.flipFront}`} onClick={() => onChoose('front')}>
          <span className={styles.flipOptionLabel}>Front</span>
          <span className={styles.flipOptionDesc}>{card.frontFormula}</span>
        </button>
        <button className={`${styles.flipOption} ${styles.flipBack}`} onClick={() => onChoose('back')}>
          <span className={styles.flipOptionLabel}>Back</span>
          <span className={styles.flipOptionDesc}>
            <IconChip icon={card.backIcon} size="md" />
            <span>{ICON_NAMES[card.backIcon]}</span>
          </span>
        </button>
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
        <div key={theme.id} className={`${styles.theme} ${player.chosenTheme?.id === theme.id ? styles.chosenTheme : ''}`}>
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

function ThemeSelectPanel({ player, playerId, onSelect }: { player: PlayerState; playerId: 1 | 2; onSelect: (theme: Theme) => void }) {
  if (!player.themeCard) return null

  if (player.chosenTheme) {
    return (
      <div className={styles.themeCommitted}>
        <span className={styles.committedLabel}>Theme locked:</span>
        <strong>{player.chosenTheme.name}</strong>
        {player.chosenTheme.icons.map((ic, i) => (
          <span key={i} className={styles.themeIconRow}>
            <IconChip icon={ic} size="sm" />
            <span className={styles.themeIconName}>{ICON_NAMES[ic]}</span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.themeSelectPanel}>
      <div className={styles.themeSelectPrompt}>Player {playerId}: choose your theme</div>
      <div className={styles.themeDisplay}>
        {[player.themeCard.front, player.themeCard.back].map((theme) => (
          <button key={theme.id} className={`${styles.theme} ${styles.themeBtn}`} onClick={() => onSelect(theme)}>
            <span className={styles.themeName}>{theme.name}</span>
            <div className={styles.themeIcons}>
              {theme.icons.map((ic, i) => (
                <span key={i} className={styles.themeIconRow}>
                  <IconChip icon={ic} size="sm" />
                  <span className={styles.themeIconName} style={{ color: ICON_COLORS[ic] }}>{ICON_NAMES[ic]}</span>
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ScoreArea({ player }: { player: PlayerState }) {
  const theme = player.chosenTheme!
  const rubric = evaluateLiveRubric(player)
  const tierResult = rubric?.find((r) => !r.isBonus && r.active)

  return (
    <div className={styles.scoreArea}>
      <div className={styles.scoreTheme}>
        <span className={styles.scoreThemeName}>{theme.name}</span>
        {theme.icons.map((ic, i) => <IconChip key={i} icon={ic} size="sm" />)}
      </div>

      {rubric && (
        <div className={styles.rubric}>
          {rubric.map((r) => (
            <span
              key={r.name}
              className={`${styles.rubricPill} ${r.active ? (r.isBonus ? styles.rubricBonus : styles.rubricActive) : ''}`}
              title={r.description}
            >
              {r.name} {r.active ? `+${r.points}` : r.points}
            </span>
          ))}
          {tierResult && <span className={styles.rubricTotal}>{tierResult.points + (rubric.find(r => r.isBonus && r.active)?.points ?? 0)} theme pts</span>}
        </div>
      )}

      {player.scoringCards.length > 0 && (
        <div className={styles.scoringCards}>
          {player.scoringCards.map((sc) => {
            const side = player.scoringFlips[sc.id] ?? 'front'
            return (
              <div key={sc.id} className={styles.scoringCardItem}>
                <span className={styles.scoringCardName}>{sc.name}</span>
                {side === 'front'
                  ? <span className={styles.scoringCardSide}>{sc.frontFormula}</span>
                  : <span className={styles.scoringCardSide}><IconChip icon={sc.backIcon} size="sm" /> {ICON_NAMES[sc.backIcon]}</span>
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
