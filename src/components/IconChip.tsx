import type { Icon } from '../types'
import styles from './IconChip.module.css'

const ICON_SYMBOLS: Record<Icon, string> = {
  whimsy: '✿',
  edge: '⚡',
  nature: '🌿',
  tradition: '⚭',
  elegance: '◆',
}

const ICON_COLORS: Record<Icon, string> = {
  whimsy: 'var(--icon-whimsy)',
  edge: 'var(--icon-edge)',
  nature: 'var(--icon-nature)',
  tradition: 'var(--icon-tradition)',
  elegance: 'var(--icon-elegance)',
}

interface Props {
  icon: Icon
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function IconChip({ icon, size = 'md', showName = false }: Props) {
  return (
    <span
      className={`${styles.chip} ${styles[size]}`}
      style={{ background: ICON_COLORS[icon] }}
      title={icon}
    >
      {ICON_SYMBOLS[icon]}
      {showName && <span className={styles.name}>{icon.charAt(0).toUpperCase() + icon.slice(1)}</span>}
    </span>
  )
}
