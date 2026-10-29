# TuStudyHub Design System

**Status:** Working Draft  
**Purpose:** Establish consistent interface, component, layout, and accessibility rules for TuStudyHub.

## 1. Design Principles

TuStudyHub uses a warm, focused academic design that prioritizes usability, clarity, and consistency.

- **Warm and focused:** Use the Kaolin neutral palette as the visual foundation and Clay as a restrained accent.
- **Consistency:** Reuse established components, spacing, typography, and color tokens.
- **Mobile-first:** Ensure the interface works on phones, tablets, and desktop screens.
- **Low-bandwidth friendly:** Prefer lightweight assets, simple layouts, and efficient page loading.
- **Accessible:** Provide readable text, visible focus states, clear labels, and keyboard navigation.
- **Meaningful status indicators:** Never communicate a status using color alone.

## 2. Color Usage

All interface colors must come from the approved tokens in `COLOR_SCHEME.md`.

### Kaolin — Neutral Foundation

Use Kaolin for page backgrounds, text, borders, tables, and other structural elements. Warm neutrals should form the majority of the interface.

### Clay — Accent

Use Clay for restrained highlights, accent icons, selected elements, and callout backgrounds.

- `clay-600` is the standard accent color for text and icons.
- `clay-700` is used on tinted fills.
- `clay-500` is for fills only; do not use it for text.
- `clay-400` is reserved for chart series.
- Clay must never become the primary action color.

### Primary Actions

Use the designated accessible action color from the project's approved implementation tokens. Do not substitute Clay as the primary action color.

### Status and Support Colors

Use the exact semantic colors defined in `COLOR_SCHEME.md`. Referral states must include their specified symbol and readable label. Support messages must include a clear message and appropriate icon or label.

### Visual Color Reference

The following swatches illustrate the established color roles. They are references to the palette in `COLOR_SCHEME.md`, not new tokens or approval to change the primary action color.

