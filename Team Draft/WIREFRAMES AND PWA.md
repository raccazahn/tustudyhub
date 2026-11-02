# TuStudyHub — Mobile-first Wireframes and PWA Plan

**Document type:** Initial Wireframes and PWA Plan (Week 2 deliverable)
**Owner:** Odasco
**Status:** Draft — pending team review
**Related documents:** `ARCHITECTURE.md`, `REQUIREMENTS.md`, `DATA_MODEL.md`, `API_SPECIFICATION.md`

This document covers only the initial wireframes and the plan for the PWA shell. The wireframes are low-fidelity layouts for a mobile viewport (about 360 px wide). They are not final visual designs. The PWA is **not** claimed to be complete: installability has not yet been tested (see Section 5).

---

## 1. Scope and Assumptions

**In scope (from the Week 2 template):** the nine minimum screens and the PWA shell checklist.

**Assumptions taken from `ARCHITECTURE.md`:**
- The PWA is the primary client and talks to a versioned REST API; all authorization is enforced by the backend. The UI only hides or shows actions for convenience.
- Roles: student, contributor, lecturer, moderator, administrator.
- Search filters: course, keyword, academic year, semester, examination type, verification status.
- Approved papers carry a unique digital identifier and a visible verification stamp. The public QR page shows the current authoritative status, so revoked papers must never appear as verified.
- Public verification shows only information approved for public access.

**Not part of the first-release wireframes (unconfirmed in the architecture):** full offline document reading, notifications, advanced moderation queues and appeals, ratings and reputation, additional clients.

**Open points for the team to confirm:**
1. Which fields are mandatory on the upload form (beyond type, course and year).
2. What the public verification page may show (proposal in Section 3.9).
3. Whether a "Report this paper" action is in the first release (it appears in Section 3.7 of the architecture but not in the minimum screen list).
4. Who may create quizzes (lecturers and approved authors, subject to the final permissions policy).

---

## 2. Navigation and Layout Principles

- **Mobile-first, single column.** Tablet and desktop widths reuse the same screens with a centred, wider container.
- **Bottom navigation (signed in):** Home · Library · Upload · Quizzes · Account. Lecturers and moderators additionally see a Review tab. Tabs are shown by role for convenience only.
- **Touch targets** at least 44 × 44 px; primary action is one full-width button per screen.
- **Typography and contrast:** system font stack, minimum 16 px body text, text contrast of at least 4.5:1.
- **States to design for every screen:** loading, empty, error, and offline (see Section 4).
- **Low bandwidth:** no large images on core screens; use inline icons; paginate results.

---

## 3. Wireframes

Legend: `[ ]` button/input · `( )` radio · `[x]` checked · `▾` dropdown · `…` more content

### 3.1 Public landing / sign-in entry

```
┌──────────────────────────┐
│ TuStudyHub               │
│                          │
│ Find and share verified  │
│ past papers.             │
│                          │
│ [ Search papers…      ]  │
│                          │
│ [   Sign in           ]  │
│ [   Create account    ]  │
│                          │
│ Scan a paper's QR code   │
│ to check it is verified. │
└──────────────────────────┘
```
Notes: public search/browse access depends on the final access rules; if search requires sign-in, the search box is replaced by a short "Sign in to search" message.

### 3.2 Registration and login

```
┌──────────────────────────┐
│ ←  Sign in               │
│                          │
│ Email                    │
│ [                     ]  │
│ Password                 │
│ [                  👁 ]  │
│ Forgot password?         │
│                          │
│ [      Sign in        ]  │
│                          │
│ New here? Create account │
└──────────────────────────┘
┌──────────────────────────┐
│ ←  Create account        │
│ Full name   [         ]  │
│ Email       [         ]  │
│ Password    [      👁 ]  │
│ (rules shown inline)     │
│ [x] I accept the terms   │
│ [   Create account    ]  │
└──────────────────────────┘
```
Notes: inline validation messages; generic error on failed login; account recovery screen follows the same layout (email, then confirmation message).

### 3.3 Student home and course/document search

```
┌──────────────────────────┐
│ Hi, <name>               │
│ [ 🔍 Course or keyword ] │
│                          │
│ My courses (recent)      │
│ ┌────────┐ ┌────────┐    │
│ │ CSC101 │ │ MTH102 │ …  │
│ └────────┘ └────────┘    │
│                          │
│ Recently added           │
│ • CSC101 Exam 2024  ✔    │
│ • MTH102 Test 2023  ✔    │
│                          │
│ Home Library Upload Quiz │
└──────────────────────────┘
```

