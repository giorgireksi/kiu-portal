# Comprehensive Analysis: index.html + CSS + JavaScript

## 📋 Executive Overview

This is a **multi-role university portal system (KIU - Kyiv International University)** with a sophisticated design system supporting:
- **4 user roles**: Student, Professor, TA (Teaching Assistant), Admin
- **2 theme modes**: Light & Dark (Luxury mode)
- **Multi-faculty system**: ECON, CS, LAW, MED, ARTS & Humanities
- **Advanced state management**: Client-side state with role/faculty switching

---

## 🎨 DESIGN & VISUAL SYSTEM

### Theme Architecture

#### **Primary Color Palette**

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|----------|-------|
| `--kiu-blue` | `#0A84FF` | `#5c90f5` | Primary accent, buttons |
| `--kiu-navy` | `#0B192C` | `#102038` | Headers, dark backgrounds |
| `--kiu-bg` | `#eef4fb` | `#070910` | Main background |
| `--kiu-text-main` | `#1e293b` | `#fbfaf6` | Primary text |
| `--kiu-text-muted` | `#64748b` | `rgba(251,250,246,0.74)` | Secondary text |
| `--lux-accent` | `#c8822a` | `#c8822a` | Luxury accent (gold/copper) |
| `--lux-green` | `#48bf86` | `#48bf86` | Success states |
| `--lux-red` | `#de6262` | `#de6262` | Error/danger states |

#### **Background Gradients**

**Light Mode (Default)**
```css
background: 
  radial-gradient(circle at 16% 10%, rgba(12, 91, 199, 0.14), transparent 24%),
  radial-gradient(circle at 85% 12%, rgba(198, 122, 61, 0.12), transparent 18%),
  linear-gradient(180deg, #f6f1e8 0%, #eef3f9 100%);
```
- Started with beige/warm tone, transitions to cool blue
- Subtle radial gradients for depth
- Grid pattern overlay (optional)

**Dark Mode (Luxury - "lux-light-mode")**
```css
--lux-bg: #efebe4;              /* Warm beige */
--lux-surface: #ffffff;          /* Pure white surfaces */
--lux-text: #201912;             /* Dark brown text */
```
- Inverts to light backgrounds
- Maintains warm aesthetic
- High contrast for accessibility

#### **Admin Dark Theme (role-admin)**
```css
body.role-admin {
  --kiu-bg: #07111d;
  --kiu-text-main: #f4f1ea;
  --kiu-shell-gradient: 
    radial-gradient(circle at 16% 10%, rgba(0, 71, 143, 0.16), transparent 30%),
    radial-gradient(circle at 84% 84%, rgba(216, 170, 86, 0.10), transparent 24%),
    linear-gradient(180deg, rgba(10, 15, 24, 0.96), rgba(5, 8, 14, 0.99));
}
```
- Deep navy/charcoal base
- Blue and gold accent glows
- Professional dark enterprise look

### Typography System

```css
Font Stack:
- Primary: 'Inter', 'Noto Sans Georgian', sans-serif
- Serif (Headlines): 'Playfair Display', Georgia, serif
- Monospace: 'DM Mono'
- Georgian Support: 'Noto Sans Georgian'

Weight Distribution:
- 400: Body text
- 500: Emphasis
- 600: Subheadings
- 700: Headings
- 800: Hero titles
```

### Shadow & Depth System

```css
--kiu-shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 
                 0 2px 4px -1px rgba(0, 0, 0, 0.03);

--kiu-shadow-md: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 
                 0 8px 10px -6px rgba(0, 0, 0, 0.05);

--kiu-shadow-blue: 0 8px 24px rgba(10, 132, 255, 0.35);

--lux-shadow: 0 22px 60px rgba(0, 0, 0, 0.38);
```

### Glass-morphism Effects

```css
--kiu-glass-blur: blur(16px);

Applied to:
- Header (70px sticky)
- Navigation bars
- Modal overlays
- Card surfaces

Effect: backdrop-filter: blur(16px) saturate(145%);
```

---

## 🗂️ HTML STRUCTURE

### Document Head

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Metadata & Cache Control -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
    <!-- Fonts & Icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter...Playfair Display...">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
