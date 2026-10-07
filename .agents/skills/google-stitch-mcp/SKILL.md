---
name: google-stitch-mcp
description: >-
  Integration guide, tool runbook, and design stitching workflows for Google Stitch MCP.
  Activate when connecting with Google Stitch, synthesizing UI designs from Stitch schemas, stitching components into templates, managing Stitch MCP servers, or consuming design tokens.
---

# Google Stitch MCP Skill

This skill provides step-by-step guidance for integrating and using **Google Stitch MCP** (Model Context Protocol) to synthesize, extract, and assemble UI components and design systems.

---

## 1. Overview & Capabilities

Google Stitch MCP enables agents to interact with Stitch design systems, design canvases, and token registries. It bridges design specifications into clean frontend code.

Key capabilities:
1. **Design Token Extraction**: Fetch color tokens, typography scales, spacing units, and radius variables directly from Stitch specs.
2. **Component Stitching**: Assemble composite screens from modular UI components.
3. **Layout Synthesis**: Convert high-level wireframes or Stitch layouts into clean HTML / Tailwind CSS / Angular templates.
4. **Visual Consistency Auditing**: Compare existing codebase templates against Stitch guidelines to detect design drift.

---

## 2. MCP Server Configuration

To configure Google Stitch MCP in Antigravity or any MCP client:

### Configuration in `mcp_config.json`
Add the Stitch MCP server entry in your global or workspace `mcp_config.json`:

```json
{
  "mcpServers": {
    "google-stitch": {
      "command": "npx",
      "args": ["-y", "@google/stitch-mcp-server@latest"],
      "env": {
        "STITCH_PROJECT_ID": "<your-project-id>",
        "STITCH_API_KEY": "<optional-api-key>"
      }
    }
  }
}
```

### CLI Command to Add Server
```bash
agy mcp add google-stitch npx -y @google/stitch-mcp-server@latest
```

---

## 3. Stitch MCP Tools & Workflows

### 3.1 Inspecting Design Tokens (`stitch_get_tokens`)
Use this tool to extract project tokens:
* Primary palette (`brand-50` through `brand-900`)
* Neutral surfaces (`canvas`, `surface-card`, `surface-secondary`)
* Typography scales (headings, body, captions)
* Elevation & shadow definitions

**Action:** Map returned tokens directly to Tailwind theme configurations (`@theme` in CSS or `tailwind.config.js`).

### 3.2 Stitching Screen Components (`stitch_render_layout`)
1. **Define Screen Anatomy**:
   * Header / App Bar
   * Primary Content Zone
   * Complementary Panels (Sidebar, Discovery Widgets)
   * Navigation Anchors (Bottom nav for mobile, rail for desktop)
2. **Execute Stitch Pipeline**:
   * Query matching components in the Stitch catalog.
   * Assemble the component hierarchy.
   * Inject project-specific semantic tokens (e.g. Ubuntu font, `#9470F8` brand color).
   * Render semantic, accessible templates with zero extraneous dependencies.

### 3.3 Validating Component Contracts (`stitch_audit_component`)
Verify that stitched components satisfy:
* Typed Inputs & Outputs (Angular signals, TypeScript strict mode).
* State coverage: Loading (skeletons), Success, Empty state, and Error state.
* Mobile-first responsive breakpoints.

---

## 4. Best Practices for Stitch Integration

1. **Keep Output Clean**: Do not allow third-party framework classes (like Material, Bootstrap) into pure Tailwind codebases.
2. **Design Token Single Source of Truth**: Map all colors to central CSS custom properties.
3. **Preserve Responsive Rules**: Ensure all stitched grids collapse gracefully to a single column on mobile (< 768px).
4. **Graceful Fallbacks**: If the Stitch MCP server is offline or in local dev mode, fall back to project-defined design tokens and Tailwind utility classes.
