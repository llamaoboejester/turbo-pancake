import type { VendorCategory } from './types'

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  attire_accessories: 'Attire & Accessories',
  ceremony: 'Ceremony',
  entertainment: 'Entertainment',
  favors_gifts: 'Favors & Gifts',
  flowers_decorations: 'Flowers & Decorations',
  food_drink: 'Food & Drink',
  photography: 'Photography',
  stationery: 'Stationery',
  transportation: 'Transportation',
}

export const GOAL_RULE_TEXT: Record<string, string> = {
  goal_indulged:     '5 pts per Food & Drink vendor booked, max 15',
  goal_captivated:   '5 pts per Entertainment vendor booked, max 15',
  goal_moved:        '5 pts per Ceremony vendor booked, max 15',
  goal_spoiled:      '5 pts per Transportation vendor booked, max 15',
  goal_admired:      '5 pts per Photography vendor booked, max 15',
  goal_impressed:    '5 pts per Attire & Accessories vendor booked, max 15',
  goal_amazed:       '5 pts per Flowers & Decorations vendor booked, max 15',
  goal_honored:      '5 pts per Stationery vendor booked, max 15',
  goal_pampered:     '5 pts per Favors & Gifts vendor booked, max 15',

  goal_modest:       '5 pts if cost-1 is your most common booking cost',
  goal_refined:      '10 pts if cost-2 is your most common booking cost',
  goal_extravagant:  '15 pts if cost 3+ is your most common booking cost',

  goal_intimate:     '5 pts if excitement 1 is your most common booked value',
  goal_vibrant:      '10 pts if excitement 2 is your most common booked value',
  goal_spectacular:  '15 pts if excitement 3+ is your most common booked value',

  goal_subtle:       '10 pts if one of your theme icons is tied for most frequent',
  goal_matched:      '10 pts if both theme icons appear equally (non-zero)',
  goal_thematic:     '20 pts if both theme icons are tied for most frequent',
  goal_balanced:     '15 pts if all 5 icons appear equally across your booked cards',
  goal_unforgettable:'30 pts if only your theme icons appear across all booked cards',
}
