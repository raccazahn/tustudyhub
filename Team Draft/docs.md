# Wireframes, Mobile PWA & Interface Planning (Draft)

**Role:** UI/UX – Wireframes, Mobile PWA and Interface Planning
**Status:** Draft v0.1

---

## 1. Purpose

This document plans the user interface and mobile Progressive Web App (PWA) experience for the platform. It translates the system architecture into screens, flows and UI rules that developers can build from.

## 2. System Context

```
Students / Lecturers / Moderators / Admins
        │
Installable mobile-friendly PWA
        │
REST API  /api/v1/
        │
 ┌──────┼───────────────┬──────────────────┬───────────────────┐
 │      │               │                  │                   │
Identity & role   Document library    Approval &          Multiple-choice
permissions       & upload            verification        quizzes
 │                │  └─ File storage   └─ Public            │
 │                │                       verification page  │
 └────────────────┴───────────┬───────────┴──────────────────┘
                          PostgreSQL
```

The front end in scope for this role is the **installable mobile-friendly PWA**. Everything below it is consumed through the REST API.

## 3. User Roles & Interface Needs

| Role | Main goals | Key screens |
|---|---|---|
| Student | Find and download documents, upload, take quizzes | Home, Library, Document detail, Upload, Quiz list, Quiz, Results, Profile |
| Lecturer | Upload materials, create quizzes, request verification | Library, Upload, Quiz builder, My uploads, Verification status |
| Moderator | Review and approve or reject submissions | Review queue, Review detail, Decision form |
| Admin | Manage users, roles and system settings | User list, Role editor, Reports/overview |
| Public (no login) | Confirm a document is verified | Public verification page |

Navigation items are shown or hidden based on role permissions returned by the Identity module.

## 4. PWA Requirements

### 4.1 Installability
- Web App Manifest: name, short name, icons (192px, 512px, maskable), `display: standalone`, theme and background colours, `start_url`.
- Served over HTTPS.
- Custom "Install app" prompt shown after a user's second visit (not on first load).

### 4.2 Service Worker & Offline
| Feature | Strategy |
|---|---|
| App shell (HTML/CSS/JS, icons) | Cache-first, versioned |
| Document list and metadata | Stale-while-revalidate |
| Downloaded documents | User-initiated "Save offline", cache storage |
| Quiz attempt in progress | Saved locally, synced when online |
| Uploads while offline | Queued, retried on reconnect, status shown |
| Auth and verification actions | Network-only |

- Offline banner: "You're offline. Showing saved content."
- Update flow: "New version available – Refresh" toast.

### 4.3 Performance Targets
- First load on 4G under 3 seconds; repeat load under 1 second.
- Lighthouse PWA, Accessibility and Performance scores of 90 or higher.
- Lazy-load document previews and images.

## 5. Information Architecture

**Bottom tab bar (mobile)**

| Tab | Contents |
|---|---|
| Home | Recent documents, pending items, quick actions |
| Library | Browse, search, filter documents |
| Upload | New upload (Lecturers/Students as permitted) |
| Quizzes | Available quizzes, results |
| Profile | Account, settings, offline downloads |

Moderators and Admins get an additional **Review** or **Admin** entry, via the tab bar or the profile menu.

## 6. Screen Inventory

| ID | Screen | Module | API area |
|---|---|---|---|
| S01 | Splash / Install prompt | PWA | – |
| S02 | Login / Register | Identity | `/api/v1/auth` |
| S03 | Home | – | aggregated |
| S04 | Library list + search | Document library | `/api/v1/documents` |
| S05 | Document detail | Document library | `/api/v1/documents/{id}` |
| S06 | Upload form | Document library, File storage | `/api/v1/documents` (POST) |
| S07 | Review queue | Approval | `/api/v1/approvals` |
| S08 | Review detail + decision | Approval | `/api/v1/approvals/{id}` |
| S09 | Public verification page | Verification | `/api/v1/verify/{code}` |
| S10 | Quiz list | Quizzes | `/api/v1/quizzes` |
| S11 | Quiz question screen | Quizzes | `/api/v1/quizzes/{id}` |
| S12 | Quiz result | Quizzes | `/api/v1/quizzes/{id}/attempts` |
| S13 | Quiz builder (Lecturer) | Quizzes | `/api/v1/quizzes` (POST) |
| S14 | Profile & offline storage | Identity | `/api/v1/me` |
| S15 | Admin: users & roles | Identity | `/api/v1/users` |

