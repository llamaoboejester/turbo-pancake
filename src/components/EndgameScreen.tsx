import { useGameStore } from '../store'
import { calculateScore, hasValidWedding } from '../scoring'
import { IconChip, ICON_NAMES } from './IconChip'
import styles from './EndgameScreen.module.css'

export function EndgameScreen() {
  const players = useGameStore((s) => s.players)

  const p1 = players[1]
  const p2 = players[2]
  const p1Valid = hasValidWedding(p1)
  const p2Valid = hasValidWedding(p2)
  const p1Score = p1Valid && p1.chosenTheme ? calculateScore(p1, p2) : null
  const p2Score = p2Valid && p2.chosenTheme ? calculateScore(p2, p1) : null

  let winner: string
  if (!p1Valid && !p2Valid) winner = 'Neither player has a valid wedding!'
  else if (!p1Valid) winner = 'Player 2 wins! (Player 1 has no venue)'
  else if (!p2Valid) winner = 'Player 1 wins! (Player 2 has no venue)'
  else if (p1Score && p2Score && p1Score.total > p2Score.total) winner = 'Player 1 wins!'
  else if (p1Score && p2Score && p2Score.total > p1Score.total) winner = 'Player 2 wins!'
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
                {score && <span className={styles.totalBadge}>{score.total} pts</span>}
              </div>

              {!valid ? (
                <div className={styles.invalid}>No venue booked — ineligible</div>
              ) : score ? (
                <>
                  <div className={styles.line}><span>Excitement</span><span>{score.excitement}</span></div>

                  <div className={styles.sectionLabel}>Theme Score</div>
                  {score.themeResults.map((r) => (
                    <div key={r.name} className={`${styles.line} ${r.active ? '' : styles.missed}`}>
                      <span>{r.name}{r.isBonus ? ' (bonus)' : ''}</span>
                      <span>{r.active ? `+${r.points}` : '—'}</span>
                    </div>
                  ))}

                  {player.scoringCards.length > 0 && (
                    <>
                      <div className={styles.sectionLabel}>Scoring Cards</div>
                      {score.scoringCardResults.map((r) => (
                        <div key={r.card.id} className={styles.scoringCardRow}>
                          <span className={styles.cardName}>{r.card.name}</span>
                          <span className={styles.cardPoints}>
                            {r.side === 'back' ? (
                              <span className={styles.backSide}>
                                <IconChip icon={r.card.backIcon} size="sm" />
                                <span className={styles.backLabel}>{ICON_NAMES[r.card.backIcon]}</span>
                              </span>
                            ) : (
                              `+${r.points}`
                            )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {score.tableauBonus > 0 && (
                    <div className={styles.line}><span>Full tableau bonus</span><span>+{score.tableauBonus}</span></div>
                  )}

                  <div className={styles.line}><span>Coins ({player.coins})</span><span>+{score.coins}</span></div>
                  <div className={styles.line}><span>Leftover cards ({score.leftoverCards})</span><span>+{score.leftoverCards}</span></div>

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
