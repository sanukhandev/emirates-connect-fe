# AGENTS.md

## Project

**Repository:** `sanukhandev/emirates-connect-fe`  
**Product:** Emirates Connect  
**Application:** Web Frontend  
**Stack:** Angular + TypeScript + Tailwind CSS  
**Primary branch:** `main`

This repository contains the web application for Emirates Connect.

Parent repository:

```text
git@github.com:sanukhandev/emirates-connect-mvp.git
```

Frontend repository:

```text
git@github.com:sanukhandev/emirates-connect-fe.git
```

The frontend is included in the parent as the `frontend` Git submodule.

---

# 1. Core Rules

Before modifying code:

```bash
git status
git branch --show-current
git log --oneline -10
git remote -v
```

Always:

- inspect existing patterns
- preserve existing design conventions
- reuse shared components
- use Tailwind CSS
- preserve responsive behavior
- keep TypeScript strict
- use typed API contracts
- avoid unnecessary dependencies
- keep components maintainable

Never:

- add Bootstrap
- add Material UI unless explicitly requested
- introduce another CSS framework
- use random design colors
- introduce another font
- expose backend secrets
- hardcode production credentials
- bypass Angular security
- modify backend/mobile from this repository

---

# 2. Product Identity

Emirates Connect is a UAE-focused professional platform for:

- entrepreneurs
- founders
- business owners
- executives
- SMEs
- enterprises
- professional communities

The product should feel:

```text
professional
premium
modern
minimal
credible
business-focused
clean
approachable
```

Avoid a playful consumer-social-media visual style.

---

# 3. Branding

Primary brand color:

```css
rgb(148 112 248)
```

Hex:

```text
#9470F8
```

Use this as the main accent.

Do not introduce arbitrary purple variants throughout components.

Use centralized semantic tokens.

---

# 4. Typography

The application uses:

```text
Ubuntu
```

Google Font only.

Recommended weights:

```text
400 Regular
500 Medium
700 Bold
```

Do not introduce:

```text
Inter
Roboto
Poppins
Montserrat
Arial as visual primary
```

Use system fallback only if Ubuntu fails to load.

Example:

```css
font-family: 'Ubuntu', sans-serif;
```

---

# 5. Tailwind CSS

Tailwind CSS is the required styling system.

Do not build the application around ad-hoc component CSS.

Use Tailwind utility classes and reusable component abstractions.

Global theme values must be centralized.

Example design tokens:

```css
@theme {
  --color-brand-50: #f7f4ff;
  --color-brand-100: #efe9ff;
  --color-brand-200: #dfd3ff;
  --color-brand-300: #c8b3ff;
  --color-brand-400: #ac8cff;
  --color-brand-500: #9470f8;
  --color-brand-600: #8057e8;
  --color-brand-700: #6d46ca;
  --color-brand-800: #593ba4;
  --color-brand-900: #4a3483;
}
```

If project Tailwind version requires a configuration file instead, map these tokens appropriately.

Do not duplicate colors throughout templates.

---

# 6. Neutral Palette

Primary surfaces should use:

```text
white
off-white
soft grey
neutral grey
dark charcoal text
```

Suggested semantic tokens:

```text
background
surface
surface-muted
border
text-primary
text-secondary
text-muted
brand
brand-hover
brand-soft
danger
success
warning
```

Avoid harsh pure-black layouts.

Avoid excessive gradients.

---

# 7. Bento Design System

The UI follows modern Bento layout principles.

Bento means:

- structured information hierarchy
- modular cards
- responsive compositions
- consistent spacing
- controlled visual density
- deliberate card sizing

Bento does not mean random card sizes.

Cards should communicate importance.

---

# 8. Bento Grid

Desktop example:

```text
┌─────────────────────────────────────────────────────────┐
│ Header                                                  │
├─────────────┬────────────────────────┬──────────────────┤
│ Navigation  │ Main Feed              │ Suggestions      │
│             │                        ├──────────────────┤
│             │                        │ Businesses       │
│             │                        ├──────────────────┤
│             │                        │ Community        │
└─────────────┴────────────────────────┴──────────────────┘
```