> API paths are placeholders to be confirmed with the backend team.

## 7. Low-Fidelity Wireframes (Mobile, 360 × 640)

### S02 – Login
```
┌─────────────────────────┐
│        [ Logo ]         │
│                         │
│  Email                  │
│  ┌───────────────────┐  │
│  │                   │  │
│  └───────────────────┘  │
│  Password               │
│  ┌───────────────────┐  │
│  │ ••••••••       👁 │  │
│  └───────────────────┘  │
│                         │
│  [      Log in       ]  │
│  Forgot password?       │
│  Create an account      │
└─────────────────────────┘
```

### S03 – Home
```
┌─────────────────────────┐
│ ☰  Home            🔔 👤│
├─────────────────────────┤
│ Hi, <Name>              │
│ ┌─────────┐ ┌─────────┐ │
│ │ Library │ │ Quizzes │ │
│ └─────────┘ └─────────┘ │
│ Recently added          │
│ ┌─────────────────────┐ │
│ │ 📄 Title      ✔ Ver.│ │
│ │ Course • Date       │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 📄 Title            │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 🏠   📚   ⬆   ❓   👤  │
└─────────────────────────┘
```

### S04 – Library
```
┌─────────────────────────┐
│ Library                 │
│ ┌─────────────────┐ [⚙] │
│ │ 🔍 Search...    │     │
│ └─────────────────┘     │
│ (All)(Notes)(Past Q)(…) │
│ ┌─────────────────────┐ │
│ │ 📄 Doc title        │ │
│ │ Uploader • 2 MB  ✔  │ │
│ │ [Open]  [⬇ Offline] │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 📄 Doc title        │ │
│ └─────────────────────┘ │
│        Load more        │
├─────────────────────────┤
│ 🏠   📚   ⬆   ❓   👤  │
└─────────────────────────┘
```

### S05 – Document Detail
```
┌─────────────────────────┐
│ ←  Document             │
├─────────────────────────┤
│ Title                   │
│ Course • Uploaded by X  │
│ Status: ✔ Verified      │
│ ┌─────────────────────┐ │
│ │   Preview / thumb   │ │
│ └─────────────────────┘ │
│ Description …           │
│ [ Download ] [ Save ⬇ ] │
│ [ Share verification ]  │
│ Related quizzes ›       │
└─────────────────────────┘
```

### S06 – Upload
```
┌─────────────────────────┐
│ ←  Upload document      │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │  ⬆ Tap to choose    │ │
│ │   PDF, DOCX, PPTX   │ │
│ └─────────────────────┘ │
│ Title        [_______]  │
│ Course       [ ▾     ]  │
│ Category     [ ▾     ]  │
│ Description  [_______]  │
│ ▓▓▓▓▓░░░░ 55%           │
│ [ Submit for approval ] │
└─────────────────────────┘
```

### S07/S08 – Moderator Review
```
┌─────────────────────────┐
│ Review queue (12)       │
│ (Pending)(Approved)(Rej)│
│ ┌─────────────────────┐ │
│ │ 📄 Title  • 2h ago  │ │
│ │ by Lecturer  [Open] │ │
│ └─────────────────────┘ │
└─────────────────────────┘

┌─────────────────────────┐
│ ←  Review               │
│ [ Document preview ]    │
│ Metadata …              │
│ Comment [____________]  │
│ [ Reject ]  [ Approve ] │
└─────────────────────────┘
```

### S09 – Public Verification Page (no login)
```
┌─────────────────────────┐
│        [ Logo ]         │
│   ✔ Document verified   │
│ Title: …                │
│ Issued by: …            │
│ Approved on: …          │
│ Code: ABC-123           │
│ ─────────────────────── │
│ ✖ Not found? Check code │
└─────────────────────────┘
```

