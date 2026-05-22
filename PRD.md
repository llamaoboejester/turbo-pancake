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

| Order | Key | Display Name | Color |
|-------|-----|--------------|-------|
| 1 | `whimsy` | Whimsy | Pink |
| 2 | `edge` | Edge | Purple |
| 3 | `nature` | Nature | Green |
| 4 | `tradition` | Tradition | Burgundy |
| 5 | `elegance` | Elegance | Gold |

The mnemonic is **WENTL** (the L stands for "Legance"). Never render icons out of this order. Icons are rendered as solid colored circles — no symbols, no text labels on the icon itself. The display name (e.g., "Elegance") appears only on theme cards.

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

### 5.3 Scoring Card Schema

Scoring cards replace goal cards. They are drawn from the scoring card market during the second half of the game (rounds 7–12). Each card has a formula side (front) and a theme icon side (back). At endgame, the player chooses which side to use for each card they hold.

```json
{
  "id": "score_001",
  "name": "Indulged",
  "category": "food_drink",
  "front_formula": "5 pts per booked Food and Drink vendor, max 15",
  "back_icon": "whimsy"
}
```

- `category`: the vendor category this formula evaluates (see Section 6.1)
- `front_formula`: human-readable description of the scoring formula (for display only)
- `back_icon`: one of the 5 WENTL icon keys — when flipped, this icon is added to the player's icon frequency count for theme score evaluation

**Scoring logic for front side:** 5 points per booked vendor of the matching category, maximum 15 points.

**Scoring logic for back side:** The card's `back_icon` is counted as an additional icon occurrence in the player's icon pool when evaluating the theme score rubric (Section 15.4). It does not directly award points — it changes the icon frequency distribution.

**9 total scoring cards — one per vendor category.**

### 5.4 Theme Card Schema

Theme cards are physical double-sided cards. Each card has a front theme and a back theme. Players are dealt one theme card and choose one theme at the mid-game break.

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

### 6.4 All 9 Scoring Cards

One per vendor category. All share the same formula structure (5 pts/booked vendor of matching category, max 15).

| Name | Category | Back Icon |
|------|----------|-----------|
| Indulged | Food and Drink | (assigned in data) |
| Captivated | Entertainment | (assigned in data) |
| Moved | Ceremony | (assigned in data) |
| Spoiled | Transportation | (assigned in data) |
| Admired | Photography | (assigned in data) |
| Impressed | Attire and Accessories | (assigned in data) |
| Amazed | Flowers and Decorations | (assigned in data) |
| Honored | Stationery | (assigned in data) |
| Pampered | Favors and Gifts | (assigned in data) |

Back icons should be distributed across the 5 WENTL icons (roughly 1–2 per icon).

---

## 7. Game Setup

### 7.1 Decks

Shuffle all vendors into one vendor deck. Shuffle all venues into one venue deck. Shuffle all scoring cards into one scoring card deck.

### 7.2 Starting Markets

At game start:

- **Vendor market** — 5 visible cards + remaining vendor deck
- **Venue market** — 3 visible cards + remaining venue deck

The scoring card deck is held in reserve; it is not dealt until the second-half market opens (see Section 8.3).

### 7.3 Player Setup

Each player receives:

- **6 coins**
- **2 vendor cards** drawn from the top of the vendor deck (placed in their staging area)
- **1 theme card** (drawn from shuffled theme card deck) — both themes on the card are visible to both players

Shuffle the 5 theme cards and deal one to each player.

---

## 8. Market System (River Mechanic)

Each market has a set number of visible slots. Slot 1 is the oldest position; the last slot is the newest.

- **Vendor market:** 5 visible slots
- **Venue market / Scoring card market:** 3 visible slots

### 8.1 Taking Cards

Players may take from:
- Any visible card in any currently active market (free selection)
- The top card of any active market's deck, face-down and unseen (blind draw)

Blind-drawn cards go directly to the player's staging area (or scoring area, for scoring cards) and do not pass through the visible market.

### 8.2 End-of-Turn Replenishment

After a player's turn fully resolves (including all bonus actions):

1. Remaining visible cards slide toward Slot 1 to fill gaps
2. New cards are drawn from the top of the deck to fill any empty slots, entering at the newest position

### 8.3 Two-Phase Market Structure

The game is divided into two phases of 6 rounds each.

**First Half (Rounds 1–6):**
- Active markets: Vendor market (5 slots) + Venue market (3 slots)

**Mid-game Break (between Rounds 6 and 7):**
- Both players select their theme before Round 7 begins (see Section 14)
- The venue market is closed permanently
- The scoring card market opens with 3 visible scoring cards dealt from the scoring card deck

**Second Half (Rounds 7–12):**
- Active markets: Vendor market (5 slots) + Scoring card market (3 slots)
- Venue cards can no longer be taken from any market (the venue deck is spent)

### 8.4 Venue Market Freeze

Once both players have booked a venue, the venue market stops replenishing even during the first half. Cards that leave it are not replaced. (The market may go partially or fully empty.)

### 8.5 End-of-Round Discard

After both players have taken their turn (end of round):

