# Wedding Planning Game — Digital Prototype PRD

## 1. Purpose & Scope

This document defines all requirements for a browser-based digital prototype of a 2-player local wedding planning tableau game. The prototype is used for playtesting and rules validation. It runs entirely in the browser with no backend, no accounts, and no networking.

This document is self-contained. No prior context is required to implement from it.

---

## 2. Non-Goals

The following are explicitly out of scope:

- Networking or multiplayer over a connection
- AI opponents
- Accounts, persistence, or save states
- Mobile optimization
- Drag and drop
- Card artwork (cards are rendered from data)
- Animations beyond simple transitions
- Admin tools
- Accessibility compliance
- Solo mode
- Venue special effects

---

## 3. Technical Stack

- **Vite + React + TypeScript** — component model maps naturally to cards, markets, and boards
- **Zustand** — centralized game state management
- **CSS Modules** — scoped styling, no framework
- All game content loaded from JSON files at startup
- Desktop browser only, single shared device

---

## 4. Icon System (WENTL)

There are exactly 5 icons. They always appear in this canonical order — in data, in UI, everywhere:

| Order | Key | Display Name | Color | Symbol |
|-------|-----|--------------|-------|--------|
| 1 | `whimsy` | Whimsy | Pink | Spiral |
| 2 | `edge` | Edge | Purple | Bolt |
| 3 | `nature` | Nature | Green | Leaf |
| 4 | `tradition` | Tradition | Burgundy | Interlocking Rings |
| 5 | `elegance` | Elegance | Gold | Diamond |

The mnemonic is **WENTL** (the L stands for "Legance"). Never render icons out of this order.

---

## 5. Data Architecture

All game content is defined in JSON files. The app loads these at startup. Card content is never hardcoded.

### 5.1 Vendor Schema

```json
{
  "id": "vendor_001",
  "name": "Magical Wine-Paired Feast",
  "category": "food_drink",
  "cost": 2,
  "excitement": 2,
  "icons": ["whimsy", "edge"]
}
```

- `category`: one of the 9 vendor categories (see Section 6.1)
- `cost`: integer 1–3
- `excitement`: integer, stored explicitly (not derived)
- `icons`: array of exactly `cost` icon keys, always in WENTL order, repetition allowed

**108 total vendors — 12 per category.**

### 5.2 Venue Schema

```json
{
  "id": "venue_001",
  "name": "Whispering Festival Manor",
  "cost": 3,
  "excitement": 2,
  "icons": ["whimsy", "edge", "nature"]
}
```

- `cost`: integer 2–4
- `excitement`: integer, stored explicitly
- `icons`: array of exactly `cost` icon keys, always in WENTL order, repetition allowed
- Venues have no category

### 5.3 Goal Schema

```json
{
  "id": "goal_001",
  "name": "Indulged",
  "type": "guest",
  "category": "food_drink"
}
```

The `type` field determines scoring logic (see Section 10.3). All scoring rules are implemented in code — the JSON stores only the data needed to identify and display the goal.

Goal types and their additional fields:

| Type | Additional Fields |
|------|------------------|
| `guest` | `category` |
| `budget` | `target_cost` (integer — for Extravagant, value is 3 and scoring treats it as 3+) |
| `excitement` | `target_excitement` (integer — for Spectacular, value is 3 and scoring treats it as 3+) |
| `theme` | `subtype` (one of: `subtle`, `matched`, `thematic`, `balanced`, `unforgettable`) |

### 5.4 Theme Card Schema

Theme cards are physical double-sided cards. Each card has a front theme and a back theme. Players are dealt one theme card and play with both themes available.

```json
{
  "id": "theme_card_1",
  "front": {
    "id": "romantic",
    "name": "Romantic",
    "icons": ["whimsy", "tradition"]
  },
  "back": {
    "id": "fairytale",
    "name": "Fairytale",
    "icons": ["whimsy", "elegance"]
  }
}
```

- Each theme has exactly 2 icons in WENTL order
- Both themes on a card share exactly one icon (guaranteed by design)
- There are 5 theme cards, 10 themes total

---

## 6. Card Reference

### 6.1 Vendor Categories (9)