```

### Layout Structure

```
<body class="role-student kiu-shell-loading lux-unified-shell">
├── <header class="kiu-header"> (sticky, 70px)
│   ├── .header-left (logo + greeting)
│   ├── .header-right (user info + switchers)
│       ├── Faculty Switcher <select>
│       ├── Role Switcher <select>
│       ├── Language Switcher
│       └── Profile Menu Dropdown
│
├── <nav id="prof-nav"> (professor-only nav, hidden by default)
│   └── Teaching Matrix | My Schedule | Library | Orders | Social | Exams
│
├── <nav id="top-nav"> (student nav)
│   └── Calendar | LMS | Social | Personal Data | Chancellery | etc.
│
├── <main id="app-content">
│   ├── <div id="page-home"> (active by default)
│   ├── <div id="page-admin-tools">
│   ├── <div id="page-social">
│   ├── <div id="page-exams">
│   └── <div id="page-calendar">
│
├── <footer>
│   └── Copyright + Georgian flag
│
└── <div id="modal-overlay">
    ├── Modal: Announcement
    ├── Modal: Event
    ├── Modal: Syllabus
    ├── Modal: Programs
    ├── Modal: Add Concentration Subject
    ├── Modal: Add Minor Subject
    └── Modal: Scheduler (Teams-style calendar)
```

### Key Component Classes

| Class | Purpose | Display |
|-------|---------|---------|
| `.only-professor` | Hide for non-professors | `display: none !important` by default |
| `.only-student` | Hide for non-students | `display: none !important` when role ≠ student |
| `.only-admin` | Admin-exclusive elements | Hidden by default |
| `.role-student` | Student-specific styles | Applied to `<body>` |
| `.role-professor` | Professor-specific styles | Applied to `<body>` |
| `.role-admin` | Admin-specific styles | Applied to `<body>` |
| `.kiu-shell-loading` | Loading state (displays "Loading workspace...") | Removed after init |
| `.lux-unified-shell` | Luxury unified shell mode | Modern glassmorphism theme |
| `.active-page` | Currently visible page section | `display: block` |

---

## 🎯 HEADER COMPONENT

### Structure

```html
<header class="kiu-header" onclick="handleHeaderHomeNavigation(event)">
    <div class="header-left">
        <div class="kiu-logo">K</div>
        <div class="header-greeting">Hello Student</div>
    </div>
    <div class="header-right">
        <div class="user-info">
            <div class="user-name">Portal User</div>
            <div class="user-role">Student View...</div>
        </div>
        <div class="faculty-switcher">
            <select id="faculty-select" onchange="switchFacultyTheme(this.value)">
                <option value="ECON">Management</option>
                <option value="CS">Computer Science</option>
                <option value="LAW">Law</option>
                <option value="MED">Medicine</option>
                <option value="ARTS">Arts & Humanities</option>
            </select>
        </div>
        <div class="role-switcher">
            <select id="role-switcher-select" onchange="switchRole(this.value)">
                <option value="student">Student View</option>
                <option value="professor">Professor View</option>
                <option value="ta">TA View</option>
                <option value="admin">Admin View</option>
            </select>
        </div>
        <div class="lang-switcher">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Flag_of_Georgia.svg/20px-Flag_of_Georgia.svg.png" alt="GE">
        </div>
        <div class="user-dropdown-trigger" onclick="toggleProfileMenu(event)">
            <div class="user-avatar"></div>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="profile-menu" id="profileMenu">
            <div class="profile-menu-item" onclick="navigate('profile')"><i class="far fa-user"></i> Profile</div>
            <div class="profile-menu-item" onclick="navigate('social')"><i class="fas fa-comments"></i> Social</div>
            <div class="profile-menu-item" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> Logout</div>
        </div>
    </div>
