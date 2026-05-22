import { useGameStore } from '../store'
import { calculateScore, hasValidWedding } from '../scoring'
import type { Theme, GridPosition } from '../types'
import { GRID_BONUSES } from '../types'
import { IconChip, ICON_NAMES, ICON_COLORS } from './IconChip'
import { IconBar } from './IconBar'
import { CardView } from './CardView'
import type { Icon } from '../types'
import styles from './EndgameScreen.module.css'

const POSITIONS: GridPosition[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const BONUS_LABELS = { draw2: 'Draw 2', book: 'Book', coins3: '+3 Coins', none: 'Venue' }

export function EndgameScreen() {
  const phase = useGameStore((s) => s.phase)
  const players = useGameStore((s) => s.players)
  const selectTheme = useGameStore((s) => s.selectTheme)

  if (phase === 'endgame_theme_select') {
    return (
      <div className={styles.screen}>
        <div className={styles.banner}>
          <h1 className={styles.title}>12 Months Are Up!</h1>
          <p className={styles.sub}>Review your wedding, then choose your scoring theme.</p>
        </div>

        <div className={styles.playerPanels}>
          {([1, 2] as const).map((pid) => {
            const player = players[pid]
            if (!player.themeCard) return null
            const chosen = player.chosenTheme

            function iconCounts(): Record<Icon, number> {
              const counts: Record<Icon, number> = { whimsy: 0, edge: 0, nature: 0, tradition: 0, elegance: 0 }
              for (const card of Object.values(player.grid)) {
                if (card) card.icons.forEach((ic) => counts[ic]++)
              }
              return counts
            }

            return (
              <div key={pid} className={styles.playerPanel}>
                <div className={styles.panelHeader}>
                  Player {pid} — 💰 {player.coins} coins
                </div>

                <IconBar counts={iconCounts()} />

                <div className={styles.miniGrid}>
                  {POSITIONS.map((pos) => {
                    const card = player.grid[pos]
                    const bonus = GRID_BONUSES[pos]
                    return (
                      <div key={pos} className={`${styles.miniCell} ${card ? styles.miniCellFilled : ''}`}>
                        {card ? (
                          <CardView card={card} compact />
                        ) : (
                          <span className={styles.miniBonus}>{BONUS_LABELS[bonus]}</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {player.goals.length > 0 && (
                  <div className={styles.goalsRow}>
                    <span className={styles.goalsLabel}>Goals:</span>
                    {player.goals.map((g) => (
                      <span key={g.id} className={styles.goalPill}>{g.name}</span>
                    ))}
                  </div>
                )}

                <div className={styles.themeSection}>
                  {chosen ? (
                    <div className={styles.chosenBanner}>
                      Theme chosen: <strong>{chosen.name}</strong>
                      <div className={styles.chosenIcons}>
                        {chosen.icons.map((ic, i) => (
                          <span key={i} className={styles.iconLabel}>
                            <IconChip icon={ic} size="sm" />
                            <span>{ICON_NAMES[ic]}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.themePrompt}>Player {pid}: choose your scoring theme</div>
                      <div className={styles.themeOptions}>
                        {[player.themeCard.front, player.themeCard.back].map((theme) => (
                          <ThemeOption
                            key={theme.id}
                            theme={theme}
                            iconCounts={iconCounts()}
                            onSelect={() => selectTheme(pid, theme)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Scoring phase
  const p1 = players[1]
  const p2 = players[2]
  const p1Valid = hasValidWedding(p1)
  const p2Valid = hasValidWedding(p2)
  const p1Score = p1Valid ? calculateScore(p1) : null
  const p2Score = p2Valid ? calculateScore(p2) : null

  let winner: string
  if (!p1Valid && !p2Valid) winner = 'Neither player has a valid wedding!'
  else if (!p1Valid) winner = 'Player 2 wins! (Player 1 has no venue)'
  else if (!p2Valid) winner = 'Player 1 wins! (Player 2 has no venue)'
  else if (p1Score!.total > p2Score!.total) winner = 'Player 1 wins!'
  else if (p2Score!.total > p1Score!.total) winner = 'Player 2 wins!'
  else winner = "It's a tie!"

  return (
    <div className={styles.screen}>
      <div className={styles.banner}>
        <h1 className={styles.title}>Final Scores</h1>
        <div className={styles.winner}>{winner}</div>
      </div>

      <div className={styles.scoreCards}>
        {([1, 2] as const).map((pid) => {
          const player = players[pid]
          const score = pid === 1 ? p1Score : p2Score
          const valid = pid === 1 ? p1Valid : p2Valid

          return (
            <div key={pid} className={styles.scoreCard}>
              <div className={styles.scoreHeader}>
                Player {pid} — {player.chosenTheme?.name ?? 'No theme'}
              </div>
              {!valid ? (
                <div className={styles.invalid}>No venue booked — ineligible</div>
              ) : score ? (
                <>
                  <div className={styles.line}><span>Excitement</span><span>{score.excitement}</span></div>
                  {score.goalResults.filter((r) => r.achieved).map((r) => (
                    <div key={r.goal.id} className={styles.line}>
                      <span>{r.goal.name}</span>
                      <span>+{r.points}</span>
                    </div>
                  ))}
                  {score.goalResults.filter((r) => !r.achieved && player.goals.find(g => g.id === r.goal.id)).length > 0 && (
                    <div className={styles.missedLabel}>Not achieved:</div>
                  )}
                  {score.goalResults.filter((r) => !r.achieved).map((r) => (
                    <div key={r.goal.id} className={`${styles.line} ${styles.missed}`}>
                      <span>{r.goal.name}</span>
                      <span>0</span>
                    </div>
                  ))}
                  <div className={styles.line}><span>Leftover coins ({player.coins})</span><span>+{score.coins}</span></div>
                  <div className={styles.total}>Total: {score.total}</div>
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ThemeOption({ theme, iconCounts, onSelect }: { theme: Theme; iconCounts: Record<Icon, number>; onSelect: () => void }) {
  const [a, b] = theme.icons
  const countA = iconCounts[a]
  const countB = iconCounts[b]

  return (
    <button className={styles.themeOption} onClick={onSelect}>
      <span className={styles.themeName}>{theme.name}</span>
      <div className={styles.themeIconRows}>
        {([a, b] as Icon[]).map((ic) => (
          <span key={ic} className={styles.iconLabel}>
            <IconChip icon={ic} size="sm" />
            <span style={{ color: ICON_COLORS[ic] }}>{ICON_NAMES[ic]}</span>
            <span className={styles.iconCount}>×{iconCounts[ic]}</span>
          </span>
        ))}
      </div>
      <span className={styles.themeHint}>
        {countA + countB} theme icons booked
      </span>
    </button>
  )
}