- Attire and Accessories
- Ceremony
- Entertainment
- Favors and Gifts
- Flowers and Decorations
- Food and Drink
- Photography
- Stationery
- Transportation

### 6.2 All 10 Themes

| Name | Icons |
|------|-------|
| Eclectic | Whimsy + Edge |
| Bohemian | Whimsy + Nature |
| Romantic | Whimsy + Tradition |
| Fairytale | Whimsy + Elegance |
| Industrial | Edge + Nature |
| Contemporary | Edge + Tradition |
| Glamorous | Edge + Elegance |
| Rustic | Nature + Tradition |
| Garden | Nature + Elegance |
| Classic | Tradition + Elegance |

### 6.3 Physical Theme Card Pairings (5 cards)

| Card | Front | Back | Shared Icon |
|------|-------|------|-------------|
| 1 | Romantic (W+T) | Fairytale (W+L) | Whimsy |
| 2 | Eclectic (W+E) | Glamorous (E+L) | Edge |
| 3 | Bohemian (W+N) | Industrial (E+N) | Nature |
| 4 | Contemporary (E+T) | Rustic (N+T) | Tradition |
| 5 | Garden (N+L) | Classic (T+L) | Elegance |

### 6.4 All 20 Goals

#### Guest Goals (9)

One per vendor category. All follow the same scoring rule.

| Name | Category |
|------|----------|
| Indulged | Food and Drink |
| Captivated | Entertainment |
| Moved | Ceremony |
| Spoiled | Transportation |
| Admired | Photography |
| Impressed | Attire and Accessories |
| Amazed | Flowers and Decorations |
| Honored | Stationery |
| Pampered | Favors and Gifts |

**Scoring:** 5 points per booked vendor of the matching category, maximum 15 points.

#### Budget Goals (3)

Evaluate cost distribution across all booked cards (vendors and venue).

| Name | Condition | Points |
|------|-----------|--------|
| Modest | Cost-1 is your most common booking cost (nothing beats it; ties are ok) | 5 |
| Refined | Cost-2 is your most common booking cost (nothing beats it; ties are ok) | 10 |
| Extravagant | Cost 3-or-more is your most common booking cost (nothing beats it; ties are ok) | 15 |

A player may score multiple budget goals if two cost values are tied for most common.

#### Excitement Goals (3)

Evaluate excitement distribution across all booked cards (vendors and venue).

| Name | Condition | Points |
|------|-----------|--------|
| Intimate | Excitement-1 is your most common excitement value (nothing beats it; ties are ok) | 5 |
| Vibrant | Excitement-2 is your most common excitement value (nothing beats it; ties are ok) | 10 |
| Spectacular | Excitement 3-or-more is your most common excitement value (nothing beats it; ties are ok) | 15 |

A player may score multiple excitement goals if two excitement values are tied for most common.

#### Theme Goals (5)

Evaluate icon counts across all booked cards (vendors + venue). At endgame, the player chooses one of their two themes — only that chosen theme's icons are used for theme goal evaluation.

| Name | Condition | Points |
|------|-----------|--------|
| Subtle | At least one of your chosen theme's icons is tied for most frequent across all booked cards | 10 |
| Matched | Both of your chosen theme's icons appear the same number of times (non-zero) | 10 |
| Thematic | Both of your chosen theme's icons are tied for most frequent across all booked cards | 20 |
| Balanced | All 5 icons appear the same number of times across all booked cards | 15 |
| Unforgettable | Only your chosen theme's icons appear across all booked cards (no other icons present) | 30 |

---

## 7. Game Setup

### 7.1 Decks

Shuffle all vendors into one vendor deck. Shuffle all venues into one venue deck. Shuffle all goals into one goal deck.

### 7.2 Markets

Deal 3 cards face-up from each deck to form three visible markets:

- **Vendor market** — 3 visible cards + remaining vendor deck
- **Venue market** — 3 visible cards + remaining venue deck
- **Goal market** — 3 visible cards + remaining goal deck

Each market is a river (see Section 8).

### 7.3 Player Setup

Each player receives:

- **6 coins**
- **2 vendor cards** drawn from the top of the vendor deck (these are placed in their staging area)
- **1 theme card** (drawn from shuffled theme card deck) — both themes are visible to both players