</header>
```

### Header Styling

```css
header {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(16px);
    height: 70px;
    display: flex;
    justify-content: space-between;
    padding: 0 40px;
    position: sticky;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.kiu-logo {
    width: 40px;
    height: 40px;
    background-color: var(--kiu-navy);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    font-size: 20px;
}

.kiu-logo::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 6px;
    height: 6px;
    background-color: var(--kiu-blue);
    border-radius: 50%;
}
```

---

## 🌐 NAVIGATION SYSTEM

### Student Navigation (Top Nav)

```html
<nav id="top-nav" class="only-student">
    <div class="nav-item" id="nav-calendar" onclick="navigate('calendar')">
        <i class="far fa-file-alt"></i> Calendar
    </div>
    <div class="nav-item" id="nav-lms" onclick="navigate('lms')">
        <i class="fas fa-book-reader"></i> LMS
    </div>
    <div class="nav-item" id="nav-social" onclick="navigate('social')">
        <i class="fas fa-comments"></i> Social
    </div>
    <!-- + 7 more items -->
</nav>
```

**Navigation Styling (Layout CSS)**

```css
#top-nav {
    background: linear-gradient(90deg, #102038 0%, #193354 45%, #0b84ff 100%);
    border-radius: 24px;
    width: min(1520px, calc(100% - 28px));
    margin: 14px auto 0;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 38px rgba(15, 23, 42, 0.2);
}

.nav-item {
    min-width: 108px;
    border-radius: 18px;
    padding: 13px 16px;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
}

.nav-item::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.11), transparent 75%);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.nav-item:hover::before,
.nav-item.active::before {
    opacity: 1;
}
```

### Professor Navigation

```html
<nav id="prof-nav" class="only-professor">
    <!-- Teaching Matrix, My Schedule, Library, Orders, Social, Exams -->
    <!-- Each with unique onclick="navigate('page')" -->
</nav>
```

**Visual Differences**
- Background: Navy to indigo gradient (darker than student nav)
- Text color: `rgba(255,255,255,0.7)` (more transparent)
- Icons larger (16px)
- Layout: Horizontal flex with gaps

---

## 💾 STATE MANAGEMENT SYSTEM

### Global State Object: `KIU_STATE`

```javascript
KIU_STATE = {
    // User & Role
    currentUserRole: 'student',              // student, professor, ta, admin
    currentFaculty: 'ECON',                  // ECON, CS, LAW, MED, ARTS
    effectiveUserRole: 'student',            // May differ from currentUserRole
    
    // Data Collections
    announcements: [],                        // Announcement objects
    events: [],                               // Event objects
    schedules: {                              // By user ID
        'user-1': [{ courseId, time, etc }]
    },
    calendarEvents: {                         // By month key (YYYY-MM)
        '2026-04': [{ date, title, color }]
    },
    
    // Faculty Data
    facultyProfiles: {
        'ECON': { name: 'Management', professors: [], tas: [] },
        'CS': { name: 'Computer Science', ... },
        'LAW': { ... },
        'MED': { ... },
        'ARTS': { ... }
    }
};
```

### Role Switching Function

```javascript
function switchRole(newRole) {
    // 1. Validate role
    // 2. Update body class: body.className = `role-${newRole}`
    // 3. Set KIU_STATE.currentUserRole = newRole
    // 4. Hide/show navigation based on role
    // 5. Reset temporary UI states (localStorage)
    // 6. Re-render active page
    // 7. Apply localStorage flags for pending navigation
}
```

### Faculty Switching Function

```javascript
function switchFacultyTheme(facultyCode) {
    // 1. Update KIU_STATE.currentFaculty
    // 2. Trigger theme re-application
    // 3. Load faculty-specific data
    // 4. Re-render faculty selector
    // 5. Update related UI (program selector, etc.)
}
```

---

## 🌓 DARK MODE / LIGHT MODE SYSTEM

### Mode Toggle Mechanism

```javascript
// Toggle between dark (default) and light
document.body.classList.toggle('lux-light-mode');

// Light Mode Variables (when applied)
body.lux-light-mode {
    --lux-bg: #efebe4;              // Warm beige
    --lux-surface: #ffffff;         // White cards
    --lux-text: #201912;            // Dark brown
    --lux-border: rgba(48,34,22,0.10);
}
```

### Theme Inheritance Hierarchy

```
Base (Dark Mode - Default)
├── Variables in :root and body
├── Applied by default
└── Uses RGB values for opacity control

├── Admin Theme (Dark Enhanced)
│   └── body.role-admin overrides
│
└── Light Theme
    └── body.lux-light-mode overrides all colors
