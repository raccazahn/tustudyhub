# TuStudyHub Color Scheme

**Status:** Working Draft  
**Purpose:** Define the approved color names, hex values, and usage restrictions for the TuStudyHub interface.

## 1. Color Philosophy

TuStudyHub uses a warm, neutral foundation with restrained Clay accents and distinct semantic colors.

- **Kaolin:** Primary neutral foundation for approximately 90% of the interface's visual area.
- **Clay:** Accent palette inspired by laterite ochre; never the primary action color.
- **Referral status colors:** Communicate referral states using a label, shape, and color.
- **Support colors:** Communicate confirmations, warnings, errors, and notices.
- **Chart series:** Use the specified colors in their fixed order.
- **Identity red:** Reserved for identity-related use only.

Exact values and roles in this document must be preserved during implementation.

## 2. Clay — Accent

Clay provides warmth and visual emphasis. It must not replace the neutral foundation or become the primary action color.

| Token | Hex | Approved use |
|---|---|---|
| `clay-700` | `#8A3E12` | On tinted fills |
| `clay-600` | `#A84D16` | Accent text and icons |
| `clay-500` | `#C2691D` | Fills only; never text |
| `clay-400` | `#D98A3D` | Chart series 5 |
| `clay-100` | `#F7E4D0` | Callout background |
| `clay-50` | `#FBF1E6` | Highlight rows |

## 3. Kaolin — Neutral

Kaolin provides the warm, readable foundation for most interface elements.

| Token | Hex | Approved use |
|---|---|---|
| `kaolin-900` | `#1C1A17` | Body text |
| `kaolin-700` | `#4A463F` | Secondary text |
| `kaolin-500` | `#726B62` | Muted text |
| `kaolin-300` | `#C4BEB4` | Input borders |
| `kaolin-200` | `#DDD8CF` | Hairline rules |
| `kaolin-100` | `#EDE9E2` | Table headers |
| `kaolin-50` | `#F7F5F1` | Page background |
| `white` | `#FFFFFF` | Cards and tables |

## 4. Referral Status Colors

Every referral status must use its defined label, shape, foreground color, and background color. Never rely on color alone.

| Status | Symbol | Foreground | Background |
|---|:---:|---|---|
| `pending` | ○ | `#726B62` | `#F7F5F1` |
| `accepted` | ● | `#1B4F80` | `#D6E3F0` |
| `in_progress` | ◐ | `#A84D16` | `#F7E4D0` |
| `completed` | ✓ | `#1F6F4A` | `#DCEAE1` |
| `closed` | ■ | `#4A463F` | `#DDD8CF` |
| `rejected` | ✕ | `#A32B1E` | `#F4DAD6` |

The displayed label must match the actual status returned by the application. Do not infer a completed or accepted status from styling alone.

## 5. Support Colors

| Token | Hex | Purpose |
|---|---|---|
| `success` | `#1F6F4A` | Confirmations |
| `warning` | `#9A6309` | Warnings |
| `danger` | `#A32B1E` | Errors |
| `info` | `#1B4F80` | Notices |
| `flag-red` | `#BF0A30` | Identity only |

Support messages should use readable text and an appropriate icon or label. Choose a background that provides sufficient contrast with the foreground.

`flag-red` must not be reused as a general-purpose danger or error color.

## 6. Chart Series

Chart colors must be used in this exact order. Do not reorder them between charts or categories.

| Series | Hex |
|---:|---|
| 1 | `#0B2545` |
| 2 | `#A84D16` |
| 3 | `#2A6DA8` |
| 4 | `#1F6F4A` |
| 5 | `#D98A3D` |
| 6 | `#7FA8CE` |
| 7 | `#4A463F` |
| 8 | `#A32B1E` |

Charts must also use readable labels, legends, or other appropriate identifiers so that the information is not communicated through color alone.

## 7. CSS Design Tokens

The following CSS provides the complete reusable palette. Semantic status and chart tokens remain separate from the core neutral and accent tokens.

```css
:root {
  /* Clay — accent */
  --clay-700: #8A3E12;
  --clay-600: #A84D16;
  --clay-500: #C2691D;
  --clay-400: #D98A3D;
  --clay-100: #F7E4D0;
  --clay-50: #FBF1E6;

  /* Kaolin — neutral */
  --kaolin-900: #1C1A17;
  --kaolin-700: #4A463F;
  --kaolin-500: #726B62;
  --kaolin-300: #C4BEB4;
  --kaolin-200: #DDD8CF;
  --kaolin-100: #EDE9E2;
  --kaolin-50: #F7F5F1;
  --white: #FFFFFF;

  /* Referral foregrounds */
  --referral-pending: #726B62;
  --referral-accepted: #1B4F80;
  --referral-in-progress: #A84D16;
  --referral-completed: #1F6F4A;
  --referral-closed: #4A463F;
  --referral-rejected: #A32B1E;

  /* Referral backgrounds */
  --referral-pending-bg: #F7F5F1;
  --referral-accepted-bg: #D6E3F0;
  --referral-in-progress-bg: #F7E4D0;
  --referral-completed-bg: #DCEAE1;
  --referral-closed-bg: #DDD8CF;
  --referral-rejected-bg: #F4DAD6;

  /* Support */
  --support-success: #1F6F4A;
  --support-warning: #9A6309;
  --support-danger: #A32B1E;
  --support-info: #1B4F80;
  --flag-red: #BF0A30;

  /* Charts — preserve this order */
  --chart-1: #0B2545;
  --chart-2: #A84D16;
  --chart-3: #2A6DA8;
  --chart-4: #1F6F4A;
  --chart-5: #D98A3D;
  --chart-6: #7FA8CE;
  --chart-7: #4A463F;
  --chart-8: #A32B1E;
}
```

These tokens define the supplied palette. Primary action tokens must be defined separately after the team confirms the application's action-color decision; Clay must not be used as the primary action color.

## 8. Usage and Accessibility Rules

1. Use only the documented palette for interface colors unless a change is approved.
2. Do not use `clay-500` for text.
3. Do not use Clay as the primary action color.
4. Keep chart colors in their specified order.
5. Use referral labels and symbols in addition to their colors.
6. Reserve `flag-red` for identity-related use.
7. Test contrast for each actual foreground/background combination.
8. Do not assume that a color is accessible in every context simply because its hex value is documented.
9. Check colors in charts, badges, alerts, disabled controls, focus states, and interactive states.
10. Update this document whenever a palette change is approved.

## 9. Implementation Notes

This document is the authoritative color reference for TuStudyHub. CSS custom properties or equivalent design tokens should be the shared source for implementation.

Before release, validate the rendered interface against these values and verify accessibility contrast. Do not silently substitute colors or alter the chart order.

**Status:** Working draft pending project-team review.
