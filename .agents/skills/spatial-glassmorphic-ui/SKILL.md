---
name: spatial-glassmorphic-ui
description: >-
  Spatial computing interface design, frosted glassmorphism, multi-layer depth architectures, and translucent surface styling.
  Activate when creating modern glassmorphic components, floating panels, spatial depth layers, backdrop filters, or ambient elevation effects in Tailwind CSS.
---

# Spatial & Glassmorphic UI Skill

A practical guide for implementing modern, accessible, and high-performance **spatial and glassmorphic user interfaces** using Tailwind CSS and modern web standards.

---

## 1. Core Principles of Spatial & Glass Design

1. **Light & Material**: Surfaces should feel like real frosted optical glass — catching specular light at the edges, softly diffusing what lies beneath, and casting subtle ambient shadows.
2. **Layer Hierarchy**: Never place glass on glass indefinitely. Use depth hierarchies:
   * Level 0: Deep canvas / background environment.
   * Level 1: Elevated card surfaces (solid or semi-translucent).
   * Level 2: Floating interactive panels (modals, bottom sheets, sticky bars, floating menus).
   * Level 3: Overlays and focal highlights.
3. **Contrast Over Aesthetics**: Text readability must never be sacrificed for aesthetic translucency. Maintain minimum 4.5:1 contrast against all underlying states.

---

## 2. Tailwind CSS Glassmorphic Recipes

### 2.1 The Standard Frosted Glass Surface
```html
<div class="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 dark:shadow-black/20">
  <!-- Content here -->
</div>
```
* **Backdrop Filter**: `backdrop-blur-md` (8px-12px blur) or `backdrop-blur-xl` (16px-20px blur).
* **Opacity Fill**: `bg-white/70` to `bg-white/80` for light theme; `bg-slate-900/60` for dark theme.
* **Edge Highlight**: `border border-white/30` simulating the refractive chamfered edge of real glass.
* **Shadow**: Restrained multi-stop ambient shadow (`shadow-lg` or custom soft drop-shadow).

### 2.2 Floating Glass Navigation Rail / Header
```html
<header class="sticky top-0 z-30 flex items-center justify-between border-b border-white/20 bg-white/80 px-4 py-3 backdrop-blur-lg transition-all duration-200">
  <!-- Logo, navigation links, and profile actions -->
</header>
```

### 2.3 Interactive Glass Cards with Hover Glow
```html
<article class="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-card/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card-hover backdrop-blur-sm">
  <!-- Ambient light shimmer -->
  <div class="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-brand-500/10 via-transparent to-brand-500/10"></div>
  <!-- Card body -->
</article>
```

---

## 3. Spatial Depth & Micro-Elevation

### 3.1 Z-Index Architecture
* Canvas / Base Content: `z-0`
* Sticky Headers / Top Bars: `z-20`
* Floating Action Buttons / Menus / Dropdowns: `z-30`
* Modals, Bottom Sheets, and Dialogs: `z-50`
* Toast Notifications: `z-60`

### 3.2 Motion & Depth Transitions
* Use smooth physics-based cubic beziers for spatial transitions: `transition-all duration-200 ease-out`.
* Elevation lift on hover: `hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]`.

---

## 4. Accessibility & Performance Guardrails

1. **Fallback for Unsupported Browsers**:
   Ensure cards remain legible even if `backdrop-filter` is unsupported:
   ```css
   @supports not (backdrop-filter: blur(10px)) {
     .glass-surface {
       background-color: #ffffff;
     }
   }
   ```
2. **GPU & Mobile Optimization**:
   * Avoid chaining multiple nested `backdrop-blur` elements within virtualized lists or high-frequency scroll containers.
   * On mobile, prefer `backdrop-blur-sm` or solid semi-opaque surfaces to conserve mobile battery and prevent frame drops.
3. **Legibility Test**:
   Always test text on top of glass containers when dynamic imagery or vibrant gradients scroll beneath them. If contrast drops below 4.5:1, increase background surface opacity from `70%` to `85%` or `90%`.