| Role | Visual reference | Token or value |
|---|---|---|
| Page foundation | ![#F7F5F1](https://img.shields.io/badge/-%20-F7F5F1?style=flat-square) | `kaolin-50` |
| Main text | ![#1C1A17](https://img.shields.io/badge/-%20-1C1A17?style=flat-square) | `kaolin-900` |
| Accent text and icons | ![#A84D16](https://img.shields.io/badge/-%20-A84D16?style=flat-square) | `clay-600` |
| Tinted accent surface | ![#F7E4D0](https://img.shields.io/badge/-%20-F7E4D0?style=flat-square) | `clay-100` |
| Success | ![#1F6F4A](https://img.shields.io/badge/-%20-1F6F4A?style=flat-square) | `success` |
| Warning | ![#9A6309](https://img.shields.io/badge/-%20-9A6309?style=flat-square) | `warning` |
| Danger | ![#A32B1E](https://img.shields.io/badge/-%20-A32B1E?style=flat-square) | `danger` |
| Information | ![#1B4F80](https://img.shields.io/badge/-%20-1B4F80?style=flat-square) | `info` |

## 3. Typography

Use a system font stack to reduce external font dependencies and support efficient loading.

**Recommended font stack:**

`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

### Typography Hierarchy

| Level | Purpose | Visual treatment |
|---|---|---|
| Page title | Identifies the current page | Largest heading on the page |
| Section heading | Introduces a distinct content section | Clear, prominent heading |
| Card title | Identifies content inside a card | Distinct from supporting text |
| Body text | Main readable content | Comfortable size and line height |
| Supporting text | Metadata, descriptions, timestamps, and secondary information | Visually subordinate but readable |
| Labels | Names fields and controls | Short, clear, consistently positioned |

Use consistent font weights and line heights. Avoid using muted text colors for essential information without checking contrast.

### Typography Implementation Reference

```css
:root {
  --font-family-base: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;

  /* Illustrative hierarchy; confirm values against the application. */
  --text-page-title: 2rem;
  --text-section-title: 1.5rem;
  --text-card-title: 1.125rem;
  --text-body: 1rem;
  --text-supporting: 0.875rem;
  --text-label: 0.875rem;
}
```

These size values are illustrative implementation suggestions, not additional approved requirements. Confirm them against the existing application styles before adoption.

## 4. Spacing and Layout

Use a consistent spacing scale.

### Spacing Scale

| Token | Value | Visual reference |
|---|---:|---|
| `space-1` | 4px | ▪ |
| `space-2` | 8px | ▪▪ |
| `space-3` | 12px | ▪▪▪ |
| `space-4` | 16px | ▪▪▪▪ |
| `space-6` | 24px | ▪▪▪▪▪▪ |
| `space-8` | 32px | ▪▪▪▪▪▪▪▪ |
| `space-12` | 48px | ▪▪▪▪▪▪▪▪▪▪▪▪ |

Use spacing tokens instead of arbitrary values wherever practical. Group related content closely and provide sufficient separation between unrelated sections.

### Responsive Layout

Suggested starting breakpoints:

| Viewport width | Layout guidance |
|---|---|
| Below 640px | Mobile layout; prioritize a single content column and touch-friendly controls. |
| 640px–1023px | Tablet layout; allow flexible columns where space permits. |
| 1024px and above | Desktop layout; use wider content areas and optional side navigation. |

These breakpoints are proposals and should be aligned with the existing application styles before implementation.

### Responsive Layout Reference

```text
MOBILE                  TABLET                 DESKTOP
Below 640px              640–1023px             1024px and above

┌──────────────┐         ┌──────────────────┐   ┌───────────────────────────┐
│ Header       │         │ Header           │   │ Header                    │
├──────────────┤         ├──────────────────┤   ├────────┬──────────────────┤
│ Content      │         │ Content          │   │ Side   │ Main content     │
│              │         │                  │   │ nav    │                  │
│ Single       │         │ Flexible         │   │        │ Wider layout     │
│ column       │         │ columns          │   │        │                  │
└──────────────┘         └──────────────────┘   └────────┴──────────────────┘
```

This diagram illustrates layout intent only. Actual navigation, column counts, and screen behavior must follow the approved requirements and existing implementation.

## 5. Reusable Components

### Buttons

Support primary, secondary, and outline variants.

Buttons must have clear action labels, visible keyboard focus, and disabled states where appropriate. Use the approved primary action color rather than Clay.

| Variant | Intended role | Visual treatment |
|---|---|---|
| Primary | Main action in a given context | Uses the approved primary action token; decision remains pending if not yet approved |
| Secondary | Supporting action | Uses an established secondary treatment |
| Outline | Alternative or lower-emphasis action | Uses an outlined treatment with readable text and visible focus |

The table describes component roles, not a final visual specification. Do not introduce an unapproved action color.

### Form Fields

Inputs, textareas, selects, and checkboxes must have accessible labels, visible boundaries, and clear validation feedback. Placeholder text must not replace a field label.

### Cards

Use cards to group related information such as courses, documents, referrals, and dashboard summaries. Maintain consistent padding, borders, and heading hierarchy.

### Tables and Lists

Use readable column headings, consistent row spacing, and clear empty states. Use the Kaolin table-header color and warm highlight rows where appropriate.

### Status Badges

Use a consistent combination of symbol, text label, foreground color, and background color. Preserve the exact status mappings in `COLOR_SCHEME.md`.

| Status | Indicator | Required information |
|---|---|---|
| Pending | ○ | Status label and pending foreground/background tokens |
| Accepted | ● | Status label and accepted foreground/background tokens |
| In progress | ◐ | Status label and in-progress foreground/background tokens |
| Completed | ✓ | Status label and completed foreground/background tokens |
| Closed | ■ | Status label and closed foreground/background tokens |
| Rejected | ✕ | Status label and rejected foreground/background tokens |

The symbols are text references. The application must use the exact mappings in `COLOR_SCHEME.md` and must not rely on the symbol or color alone.

### Alerts and Support Messages

Support success, warning, danger, and informational messages. Each message must communicate what happened and, when useful, what the user should do next.

### Dialogs and Confirmations

Use dialogs for important confirmations and focused tasks. Provide a clear title, appropriate actions, keyboard accessibility, and a way to dismiss the dialog when appropriate.

### Component State Reference

Reusable components should define their relevant states consistently.

| Component | States to consider |
|---|---|
| Button | Default, hover, focus, active, disabled |
| Form field | Default, focus, invalid, disabled |
| Card | Default and interactive where applicable |
| Status badge | Each documented referral status |
| Alert | Success, warning, danger, information |
| Dialog | Open, validation feedback where applicable, dismissed |

These state names are a documentation checklist, not a claim that all states have already been implemented.

## 6. Core Screen Patterns

Apply the same design rules across these proposed screen patterns:

- **Dashboard:** Overview cards, recent activity, progress summaries, and relevant actions.
- **Courses:** Course lists, details, and related study materials.
- **Documents:** Document metadata, access actions, review status, and empty states.
- **Quizzes:** Readable questions, clear answer controls, and useful feedback.
- **Referrals:** Status indicators, progress information, and referral details.
- **Forms:** Consistent field labels, validation, submission feedback, and confirmation states.
- **Profile and settings:** Clearly grouped account information and preferences.

Actual screen behavior must follow the project's approved requirements and existing implementation.

## 7. Accessibility

- Maintain sufficient foreground/background contrast.
- Do not rely on color alone to convey meaning.
- Provide visible focus indicators and keyboard-accessible controls.
- Use semantic headings and correctly associated form labels.
- Provide meaningful alternative text for informative images.
- Ensure interactive targets are comfortable to use on touchscreens.
- Respect reduced-motion preferences when animations are introduced.

Verify contrast for actual rendered combinations before release.

### Accessibility Review Checklist

Before a component or screen is approved, review:

- [ ] Text and interactive elements have sufficient contrast.
- [ ] Statuses remain understandable without color.
- [ ] Keyboard focus is visible and follows a sensible order.
- [ ] Form fields have associated labels and understandable validation messages.
- [ ] Informative images have meaningful alternative text.
- [ ] Touch targets are comfortable to use.
- [ ] Motion respects the user's reduced-motion preference.
- [ ] Responsive layouts remain readable without unintended horizontal scrolling.

This checklist supports review; checking an item here does not itself prove that the implementation passes accessibility testing.

## 8. Technical Implementation

- Define shared colors as reusable CSS custom properties or equivalent design tokens.
- Keep components consistent with the existing project architecture.
- Avoid duplicating color values across individual components.
- Preserve server-side authorization and validation for protected operations.
- Treat client-side status displays as presentation; authoritative status must come from trusted application data.
- Optimize assets and avoid unnecessary dependencies.

The technology stack and implementation details must follow the repository's existing architecture and approved project decisions.

## 9. Governance

`COLOR_SCHEME.md` is the authoritative reference for color names, exact hex values, and usage restrictions.

Any proposed change to the palette, component rules, or responsive behavior should be reflected in the relevant documentation and reviewed before implementation.

**Status:** Working draft pending project-team review.

---

## 10. Visual Design Reference

This section provides compact visual references for the documented design system. It does not replace the existing component requirements, approve new colors, or establish unapproved implementation decisions.

### 10.1 Spacing Reference

The following scale visualizes the relative spacing values. Each square represents approximately 4px in the documented scale.

| Token | Value | Visual reference |
|---|---:|---|
| `space-1` | 4px | ▪ |
| `space-2` | 8px | ▪▪ |
| `space-3` | 12px | ▪▪▪ |
| `space-4` | 16px | ▪▪▪▪ |
| `space-6` | 24px | ▪▪▪▪▪▪ |
| `space-8` | 32px | ▪▪▪▪▪▪▪▪ |
| `space-12` | 48px | ▪▪▪▪▪▪▪▪▪▪▪▪ |

### 10.2 Typography Hierarchy

| Level | Relative hierarchy | Intended use |
|---|---|---|
| Page title | Largest | Current page identity |
| Section heading | High | Major content sections |
| Card title | Medium-high | Individual content groups |
| Body text | Standard | Main content |
| Supporting text | Smaller | Secondary information |
| Labels | Compact | Form controls and short identifiers |

Actual font sizes, weights, and line heights should be aligned with the application's existing styles. The hierarchy above communicates relative importance, not an additional approved scale.

### 10.3 Color Role Reference

These visual references link the design system to `COLOR_SCHEME.md`.

| Role | Swatch | Token |
|---|---|---|
| Neutral page foundation | ![#F7F5F1](https://img.shields.io/badge/-%20-F7F5F1?style=flat-square) | `kaolin-50` |
| Primary text | ![#1C1A17](https://img.shields.io/badge/-%20-1C1A17?style=flat-square) | `kaolin-900` |
| Accent text and icons | ![#A84D16](https://img.shields.io/badge/-%20-A84D16?style=flat-square) | `clay-600` |
| Tinted accent surface | ![#F7E4D0](https://img.shields.io/badge/-%20-F7E4D0?style=flat-square) | `clay-100` |
| Success | ![#1F6F4A](https://img.shields.io/badge/-%20-1F6F4A?style=flat-square) | `success` |
| Warning | ![#9A6309](https://img.shields.io/badge/-%20-9A6309?style=flat-square) | `warning` |
| Danger | ![#A32B1E](https://img.shields.io/badge/-%20-A32B1E?style=flat-square) | `danger` |
| Information | ![#1B4F80](https://img.shields.io/badge/-%20-1B4F80?style=flat-square) | `info` |

### 10.4 Component Role Reference

| Component | Purpose | Consistency requirement |
|---|---|---|
| Primary button | Main contextual action | Use the approved action token |
| Secondary button | Supporting action | Maintain clear visual hierarchy |
| Outline button | Alternative action | Keep text, border, and focus visible |
| Form field | User input | Provide a label and validation feedback |
| Card | Related content grouping | Keep padding and heading hierarchy consistent |
| Status badge | Referral state | Combine label, symbol, and documented colors |
| Alert | Important feedback | Include a clear message and suitable label or icon |
| Dialog | Focused task or confirmation | Provide an accessible title and appropriate actions |

This table defines component roles. It does not imply that every component or variant has already been implemented.

### 10.5 Responsive Layout Reference

| Screen class | Width | Primary consideration |
|---|---|---|
| Mobile | Below 640px | Single-column priority and touch-friendly controls |
| Tablet | 640px–1023px | Flexible use of available width |
| Desktop | 1024px and above | Wider content and optional side navigation |

These remain proposed starting breakpoints until confirmed against the application.

### 10.6 Design Consistency Checklist

Use this checklist when reviewing a screen or component:

- [ ] Colors match the authoritative color scheme.
- [ ] Spacing follows the documented scale where practical.
- [ ] Typography follows the established hierarchy.
- [ ] Buttons and controls communicate their purpose clearly.
- [ ] Statuses use labels and symbols as well as colors.
- [ ] Focus, disabled, validation, and relevant interactive states are considered.
- [ ] Layout adapts to the supported viewport widths.
- [ ] Accessibility and contrast are checked in the rendered interface.
- [ ] Proposed patterns are verified against approved requirements before implementation.

The visual references are documentation aids. They do not introduce new design tokens, override approved requirements, or resolve pending color and responsive-layout decisions.