1. The card in Slot 1 (oldest) of each active market is discarded
2. Remaining cards slide toward Slot 1
3. A new card is drawn from the top of the deck to fill the last slot

This discard happens to all currently active markets.

---

## 9. Turn Structure

Players alternate turns. Player 1 goes first. Each player takes exactly 12 turns. The game lasts 24 total turns (12 rounds of 2 turns each), plus one mid-game break between rounds 6 and 7.

On each turn, the active player chooses **exactly one** of the following four actions.

---

## 10. Actions

### 10.1 Take 2 Cards

Take any 2 cards from the currently active public markets. Each card may independently be:
- A visible card from any active market slot
- The top card of any active market deck (blind)

The 2 cards may be from the same or different markets.

**Restrictions:**
- A player who has already booked a venue may not take additional venue cards
- Venue cards cannot be taken at all during the second half (venue market is closed)
- A taken scoring card goes directly to the player's scoring card area (above the grid), not staging

Vendor and venue cards taken go to the player's staging area.

### 10.2 Gain 3 Coins

Player gains 3 coins from the supply.

### 10.3 Book

Player books one card from their staging area into their 3×3 grid.

**Requirements:**
- Pay the card's full cost in coins
- Target grid space must be empty
- Card must be placed legally (see Section 11)

After a successful booking, the player gains the location bonus for that grid space (see Section 11.2).

**Venue booking bonus:** When a player books a venue, they immediately gain both of the following, in addition to any space bonus:
- Take 2 cards (same rules as the Take 2 action — any active market, visible or blind)
- Gain 3 coins

The venue booking bonus is resolved before the space bonus.

### 10.4 Swap

Player takes one vendor card directly from a public market (visible or blind) and immediately replaces an already-booked vendor in their grid.

**Requirements:**
- Pay the new card's full cost
- The card being replaced must be a vendor (venues may not be swapped)
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
| 1 | Top-left | Draw 2 |
| 2 | Top-center | Book |
| 3 | Top-right | Gain 3 Coins |
| 4 | Middle-left | Book |
| 5 | Center | Take 2 + Gain 3 Coins (venue booking) |
| 6 | Middle-right | Book |
| 7 | Bottom-left | Gain 3 Coins |
| 8 | Bottom-center | Book |
| 9 | Bottom-right | Draw 2 |

### 11.3 Legal Placement

- Venue cards may only be placed in Space 5 (center)
- Vendor cards may only be placed in non-center spaces (1–4, 6–9)
- Target space must be empty

### 11.4 Bonus Descriptions

**Draw 2:** Take any 2 cards from the currently active markets, same rules as the Take 2 Cards action (visible or blind, any active market).

**Book:** Gain one additional Book action. The player must still pay full cost for the card booked. This bonus Book action may trigger another bonus if the new card lands on a bonus Book space (chains are allowed). Bonus Book actions may be used to book vendors or venues.

**Gain 3 Coins:** Player gains 3 coins.

**Take 2 + Gain 3 Coins (Space 5 only):** When a venue is booked in Space 5, the player immediately takes 2 cards from the active markets and gains 3 coins. This resolves before any further bonus chaining.

---

## 12. Hand Limits

| Card Type | Limit |
|-----------|-------|
| Unbooked vendors | 5 |
| Unbooked venues | 2 |
| Scoring cards | No limit |
| Theme cards | Always exactly 1 (2 themes shown until mid-game commit) |

Hand limits are enforced at all times. A player may not acquire a card that would exceed their limit.

---

## 13. Voluntary Discarding

At any point during their own turn, a player may discard any number of unbooked vendors or venues from their staging area. Each discarded card yields 1 coin.

Scoring cards may not be discarded.

---

## 14. Venue Rules

- A player may hold at most 2 unbooked venues at once
- A player may only book one venue (Space 5)
- When a player books a venue: all remaining unbooked venues in their staging area are discarded, yielding 1 coin each; the venue booking bonus resolves immediately (Take 2 + Gain 3 coins)
- Once a venue is booked, the player may not acquire additional venue cards
- Venues may not be swapped out of the grid

---

## 15. Mid-game Theme Commit

### 15.1 Trigger

After both players complete their 6th turn (end of Round 6), the mid-game break occurs before Round 7 begins.

### 15.2 Process

The game pauses on the same screen — no navigation. Instead of showing action buttons, the UI presents each player's theme card options. Each player selects one of their two themes. Both players must commit before the game continues.

The unchosen theme is discarded. The chosen theme is locked for the rest of the game and displayed prominently above the player's grid alongside the theme scoring rubric (see Section 15.4).

### 15.3 Visual During Mid-game Break

Players should see their full board (grid, icon bar, staging area, coins) to inform their choice. The theme selection UI is inline — above the action area.

---

## 16. Scoring & Endgame

### 16.1 Endgame Trigger

The game ends after both players have completed their 12th turn (turn 24 total).

### 16.2 Valid Wedding

A player must have a booked venue to be eligible to win. A player without a booked venue cannot win regardless of score.

### 16.3 Scoring Card Choices

Before totaling scores, each player independently decides, for each scoring card they hold: use the **front** (category formula) or the **back** (icon, added to icon pool for theme evaluation). These choices are made at the scoring screen.

