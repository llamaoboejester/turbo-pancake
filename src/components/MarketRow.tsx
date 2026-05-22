import { useGameStore } from '../store'
import type { MarketType, AnyCard, GridPosition } from '../types'
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
  const swapCard = useGameStore((s) => s.swapCard)

  const isSecondHalf = roundNumber > 6
  const activeMarkets: MarketType[] = isSecondHalf ? ['vendor', 'scoring'] : ['vendor', 'venue']

  const isTaking = phase === 'taking_cards' || phase === 'bonus_draw2' || phase === 'venue_bonus_take'
  const isSwapping = phase === 'swapping'
  const takenCount = (pendingAction && 'taken' in pendingAction) ? pendingAction.taken.length : 0

  const player = players[activePlayer]
  const hasBookedVenue = Object.values(player.grid).some((c) => c?.type === 'venue')

  const swapReplacePosition = isSwapping && pendingAction?.type === 'swap'
    ? (pendingAction as { type: 'swap'; replacePosition: GridPosition | null }).replacePosition
    : null
  const swapReady = isSwapping && swapReplacePosition !== null

  function canTakeCard(card: AnyCard | null): boolean {
    if (!isTaking || !card) return false
    if (takenCount >= 2) return false
    if (card.type === 'venue' && hasBookedVenue) return false
    if (card.type === 'vendor' && player.stagingVendors.length >= 5) return false
    if (card.type === 'venue' && player.stagingVenues.length >= 2) return false
    return true
  }

  function canSwapCard(card: AnyCard | null): boolean {
    if (!swapReady || !card) return false
    if (card.type !== 'vendor') return false
    if (player.coins < card.cost) return false
    return true
  }

  function canBlindDraw(marketType: MarketType): boolean {
    if (markets[marketType].deck.length === 0) return false
    if (isTaking && takenCount < 2) return true
    if (swapReady && marketType === 'vendor') return true
    return false
  }

  function handleCardClick(marketType: MarketType, index: number, card: AnyCard) {
    if (isTaking && canTakeCard(card)) {
      takeCard(marketType, index)
    } else if (swapReady && canSwapCard(card)) {
      swapCard(marketType, index)
    }
  }

  function handleBlindClick(marketType: MarketType) {
    if (isTaking) takeCard(marketType, 'blind')
    else if (swapReady) swapCard(marketType, 'blind')
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
                const swappable = canSwapCard(card)
                const active = isTaking || swapReady
                const disabled = active && !takeable && !swappable
                return (
                  <div key={i} className={styles.slot}>
                    {card ? (
                      <CardView
                        card={card}
                        onClick={(takeable || swappable) ? () => handleCardClick(mt, i, card) : undefined}
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
                  onClick={() => handleBlindClick(mt)}
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
