# Projects Section - Main Discovery Page Wireframe

## Layout Overview
The layout utilizes a 3-column responsive grid to eliminate empty spaces on the left and right, providing a rich, dashboard-like discovery experience.

## ASCII Wireframe

```text
+---------------------------------------------------------------------------------------------------+
|  [KIU Social]  |  🔍 Search projects, tags, or members...  |  [+ New Project]  |  [⚙️]  [👤]     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +-------------------------+  +---------------------------------------------------------------+  |
|  | LEFT SIDEBAR (Filters)  |  |                   CENTER (Project Grid)                       |  |
|  |                         |  |                                                               |  |
|  |  📂 My Projects         |  |  +-----------------------+  +-----------------------+         |  |
|  |  • Active (3)           |  |  | 🚀 Project Alpha      |  | 📊 Data Analytics Hub |         |  |
|  |  • Pending Review (1)   |  |  | [Active]              |  | [Recruiting]          |         |  |
|  |                         |  |  | 👥 4/8 Members        |  | 👥 2/5 Members        |         |  |
|  |  🏛️ Faculty            |  |  | [██████░░░░] 60%      |  | [██░░░░░░░░] 20%      |         |  |
|  |  • [x] ECON             |  |  | 🏷️ AI, Research       |  | 🏷️ Stats, Python      |         |  |
|  |  • [ ] Computer Science |  |  | [ View Workspace > ]  |  | [ View Workspace > ]  |         |  |
|  |  • [ ] Engineering      |  |  +-----------------------+  +-----------------------+         |  |
|  |                         |  |                                                               |  |
|  |  🏷️ Skill Tags         |  |  +-----------------------+  +-----------------------+         |  |
|  |  • [ ] Python           |  |  | 🎨 UI/UX Redesign     |  | 🌐 Web Dev Bootcamp   |         |  |
|  |  • [ ] React            |  |  | [Completed]           |  | [Active]              |         |  |
|  |  • [ ] Data Science     |  |  | 👥 5/5 Members        |  | 👥 8/10 Members       |         |  |
|  |                         |  |  | [██████████] 100%     |  | [█████░░░░░] 50%      |         |  |
|  |  📊 Project Status      |  |  | 🏷️ Design, Figma      |  | 🏷️ HTML, CSS, JS      |         |  |
|  |  • [x] Active           |  |  | [ View Workspace > ]  |  | [ View Workspace > ]  |         |  |
|  |  • [ ] Recruiting       |  |  +-----------------------+  +-----------------------+         |  |
|  |  • [ ] Completed        |  |                                                               |  |
|  +-------------------------+  +---------------------------------------------------------------+  |
|                                                                                                   |
|  +-------------------------+  +---------------------------------------------------------------+  |
|  | RIGHT SIDEBAR (Context) |  |                   BOTTOM (Pagination/Load More)               |  |
|  |                         |  |                                                               |  |
|  |  🔥 Trending Projects   |  |  [ Load More Projects... ]                                    |  |
|  |  1. AI Campus Assistant |  |                                                               |  |
|  |  2. Eco-Friendly App    |  |                                                               |  |
|  |                         |  |                                                               |  |
|  |  💡 Recommended For You |  |                                                               |  |
|  |  Based on your skills:  |  |                                                               |  |
|  |  "React", "Node.js"     |  |                                                               |  |
|  |                         |  |                                                               |  |
|  |  📈 Your Contribution   |  |                                                               |  |
|  |  • Active Projects: 3   |  |                                                               |  |
|  |  • Tasks Completed: 12  |  |                                                               |  |
|  |  • Hours Logged: 24h    |  |                                                               |  |
|  +-------------------------+  +---------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

## Component Breakdown

### 1. Top Command Bar
- **Search**: Global search across project names, descriptions, and tags.
- **New Project**: Primary CTA for initiating a new project.
- **View Toggle**: (Optional) Switch between Grid and List views.

### 2. Left Sidebar (Filters & Navigation)
- **My Projects**: Quick access to projects the user owns or is a member of.
- **Faculty**: Filter by academic department (e.g., ECON, CS, Engineering).
- **Skill Tags**: Filter by required or offered skills to find matching projects.
- **Status**: Filter by project lifecycle stage (Active, Recruiting, Completed).

### 3. Center Area (Project Grid)
- **Project Cards**: Rich cards displaying immediate value:
  - Project Name & Icon/Emoji
  - Current Status badge
  - Member count vs. capacity (e.g., 4/8 Members)
  - Visual progress bar
  - Top 2-3 skill tags
  - "View Workspace" action button

### 4. Right Sidebar (Context & Engagement)
- **Trending Projects**: Highlights popular or highly active projects to drive engagement.
- **Recommended For You**: Personalized suggestions based on the user's profile skills and faculty.
- **Your Contribution**: A mini-dashboard showing the user's personal stats within the projects ecosystem.

## Design Improvements Addressed
1. **Eliminated Empty Spaces**: The 3-column layout (Left: ~250px, Center: Flexible, Right: ~280px) utilizes the full viewport width effectively.
2. **Enhanced Discoverability**: Filters on the left and personalized recommendations on the right make it easier for users to find relevant projects.
3. **Rich Card Design**: Project cards now show immediate value (progress, members, tags) without requiring a click, reducing cognitive load.
4. **Glassmorphism Integration**: All sidebars and cards will use the existing `--sn-*` CSS variables from `social-rebuild.css` for consistent frosted glass effects, with `social-projects-lms.css` handling specific card layouts.