If a player uses the back side of a scoring card, that card's `back_icon` is added to their icon frequency count as if it were an additional booked card with that single icon. It participates in the theme score rubric evaluation (Section 16.4) but grants no direct points.

### 16.4 Theme Score Rubric

The theme score is always evaluated against the player's chosen theme using icon frequency counts across all booked cards (vendors + venue) plus any flipped scoring cards. These tiers are not cards — they are fixed rules always applied at endgame. Multiple tiers can be achieved simultaneously.

| Tier | Condition | Points |
|------|-----------|--------|
| Subtle | At least one of your two chosen theme icons is tied for most frequent (nothing else beats it) | 10 |
| Matched | Both of your chosen theme icons appear the same number of times (non-zero) | 10 |
| Thematic | Both of your chosen theme icons are tied for most frequent (nothing else beats them) | 20 |
| Balanced | All 5 icons appear the same number of times across all booked cards | 15 |
| Unforgettable | Only your chosen theme's icons appear across all booked cards (no other icons present) | 30 |

"Tied for most frequent" means nothing beats it — ties are acceptable.

### 16.5 Final Score Formula

```
Final Score =
  Excitement total (sum of excitement on all booked cards)
  + Theme score (sum of achieved rubric tiers, Section 16.4)
  + Scoring cards (sum of achieved front-side formulas for non-flipped cards)
  + Tableau completion bonus (15 pts if all 9 grid spaces are filled)
  + Leftover coins (1 pt each)
  + Leftover unbooked cards (1 pt each — counts vendors and venues still in staging)
```

The player with the higher final score wins. Both players score independently — there is no catch-up mechanism.

Score is not shown during the game. It is revealed only on the endgame scoring screen.

---

## 17. UI Requirements

### 17.1 Layout

Single-screen application. No page navigation. All game state visible at all times.

Layout regions:

- **Top bar:** current player indicator, turn/round number, phase, action buttons
- **Markets row:** active markets shown with all visible card slots and a deck indicator (face-down card count); during second half, venue market is replaced by scoring card market
- **Player boards:** displayed side-by-side, each containing:
  - **Above grid:** chosen theme name + icon pair; theme scoring rubric summary; held scoring cards (shown after mid-game commit only)
  - **3×3 grid** with space labels/bonuses visible on empty spaces
  - **Icon frequency bar** — segmented vertical bar graph, one bar per icon in WENTL order, filling from the bottom
  - **Below grid (staging):** unbooked vendors and unbooked venues
  - Coin count and remaining turns

### 17.2 Card Rendering

Cards are rendered from JSON data. No artwork. Fixed card widths (normal and compact modes).

Each card must display:

- Name
- Category (vendors and scoring cards only)
- Cost (vendors and venues)
- Excitement value (vendors and venues)
- Icons (rendered as solid colored circles in WENTL order — no text labels)
- For scoring cards: formula text on front, icon circle on back

### 17.3 Icon Frequency Display

Icon frequency is displayed as a segmented vertical bar graph (not numbers):

- One bar per WENTL icon (5 bars)
- Each bar is divided into segments; filled segments represent the count
- Bars fill from the bottom
- Each bar is labeled with a small colored dot matching the icon color (no text)

### 17.4 Action UI

Use click-to-select + click-to-confirm interaction:

1. Player clicks an action button or selects a card to initiate an action
2. Valid targets highlight; invalid targets are visually disabled
3. Player clicks a target to complete the action
4. State updates; turn resolves

No drag and drop.

### 17.5 State Visibility

Always display for each player:

- Coins
- Remaining turns
- Icon frequency bar (booked cards only)
- Chosen theme (after mid-game commit) or both theme options (before commit)

Score is not displayed during the game.

---

## 18. Rules Enforcement

The prototype must make illegal actions impossible — not just visually flagged but non-interactive.

Enforced rules:

- Hand limits (vendor ≤ 5, venue ≤ 2)
- Legal grid placement (venue → Space 5 only; vendors → non-center only; target must be empty)
- Cost payment (cannot book/swap without sufficient coins)
- Venue acquisition restriction (no new venues after booking one; no venues in second half)
- Venue swap restriction (cannot swap a venue out of the grid)
- Swap target restriction (replacement must be a vendor)
- Market replenishment timing (end-of-turn replenish, end-of-round river discard)
- Market availability (venue market only in first half; scoring card market only in second half)
- Blind draw from empty deck must be disabled if deck is empty
- Turn structure (exactly one action per turn, except chained bonus Book actions and venue booking bonus)
- Mid-game break: both players must commit to a theme before Round 7 begins
- Endgame: venue required to win

---

## 19. Stub Data

The JSON data files ship with a small number of stub cards sufficient to run and playtest the game. The JSON schema must exactly match the specs in Section 5 so that real card data can be substituted by providing card images to an AI vision tool and generating the full dataset.

Stub counts (minimum):
- 3 vendors per category (27 total)
- 5 venues
- All 9 scoring cards
- All 5 theme cards (all 10 themes)

---

## 20. Out of Scope (Future)

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
