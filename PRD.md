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

**54 stub vendors — 6 per category. Full game targets 108 (12 per category).**

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

**12 stub venues.**

### 5.3 Scoring Card Schema

Scoring cards are drawn from the scoring card market during the second half (rounds 7–12). Each card has a formula side (front) and a theme icon side (back). When a player takes a scoring card, they must **immediately and permanently** choose which side to use — Front or Back. This choice cannot be changed.

```json
{
  "id": "score_001",
  "type": "scoring",
  "name": "Indulged",
  "category": "food_drink",
  "frontFormula": "5 pts per Food & Drink vendor booked, max 15",
  "backIcon": "whimsy"
}
```

- `frontFormula`: human-readable description of the scoring formula (display only)
- `backIcon`: one of the 5 WENTL icon keys — if chosen, this icon is added immediately and permanently to the player's icon histogram

**30 total scoring cards.** Back icons are distributed evenly: exactly 6 cards per WENTL icon. See Section 6.4 for the full list.

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

### 6.4 All 30 Scoring Cards

Back icons are distributed exactly 6 per WENTL icon across all 30 cards.

#### Category Cards (9) — 5 pts per booked vendor of matching category, max 15

| Name | Category | Back Icon |
|------|----------|-----------|
| Indulged | Food and Drink | Whimsy |
| Captivated | Entertainment | Edge |
| Moved | Ceremony | Nature |
| Spoiled | Transportation | Tradition |
| Admired | Photography | Elegance |
| Impressed | Attire and Accessories | Whimsy |
| Amazed | Flowers and Decorations | Nature |
| Honored | Stationery | Tradition |
| Pampered | Favors and Gifts | Elegance |

#### Trio Set Cards (3) — 10 pts per complete set of all 3 categories

| Name | Categories | Back Icon |
|------|------------|-----------|
| The Look | Attire, Flowers & Decorations, Photography | Whimsy |
| The Party | Entertainment, Food & Drink, Favors & Gifts | Edge |
| The Logistics | Ceremony, Stationery, Transportation | Tradition |

A complete set = at least 1 booked vendor from each of the 3 categories. Score 10 pts per complete set (max 2 sets = 20 pts, since the venue occupies the center space).

#### Combo / Negative Cards (3) — per booked vendor of the listed category

| Name | Formula | Back Icon |
|------|---------|-----------|
| The Quiet Witness | +5/Photography, −3/Entertainment, −3/Ceremony | Nature |
| The Indulgent Table | +5/Food & Drink, −3/Attire & Accessories, −3/Stationery | Whimsy |
| The Grand Departure | +5/Transportation, −3/Flowers & Decorations, −3/Favors & Gifts | Elegance |

Points (positive or negative) are applied per booked vendor. Example: 3 Ceremony vendors with The Quiet Witness = −9 pts.

#### Grid / Spatial Cards (4)

| Name | Formula | Back Icon |
|------|---------|-----------|
| The Collection | 15 pts if 3 booked vendors in the same category occupy a complete row or column | Nature |
| Cornerstone | 20 pts if all 4 corner spaces (1, 3, 7, 9) contain vendors of the same category | Tradition |
| Fixed Budget | 10 pts if 3 booked vendors with the same cost occupy a complete row, column, or diagonal | Tradition |
| Consistent | 10 pts if 3 booked vendors with the same excitement occupy a complete row, column, or diagonal | Elegance |

#### Breadth / Depth Cards (3)

| Name | Formula | Back Icon |
|------|---------|-----------|
| The Specialist | 5 pts per vendor category in which you have 2 or more booked vendors | Edge |
| The Curator | 25 pts if your 8 booked vendors represent 8 different categories | Whimsy |
| The Obsession | 35 pts if all 8 booked vendors belong to the same category | Edge |

#### All-Same Cards (2)

