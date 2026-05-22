import { ActionBar } from './ActionBar'
import { MarketRow } from './MarketRow'
import { PlayerBoard } from './PlayerBoard'
import styles from './GameBoard.module.css'

export function GameBoard() {
  return (
    <div className={styles.layout}>
      <ActionBar />
      <MarketRow />
      <div className={styles.players}>
        <PlayerBoard playerId={1} />
        <PlayerBoard playerId={2} />
      </div>
    </div>
  )
}