Tablet should reduce complexity.

Mobile must generally become:

```text
single column
```

Do not horizontally squeeze desktop layouts.

---

# 9. Responsive Design

Use mobile-first Tailwind breakpoints.

Design for:

```text
mobile
tablet
desktop
large desktop
```

Every major feature must be validated at small viewport sizes.

Avoid fixed widths that break mobile.

Prefer:

```text
max-w-*
grid
flex
minmax
gap
responsive columns
```

---

# 10. Layout

Recommended application shell:

```text
App
├── Header
├── DesktopSidebar
├── MainContent
├── ContextSidebar
└── MobileBottomNavigation
```

Do not recreate layout markup individually on every page.

---

# 11. Component Architecture

Recommended structure:

```text
src/app/
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   └── models/
│
├── shared/
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── feed/
│   ├── profile/
│   ├── business/
│   ├── post/
│   ├── comments/
│   ├── reels/
│   ├── verification/
│   ├── notifications/
│   └── discovery/
│
└── layouts/
```

Use standalone Angular components if the project architecture supports them.

---

# 12. Reusable UI Components

Prefer reusable components such as:

```text
Button
IconButton
Avatar
Badge
VerificationBadge
Input
Textarea
Select
Modal
Dialog
Drawer
BottomSheet
Dropdown
Tabs
Card
BentoCard
BentoGrid
Skeleton
EmptyState
ErrorState
Spinner
Toast
PostCard
CommentItem
BusinessCard
UserCard
ReelCard
MediaViewer
```

Do not duplicate component implementations.

---

# 13. Card Design

Default cards should use:

- off-white/white backgrounds
- subtle borders
- restrained shadow
- consistent radius
- consistent padding

Suggested radius:

```text
rounded-2xl
```

Large Bento cards may use:

```text
rounded-3xl
```

Avoid excessively heavy shadows.

---

# 14. Spacing

Use a consistent spacing scale.

Prefer Tailwind spacing utilities.

Typical:

```text
gap-2
gap-3
gap-4
gap-6
p-4
p-5
p-6
```

Avoid arbitrary values unless truly required.

---

# 15. Accessibility

Target WCAG 2.1 AA where practical.

Ensure:

- keyboard navigation
- visible focus
- semantic HTML
- labels
- alt text
- ARIA only where required
- adequate contrast
- accessible dialogs
- accessible dropdowns

Do not rely on color alone to represent state.

---

# 16. Brand Color Accessibility

Do not assume `#9470F8` is suitable for every text/background combination.

Use darker variants where contrast requires it.

Primary CTA:

```text
brand background
white text
```

must be contrast-tested.

---

# 17. Angular State

Prefer the project's existing Angular state mechanism.

If no state framework exists, use Angular primitives before introducing large external state libraries.

Use:

- Signals
- RxJS
- services

Introduce NgRx only when complexity justifies it or architecture explicitly requires it.

---

# 18. HTTP Architecture

All backend communication must be centralized.

Recommended:

```text
environment config
    ↓
API client/service
    ↓
feature service
    ↓
component
```

Do not scatter raw HTTP calls throughout UI components.

---

# 19. API Base URL

Use environment configuration.

Example:

```text
apiBaseUrl
```

Never hardcode production API URLs in components.

---

# 20. Authentication

Authentication state should be centralized.

Use an interceptor for token/session handling if appropriate.

Do not expose sensitive tokens unnecessarily.

Prefer secure cookie/session patterns if the backend architecture supports them.

Never log authentication tokens.

---

# 21. Route Guards

Protected routes must use Angular guards.

Examples:

```text
profile
business administration
verification submission
settings
notifications
create post
```

Frontend guards improve UX but do not replace backend authorization.

---

# 22. API Types

Avoid:

```typescript
any
```

Define API models/interfaces.

Examples:

```text
User
UserProfile
Business
Post
Comment
Reel
Notification
VerificationRequest
PaginatedResponse<T>
ApiResponse<T>
```

---

# 23. Posts

Post components should support:

