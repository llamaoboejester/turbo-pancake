import { useGameStore } from '../store'
import type { MarketType, AnyCard } from '../types'
import { CardView } from './CardView'
import styles from './MarketRow.module.css'

const MARKET_LABELS: Record<MarketType, string> = {
  vendor: 'Vendor Market',
  venue: 'Venue Market',
  goal: 'Goal Market',
}

export function MarketRow() {
  const markets = useGameStore((s) => s.markets)
  const phase = useGameStore((s) => s.phase)
  const activePlayer = useGameStore((s) => s.activePlayer)
  const players = useGameStore((s) => s.players)
  const takeCard = useGameStore((s) => s.takeCard)

  const isTaking = phase === 'taking_cards' || phase === 'bonus_draw2'
  const pendingAction = useGameStore((s) => s.pendingAction)
  const takenCount = (pendingAction && 'taken' in pendingAction) ? pendingAction.taken.length : 0
  const player = players[activePlayer]
  const hasBookedVenue = Object.values(player.grid).some((c) => c?.type === 'venue')

  function canTakeFromMarket(_marketType: MarketType, card: AnyCard | null): boolean {
    if (!isTaking || !card) return false
    if (takenCount >= 2) return false
    if (card.type === 'venue' && hasBookedVenue) return false
    if (card.type === 'vendor' && player.stagingVendors.length >= 5) return false
    if (card.type === 'venue' && player.stagingVenues.length >= 2) return false
    return true
  }

  function canBlindDraw(marketType: MarketType): boolean {
    if (!isTaking) return false
    if (takenCount >= 2) return false
    if (markets[marketType].deck.length === 0) return false
    return true
  }

  return (
    <div className={styles.row}>
      {(['vendor', 'venue', 'goal'] as MarketType[]).map((mt) => {
        const market = markets[mt]
        return (
          <div key={mt} className={styles.market}>
            <div className={styles.label}>{MARKET_LABELS[mt]}</div>
            <div className={styles.cards}>
              {market.visible.map((card, i) => (
                <div key={i} className={styles.slot}>
                  {card ? (
                    <CardView
                      card={card}
                      onClick={canTakeFromMarket(mt, card) ? () => takeCard(mt, i) : undefined}
                      disabled={isTaking && !canTakeFromMarket(mt, card)}
                    />
                  ) : (
                    <div className={styles.empty}>—</div>
                  )}
                </div>
              ))}
              <div className={styles.deck}>
                <button
                  className={styles.blindBtn}
                  disabled={!canBlindDraw(mt)}
                  onClick={() => takeCard(mt, 'blind')}
                  title="Draw blind from deck"
                >
                  🂠 {market.deck.length}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
