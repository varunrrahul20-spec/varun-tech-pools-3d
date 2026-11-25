---
name: "Varun Tech Pools"
description: "An architectural, aquatic design system pairing deep marine navy and crystal pool blues with crisp geometric typography and sunlit glass surfaces."
---

## Overview

Varun Tech Pools embodies clarity, engineering precision, and refreshing aquatic calm. Designed for homeowners, hospitality operators, and commercial property managers seeking pool care or custom pool construction, the interface balances tactile 3D water depth in hero moments with clean, breathable editorial sections below. The aesthetic blends **Corporate / Modern** clarity with subtle **Glassmorphism** over deep water surfaces, using generous whitespace, crisp marine typography, and sunlit cyan highlights.

## Colors

The palette is anchored by deep marine navy and pool-tile blue, illuminated by crystal aqua cyan and ice-water tints. Light mode dominates the service, promise, and contact sections with airy aquatic off-whites, while deep marine surfaces frame the 3D water hero and custom construction showcase.

- **Primary:** Deep Pool Blue (`#00429C`) drives primary calls to action, active states, and key structural accents.
- **Secondary:** Crystal Aqua (`#00677D` / `#39D7FF`) evokes sunlit pool water, used for highlights, badges, and interactive accents.
- **Brand Anchors:** `deep-navy` (`#071D65`), `pool-blue` (`#0759C9`), `aqua-cyan` (`#12C7EE`), and `ice-tint` (`#EAFAFF`) preserve the exact Varun Tech Pools identity across hero gradients and 3D canvas backdrops.

```yaml
colors:
  deep-navy: "#071D65"
  pool-blue: "#0759C9"
  aqua-cyan: "#12C7EE"
  ice-tint: "#EAFAFF"
  pool-canvas: "#F5FBFF"
  light:
    primary: "#00429C"
    on-primary: "#FFFFFF"
    primary-container: "#0759C9"
    on-primary-container: "#CCD9FF"
    secondary: "#00677D"
    on-secondary: "#FFFFFF"
    secondary-container: "#39D7FF"
    on-secondary-container: "#005A6E"
    background: "#F5FBFF"
    on-background: "#001355"
    surface: "#FBF8FF"
    surface-container-lowest: "#FFFFFF"
    surface-container-low: "#F3F2FF"
    surface-container: "#ECECFF"
    surface-container-high: "#E4E7FF"
    on-surface: "#001355"
    surface-variant: "#DFE2F2"
    on-surface-variant: "#424653"
    outline: "#737785"
    outline-variant: "#C2C6D6"
    error: "#BA1A1A"
    on-error: "#FFFFFF"
  dark:
    primary: "#B0C6FF"
    on-primary: "#002D6E"
    primary-container: "#0759C9"
    on-primary-container: "#CCD9FF"
    secondary: "#6BDDFF"
    on-secondary: "#003642"
    secondary-container: "#00C3EA"
    on-secondary-container: "#004C5D"
    background: "#000D41"
    on-background: "#DDE1FF"
    surface: "#000D41"
    surface-container-lowest: "#000935"
    surface-container-low: "#001355"
    surface-container: "#00165F"
    surface-container-high: "#0E226A"
    on-surface: "#DDE1FF"
    surface-variant: "#424653"
    on-surface-variant: "#C2C6D6"
    outline: "#8C909F"
    outline-variant: "#424653"
    error: "#FFB4AB"
    on-error: "#690005"
```

## Typography

A high-contrast pairing of **Alata** for geometric architectural headlines and **Instrument Sans** for clean, legible body copy and UI controls. **Source Code Pro** is reserved for technical specifications, phone numbers, and water-care metrics.

```yaml
typography:
  display-lg:
    fontFamily: "Alata"
    fontSize: 72px
    fontWeight: 400
    lineHeight: 76px
    letterSpacing: -1.5px
  display-lg-mobile:
    fontFamily: "Alata"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 38px
    letterSpacing: -0.5px
  headline-lg:
    fontFamily: "Alata"
    fontSize: 48px
    fontWeight: 400
    lineHeight: 54px
    letterSpacing: -1px
  headline-lg-mobile:
    fontFamily: "Alata"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 34px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Alata"
    fontSize: 32px
    fontWeight: 400
    lineHeight: 38px
    letterSpacing: -0.5px
  title-lg:
    fontFamily: "Instrument Sans"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: -0.2px
  title-md:
    fontFamily: "Instrument Sans"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Instrument Sans"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0px
  body-md:
    fontFamily: "Instrument Sans"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Instrument Sans"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Instrument Sans"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: "Instrument Sans"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 16px
    letterSpacing: 1.5px
  mono-md:
    fontFamily: "Source Code Pro"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: -0.2px
```

## Layout & Spacing

The layout uses a **Fixed-Max-Width Grid** (`1200px` max container) on desktop with generous vertical section rhythm, collapsing to a **Fluid Grid** on mobile (`20px` horizontal margins). Spacing follows an 8px base unit with a 4px half-step for tight icon-label pairings.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section-sm: 48px
  section-lg: 96px
  page-margin: 24px
```

## Elevation & Depth

Hierarchy is built through tonal surface contrast and soft marine-tinted ambient shadows (`rgba(3, 30, 91, 0.14)`). Light-mode service cards rest on crisp white (`surface-container-lowest`) with subtle ice-blue borders (`outline-variant`) and lift gently on hover. Over the 3D WebGL water hero and dark construction band, translucent glass panels use subtle frosted borders (`1px solid rgba(255, 255, 255, 0.22)`) to float above deep water gradients.

## Shapes

Shapes are fluid and approachable, echoing curved pool edges and water droplets. Primary action buttons and badges use full pill radii (`9999px`), while service cards, contact panels, and feature containers use generous `24px` (`xl`) or `16px` (`lg`) corners.

```yaml
rounded:
  sm: 6px
  DEFAULT: 12px
  md: 16px
  lg: 24px
  xl: 28px
  full: 9999px
```

## Motion & Micro-interaction

Motion mirrors the calm buoyancy of water. Interactive hover lifts and button presses respond within `150ms`–`200ms` with smooth deceleration, while scroll-triggered section reveals glide upward gently. Ambient 3D water ripples and caustics run continuously at a relaxed cadence and pause automatically when `prefers-reduced-motion` is enabled.

```yaml
motion:
  state-change:
    duration: 180ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  card-lift:
    duration: 240ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  section-reveal:
    duration: 600ms
    delay: 0ms
    timingFunction: cubic-bezier(0.16, 1, 0.3, 1)
```

## Voice & Content Strategy

- **Tone of voice:** Trustworthy, clear, and service-oriented. Speaks directly to pool owners without technical jargon ("Keep your water clean, your equipment working, and your pool looking its best").
- **Capitalisation:** Sentence case for section headings, service descriptions, and navigation links; uppercase tracking for small section kickers (`WHAT WE DO`, `DESIGNED FOR YOUR SPACE`).
- **Button and action labels:** Action-oriented verb phrases (`Request a service`, `Explore services`, `Talk to our team`, `Call now`, `WhatsApp`).
- **Numbers & Contact:** Phone numbers formatted consistently with country code (`+91 96424 16913`, `+91 91777 46913`) in tabular/monospace figures for instant scannability.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html` — `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html` — `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html` — `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Typography** → `@components/typography.html` — `typography-display`, `typography-body`, `typography-label`