```

### Transparent Mode Control

```css
:root {
    --lux-transparency-mode: on;
    --lux-panel-alpha: 0.94;        /* Card surface opacity */
    --lux-glass-alpha: 0.48;        /* Glass effect strength */
}
```

---

## 🎨 CSS FILE BREAKDOWN

### 1. **base.css** (200+ lines)
**Focus**: Global resets, variables, RBAC, loading states

Key Content:
- CSS Variables (color palette, shadows, gradients)
- Role-based access control (RBAC) with `.only-*` classes
- Admin dark theme overrides
- Loading skeleton state (`.kiu-shell-loading`)
- Header & basic layout
- Button styles, shadows, glassmorphism

```css
/* RBAC Example */
.only-professor { display: none !important; }
.role-professor .only-professor { display: block !important; }

/* Admin Theme */
body.role-admin {
    --kiu-bg: #07111d;
    --kiu-text-main: #f4f1ea;
}
```

### 2. **layout.css** (300+ lines)
**Focus**: Responsive container layout, luxury branding, navigation styling

Key Content:
- Header: `width: min(1520px, calc(100% - 28px))` (responsive max-width)
- Rounded borders: `border-radius: 28px` on header/nav
- Luxury brand mark styling with gradient
- Navigation bar styling (gradient backgrounds, rounded items)
- Modal content styling (backdrop blur, shadows)
- Button styles with luxury aesthetic
- Table styling

```css
header {
    width: min(1520px, calc(100% - 28px));
    margin: 16px auto 0;
    border-radius: 28px;
    backdrop-filter: blur(24px);
}
```

### 3. **components.css** (compatibility placeholder)
- Minimal content for component compatibility
- Shared styles for future component library

### 4. **social.css** (unread)
- Social/messaging features (likely for social page)

### 5. **index-luxury.css** (300+ lines)
**Focus**: "Luxury unified shell" - luxury dark theme with glassmorphism

Key Content:
- Dark mode variables (accents in gold/copper)
- Background canvas and overlay system
- Sidebar definition (`.lux-shell` - 238px wide)
- Light mode color scheme
- Panel alpha control for transparency
- Unified styling for all components in luxury shell mode
- Button gradients with luxury accents
- Input/select dark styling

```css
body.lux-unified-shell:is(.role-professor, .role-ta, .role-admin, .role-student_service) {
    background: 
        linear-gradient(180deg, 
            rgba(14,20,33,calc(var(--lux-panel-alpha) * 0.94)), 
            rgba(8,12,21,calc(var(--lux-panel-alpha) * 0.72))
        );
    backdrop-filter: blur(24px) saturate(145%);
}
```

---

## 🎬 JavaScript Architecture

### 1. **core.js** (Boot Loader)
**Purpose**: Dynamically loads all other JS files in correct order

```javascript
const scriptPaths = [
    'app/app.js',           // Bootstrap & compatibility
    'app/api.js',           // API layer
    'app/auth.js',          // Authentication
    'data/initial-state.js',    // Empty-state bootstrap
    'app/state.js',         // State management
    'shared/faculty.js',    // Faculty utils
    'shared/messenger.js',  // Messaging
    'shared/utilities.js',  // Helpers
    'features/navigation.js',
    'features/ui.js',
    'pages/gradebook.js',
    // + 6 more page modules
];
```

**Loading Strategy**:
- Sequential loading (`script.async = false`)
- Maintains order dependency
- Injects scripts into document head

### 2. **app.js** (Compatibility & Bootstrap)
**Functions**:

| Function | Purpose |
|----------|---------|
| `schedulePortalBackendBootstrap()` | Initialize backend bootstrap |
| `syncPortalBackendImpersonation()` | Sync admin-only role impersonation state |
| `fetchPortalPlatformStatus()` | Get platform health |
| `resetRoleSwitchViewState()` | Clear temp UI state on role switch |
| `clearTemporarySocialNavGlow()` | Remove social nav highlights |
| `syncProfessorNavActiveState()` | Update prof nav active item |
| `ensureFacultyExamsNavLink()` | Add exams nav if missing |
| `refreshStandalonePageContext()` | Update page context |
| `consumePendingSocialReturn()` | Handle social return navigation |

**State Fallbacks**: All functions have NOOP fallbacks if not defined

### 3. **navigation.js** (Route Management)
**Key Variables**:

```javascript
let _domCache = {
    pageSections: null,           // Cached page divs
    allNavItems: null,            // Cached nav items
    lastPageId: null,             // Previous page
    lastRenderedPages: new Set()  // Render tracking
};
```

**Key Functions**:

| Function | Purpose |
|----------|---------|
| `getActivePageId()` | Get current page ID |
| `navigate(pageId)` | Switch page section |
| `ensureRuntimeForPage(pageId)` | Lazy-load runtime modules |
| `markPortalShellReady()` | Remove loading state |
| `runDeferredPortalStartup()` | Execute post-load logic |

**Page Categories**:
```javascript
REGISTRATION_RUNTIME_PAGES = new Set([
    'gradebook', 'lms', 'programs', 'registration', 'study-card', 'timetable'
]);

