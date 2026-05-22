# Wedding Planning Game — Digital Prototype PRD

## Overview

This document defines the requirements for a browser-based digital prototype of a wedding planning tableau/grid-building game.

The prototype is intended for:
- rapid gameplay iteration,
- playtesting,
- UX validation,
- and rules enforcement.

This is NOT a production multiplayer application.

---

# Product Goals

The prototype should:

1. Fully enforce gameplay rules.
2. Allow two players to play locally on the same device.
3. Use simplified rendered cards instead of uploaded artwork.
4. Load all game data from JSON.
5. Make gameplay state extremely visible and easy to understand.
6. Prioritize gameplay flow over polish.

---

# Non-Goals

The prototype does NOT need:
- networking,
- accounts,
- matchmaking,
- persistence,
- AI opponents,
- animations beyond simple transitions,
- drag-and-drop,
- card artwork rendering,
- admin tools,
- mobile optimization,
- accessibility compliance,
- solo mode,
- venue special effects (initial version).

---

# Core Game Summary

Players are recently engaged couples with 12 months to plan a wedding.

Each player gets:
- 12 turns total,
- a personal 3×3 wedding grid,
- two starting theme cards,
- coins,
- access to shared public markets.

Players:
- collect vendors,
- collect goals,
- acquire a venue,
- and build a cohesive wedding tableau.

At game end:
- players score excitement,
- plus achieved goals.

A valid final wedding MUST include a venue.

---

# Technical Requirements

## Platform

- Web browser application
- Desktop-first
- Single shared device
- Local state only

## Recommended Stack

Suggested but not required:
- React
- TypeScript
- Tailwind CSS
- Zustand or Redux for state management

---

# Data Architecture

All gameplay content must load from JSON.

## JSON Data Sources

### Vendors

```json
{
  "id": "vendor_001",
  "name": "Magical Wine-Paired Feast",
  "category": "food_drink",
  "cost": 3,
  "excitement": 2,
  "icons": ["spiral", "ring"]
}
```

### Venues

```json
{
  "id": "venue_001",
  "name": "Whispering Festival Manor",
  "cost": 3,
  "excitement": 2,
  "icons": ["spiral", "ring"]
}
```

### Goals

```json
{
  "id": "goal_001",
  "name": "Indulged",
  "description": "5 points for every Food & Drink booking",
  "type": "category_multiplier",
  "category": "food_drink",
  "points_per": 5
}
```

### Themes

```json
{
  "id": "theme_001",
  "name": "Romantic",
  "icons": ["spiral", "ring"]
}
```

---

# Game Setup

## Player Setup

Each player begins with:
- 6 coins
- 2 vendor cards
- 2 theme cards

Players will choose ONE of their two themes for scoring at endgame.

Players never gain additional themes.

---

# Market Setup

## Vendor Market

Initial implementation:
- 6 visible vendor cards
- displayed as 2 rows of 3

Vendor market behaves as a river.

At the end of each round:
1. Oldest vendor card is discarded.
2. Remaining cards slide forward.
3. New vendor card enters nearest deck position.

---

## Venue Market

- Small visible venue market
- Players may acquire venues until one is booked
- Once a venue is booked:
  - all unbooked venues owned by that player are discarded
  - player gains 1 coin per discarded venue

Venue swapping is NOT allowed.

Venue effects are NOT included in initial implementation.

---

## Goal Market

Visible public market.

Players may freely acquire goals.

No goal limit.

Goals are never discarded.

Goals function similarly to Point Salad scoring cards:
- players may score some,
- score none,
- or score many.

---

# Turn Structure

Players alternate turns.

Each player gets exactly 12 turns total.

Two-player game:
- 24 total turns.

---

# Core Actions

On a turn, player chooses ONE action.

---

## Action: Take 2 Cards

Player may take any two cards from public markets.

Allowed combinations:
- vendor + vendor
- vendor + goal
- goal + goal
- venue + vendor
- etc.

Restriction:
- once player has booked a venue,
  they may not take additional venue cards.

Acquired cards enter player's visible personal staging area.

No hidden hands.

---

## Action: Gain 3 Coins

Player gains 3 coins.

---

## Action: Book

Player books a card from their personal staging area into their 3×3 grid.

Requirements:
- must pay full card cost,
- must place legally,
- destination space must be empty.

Legal placement:
- venue must be center,
- vendors must be non-center spaces.

After booking:
- gain corresponding location bonus.

---

## Action: Swap

Player may:
1. Take a card directly from a public market.
2. Pay full cost.
3. Replace an already-booked vendor in grid.

Effects:
- replaced card is discarded,
- original cost is NOT refunded,
- no location bonus is gained,
- only vendors may be swapped,
- venues may NOT be swapped.

---

# Bonus Book Actions

Some grid spaces grant a bonus Book action.

This:
- grants an additional booking action,
- but player still pays all normal costs.

Bonus Book actions may:
- chain,
- book vendors,
- book venues.

---

# Grid Layout

## Structure

3×3 grid.

Center:
- venue only.

Outer spaces:
- fixed bonuses.

---

## Bonuses

### 2 Spaces
Draw 2 cards

### 2 Spaces
Gain 3 coins

### 4 Spaces
Bonus Book action

---

# Personal Areas

Players maintain visible personal areas containing:
- unbooked vendors,
- unbooked venues,
- goals,
- themes.

No hidden information.

---

# Hand Limits

## Vendors
Maximum 5 unbooked vendors.

## Venues
Maximum 2 unbooked venues.

## Goals
No limit.

## Themes
Always exactly 2.

---

# Voluntary Discarding

At any time during their own turn:
- player may discard an unbooked vendor or venue
- to gain 1 coin.

---

# Scoring

## Endgame Trigger

After all players complete 12 turns.

---

## Valid Wedding Requirement

Player must have a booked venue.

If no venue is booked:
- player is invalid for scoring/winning.

---

# Final Score

Final score =
- total excitement
- plus goal points

---

# Excitement

Each vendor and venue contains an excitement value.

Excitement is cumulative.

---

# Goals

Goals score according to their individual rule text.

Examples:
- 5 points per Food & Drink vendor
- 5 points per Favors & Gifts vendor
- 15 points if most booked vendors cost 3
- 20 points if no non-theme icon exceeds either chosen theme icon

---

# Themes

Each theme contains two icons.

At endgame:
- player chooses ONE of their two themes for scoring.

Theme-related goals evaluate using chosen theme only.

---

# UI Requirements

## Layout

Screen should clearly show:
- vendor market
- venue market
- goal market
- both player boards
- current player
- remaining turns
- coins
- excitement
- visible staging areas

---

# Card Rendering

Cards should be rendered digitally from JSON.

Cards should display:
- name
- category
- cost
- excitement
- icons
- short rules text if needed

No scanned artwork required.

---

# Interaction Model

Use:
- click-to-select
- click-to-place

No drag-and-drop required.

---

# Rules Enforcement

Prototype must enforce:
- legal placement
- costs
- hand limits
- venue restrictions
- turn structure
- chaining legality
- market restrictions
- valid swaps
- valid endgame

Illegal actions should be impossible or disabled.

---

# State Visibility

Prototype should always visibly display:
- current score estimate
- icon totals
- remaining turns
- current coins
- chosen/unchosen themes
- booked vs unbooked cards

---

# Future Features (Not Required Now)

Potential future additions:
- venue special effects
- solo mode
- AI opponent
- networking
- animations
- market coin incentives
- persistent saves
- deck customization
- replay system
- statistics
- card filtering/search
- mobile support
