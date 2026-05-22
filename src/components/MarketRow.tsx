import { useGameStore } from '../store'
import type { MarketType, AnyCard } from '../types'
import { CardView } from './CardView'
import styles from './MarketRow.module.css'

const MARKET_LABELS: Record<MarketType, string> = {
  vendor: 'Vendor Market',
  venue: 'Venue Market',
  scoring: 'Scoring Cards',
}

export function MarketRow() {
  const markets = useGameStore((s) => s.markets)
  const phase = useGameStore((s) => s.phase)
  const roundNumber = useGameStore((s) => s.roundNumber)
  const activePlayer = useGameStore((s) => s.activePlayer)
  const players = useGameStore((s) => s.players)
  const pendingAction = useGameStore((s) => s.pendingAction)
  const takeCard = useGameStore((s) => s.takeCard)

  const isSecondHalf = roundNumber > 6
  const activeMarkets: MarketType[] = isSecondHalf ? ['vendor', 'scoring'] : ['vendor', 'venue']

  const isTaking = phase === 'taking_cards' || phase === 'bonus_draw2'
  const takenCount = (pendingAction && 'taken' in pendingAction) ? pendingAction.taken.length : 0

  const player = players[activePlayer]
  const hasBookedVenue = Object.values(player.grid).some((c) => c?.type === 'venue')

  function canTakeCard(card: AnyCard | null): boolean {
    if (!isTaking || !card) return false
    if (takenCount >= 2) return false
    if (card.type === 'venue' && hasBookedVenue) return false
    if (card.type === 'vendor' && player.stagingVendors.length >= 5) return false
    if (card.type === 'venue' && player.stagingVenues.length >= 2) return false
    return true
  }

  function canBlindDraw(marketType: MarketType): boolean {
    if (markets[marketType].deck.length === 0) return false
    return isTaking && takenCount < 2
  }

  return (
    <div className={styles.row}>
      {activeMarkets.map((mt) => {
        const market = markets[mt]
        return (
          <div key={mt} className={`${styles.market} ${mt === 'vendor' ? styles.vendorMarket : ''}`}>
            <div className={styles.label}>{MARKET_LABELS[mt]}</div>
            <div className={styles.cards}>
              {market.visible.map((card, i) => {
                const takeable = canTakeCard(card)
                const disabled = isTaking && !takeable
                return (
                  <div key={i} className={styles.slot}>
                    {card ? (
                      <CardView
                        card={card}
                        onClick={takeable ? () => takeCard(mt, i) : undefined}
                        disabled={disabled}
                      />
                    ) : (
                      <div className={styles.empty}>—</div>
                    )}
                  </div>
                )
              })}
              <div className={styles.deck}>
                <button
                  className={styles.blindBtn}
                  disabled={!canBlindDraw(mt)}
                  onClick={() => takeCard(mt, 'blind')}
                >
                  <span className={styles.deckIcon}>🂠</span>
                  <span className={styles.deckLabel}>Deck · {market.deck.length}</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
