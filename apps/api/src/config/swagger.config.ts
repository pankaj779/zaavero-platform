/**
 * OpenAPI / Swagger description for the Graphology Platform API.
 */
export const SWAGGER_API_DESCRIPTION = `
## Overview

Versioned REST API for the Graphology Platform (\`/api/v1\`).

## Authentication

1. Register or log in via **Auth** endpoints.
2. Use the returned \`accessToken\` as a Bearer token.
3. Rotate sessions with \`POST /api/v1/auth/refresh\` using the opaque refresh token.
4. Revoke sessions with \`POST /api/v1/auth/logout\`.

Protected routes require header:

\`Authorization: Bearer <accessToken>\`

## Authorization (RBAC)

Use \`@Roles\` / \`@Permissions\` on controllers. Temporary verification routes live under **RBAC Test**.

- Unauthenticated → \`401\`
- Authenticated without role/permission or inactive org membership → \`403\`

## Response envelope

Success and error payloads follow the platform API standards document.

## Docs

- Repository: \`docs/API_VERSIONING.md\`, \`docs/ENVIRONMENT.md\`
- Auth module: \`apps/api/src/modules/auth/README.md\`
`.trim();

export const SWAGGER_TAGS = [
  {
    name: 'Health',
    description: 'Liveness and readiness probes',
  },
  {
    name: 'Auth',
    description: 'Registration, login, tokens, email verification, password reset',
  },
  {
    name: 'Courses',
    description: 'Organization-scoped course management (CRUD, list filters, soft delete)',
  },
  {
    name: 'Batches',
    description: 'Organization-scoped batch management (CRUD, list filters, soft delete)',
  },
  {
    name: 'Enrollments',
    description:
      'Organization-scoped enrollment management (CRUD, list filters, soft delete via DROPPED)',
  },
  {
    name: 'Lessons',
    description: 'Course module lessons (CRUD, ordering, content types, soft delete)',
  },
  {
    name: 'Lesson Progress',
    description: 'Per-student lesson progress, resume position, and completion',
  },
  {
    name: 'Live Sessions',
    description: 'Batch live sessions (CRUD, meeting provider, schedule, soft delete)',
  },
  {
    name: 'Attendances',
    description: 'Live session attendance marking and updates',
  },
  {
    name: 'Assignments',
    description: 'Course/batch assignments (CRUD, due dates, soft delete)',
  },
  {
    name: 'Submissions',
    description: 'Assignment submissions, grading, and status transitions',
  },
  {
    name: 'Certificates',
    description: 'Certificate issuance, verification lookup, and revocation',
  },
  {
    name: 'Notifications',
    description: 'In-app notifications with read/unread state',
  },
  {
    name: 'Conversations',
    description: 'Messaging conversations and participants',
  },
  {
    name: 'Messages',
    description: 'Conversation messages and soft delete',
  },
  {
    name: 'Calendar Events',
    description: 'Standalone and LMS-derived calendar events',
  },
  {
    name: 'Payments',
    description:
      'Checkout configuration, catalog, orders, verification, history, invoices, subscription',
  },
  {
    name: 'Payments Admin',
    description:
      'Admin payment operations: overview, plans, transactions, invoices, refunds, subscriptions, coupons, retries',
  },
  {
    name: 'Payment Webhooks',
    description: 'Public provider webhooks authenticated via HMAC signatures',
  },
  {
    name: 'RBAC Test',
    description: 'Temporary protected routes for authorization verification (remove later)',
  },
] as const;