SOCIAL_RUNTIME_PAGES = new Set([
    'exams', 'faculty-schedule', 'orders', 'social'
]);
```

### 4. **ui.js** (UI Interactions)
**Key Functions**:

```javascript
function toggleProfileMenu(event)           // Profile dropdown toggle
function switchCalendarTab(tab)             // Calendar tab switching
function renderCalendarPage()               // Calendar month renderer
function renderCalendarMonth()              // Grid-based calendar
function openModal(type, title, body)       // Show modal
function closeAllModals(event)              // Close modal overlay
function switchRole(value)                  // Role switching
function switchFacultyTheme(value)          // Faculty switching
```

### 5. **Calendar Module Deep Dive**

#### Calendar Renderer Flow

```javascript
function renderCalendarPage() {
    // 1. Get calendar root element
    const root = document.getElementById('calendar-root');
    
    // 2. Determine user role
    const role = getEffectiveUserRole();
    
    // 3. Gather data
    const announcements = KIU_STATE.announcements.slice(0, 12);
    const events = KIU_STATE.events.slice(0, 20);
    const profList = getAllStaff('professors', null).slice(0, 12);
    
    // 4. Build month view with:
    //    - Month/year header with navigation
    //    - 7-column grid (Sun-Sat)
    //    - Event indicators per day
    //    - Color coding by event type
    
    // 5. Build tabs for:
    //    - Calendar (month view)
    //    - Announcements (table)
    //    - Events (card list)
    //    - Office Hours (prof availability)
}
```

#### Calendar Structure
```
┌─────────────────────────────────────┐
│ Hero: Academic Calendar             │
├─────────────────────────────────────┤
│ [Tabs: Cal | Ann | Events | Hours]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Month Navigation                 │ │
│ │ [< April 2026 >]                 │ │
│ ├─────────────────────────────────┤ │
│ │ Grid 7×6 (Month View)            │ │
│ │ - Date cells (80px height)       │ │
│ │ - Event badges (colored)         │ │
│ │ - Today highlight (blue circle)  │ │
│ └─────────────────────────────────┘ │
│ - Announcements Tab                  │
│ - Events Tab                         │
│ - Office Hours (Prof table)          │
└─────────────────────────────────────┘
```

#### Calendar Day Cell HTML
```html
<div style="
    padding: 6px 8px;
    min-height: 80px;
    border: 1px solid #f0f0f0;
    background: ${isToday ? '#eff6ff' : 'white'};
">
    <div style="
        font-size: 13px;
        font-weight: 700;
        color: ${isToday ? 'var(--kiu-blue)' : 'var(--kiu-text-main)'};
        ${isToday ? 'background: var(--kiu-blue); color: white; border-radius: 50%;' : ''}
    ">${dayNumber}</div>
    ${dayEvts.map(ev => `
        <div style="
            margin-top: 3px;
            padding: 2px 5px;
            background: ${ev.color || '#dbeafe'};
            color: ${ev.textColor || '#1e40af'};
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        ">${ev.title}</div>
    `).join('')}
