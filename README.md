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

The composer supports user or managed-business authors, draft/published status, plain text, and up to four JPEG, PNG, or WebP images (8 MB each). Public user and business pages render published posts from the Laravel API; comments, reactions, and feed ranking are not part of this feature.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