| Name | Formula | Back Icon |
|------|---------|-----------|
| Uniform | 25 pts if all 8 booked vendors have the same excitement value | Nature |
| The Deal | 25 pts if all 8 booked vendors have the same cost | Whimsy |

#### Even / Odd Cards (2)

| Name | Formula | Back Icon |
|------|---------|-----------|
| In Harmony | +7 pts if your total excitement (all booked cards) is even; +3 pts if odd | Elegance |
| The Economist | +7 pts if your total coins spent booking is even; +3 pts if odd | Edge |

#### Theme Card (1)

| Name | Formula | Back Icon |
|------|---------|-----------|
| The Purist | 5 pts per WENTL icon that does not appear on any of your booked cards | Nature |

#### Catch-up Cards (3)

| Name | Formula | Back Icon |
|------|---------|-----------|
| Less is More | 5 pts per empty grid space at endgame | Tradition |
| The Thrifty Couple | +10 pts if you spent fewer total coins booking than your opponent | Edge |
| The Minimalist | +15 pts if your total coins spent booking is 10 or less | Elegance |

---

## 7. Game Setup

### 7.1 Decks

Shuffle all vendors into one vendor deck. Shuffle all venues into one venue deck. Shuffle all scoring cards into one scoring card deck.

### 7.2 Starting Markets

At game start:

- **Vendor market** — 6 visible cards + remaining vendor deck
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

- **Vendor market:** 6 visible slots
- **Venue market / Scoring card market:** 3 visible slots

### 8.1 Taking Cards

Players may take from:
- Any visible card in any currently active market (free selection)
- The top card of any active market's deck, face-down and unseen (blind draw)

Blind-drawn cards go directly to the player's staging area (or scoring card area, for scoring cards) and do not pass through the visible market.

### 8.2 End-of-Turn Replenishment

After a player's turn fully resolves (including all bonus actions):

1. Remaining visible cards slide toward Slot 1 to fill gaps
2. New cards are drawn from the top of the deck to fill any empty slots, entering at the newest position

### 8.3 Two-Phase Market Structure

The game is divided into two phases of 6 rounds each.

**First Half (Rounds 1–6):**
- Active markets: Vendor market (6 slots) + Venue market (3 slots)

**Mid-game Break (between Rounds 6 and 7):**
- Both players select their theme before Round 7 begins (see Section 14)
- The venue market is closed permanently
- The scoring card market opens with 3 visible scoring cards dealt from the scoring card deck

**Second Half (Rounds 7–12):**
- Active markets: Vendor market (6 slots) + Scoring card market (3 slots)
- Venue cards can no longer be taken from any market

### 8.4 Venue Market Freeze

Once both players have booked a venue, the venue market stops replenishing even during the first half. Cards that leave it are not replaced.

### 8.5 End-of-Round Discard

After both players have taken their turn (end of round):

1. The card in Slot 1 (oldest) of each active market is discarded
2. Remaining cards slide toward Slot 1
3. A new card is drawn from the top of the deck to fill the last slot

This discard happens to all currently active markets.

---

## 9. Turn Structure

Players alternate turns. Player 1 goes first. Each player takes exactly 12 turns. The game lasts 24 total turns (12 rounds of 2 turns each), plus one mid-game break between rounds 6 and 7.

On each turn, the active player chooses **exactly one** of the following three actions.

---

## 10. Actions

Actions are presented in this order: Gain 3 Coins, Take 2 Cards, Book.

### 10.1 Gain 3 Coins

Player gains 3 coins from the supply.

### 10.2 Take 2 Cards

Take any 2 cards from the currently active public markets. Each card may independently be:
- A visible card from any active market slot
- The top card of any active market deck (blind)

The 2 cards may be from the same or different markets.

**Restrictions:**
- A player who has already booked a venue may not take additional venue cards
- Venue cards cannot be taken at all during the second half (venue market is closed)
- Vendor and venue cards taken go to the player's staging area
- When a scoring card is taken, the player must immediately choose Front or Back before continuing (see Section 10.2.1)

