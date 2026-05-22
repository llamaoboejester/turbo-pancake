import { useGameStore } from '../store'
import { calculateScore, hasValidWedding } from '../scoring'
import type { Theme } from '../types'
import { IconChip, ICON_NAMES } from './IconChip'
import styles from './EndgameScreen.module.css'

export function EndgameScreen() {
  const phase = useGameStore((s) => s.phase)
  const players = useGameStore((s) => s.players)
  const selectTheme = useGameStore((s) => s.selectTheme)

  if (phase === 'endgame_theme_select') {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>12 Months Are Up!</h1>
        <p className={styles.sub}>Each player must choose their scoring theme.</p>
        <div className={styles.themeSelectors}>
          {([1, 2] as const).map((pid) => {
            const player = players[pid]
            if (!player.themeCard) return null
            const chosen = player.chosenTheme

            return (
              <div key={pid} className={styles.themeSelector}>
                <div className={styles.selectorLabel}>Player {pid}</div>
                {chosen ? (
                  <div className={styles.chosen}>Chose: <strong>{chosen.name}</strong></div>
                ) : (
                  <div className={styles.themes}>
                    {[player.themeCard.front, player.themeCard.back].map((theme) => (
                      <ThemeOption key={theme.id} theme={theme} onSelect={() => selectTheme(theme)} />
                    ))}
                  </div>
                )}
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
      <h1 className={styles.title}>Final Scores</h1>
      <div className={styles.winner}>{winner}</div>

      <div className={styles.scoreCards}>
        {([1, 2] as const).map((pid) => {
          const player = players[pid]
          const score = pid === 1 ? p1Score : p2Score
          const valid = pid === 1 ? p1Valid : p2Valid

          return (
            <div key={pid} className={styles.scoreCard}>
              <div className={styles.scoreHeader}>Player {pid} — {player.chosenTheme?.name ?? 'No theme'}</div>
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

function ThemeOption({ theme, onSelect }: { theme: Theme; onSelect: () => void }) {
  return (
    <button className={styles.themeOption} onClick={onSelect}>
      <span className={styles.themeName}>{theme.name}</span>
      <div className={styles.themeIcons}>
        {theme.icons.map((ic, i) => (
          <span key={i} className={styles.iconLabel}>
            <IconChip icon={ic} size="md" />
            <span className={styles.iconName}>{ICON_NAMES[ic]}</span>
          </span>
        ))}
      </div>
    </button>
  )
}