</div>
```

---

## 🛠️ KEY FUNCTIONS & LOGIC

### Role Switching Logic

```javascript
// UI Display Control
function switchRole(newRole) {
    // Update visual role
    document.body.className = document.body.className
        .replace(/role-\w+/, `role-${newRole}`);
    
    // Control visibility
    document.querySelectorAll('.only-professor').forEach(el => {
        el.style.display = (newRole === 'professor') ? 'block' : 'none';
    });
    
    // Store state
    localStorage.setItem('KIU_USER_ROLE', newRole);
    
    // Reset navigation state
    if (typeof resetRoleSwitchViewState === 'function') {
        resetRoleSwitchViewState();
    }
    
    // Force home page for certain transitions
    localStorage.setItem('KIU_FORCE_HOME_ON_ROLE_SWITCH', '1');
}
```

### Faculty Switching Logic

```javascript
function switchFacultyTheme(facultyCode) {
    // 1. Validate faculty
    const validFaculties = ['ECON', 'CS', 'LAW', 'MED', 'ARTS'];
    if (!validFaculties.includes(facultyCode)) return;
    
    // 2. Update state
    if (typeof KIU_STATE !== 'undefined') {
        KIU_STATE.currentFaculty = facultyCode;
    }
    
    // 3. Load faculty profile
    const profile = getFacultyProfile(facultyCode);
    
    // 4. Apply faculty colors/theme
    applyFacultyTheme(profile);
    
    // 5. Update dropdowns
    document.getElementById('faculty-select').value = facultyCode;
}
```

### Modal System

**Modal Types**:
1. Announcement
2. Event
3. Syllabus (file downloads)
4. Programs (curriculum selector)
5. Add Concentration Subject
6. Add Minor Subject
7. Scheduler (Teams-style)

**Modal Functions**:
```javascript
function openModal(type, title, body) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(`modal-${type}`);
    
    // Set content
    document.getElementById(`modal-${type}-title`).textContent = title;
    document.getElementById(`modal-${type}-body`).innerHTML = body;
    
    // Show
    overlay.style.display = 'flex';
    modal.style.display = 'block';
}

function closeAllModals(event) {
    event?.stopPropagation?.();
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'none';
    overlay.querySelectorAll('.modal-content').forEach(m => {
        m.style.display = 'none';
    });
}
```

---

## 📊 PAGES & VIEWS

### Student Pages

| Page | ID | Icon | Render Function |
|------|--|----|-----------------|
| Home | `page-home` | — | Dynamic (luxury shell) |
| Calendar | `page-calendar` | 📅 | `renderCalendarPage()` |
| LMS | `page-lms` | 📚 | `renderLMSSubjects()` |
| Social | `page-social` | 💬 | Social module |
| Personal Data | `page-personal-data` | 👤 | — |
| E-Chancellery | `page-chancellery` | 🖥️ | `renderChancelleryPage()` |
| Student Service | `page-student-service` | 🎧 | `renderStudentServicePage()` |
| Programs | `page-programs` | 📄 | Modal selector |
| Study Card | `page-study-card` | 🎓 | `renderStudyCard()` |
| Registration | `page-registration` | ✅ | — |
| Timetable | `page-timetable` | 📋 | `renderTimetable()` |

### Professor Pages

| Page | Display | Function |
|------|---------|----------|
| Teaching Matrix | `navigate('home')` | Gradebook view |
| My Schedule | `navigate('faculty-schedule')` | Calendar + schedule |
| Library Reference | `navigate('library')` | Syllabus download center |
| Orders | `navigate('orders')` | Orders inbox |
| Social | `navigate('social')` | Messaging |
| Exams | `navigate('exams')` | Exam management |

### Admin Pages

| Page | Permissions |
|------|------------|
| Admin Tools | Full system access |
| Admin Scheduler | Batch operations |
| Staff Management | Staff CRUD |
| Students Management | Student CRUD |
| Admin Library | Content management |
| Admin Orders | Order management |
| Profile View | System profile |

---

## 🔐 RBAC (Role-Based Access Control)

### CSS-Based Access Control

```css
.only-professor { display: none !important; }
.role-professor .only-professor { display: block !important; }

.only-student { display: none !important; }
.role-student .only-student { display: block !important; }

.only-admin { display: none !important; }
.role-admin .only-admin { display: block !important; }
```

### JavaScript-Based Access Control

```javascript
const USER_ROLES = {
    STUDENT: 'student',
    PROFESSOR: 'professor',
    TA: 'ta',
    ADMIN: 'admin',
    STUDENT_SERVICE: 'student_service'
};