#### 10.2.1 Scoring Card Flip Choice

When a player takes a scoring card (visible or blind), the take action pauses immediately. The player must choose:

- **Front** — the card's formula will be evaluated at endgame for direct points
- **Back** — the card's `backIcon` is added immediately and permanently to the player's icon histogram; it participates in theme score rubric evaluation from this point forward

This choice is permanent. No take-backs. After the choice, the take action resumes if cards remain to be taken.

### 10.3 Book

Player books one card from their staging area into their 3×3 grid.

**Requirements:**
- Pay the card's full cost in coins
- Target grid space must be empty
- Card must be placed legally (see Section 11)

After a successful booking, the player gains the location bonus for that grid space (see Section 11.2).

**Venue booking:** When a player books a venue into Space 5, they immediately receive the Space 5 bonus: choose any 1 of the 5 WENTL icons to add permanently to their icon histogram. This resolves before any further bonus chaining.

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
| 5 | Center | Choose 1 theme element (venue booking only) |
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

**Book:** Gain one additional Book action. The player must still pay full cost for the card booked. This bonus Book action may trigger another bonus if the new card lands on a Book space (chains are allowed).

**Gain 3 Coins:** Player gains 3 coins.

**Choose 1 theme element (Space 5 only):** When a venue is booked in Space 5, the player immediately selects any 1 of the 5 WENTL icons. That icon is added permanently to their icon histogram and counts toward the theme score rubric from that point forward.

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
- When a player books a venue: all remaining unbooked venues in their staging area are discarded, yielding 1 coin each; the Space 5 bonus (choose 1 theme element) resolves immediately
- Once a venue is booked, the player may not acquire additional venue cards

---

## 15. Mid-game Theme Commit

### 15.1 Trigger

After both players complete their 6th turn (end of Round 6), the mid-game break occurs before Round 7 begins.

### 15.2 Process

The game pauses on the same screen — no navigation. Instead of showing action buttons, the UI presents each player's theme card options. Each player selects one of their two themes. Both players must commit before the game continues.

The unchosen theme is discarded. The chosen theme is locked for the rest of the game and displayed prominently alongside the live theme scoring rubric.

### 15.3 Visual During Mid-game Break

Players should see their full board (grid, icon histogram, staging area, coins) to inform their choice. The theme selection UI is inline — displayed to the right of the icon histogram.

---

## 16. Scoring & Endgame

### 16.1 Endgame Trigger

The game ends after both players have completed their 12th turn (turn 24 total).

### 16.2 Valid Wedding

A player must have a booked venue to be eligible to win. A player without a booked venue cannot win regardless of score.

### 16.3 Scoring Card Evaluation

Scoring card flip choices are made at the time of acquisition (see Section 10.2.1), not at endgame. At endgame, each scoring card is evaluated using whichever side was chosen:

- **Front:** evaluate the formula against the player's final grid (see Section 6.4 for all formulas)
- **Back:** the icon was already added to the histogram at acquisition time; the card contributes no additional direct points at endgame

### 16.4 Theme Score Rubric

The theme score is evaluated against the player's chosen theme using icon frequency counts across: all booked cards (vendors + venue icons) + any back-side scoring card icons + any venue bonus icon chosen at booking.

Tiers are **exclusive** — only the highest qualifying tier scores. Evaluation order: Unforgettable → Balanced → Thematic → Subtle. Stop at the first match. **Matched** is an independent bonus evaluated separately for all players.

| Tier | Condition | Points | Type |
|------|-----------|--------|------|
| Unforgettable | Only your 2 theme icons appear across all sources; both must be present | 30 | Exclusive |
| Balanced | All 5 icons appear the same number of times (non-zero) | 20 | Exclusive |
| Thematic | Both theme icons are ≥ every non-theme icon (ties allowed); at least one non-theme icon present | 20 | Exclusive |
| Subtle | Exactly one of your theme icons is ≥ every non-theme icon; the other is not | 10 | Exclusive |
| Matched | Both theme icons appear the same number of times (non-zero) | +5 | Bonus (everyone checks) |

