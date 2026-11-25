# TuStudyHub User Guide

**Audience:** Students, visitors, contributors, lecturers, moderators and administrators  
**Status:** Initial user guide; verify screenshots and exact screen labels against the current deployed release before final publication.  
**Last reviewed:** 25 November 2026

## 1. About TuStudyHub

TuStudyHub is a tertiary academic resource and learning platform for organizing approved academic materials, supporting course-based learning, and managing document review and verification. It is designed as a responsive web application and installable Progressive Web App (PWA).

The platform is not a student information system. It does not replace official university admissions, registration, grades or student records.

## 2. Access and account roles

### Visitors
Visitors have read-only access to the public areas enabled by the deployment. Protected activities require an account and the appropriate permission. A visitor must not be able to bypass these restrictions by calling an API directly.

### Registered users
Registration and account approval depend on the configured account workflow. An account may remain pending until reviewed. The available actions depend on the assigned role and account status.

### Main roles
- **Student:** accesses student learning features and materials permitted to the account.
- **Contributor:** submits eligible academic resources when submission permission has been granted.
- **Lecturer:** performs authorized academic and review activities.
- **Moderator:** handles assigned reports and content moderation tasks.
- **Administrator:** manages platform users, academic structure and administrative workflows.

The role name alone does not grant unrestricted access. The server checks permissions for protected actions.

## 3. Getting started

1. Open the TuStudyHub website using the official URL supplied by the project team.
2. Browse the public sections available to visitors.
3. Select the sign-in or registration option when you need an account.
4. Complete the requested account information accurately.
5. If the account requires approval, wait for the review decision.
6. After approval, sign in and use the sections available to your role.

**Important:** The custom domain is not yet confirmed as publicly accessible. Until DNS and HTTPS are activated, use only a project-team-provided test address. Do not treat the domain name as live merely because it appears in project documentation.

## 4. Finding academic resources

1. Open the Library section.
2. Browse or search for the material you need.
3. Use available course or academic filters to narrow the results.
4. Open a resource to review its permitted details.
5. If an action is restricted, sign in with an approved account or contact the project administrator.

Access to a resource depends on its publication status and the permissions configured by the platform. Do not redistribute academic materials unless you have permission to do so.

## 5. Courses and academic structure

Open the Courses section to browse the academic catalogue available in the application. The catalogue is organized around the university's academic hierarchy:

**College → Department → Course**

The catalogue organizes resources and learning activities. It is not a student enrollment or official academic-record system.

## 6. Quizzes

1. Open the Quizzes section.
2. Select a quiz that is published and available to your account.
3. Read the instructions before starting.
4. Answer the questions and submit the attempt.
5. Review the score or result shown by the application.

Quiz creation and publication are restricted to authorized roles. A quiz may be unavailable if it is unpublished, restricted or outside your account permissions.

## 7. Document verification

Use the Verify area or the verification link/QR code provided with an eligible document, where this feature is enabled for the current release. Check the status returned by the platform rather than relying on a printed stamp alone.

A verification result does not grant permission to download or redistribute the document. If a result is unavailable or unclear, contact the project team and provide the document identifier without sharing private account information.

## 8. Contributor and review workflow

Where contributor access is enabled:

1. Sign in with an account that has submission permission.
2. Open the resource submission workflow.
3. Enter accurate document metadata and select the permitted file.
4. Submit the resource for review.
5. Monitor its status and any reviewer feedback.
6. If it is rejected, read the reason and follow the correction instructions before submitting an updated version.

Submission does not mean a resource has been approved or published. Do not upload material that you do not have the right to share.

## 9. Account safety and responsible use

- Keep your password private and use a unique password.
- Sign out on shared devices.
- Do not upload private student records or confidential university information.
- Do not submit copyrighted materials without authorization.
- Do not attempt to access another user's account, restricted files or administrative functions.
- Report incorrect content, suspicious activity or access problems through the contact channel officially provided by the project team.
- Never send passwords, verification codes or session tokens in a support request.

## 10. Troubleshooting

| Problem | What to do |
|---|---|
| Website does not open | Confirm that you are using the current URL supplied by the project team. The custom domain is awaiting DNS resolution and HTTPS activation. |
| Sign-in fails | Check the email and password, then retry. If the account is pending or suspended, contact the authorized administrator. |
| A section or action is unavailable | Your role, account status or the resource's publication status may not permit the action. |
| A resource cannot be downloaded | Confirm that you are signed in and authorized to download that resource. |
| A quiz is unavailable | It may not be published or your account may not have permission to attempt it. |
| A page appears outdated | Refresh when online. If the problem continues, report the page and device/browser details. |
| Verification cannot be completed | Check the identifier or QR link and try again when the service is available. Contact the project team if the status remains unclear. |

## 11. Support

Use only the official support/contact details published by the TuStudyHub project team or William V. S. Tubman University. Contact details must be confirmed before they are added to this guide.

## 12. Guide maintenance

This guide must be updated when the application workflow or permission model changes. Before final submission, the team should add screenshots captured from the actual release for registration/sign-in, Library, Courses, Quizzes, document submission/review, verification and role-specific dashboards. Screenshots must not expose real student information, credentials or private records.