### S10–S12 – Quizzes
```
┌─────────────────────────┐   ┌─────────────────────────┐
│ Quizzes                 │   │ Q 3 of 10      ⏱ 08:12  │
│ ┌─────────────────────┐ │   │ ▓▓▓░░░░░░░              │
│ │ Quiz title          │ │   │ Question text goes here │
│ │ 10 Qs • Best: 80%   │ │   │ ( ) A. Option           │
│ │ [ Start ]           │ │   │ (•) B. Option           │
│ └─────────────────────┘ │   │ ( ) C. Option           │
└─────────────────────────┘   │ ( ) D. Option           │
                              │ [ Back ]     [ Next ]   │
┌─────────────────────────┐   └─────────────────────────┘
│ Result: 8/10 (80%)      │
│ ✔ Q1  ✖ Q2  ✔ Q3 …      │
│ [ Review answers ]      │
│ [ Retake ] [ Library ]  │
└─────────────────────────┘
```

## 8. Key User Flows

1. **Upload and approval:** Lecturer uploads (S06) → file stored → status *Pending* → Moderator reviews (S07/S08) → Approved → document gets a verification code → appears as ✔ Verified in Library.
2. **Public verification:** Anyone opens a link or QR code → S09 shows validity.
3. **Quiz:** Student opens Quizzes (S10) → answers (S11) → sees results (S12) → progress saved.
4. **Offline use:** Student taps "Save ⬇" → document cached → opens from Profile > Offline downloads without network.

## 9. UI Components

- Top app bar, bottom tab bar, cards, chips (filters), search field
- Buttons: primary, secondary, destructive
- Status badges: Pending, Approved, Rejected, Verified
- Form inputs, dropdowns, file picker, progress bar
- Toasts, offline banner, empty states, skeleton loaders, confirmation dialogs

## 10. Design Guidelines (Draft)

| Item | Decision |
|---|---|
| Layout | Mobile-first; breakpoints 360 / 768 / 1024 px |
| Touch targets | Minimum 44 × 44 px |
| Typography | System font stack; 16 px base |
| Colour | Primary (brand), neutral greys, semantic: success / warning / error |
| Theme | Light first; dark mode planned |
| Icons | One consistent icon set |

## 11. Accessibility

- WCAG 2.1 AA contrast; visible focus states
- Labels for all inputs; ARIA roles on navigation and dialogs
- Support screen readers and text scaling to 200%
- Don't rely on colour alone for status (use icons and text)

## 12. UI States to Design for Every Screen

Loading • Empty • Error • Offline • No permission (403) • Success

## 13. Role-Based Visibility

| Feature | Student | Lecturer | Moderator | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse / download | ✔ | ✔ | ✔ | ✔ |
| Upload | ✔* | ✔ | ✔ | ✔ |
| Take quizzes | ✔ | ✔ | ✔ | ✔ |
| Create quizzes | – | ✔ | – | ✔ |
| Review / approve | – | – | ✔ | ✔ |
| Manage users and roles | – | – | – | ✔ |

\*Student upload permission to be confirmed.

## 14. Deliverables & Timeline (Draft)

| # | Deliverable | Status |
|---|---|---|
| 1 | Low-fi wireframes (this document) | Draft |
| 2 | Mid-fi wireframes in Figma | To do |
| 3 | Clickable prototype | To do |
| 4 | PWA manifest and icon set | To do |
| 5 | Design tokens and component library | To do |
| 6 | Developer handoff notes | To do |

## 15. Open Questions

- Can students upload, or only lecturers?
- Which file types and maximum file size are allowed?
- How is a document's verification code shared (link, QR code, both)?
- Are quizzes timed, and can they be retaken?
- Is push notification support required?
- Languages and localisation needed?

## 16. References

- Project architecture diagram (REST API `/api/v1/`, PostgreSQL, file storage)
- [Web App Manifest](https://developer.mozilla.org/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