function getEffectiveUserRole() {
    // Returns current role (may override stored role)
}

function hasRolePermission(requiredRole) {
    return getEffectiveUserRole() === requiredRole;
}
```

---

## 🎨 COLOR CHANGING SYSTEM

### Theme Application Flow

```
User Action (Faculty Select / Role Switch)
    ↓
switchFacultyTheme() / switchRole()
    ↓
Update KIU_STATE.currentFaculty / currentUserRole
    ↓
Apply CSS Variable Overrides via JavaScript
    ↓
Update HTML Data Attributes (data-faculty, data-role)
    ↓
CSS Recomputes with New Variables
    ↓
UI Refreshes with New Colors
```

### Color Override Pattern

```javascript
// Direct CSS variable manipulation
function applyFacultyColors(facultyCode) {
    const colors = {
        'ECON': { primary: '#0A84FF', accent: '#FF9500' },
        'CS': { primary: '#5c90f5', accent: '#34C759' },
        'LAW': { primary: '#0B192C', accent: '#c67a3d' },
        'MED': { primary: '#a4262c', accent: '#d8aa56' },
        'ARTS': { primary: '#c8822a', accent: '#fbfaf6' }
    };
    
    const palette = colors[facultyCode];
    document.documentElement.style.setProperty('--kiu-blue', palette.primary);
    document.documentElement.style.setProperty('--kiu-accent', palette.accent);
}
```

---

## 🚀 INITIALIZATION & LOADING FLOW

### Page Load Sequence

```
1. DOM Parse
   ↓
2. CSS Load
   ├── base.css (variables, RBAC)
   ├── layout.css (layout)
   ├── components.css (stubs)
   ├── social.css (social styles)
   └── index-luxury.css (luxury theme)
   ↓
3. HTML Ready
   ├── <body class="kiu-shell-loading"> (shows loading state)
   ├── All content hidden (visibility: hidden;)
   └── "Loading workspace..." displayed
   ↓
4. JavaScript Bootstrap
   ├── core.js (loaded inline)
   ├── core.js injects script chain
   ├── Sequential script loading (app → api → auth → etc.)
   └── Each script initializes sequentially
   ↓
5. Runtime Startup
   ├── Check dependency readiness
   ├── isPortalStartupDependencyReady() validates
   ├── Lazy-load registration/social modules if needed
   └── runDeferredPortalStartup()
   ↓
6. Shell Ready
   ├── Remove 'kiu-shell-loading' class
   ├── Set visibility: visible
   ├── Render active page
   ├── Apply role/faculty theme
   └── markPortalShellReady()