### 16.5 Final Score Formula

```
Final Score =
  Excitement total (sum of excitement on all booked cards)
  + Theme score (highest exclusive tier + Matched bonus if applicable)
  + Scoring cards (sum of all front-side formulas for cards kept on front)
  + Tableau completion bonus (15 pts if all 9 grid spaces are filled)
  + Leftover coins (1 pt each)
  + Leftover unbooked cards (1 pt each — vendors and venues in staging)
```

The player with the higher final score wins. Score is not shown during the game — revealed only on the endgame scoring screen.

---

## 17. UI Requirements

### 17.1 Layout

Single-screen application. No page navigation. All game state visible at all times.

Layout regions:

- **Top bar:** current player indicator, turn/round number, phase, action buttons
- **Markets row:** active markets shown with all visible card slots and a deck indicator; during second half, venue market is replaced by scoring card market
- **Player boards:** displayed side-by-side, each containing:
  - **Icon histogram** — segmented vertical bar graph, one bar per icon in WENTL order
  - **To the right of histogram:** chosen theme name + rubric pills (live, second half only); theme card options (first half); theme commit UI (mid-game break); flip choice panel (when taking a scoring card); venue icon selection (when booking a venue)
  - **3×3 grid** with space labels/bonuses visible on empty spaces
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
- For scoring cards: formula text on front; icon circle + name on back

### 17.3 Icon Histogram

Icon frequency is displayed as a segmented vertical bar graph:

- One bar per WENTL icon (5 bars)
- Each bar is divided into segments; filled segments represent the count
- Bars fill from the bottom
- Each bar is labeled with a small colored dot matching the icon color (no text)
- Includes icons from: booked cards, back-side scoring cards, and any venue bonus icon

### 17.4 Live Rubric Pills

During the second half (after theme commit), the theme rubric is displayed as pills next to the histogram. Each pill shows the tier name and point value. Pills are highlighted when the player currently meets the criteria. Tooltips explain each tier's condition.

### 17.5 Action UI

Use click-to-select + click-to-confirm interaction:

1. Player clicks an action button or selects a card to initiate an action
2. Valid targets highlight; invalid targets are visually disabled
3. Player clicks a target to complete the action
4. State updates; turn resolves

No drag and drop.

### 17.6 State Visibility

Always display for each player:

- Coins
- Remaining turns
- Icon histogram (all sources: booked cards + scoring card backs + venue bonus icon)
- Both theme options (before mid-game commit) or chosen theme (after commit)

Score is not displayed during the game.

---

## 18. Rules Enforcement

The prototype must make illegal actions impossible — not just visually flagged but non-interactive.

Enforced rules:

- Hand limits (vendor ≤ 5, venue ≤ 2)
- Legal grid placement (venue → Space 5 only; vendors → non-center only; target must be empty)
- Cost payment (cannot book without sufficient coins)
- Venue acquisition restriction (no new venues after booking one; no venues in second half)
- Scoring card flip choice is immediate and permanent — no changes after selection
- Market replenishment timing (end-of-turn replenish, end-of-round river discard)
- Market availability (venue market only in first half; scoring card market only in second half)
- Blind draw from empty deck must be disabled if deck is empty
- Turn structure (exactly one action per turn, except chained bonus Book actions and venue bonus)
- Mid-game break: both players must commit to a theme before Round 7 begins
- Endgame: venue required to win

---

## 19. Stub Data

JSON data files ship with stub cards sufficient to run and playtest the game. The JSON schema must exactly match the specs in Section 5.

Stub counts:
- 54 vendors (6 per category)
- 12 venues
- 30 scoring cards (full set per Section 6.4)
- 5 theme cards (all 10 themes)
