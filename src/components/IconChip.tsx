import type { Icon } from '../types'
import styles from './IconChip.module.css'

export const ICON_COLORS: Record<Icon, string> = {
  whimsy: 'var(--icon-whimsy)',
  edge: 'var(--icon-edge)',
  nature: 'var(--icon-nature)',
  tradition: 'var(--icon-tradition)',
  elegance: 'var(--icon-elegance)',
}

export const ICON_NAMES: Record<Icon, string> = {
  whimsy: 'Whimsy',
  edge: 'Edge',
  nature: 'Nature',
  tradition: 'Tradition',
  elegance: 'Elegance',
}

interface Props {
  icon: Icon
  size?: 'sm' | 'md' | 'lg'
}

export function IconChip({ icon, size = 'md' }: Props) {
  return (
    <span
      className={`${styles.chip} ${styles[size]}`}
      style={{ background: ICON_COLORS[icon] }}
      title={ICON_NAMES[icon]}
    />
  )
}
