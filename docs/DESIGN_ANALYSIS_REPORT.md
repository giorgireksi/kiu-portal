# KIU Luxury Editorial Design Analysis

This report outlines the design system, color logic, CSS methodologies, and Javascript integrations observed in `index.html` and its dependencies (specifically `index-luxury.css`, `base.css`, and `faculty.js`). You can use this guide as a blueprint to confidently redesign other pages like `admin-library.html`, `admin-scheduler.html`, and `staff.html` to perfectly match the new aesthetic.

## 1. Global Themes & Layout

The portal utilizes a **Modern "Luxury Editorial" Dark Mode** design approach ("Glassmorphism" combined with elegant serif typography).

### Core Body & Background
To implement the background theme, your pages must structure the background similar to `index.html`:
- The `body` element inherently receives a deep dark blue scale (`#070910`). 
- A fixed background gradient overlays the body, providing light glowing accents in the corners.
- **Side Navigation (`#lux-shell`)**: 238px wide, fixed on the left side with a blur backdrop filter (`--lux-shell-glow-rgb`).
- **Top Bar (`#lux-topbar`)**: 78px high, blurred gradient, spanning from the sidebar to the right edge.
- **Main App Content (`#app-content`)**: Receives top padding to account for the top bar and a left margin for the sidebar.

### Required Fonts
Include these in the `<head>` of your HTML files:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Necessary CSS Files
At minimum, new pages require the following stylesheets:
```html
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/layout.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/index-luxury.css">
```

---

## 2. Dynamic Color & Theme System (Faculty Colors)

The design implements a **Dynamic Faculty Theming Engine** managed by `assets/js/shared/faculty.js`. Accent colors across the UI automatically switch based on the selected faculty.

### The Color Variables:
- `--lux-bg`: `#070910`
- `--lux-surface`: `#101726`
- `--lux-border`: `rgba(255, 255, 255, 0.08)`
- `--lux-text`: `#f5f1e8`
- `--lux-text-muted`: `rgba(245,241,232, 0.62)`

### Faculty Dynamic Accents:
Depending on the dropdown choice `<select id="faculty-select" onchange="switchFacultyTheme(this.value)">`, the primary accent variable (`--lux-accent`, `--lux-accent-2`) changes:
- **CS (Computer Science)**: Purple (`#5b21b6`)
- **ECON (Management)**: Red (`#a4262c`)
- **LAW**: Green (`#107c41`)
- **MED (Medicine)**: Dark Green (`#065f46`)
- **ARTS**: Amber/Orange (`#b45309`)

**Usage tip**: Instead of hardcoding red or blue, rely on `var(--lux-accent)` for borders, text spans, or backgrounds to ensure full compatibility with the dynamic engine.

---

## 3. Core UI Components

### Buttons
To maintain consistency, use the established luxury button classes:

- **Primary Action Button**: `.lux-primary-btn`, `.admin-glass-btn`, or `.kiu-btn-blue`
  - *Styles applied*: Accent gradient background `linear-gradient(135deg, var(--lux-accent), var(--lux-accent-2))`, no borders, 12px border-radius, prominent glowing box-shadow.
- **Secondary / Outline Button**: `.lux-secondary-btn`, `.kiu-btn-outline`
  - *Styles applied*: Highly transparent background `rgba(255,255,255,0.04)`, `1px solid var(--lux-border)`, text color `var(--lux-text)`.

### Cards and Data Panels
Containers holding varying pieces of text or tables should use the "glass logic" cards implementation:
- **Classes**: `.lux-panel`, `.lux-card`, `.content-box`
- *How it looks*: A very subtle vertical dark gradient `linear-gradient(180deg, rgba(16,23,38,0.96), rgba(12,18,29,0.98))`, 1px subtle white border (`--lux-border`), aggressively rounded corners `24px` (`--lux-radius-lg`), and strong drop shadow.

### Headers and Typography (The "Editorial" Look)
Hero panels and significant page titles make use of the `Playfair Display` serif font rather than simple sans-serif fonts. 

**Example component structure:**
```html
<div class="lux-hero">
    <div class="lux-kicker">Faculty Management</div>
    <h1>Administration Dashboard</h1>
    <p>Manage courses, review workloads, and export institutional data.</p>
</div>
```
- `.lux-kicker`: Tiny tracked-out uppercase accent-colored text.
- `h1` tags in hero boxes naturally pick up `Playfair Display`, `34px`.
- Statistics often use `DM Mono` for numbers to look technical and precise (e.g. `<div class="lux-stat"><strong>2,431</strong><span>Students</span></div>`).

### Notifications / Alerts
If displaying status messages:
- `.lux-alert`: The container. Add `.is-blue` or `.is-green` for coloration.
- `.lux-alert-icon`: Leftly aligned icon box container.
- `.lux-alert-copy`: Container for text with an internal `strong` and `span`.

---

## 4. Input & Search Bar Styling
Inputs, Selects, and Textareas follow the uniform transparency model:
- **Baseline CSS**: The inputs have a blurred, translucent glass look `background: rgba(var(--lux-glass-tint-rgb),0.34)`.
- **Borders**: They rely on `border: 1px solid var(--lux-border)`.
- **Focus States**: On focus, the border shifts gracefully to `rgba(var(--lux-accent-rgb),0.28)`.

```html
<div class="lux-search">
    <i class="fas fa-search"></i>
    <input type="text" placeholder="Search resources...">
</div>
```

---

## 5. Necessary Javascript Includes
To ensure modals, tabs, switching engines, and layouts render perfectly on your target administration pages, include the core Javascripts at the bottom of the `<body>`:

```html
<script src="assets/js/app/app.js"></script>
<script src="assets/js/app/api.js"></script>
<script src="assets/js/app/auth.js"></script>
<script src="assets/js/app/state.js"></script>
<!-- CRITICAL: Handles color dynamic changes -->
<script src="assets/js/shared/faculty.js"></script> 
<!-- Other relevant features -->
<script src="assets/js/shared/utilities.js"></script>
<script src="assets/js/features/ui.js"></script>
<script src="assets/js/features/index-luxury.js"></script>
```

---

## Summary Checklist for your redesign:
1. Wrap elements into a core shell (e.g., `#lux-shell` sidebar, `#lux-topbar`, `#app-content` main area).
2. Swap hardcoded `#007bff` blues or solid-color backgrounds for CSS variables (`var(--lux-surface)`, `var(--lux-accent)`).
3. Switch boring `border-radius: 4px` on cards to the rounder `.lux-card` classes (`border-radius: 24px`).
4. Adopt `Playfair Display` for primary headers and `.lux-kicker` for small meta labels.
5. Upgrade buttons directly to `.lux-primary-btn` and `.lux-secondary-btn`.