- user actor
- business actor
- timestamp
- body
- media
- reactions
- comment count
- contextual actions

Keep PostCard reusable between:

```text
feed
profile
business page
post detail
```

---

# 24. Comments

Comments must support threaded replies.

Create recursive or bounded reusable components carefully.

Avoid unlimited DOM recursion.

Support:

```text
view replies
load more replies
reply
delete own comment
report
```

---

# 25. Reels

Reels UX should support:

- vertical media
- play/pause
- mute
- creator information
- engagement
- captions
- loading states
- failed processing states

Avoid loading every video at once.

Use lazy loading/intersection behavior.

---

# 26. Images

Images should:

- have dimensions where possible
- have alt text
- use lazy loading
- preserve aspect ratio
- use object-fit appropriately

Avoid layout shifts.

---

# 27. Loading States

Every remote-data UI should handle:

```text
loading
success
empty
error
```

Use skeletons rather than indefinite blank spaces.

---

# 28. Forms

Forms must:

- have labels
- expose validation clearly
- disable invalid submissions where appropriate
- show server validation errors
- prevent accidental duplicate submission

Use Angular reactive forms for non-trivial forms.

---

# 29. Error Handling

Use centralized HTTP error handling for common errors.

Handle:

```text
401
403
404
409
422
429
500
```

Do not expose raw backend stack traces.

---

# 30. Security

Never:

- use unsafe HTML without sanitization
- bypass Angular sanitizer casually
- put secrets in browser code
- trust localStorage for authorization decisions
- construct unsafe external redirects
- expose privileged backend endpoints

Use:

```text
rel="noopener noreferrer"
```

for new-tab external links where applicable.

---

# 31. Performance

Use Angular performance features appropriately.

Prefer:

- lazy-loaded routes
- optimized images
- trackBy / modern equivalents
- signals
- OnPush where relevant
- virtual scrolling for very large lists

Do not prematurely optimize simple components.

---

# 32. SEO

Public business/profile pages may require SEO.

Where SSR/prerendering exists, preserve it.

Use meaningful:

```text
title
meta description
canonical
Open Graph
structured data
```

where applicable.

---

# 33. Design Consistency

Before adding a new visual style, check:

```text
docs/design/DESIGN-SYSTEM.md
docs/design/UI-PRINCIPLES.md
```

in the parent repository.

Frontend implementation must follow those specifications.

---

# 34. Testing

At minimum validate:

```bash
npm run lint
npm test
npm run build
```

Run project-specific commands as configured.

For changed components test:

- render
- loading
- error
- interaction
- responsive behavior where practical

Do not claim build success unless executed.

---

# 35. Formatting

Follow the repository's configured formatter.

Do not manually introduce incompatible formatting conventions.

---

# 36. Dependencies

Before adding a package:

1. check if Angular/Tailwind already solves the problem
2. check maintenance status
3. consider bundle impact
4. avoid packages for trivial utilities

Do not introduce multiple competing UI libraries.

---

# 37. Git

Use Conventional Commits.

Examples:

```text
feat: add onboarding profile form
feat: add bento business profile layout
fix: handle expired authentication session
refactor: extract reusable post card
style: align feed cards with design system
test: add business page component coverage
```

---

# 38. Parent Submodule Workflow

After frontend work:

```bash
git add .
git commit -m "feat: ..."
git push origin main
```

Then update parent:

```bash
git add frontend
git commit -m "chore: update frontend submodule"
git push origin main
```

---

# 39. Definition of Done

A frontend task is complete when:

- requirement implemented
- brand system followed
- Ubuntu remains the only primary font
- Tailwind used correctly
- responsive behavior verified
- mobile layout validated
- accessibility considered
- API integration typed
- loading/error/empty states handled
- lint passes
- build passes
- tests pass where configured
- no secrets committed
- committed and pushed to `main`
- working tree clean

Final task report:

```text
Task:
Status:

Pages/components changed:

API changes consumed:

Design-system impact:

Responsive validation:

Accessibility:

Tests:

Build:

Commit:

Branch:

Working tree:
```