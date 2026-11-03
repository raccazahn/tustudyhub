# API Specification — Contract Draft

## Standards from the concept paper
- REST with JSON; all routes under `/api/v1/`.
- Plural resource names, e.g. `/api/v1/papers`.
- Token-based user authentication.
- Consistent errors with `code`, `message`, `request_id`.
- Pagination, filtering and sorting for list endpoints.
- Interactive API documentation (e.g. FastAPI OpenAPI/Swagger UI).
- No business logic exclusively in the frontend.

## Initial resource inventory — exact endpoints must be agreed before coding
| Resource | Purpose | Operations to specify |
|---|---|---|
| Auth/sessions | Register, login, password reset, token lifecycle | Register, login, refresh/logout, reset |
| Users | Profile and role-aware administration | Own profile; admin user/role management |
| Courses | Course catalogue | List/read; admin management |
| Papers | Metadata and upload | Upload/create, list/search, detail, download |
| Verification | Review, approval and public status | Submit for review, approve/reject, revoke, public lookup |
| Quizzes | MCQ quiz management | Authorized create/manage; list/read |
| Quiz attempts | Submit answers and receive score | Submit/view score history |
| Reports | Flag incorrect/prohibited content | Create report; authorized review |
| Ratings/reviews | Resource feedback | Create/update own rating/review; authorized moderation |
| Notifications | Persistent event notifications | List/read/update notification state; preferences |
| Academic Q&A | Course-related questions and answers | Create/list/respond/report; moderation |
| Feedback | User-submitted platform feedback | Submit; admin triage and status management |
| Analytics | Administrative metrics | Permission-checked reports and aggregates |
| Academic structure | Colleges, departments and courses | Admin CRUD with parent-child validation |
| AI quiz generation | Draft generation and validation | Authorized draft request; validate; reviewer approval |
| Offline sync | Client synchronization | Sync state, queued-action reconciliation and conflict handling |
| API clients | External client access | Only if selected and implemented |

## Error shape proposal
```json
{
  "code": "VALIDATION_ERROR",
  "message": "A short explanation suitable for the client.",
  "request_id": "request-correlation-id"
}
```

## Contract checklist
- [ ] Agree method/path list before coding.
- [ ] Define auth/permissions, schemas and validation.
- [ ] Define upload limits, errors and pagination.
- [ ] Provide OpenAPI v1 and interactive docs.
- [ ] Prepare mock responses/server if useful.
