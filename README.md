# EcFoundation

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.24.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Profile routes

```text
/onboarding       Multi-step professional profile onboarding
/profile          Current professional profile
/profile/edit     Edit current professional profile and media
/users/:id        Public professional profile
```

Profile data and industry/emirate options are loaded from the Laravel API using the existing Sanctum SPA session.

## Business routes

```text
/businesses             Current user's business memberships
/businesses/create      Create a business page
/businesses/:slug       Public business page
/businesses/:slug/edit  Owner/admin business management and media
/businesses/:slug/members  Owner/admin membership management
```

Business data and role authorization come from the Laravel API. Industry and emirate options are loaded from the backend metadata endpoints.

## Post routes

```text
/my-posts          Create and manage the current user's posts and drafts
/posts/:id         View a published post
/posts/:id/edit    Edit an owned or authorized business post
```

The composer supports user or managed-business authors, draft/published status, plain text, and up to four JPEG, PNG, or WebP images (8 MB each). Public user and business pages render published posts from the Laravel API; comments and reactions are available on published content, while feed ranking is not part of this feature.

## Home feed

The authenticated `/` route is a global chronological feed. It reuses the post card/composer, loads cursor pages progressively, and lazy-loads comments only when a post's `View comments` action is opened. Comments support user or managed-business authors and one reply level; reactions are human-user-only, with no mentions, notifications, or moderation UI.

```text
/                  Authenticated chronological home feed
```

The Phase 1 home feed is a global, non-personalized chronological view of published user and business posts from `GET /api/v1/feed`. It uses opaque cursor pagination, progressive loading, refresh/retry states, and the shared post composer/card. It is not a following or recommendation feed.

## Reactions

Posts, comments, and replies support `like`, `celebrate`, `support`, and `insightful` reactions through the shared reaction control. The UI shows the aggregate summary and current human user's reaction, updates optimistically, and rolls back failed mutations. Business identities do not react; reactions always belong to the authenticated human user. Reaction controls are not shown for drafts.

## Follow network

Public user and business pages expose human-user follow/unfollow controls with optimistic counts and rollback on failure. Network lists use the backend's paginated resources and load more relationships without duplicating targets.

Routes:

/users/:id/followers          User followers
/users/:id/following          User's mixed user/business following list
/businesses/:slug/followers   Business followers

Follow actions always use the authenticated human account; there is no business follower identity. The home feed remains global chronological and is not personalized by follows.

## Verification

```text
/verification                  Current user's verification submission/status
/businesses/:slug/verification Owner/admin business verification submission/status
```

Verification supports `not_submitted`, `pending`, `approved`, and `rejected` states. User and authorized business managers can submit PDF, JPEG, PNG, or WebP documents (10 MB each, up to five files). Rejected requests can be resubmitted; private documents never expose storage paths or permanent URLs. Public profiles and business pages show only the approved verified badge. Admin review UI is not part of EC-011-FE.

### Search and discovery

The public `/search` route supports unified people/business discovery plus user and business type filters, canonical industry/emirate filters, verified filtering, filter-only discovery and progressive page loading. Query state lives in the URL, so refresh, deep links and browser back/forward restore the same search. Result order is defined by the backend and is not re-ranked in Angular. Search is guest-accessible and does not search posts, personalize ranking, store search history or add recommendations.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