Shuffle the 5 theme cards and deal one to each player.

---

## 8. Market System (River Mechanic)

Each market has 3 visible slots. Slot 1 is the oldest position; Slot 3 is the newest.

### 8.1 Taking Cards

Players may take from:
- Any visible card in any market (free selection)
- The top card of any market's deck, face-down and unseen (blind draw)

Blind-drawn cards go directly to the player's staging area and do not pass through the visible market.

### 8.2 End-of-Turn Replenishment

After a player's turn fully resolves (including all bonus actions):

1. Remaining visible cards slide toward Slot 1 to fill gaps
2. New cards are drawn from the top of the deck to fill any empty slots, entering at the newest position

### 8.3 End-of-Round Discard

After both players have taken their turn (end of round):

1. The card in Slot 1 (oldest) of each market is discarded
2. Remaining cards slide toward Slot 1
3. A new card is drawn from the top of the deck to fill Slot 3

This discard happens to all three markets.

---

## 9. Turn Structure

Players alternate turns. Player 1 goes first. Each player takes exactly 12 turns. The game lasts 24 total turns (12 rounds of 2 turns each).

On each turn, the active player chooses **exactly one** of the following four actions.

---

## 10. Actions

### 10.1 Take 2 Cards

Take any 2 cards from the public markets. Each card may independently be:
- A visible card from any market slot
- The top card of any market deck (blind)

The 2 cards may be from the same or different markets in any combination (vendor, venue, goal).

**Restriction:** A player who has already booked a venue may not take additional venue cards.

Taken cards go to the player's staging area.

### 10.2 Gain 3 Coins

Player gains 3 coins from the supply.

### 10.3 Book

Player books one card from their staging area into their 3×3 grid.

**Requirements:**
- Pay the card's full cost in coins
- Target grid space must be empty
- Card must be placed legally (see Section 11)

After a successful booking, the player gains the location bonus for that grid space (see Section 11.2).

### 10.4 Swap

Player takes one card directly from a public market (visible or blind) and immediately replaces an already-booked vendor in their grid.

**Requirements:**
- Pay the new card's full cost
- The replaced card must be a vendor (venues may not be swapped)
- The incoming card must be a vendor

**Effects:**
- Replaced vendor is discarded (original cost not refunded)
- No location bonus is granted (it was already granted when the space was originally booked)
- The new vendor occupies the same grid space

---

## 11. Grid System

### 11.1 Layout

Each player has a personal 3×3 grid. Spaces are numbered 1–9, left-to-right, top-to-bottom:

```
[1] [2] [3]
[4] [5] [6]
[7] [8] [9]
```

Space 5 (center) is the venue slot. All other spaces are vendor slots.

### 11.2 Space Bonuses

| Space | Position | Bonus |
|-------|----------|-------|
| Top-left | 1 | Draw 2 |
| Top-center | 2 | Book |
| Top-right | 3 | Gain 3 Coins |
| Middle-left | 4 | Book |
| Center | 5 | (Venue slot — no bonus) |
| Middle-right | 6 | Book |
| Bottom-left | 7 | Gain 3 Coins |
| Bottom-center | 8 | Book |
| Bottom-right | 9 | Draw 2 |

### 11.3 Legal Placement

- Venue cards may only be placed in Space 5 (center)
- Vendor cards may only be placed in non-center spaces (1–4, 6–9)
- Target space must be empty

### 11.4 Bonus Descriptions

**Draw 2:** Take any 2 cards from the markets, same rules as the Take 2 Cards action (visible or blind, any market).

**Book:** Gain one additional Book action. The player must still pay full cost for the card booked. This bonus Book action may trigger another bonus if the new card is placed in a bonus Book space (chains are allowed). Bonus Book actions may be used to book vendors or venues.

**Gain 3 Coins:** Player gains 3 coins.

---

## 12. Hand Limits

| Card Type | Limit |
|-----------|-------|
| Unbooked vendors | 5 |
| Unbooked venues | 2 |
| Goals | No limit |
| Theme cards | Always exactly 1 (2 themes shown) |

Hand limits are enforced at all times. A player may not acquire a card that would exceed their limit.

---

## 13. Voluntary Discarding