```

### Deferred Startup Hooks

```javascript
function runDeferredPortalStartup() {
    // 1. Check for pending runtime modules
    const runtimePromise = ensureRuntimeForPage(activePageId);
    if (runtimePromise) {
        runtimePromise.then(() => runDeferredPortalStartup());
        return;
    }
    
    // 2. Handle role-switch pending navigation
    if (localStorage.getItem('KIU_FORCE_HOME_ON_ROLE_SWITCH') === '1') {
        navigate('home');
        markPortalShellReady();
        return;
    }
    
    // 3. Handle pending admin page navigation
    const pendingAdminPage = localStorage.getItem('KIU_PENDING_ADMIN_PAGE');
    if (pendingAdminPage) {
        navigate(pendingAdminPage);
    }
    
    // 4. Handle return from social
    if (consumePendingSocialReturn()) {
        markPortalShellReady();
        return;
    }
    
    markPortalShellReady();
}
```

---

## 🎨 BACKGROUND & GRADIENTS

### Shell Background System

```css
body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
        /* Accent glow at top-left (blue or gold) */
        radial-gradient(circle at 16% 10%, 
            rgba(var(--lux-accent-rgb), 0.08), 
            transparent 30%),
        
        /* Secondary glow at bottom-right (warm tone) */
        radial-gradient(circle at 84% 84%, 
            rgba(var(--lux-home-secondary-rgb), 0.08), 
            transparent 24%),
        
        /* Main gradient (light to cooler) */
        linear-gradient(180deg, 
            rgba(255,255,255,0.01), 
            transparent 38%);
}
```

### Admin Dark Shell

```css
body.role-admin {
    background:
        radial-gradient(circle at 16% 10%, 
            rgba(0, 71, 143, 0.16),      /* Deep blue glow */
            transparent 30%),
        
        radial-gradient(circle at 84% 84%, 
            rgba(216, 170, 86, 0.10),    /* Gold glow */
            transparent 24%),
        
        linear-gradient(180deg, 
            rgba(10, 15, 24, 0.96), 
            rgba(5, 8, 14, 0.99));       /* Dark navy to almost black */
}
```

### Header Background

```css
header {
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

body.role-admin header {
    background: rgba(8, 13, 22, 0.88);
    border-bottom-color: rgba(255, 255, 255, 0.08);
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints & Sizing

```css
/* Max Content Width */
main, header, nav {
    width: min(1520px, calc(100% - 28px));
    margin: 0 auto;
}

/* Container Queries (modern approach) */
body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;
    overflow-y: auto;
}

/* Sidebar Width (Luxury Mode) */
#lux-shell {
    --lux-sidebar-width: 238px;
    width: var(--lux-sidebar-width);
}
```

### Mobile Adjustments

```css
/* Sticky header remains fixed */
header {
    position: sticky;
    top: 0;
    z-index: 1000;
}

/* Nav items wrap on small screens */
#top-nav {
    overflow-x: auto;
    scroll-behavior: smooth;
}
```

---

## 🔧 ADVANCED FEATURES

### 1. Faculty Profile System
```javascript
const facultyProfiles = {
    'ECON': { 
        name: 'Management',
        professors: [ { name, email, office } ],
        tas: [ { name, email } ],
        programs: [ { code, name, credits } ]
    },
    // 4 more faculties...
};
```

### 2. Schedule/Calendar Integration
```javascript
KIU_STATE.schedules = {
    'user-123': [
        { courseId: 'CS101', time: 'Mon 10:00', room: 'A-101' },
        // More classes...
    ]
};

KIU_STATE.calendarEvents = {
    '2026-04': [
        { date: '2026-04-15', title: 'Midterm Exam', color: '#FF9500' },
        // More events...
    ]
};
```

### 3. Transparent Mode Control
```css
--lux-transparency-mode: on;      /* Can be turned on/off */
--lux-panel-alpha: 0.94;          /* Adjustable opacity */
--lux-glass-alpha: 0.48;          /* Glass effect strength */
```

### 4. Lazy Loading Pattern
```javascript
const REGISTRATION_RUNTIME_PAGES = new Set([...]);
const SOCIAL_RUNTIME_PAGES = new Set([...]);

function ensureRuntimeForPage(pageId) {
    const loaders = [];
    if (REGISTRATION_RUNTIME_PAGES.has(pageId)) {
        loaders.push(ensurePortalRegistrationRuntimeLoaded());
    }
    if (SOCIAL_RUNTIME_PAGES.has(pageId)) {
        loaders.push(ensurePortalSocialRuntimeLoaded());
    }
    return loaders.length ? Promise.all(loaders) : null;
}
```

---

## 🎯 KEY TAKEAWAYS

### Design Philosophy
- **Luxury & Professional**: Gold accents, glass morphism, high contrast
- **Accessibility**: Multiple themes (light/dark), high readability
- **Role-aware**: Different UIs for student/professor/admin
- **Performance**: Deferred loading, DOM caching, CSS variables

### Technical Stack
- **HTML5**: Semantic structure
- **CSS3**: Variables, gradients, backdrop-filter, grid
- **Vanilla JavaScript**: No frameworks, pure DOM manipulation
- **State Management**: localStorage + global KIU_STATE object

### Color & Theme System
- **3 Primary Themes**: Light (default), Dark (luxury), Admin Dark
- **Faculty System**: 5 faculties with switchable themes
- **CSS Variable Inheritance**: Easy theme switching without page reload
- **Glass Morphism**: Modern blur/transparency effects

### Navigation & Routing
- **SPA-like**: Client-side page switching
- **No page reloads**: State preserved in memory
- **Lazy loading**: Modules load on demand
- **History**: localStorage tracks pending navigation