### 3.4 Document results filtered by course and type

```
┌──────────────────────────┐
│ ← Results: CSC101        │
│ [Year ▾][Type ▾][Sem ▾]  │
│ [Verified only  ( )]     │
│                          │
│ ┌──────────────────────┐ │
│ │ CSC101 Final Exam    │ │
│ │ 2024 · Sem 1 · Exam  │ │
│ │ ✔ Verified           │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ CSC101 Test 1        │ │
│ │ 2023 · Sem 2 · Test  │ │
│ │ ⏳ Pending review     │ │
│ └──────────────────────┘ │
│ [ Load more ]            │
└──────────────────────────┘
```
Notes: only papers the user is allowed to see are listed; empty state reads "No papers found. Try fewer filters."

### 3.5 Document detail/download and verification status

```
┌──────────────────────────┐
│ ← CSC101 Final Exam      │
│ 2024 · Semester 1 · Exam │
│ Course: CSC101           │
│ Uploaded by: <role/name> │
│                          │
│ Status: ✔ Verified       │
│ ID: <digital identifier> │
│ [ QR code ]              │
│                          │
│ [   Download (PDF)    ]  │
│ File size: 1.2 MB        │
│                          │
│ Report this paper (TBC)  │
└──────────────────────────┘
```
Status variants: **Verified**, **Pending review**, **Rejected** (with reason, visible to the uploader), **Revoked**. The download button is disabled when the user is not permitted to download.

### 3.6 Upload form

```
┌──────────────────────────┐
│ ← Upload a paper         │
│ Course ▾      [ CSC101 ] │
│ Type ▾        [ Exam   ] │
│ Academic year [ 2024   ] │
│ Semester ▾    [ 1      ] │
│ Title         [        ] │
│ Other required fields (TBC) │
│                          │
│ File (PDF or image)      │
│ [ Choose file / camera ] │
│ Max size: <limit TBC>    │
│                          │
│ [      Submit         ]  │
│ Submitted papers are     │
│ reviewed before they     │
│ are published.           │
└──────────────────────────┘
```
Notes: shows file name, size and an upload progress bar; clear errors for wrong file type, too large, or upload failed (with Retry). Field list and limits to be matched to `REQUIREMENTS.md` and `API_SPECIFICATION.md`.

### 3.7 Lecturer/moderator review and approval screen

```
┌──────────────────────────┐
│ Review queue (5)         │
│ ┌──────────────────────┐ │
│ │ CSC101 Final 2024    │ │
│ │ Submitted 2 days ago │ │
│ │ [ Open ]             │ │
│ └──────────────────────┘ │
└──────────────────────────┘
┌──────────────────────────┐
│ ← Review paper           │
│ [ File preview / open ]  │
│ Course · Type · Year     │
│ Uploader                 │
│                          │
│ Comment (required if     │
│ rejecting)               │
│ [                     ]  │
│ [ Approve ] [ Reject ]   │
└──────────────────────────┘
```
Notes: approving generates the digital identifier and verification stamp (backend). Revocation of a verified paper lives in the same detail view for authorised roles, with a confirmation dialog.

### 3.8 Quiz list, quiz attempt and score result

```
┌──────────────┐ ┌──────────────────┐ ┌──────────────┐
│ Quizzes      │ │ ← CSC101 Quiz 1  │ │ Result       │
│ • CSC101 Q1  │ │ Question 2 of 10 │ │ You scored   │
│   10 Qs      │ │ ▓▓░░░░░░░░       │ │ 8 / 10       │
│   Best: 7/10 │ │ What is …?       │ │              │
│ • MTH102 Q1  │ │ ( ) A …          │ │ Q3 ✘ Q7 ✘    │
│   New        │ │ (•) B …          │ │ [ Review ]   │
│              │ │ ( ) C …          │ │ [ Try again ]│
│              │ │ [ Next ]         │ │ [ Back ]     │
└──────────────┘ └──────────────────┘ └──────────────┘
```
Notes: the quiz list shows score history (best/latest attempt). Marking is done by the backend. Quiz creation screens for lecturers are out of the minimum scope and are not drawn here.

