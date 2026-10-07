---
name: ui-ux-pro-max-skill
description: >-
  Advanced UI/UX design system engineering, interaction patterns, layout architecture, visual polish, and design review.
  Activate when designing, reviewing, or refactoring user interfaces, component design systems, Tailwind tokens, micro-interactions, responsive layouts, or accessibility.
---

# UI/UX Pro Max Skill

A professional-grade UI/UX design system and product design skill for building modern, accessible, responsive, and aesthetically refined web applications.

---

## 1. Visual Hierarchy & Layout Architecture

### 1.1 Information Hierarchy
* **Focal Point Dominance**: Every screen must have a clear primary focal point (e.g. main feed stream, primary CTA, hero summary). Secondary and tertiary panels (sidebars, widgets) must never compete visually with the main canvas.
* **Content-Over-Chrome**: Minimize unnecessary UI borders, heavy boxes, and oversized headers. Prioritize real content, human-readable typography, and intentional whitespace.
* **Density & Spacing Scales**:
  * Micro (elements inside a button or tag): `gap-1`, `gap-1.5`, `gap-2` (4px - 8px)
  * Internal Card Padding: `p-4` to `p-6` (16px - 24px)
  * Inter-component Flow: `gap-4`, `gap-6` (16px - 24px)
  * Page / Shell Gaps: `gap-6` to `gap-8` (24px - 32px)

### 1.2 Bento Grid Design Principles
* Use Bento composition specifically where information modularity clarifies relationships (e.g. dashboards, discovery panels, statistics, profile overviews).
* Keep main dynamic content streams (such as feeds, articles, threads) strictly linear and vertical.
* Use proportional card spans (`col-span-1`, `col-span-2`) with balanced visual weight.

---

## 2. Color System & Semantic Tokens

### 2.1 Palette Construction
* **Canvas / Surface**:
  * Base App Canvas: Soft off-white / light slate (`#F7F7FA` to `#F8FAFC`). Avoid blinding pure white backgrounds for entire viewports.
  * Elevated Card Surface: Pure white (`#FFFFFF`) with ultra-subtle border (`#E8E8EE` or `border-slate-200/60`).
  * Secondary / Muted Surface: Soft grey (`#F3F4F7` or `slate-100/70`) for inputs, chips, and secondary containers.
* **Brand Accent Usage**:
  * Keep the primary brand color reserved for active states, primary CTA buttons, selection highlights, progress indicators, and subtle icon accents.
  * Never wash entire pages or sidebars in saturated brand colors unless building high-contrast promotional modals.
* **Semantic States**:
  * Success: Soft emerald / green (`#10B981` / `bg-emerald-50 text-emerald-700`)
  * Warning: Amber / gold (`#F59E0B` / `bg-amber-50 text-amber-700`)
  * Danger / Destructive: Rose / red (`#EF4444` / `bg-rose-50 text-rose-700`)
  * Info: Indigo / sky (`#3B82F6` / `bg-blue-50 text-blue-700`)

---

## 3. Typography & Micro-copy

* **Font Uniformity**: Strictly stick to the project's designated font family (e.g. Ubuntu). Never mix multiple competing primary fonts.
* **Type Scale & Weights**:
  * Page Titles: `text-2xl` to `text-3xl font-bold tracking-tight`
  * Section Headers: `text-base` to `text-lg font-bold`
  * Card Titles / Author Names: `text-sm font-semibold`
  * Body Text: `text-sm leading-relaxed text-content-primary`
  * Secondary Metadata: `text-xs text-content-secondary`
  * Badges / Timestamps / Captions: `text-[11px]` to `text-xs font-medium text-content-muted`
* **Micro-copy Rules**:
  * Be concise, friendly, and business-appropriate.
  * Avoid generic placeholders like "Click here" or "Submit"; use action-oriented verbs like "Publish update", "Save changes", "Connect".

---

## 4. Components & Interaction Patterns

### 4.1 Buttons & Interactive Controls
* Minimum touch target size: **44 × 44px** on mobile viewports.
* Provide interactive states for every control:
  * Default, `:hover`, `:active` (`active:scale-95`), `:focus-visible` (visible ring), and `:disabled` (`opacity-50 cursor-not-allowed`).
* Use SVG line icons with semantic color pairings rather than unicode emojis for general UI.

### 4.2 Form Inputs & Search Bars
* Clearly associate inputs with `<label>` (use `.sr-only` if visually implied).
* Include clear focus rings: `focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`.
* Never jump layout when errors occur; reserve aria-live regions.

### 4.3 Media & Responsive Imagery
* **Landscape Scaling**: Scale landscape media to fit widescreen frames (`max-h-[400px] w-auto max-w-full object-contain`).
* **Portrait Scaling**: Scale portrait media to fit vertical frames (`max-h-[520px] w-auto max-w-full object-contain`), avoiding content clipping.
* Always handle loading states with skeleton shimmers (`animate-pulse`).

---

## 5. Accessibility (WCAG 2.1 AA)

* **Color Contrast**: Verify minimum 4.5:1 contrast for normal text and 3:1 for large text / graphical controls.
* **Keyboard Navigation**:
  * Ensure full keyboard navigability via `Tab` / `Shift+Tab`.
  * Support `Escape` key for dismissing modals, popovers, and 3-dot dropdown menus.
* **ARIA & Semantics**:
  * Use semantic HTML elements (`<main>`, `<article>`, `<header>`, `<nav>`, `<aside>`, `<button>`).
  * Use `aria-expanded`, `aria-label`, `aria-haspopup`, and `role="menu"` appropriately for floating menus.

---

## 6. Execution Checklist

Before finishing any UI/UX task:
- [ ] Viewport test at 360px (mobile), 768px (tablet), and 1280px+ (desktop).
- [ ] Verify zero horizontal scrollbars or overflowing elements.
- [ ] Check active/selected navigation contrast.
- [ ] Verify loading skeletons, empty states, and error alerts exist.
- [ ] Verify all interactive controls have accessible focus and hover states.
