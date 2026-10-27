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

## 3. Typography

Use a system font stack to reduce external font dependencies and support efficient loading.

Recommended stack:

`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Typography hierarchy:

- **Page title:** Largest heading on the page.
- **Section heading:** Introduces a distinct content section.
- **Card title:** Identifies the content inside a card.
- **Body text:** Main readable content.
- **Supporting text:** Metadata, descriptions, timestamps, and secondary information.
- **Labels:** Short, clear names for fields and controls.

Use consistent font weights and line heights. Avoid using muted text colors for essential information without checking contrast.

## 4. Spacing and Layout

Use a consistent spacing scale:

| Token | Value |
|---|---:|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |

Use spacing tokens instead of arbitrary values wherever practical. Group related content closely and provide sufficient separation between unrelated sections.

### Responsive Layout

Suggested starting breakpoints:

- **Below 640px:** Mobile layout; prioritize a single content column and touch-friendly controls.
- **640px–1023px:** Tablet layout; allow flexible columns where space permits.
- **1024px and above:** Desktop layout; use wider content areas and optional side navigation.

These breakpoints are proposals and should be aligned with the existing application styles before implementation.

## 5. Reusable Components

### Buttons

Support primary, secondary, and outline variants.

Buttons must have clear action labels, visible keyboard focus, and disabled states where appropriate. Use the approved primary action color rather than Clay.

### Form Fields

Inputs, textareas, selects, and checkboxes must have accessible labels, visible boundaries, and clear validation feedback. Placeholder text must not replace a field label.

### Cards

Use cards to group related information such as courses, documents, referrals, and dashboard summaries. Maintain consistent padding, borders, and heading hierarchy.

### Tables and Lists

Use readable column headings, consistent row spacing, and clear empty states. Use the Kaolin table-header color and warm highlight rows where appropriate.

### Status Badges

Use a consistent combination of symbol, text label, foreground color, and background color. Preserve the exact status mappings in `COLOR_SCHEME.md`.

### Alerts and Support Messages

Support success, warning, danger, and informational messages. Each message must communicate what happened and, when useful, what the user should do next.

### Dialogs and Confirmations

Use dialogs for important confirmations and focused tasks. Provide a clear title, appropriate actions, keyboard accessibility, and a way to dismiss the dialog when appropriate.

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
