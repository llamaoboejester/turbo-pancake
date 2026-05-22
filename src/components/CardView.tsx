import type { AnyCard, VendorCard, VenueCard, ScoringCard } from '../types'
import { IconChip } from './IconChip'
import { CATEGORY_LABELS } from '../constants'
import styles from './CardView.module.css'

interface Props {
  card: AnyCard
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  compact?: boolean
}

export function CardView({ card, selected, disabled, onClick, compact }: Props) {
  const cls = [
    styles.card,
    styles[card.type],
    selected ? styles.selected : '',
    disabled ? styles.disabled : '',
    onClick && !disabled ? styles.clickable : '',
    compact ? styles.compact : '',
  ].join(' ')

  if (card.type === 'scoring') return <ScoringCardView card={card} cls={cls} onClick={onClick} compact={compact} />

  return (
    <div className={cls} onClick={disabled ? undefined : onClick}>
      <div className={styles.header}>
        <span className={styles.name}>{card.name}</span>
        {card.type === 'vendor' && (
          <span className={styles.category}>{CATEGORY_LABELS[(card as VendorCard).category]}</span>
        )}
      </div>
      <div className={styles.icons}>
        {card.icons.map((icon, i) => (
          <IconChip key={i} icon={icon} size={compact ? 'sm' : 'md'} />
        ))}
      </div>
      <div className={styles.stats}>
        <span className={styles.cost}>💰 {card.cost}</span>
        <span className={styles.excitement}>✨ {(card as VendorCard | VenueCard).excitement}</span>
      </div>
    </div>
  )
}

function ScoringCardView({ card, cls, onClick, compact }: { card: ScoringCard; cls: string; onClick?: () => void; compact?: boolean }) {
  return (
    <div className={cls} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.name}>{card.name}</span>
        <span className={styles.category}>{CATEGORY_LABELS[card.category]}</span>
      </div>
      <div className={styles.goalText}>{card.frontFormula}</div>
      {!compact && (
        <div className={styles.scoringBack}>
          Back: <IconChip icon={card.backIcon} size="sm" />
        </div>
      )}
    </div>
  )
}