### 3.9 Public QR verification page (no sign-in)

```
┌──────────────────────────┐
│ TuStudyHub Verification  │
│                          │
│        ✔ VERIFIED        │
│                          │
│ CSC101 Final Exam        │
│ 2024 · Semester 1        │
│ ID: <digital identifier> │
│ Verified on: <date>      │
└──────────────────────────┘
┌──────────────────────────┐
│ TuStudyHub Verification  │
│                          │
│        ✘ REVOKED         │
│                          │
│ This paper is no longer  │
│ verified.                │
│ ID: <digital identifier> │
└──────────────────────────┘
```
Also designed: a **Not found** state for unknown identifiers. Notes: the page must always show the current status from the server (never a cached "Verified"), and it must show only approved public information. The revoked state shows no more than needed.

---

## 4. PWA Plan

### 4.1 Goals
An installable, fast, mobile-first web app that works on low-bandwidth connections and degrades gracefully offline.

### 4.2 Web app manifest
- `name`: TuStudyHub; `short_name`: TuStudyHub
- `start_url`: `/`; `scope`: `/`; `display`: `standalone`
- `theme_color` and `background_color`: to be chosen with the team's colour palette
- Icons: 192×192 and 512×512 PNG, plus a maskable 512×512 icon
- Served over HTTPS with a valid `<link rel="manifest">` and `<meta name="viewport">`

### 4.3 Service worker strategy
| Resource | Strategy | Reason |
|---|---|---|
| App shell (HTML, CSS, JS, icons, fonts) | Cache-first, versioned precache | Fast start, works offline |
| API responses (search, library, quizzes) | Network-first; short-lived cache fallback for read-only lists | Fresh data when online |
| Verification page and status API | **Network-only** | Must always show the current Verified/Revoked status |
| Authenticated requests, uploads, downloads | Network-only; not cached | Protects access rules and private files |

### 4.4 Offline behaviour (first release)
- Offline: the app shell loads and shows a friendly "You are offline" screen with any cached recent lists clearly marked as possibly out of date.
- Upload, review, quiz submission and verification require a connection and show a clear message offline.
- **Full offline document reading is not planned for the first release** (unconfirmed in `ARCHITECTURE.md`).

### 4.5 Performance and accessibility
- Lightweight assets, compressed images, system fonts, and code splitting per route
- Pagination on search results; lazy loading of non-critical content
- Contrast at least 4.5:1, 16 px minimum body text, visible focus states, labelled form inputs

### 4.6 Security considerations
- HTTPS only; no tokens, passwords or private file URLs stored in the service-worker cache
- Cache cleared on sign-out; cache version bumped on each release so old files are replaced

---

## 5. PWA Shell Checklist

Status is updated only when it has been checked. Nothing below is marked done until evidence exists.

- [ ] Responsive mobile-first layout
- [ ] Web app manifest and suitable icons
- [ ] Service worker registered and installability checked (Lighthouse and a real device)
- [ ] Lightweight assets and readable typography/contrast
- [ ] Tested on a phone or mobile browser, with evidence recorded

**Test plan:** Open the deployed HTTPS site on at least one Android (Chrome) and one iOS (Safari) device. Check that the install option appears or "Add to Home Screen" works, the app opens in standalone mode, the offline screen shows with the network off, and the Lighthouse PWA and accessibility audits pass. Record device, browser, date and screenshots below.

---

## 6. Wireframe Links / Notes

- Landing: _(add image/link)_ — Section 3.1
- Search/library: _(add image/link)_ — Sections 3.3–3.5
- Upload/review: _(add image/link)_ — Sections 3.6–3.7
- Quiz: _(add image/link)_ — Section 3.8
- Verification: _(add image/link)_ — Section 3.9
- Test evidence: _(not yet tested — add device, browser, date, screenshots and Lighthouse results)_

---

## 7. Review and Acceptance

- [ ] All nine minimum screens are sketched and attached as images or links.
- [ ] Screen names, statuses and field names match the requirements, data model and API terminology.
- [ ] Open points in Section 1 are resolved or recorded as pending.
- [ ] Optional features remain clearly separate from the first-release scope.
- [ ] PWA installability is tested and the evidence is recorded.
- [ ] Reviewed by the team and acceptance recorded.

**Approval status:** Draft. Not final until reviewed by the team.