At any point during their own turn, a player may discard any number of unbooked vendors or venues from their staging area. Each discarded card yields 1 coin.

---

## 14. Venue Rules

- A player may hold at most 2 unbooked venues at once
- A player may only book one venue (the center space)
- When a player books a venue: all remaining unbooked venues in their staging area are discarded, yielding 1 coin each
- Once a venue is booked, the player may not acquire additional venue cards (Take 2 Cards and Swap are restricted accordingly)
- Venues may not be swapped out of the grid

---

## 15. Scoring & Endgame

### 15.1 Endgame Trigger

The game ends after both players have completed their 12th turn.

### 15.2 Theme Selection

Before scoring, each player chooses one of their two themes. This choice is used for all theme goal evaluation. The unchosen theme is ignored.

### 15.3 Valid Wedding

A player must have a booked venue to be eligible to win. A player without a booked venue cannot win regardless of score.

### 15.4 Final Score

```
Final Score = (sum of excitement on all booked cards) + (sum of points from all achieved goals) + (remaining coins)
```

Leftover coins are worth 1 point each. The player with the higher final score wins. Both players score independently — there is no catch-up mechanism.

---

## 16. UI Requirements

### 16.1 Layout

Single-screen application. No page navigation. All game state visible at all times.

Suggested layout regions:

- **Header:** current player indicator, turn number (e.g. "Turn 7 / 12"), round number, phase
- **Markets row:** vendor market, venue market, goal market — each showing 3 visible card slots and a deck indicator (face-down card count)
- **Player boards:** displayed side-by-side (or stacked), each containing:
  - 3×3 grid with space labels/bonuses visible on empty spaces
  - Staging area (unbooked vendors, venues, goals, theme card)
  - Coin count
  - Chosen/unchosen theme indicator (before endgame: both shown; after theme selection: one highlighted)
  - Icon frequency totals across booked cards

### 16.2 Card Rendering

Cards are rendered from JSON data. No artwork. Each card must display:

- Name
- Category (vendors only)
- Cost (as a number and as an icon count)
- Excitement value
- Icons (rendered as colored circular chips in WENTL order, symbol only — no text label)
- For goals: scoring rule text
- For themes: both icon names displayed as text

### 16.3 Action UI

Use click-to-select + click-to-confirm interaction:

1. Player clicks an action button or selects a card to initiate an action
2. Valid targets highlight; invalid targets are visually disabled
3. Player clicks a target to complete the action
4. State updates; turn resolves

No drag and drop.

### 16.4 State Visibility

Always display for each player:

- Coins
- Number of booked vendors, total grid spaces filled
- Icon counts across all booked cards (5 icon totals)
- Remaining turns
- Which theme is active / selected

Score is not displayed during the game. Final scores are revealed only at endgame after theme selection.

---

## 17. Rules Enforcement

The prototype must make illegal actions impossible — not just visually flagged but non-interactive.

Enforced rules:

- Hand limits (vendor ≤ 5, venue ≤ 2)
- Legal grid placement (venue → center only; vendors → non-center only; target must be empty)
- Cost payment (cannot book/swap without sufficient coins)
- Venue acquisition restriction (no new venues after booking one)
- Venue swap restriction (cannot swap a venue)
- Swap target restriction (replacement must be a vendor)
- Market replenishment timing (markets replenish end-of-turn, river discard end-of-round)
- Blind draw from empty deck must be disabled if deck is empty
- Turn structure (exactly one action per turn, except chained bonus Book actions)
- Endgame: theme selection required before scoring; venue required to win

---

## 18. Stub Data

The JSON data files ship with a small number of stub cards sufficient to run and playtest the game. The JSON schema must exactly match the specs in Section 5 so that real card data can be substituted by providing card images to an AI vision tool and generating the full 108-vendor dataset.

Stub counts (minimum):
- 3 vendors per category (27 total)
- 5 venues
- All 20 goals
- All 5 theme cards (all 10 themes)

---

## 19. Out of Scope (Future)

- Venue special effects
- Solo mode
- AI opponent
- Networking / multiplayer
- Animations
- Market coin incentives (placing coins on passed cards)
- Persistent saves
- Replay system
- Mobile support
- Deck customization
- Card filtering or search
