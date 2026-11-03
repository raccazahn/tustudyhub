# TuStudyHub UI/UX Wireframe

**Project:** TuStudyHub
**Tagline:** Learn • Share • Verify
**Document Type:** UI/UX Design Documentation
**Version:** 1.0
**Status:** Preliminary Design Baseline

## 1. Purpose

This document presents the UI/UX wireframe
for TuStudyHub. It describes the intended
screen layouts, navigation, and user workflows.

The wireframe must remain consistent with
the actual application implementation.

## 2. Brand Identity

Use the established Clay & Kaolin palette.

| Color | Hex |
|---|---|
| Clay 700 | #8A3E12 |
| Clay 600 | #A84D16 |
| Clay 500 | #C2691D |
| Clay 400 | #D98A3D |
| Kaolin 900 | #1C1A17 |
| Kaolin 700 | #4A463F |
| Kaolin 500 | #726B62 |
| Kaolin 50 | #F7F5F1 |

## 3. User Roles

- Student
- Lecturer
- Administrator

## 4. Application Navigation

```mermaid
flowchart TD
    A[TuStudyHub] --> B[Authentication]
    B --> C[Student Dashboard]
    B --> D[Lecturer Dashboard]
    B --> E[Administrator Dashboard]

    C --> F[Academic Library]
    C --> G[Quizzes]
    C --> H[Academic Q&A]
    C --> I[Notifications]
    C --> J[Offline Resources]

    D --> K[Resource Review]
    D --> L[Quiz Management]
    D --> M[AI Quiz Review]

    E --> N[User Management]
    E --> O[Academic Structure]
    E --> P[Verification Registry]
    E --> Q[Analytics]
    E --> R[Feedback Management]
