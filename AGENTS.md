# Taifun Game — AGENTS.md

## Project Overview

Taifun Game is a Telegram Mini App action game built with:

- Phaser 3
- TypeScript
- Vite

The project is:
- mobile-first
- portrait-oriented
- Telegram-focused
- lightweight
- arcade-style

Current gameplay direction:
- vertical action/survival gameplay
- fast combat
- short mobile sessions
- responsive controls

---

# Core Principles

The game must feel:

- responsive
- readable
- fast
- satisfying
- lightweight

NOT:
- overengineered
- enterprise-like
- bloated
- overly abstract

---

# Architecture Rules

## Keep systems modular

Preferred structure:

src/
 ├── scenes/
 ├── entities/
 ├── ui/
 ├── systems/
 ├── effects/
 └── assets/

---

# DO

- Make small focused changes
- Preserve existing systems
- Keep code readable
- Prefer simple classes
- Use lightweight Phaser systems
- Keep gameplay responsive
- Keep mobile performance stable

---

# DO NOT

- Refactor unrelated systems
- Introduce giant managers
- Create unnecessary abstractions
- Add ECS architecture
- Add singleton-heavy architecture
- Add large utility frameworks
- Rewrite working systems
- Introduce complex dependency injection

---

# Gameplay Rules

## Input

Desktop:
- keyboard supported

Mobile:
- touch-first controls

Controls must:
- support simultaneous input
- remain responsive
- avoid input delay

---

# Camera Rules

Camera should:
- feel smooth
- remain readable
- avoid excessive shaking
- work well in portrait mode

Avoid:
- jitter
- excessive lag
- cinematic overkill

---

# Combat Rules

Combat should feel:
- arcade-like
- readable
- impactful
- fast

Preferred:
- short attack timings
- strong feedback
- lightweight hit effects

Avoid:
- complicated combo systems
- long animation locks
- overly realistic combat

---

# Performance Rules

Telegram Mini Apps require good mobile performance.

DO:
- keep rendering lightweight
- minimize object creation in update loops
- reuse effects where possible
- keep particles simple

DO NOT:
- add expensive shaders
- add heavy postprocessing
- add large physics systems
- create unnecessary allocations

---

# Visual Style

Visual direction:
- stylized
- satirical
- readable
- modern retro
- pixel-art inspired

Avoid:
- noisy visuals
- excessive effects
- blurry graphics
- cluttered UI

---

# Coding Style

## Prefer

Small readable methods:

- handleMovement()
- handleAttack()
- updateCamera()
- updateControls()

---

## Avoid

Huge god classes.

If a file becomes too large:
- split logically
- preserve readability

---

# File Modification Rules

When implementing features:

DO:
- modify only required files
- preserve architecture
- keep changes focused

DO NOT:
- touch unrelated systems
- rename files unnecessarily
- restructure entire folders

---

# AI Agent Workflow

For every task:

1. Implement small focused feature
2. Preserve existing gameplay
3. Return concise explanations
4. Avoid unrelated refactors

---

# Preferred Task Size

Good:
- one mechanic
- one gameplay improvement
- 1–3 files modified

Bad:
- rewrite whole game
- giant architecture overhaul
- multiple unrelated systems

---

# Telegram Rules

The game is:
- portrait-first
- mobile-first
- Telegram Mini App focused

UI must:
- remain readable on phones
- avoid edge overlap
- keep controls accessible

---

# Current Priorities

Current development priorities:

1. Vertical gameplay conversion
2. Gameplay feel polish
3. Responsive combat
4. Enemy variety
5. Sprite/animation pipeline
6. Level design
7. Audio
8. Optimization

---

# Important Rule

Gameplay feel is more important than:
- perfect architecture
- overengineering
- unnecessary abstraction

Prioritize:
- fun
- responsiveness
- readability
- mobile UX