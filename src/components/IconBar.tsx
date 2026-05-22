import type { Icon } from '../types'
import { ICON_COLORS } from './IconChip'
import styles from './IconBar.module.css'

const ICONS: Icon[] = ['whimsy', 'edge', 'nature', 'tradition', 'elegance']
const MAX_SEGMENTS = 10

interface Props {
  counts: Record<Icon, number>
}

export function IconBar({ counts }: Props) {
  const maxCount = Math.max(1, ...Object.values(counts))
  const segments = Math.max(MAX_SEGMENTS, maxCount)

  return (
    <div className={styles.container}>
      {ICONS.map((icon) => {
        const count = counts[icon]
        return (
          <div key={icon} className={styles.barCol}>
            <div className={styles.bar}>
              {Array.from({ length: segments }).map((_, i) => {
                const filled = i < count
                return (
                  <div
                    key={i}
                    className={`${styles.segment} ${filled ? styles.filled : styles.empty}`}
                    style={filled ? { background: ICON_COLORS[icon] } : undefined}
                  />
                )
              })}
            </div>
            <div className={styles.dot} style={{ background: ICON_COLORS[icon] }} />
          </div>
        )
      })}
    </div>
  )
}
