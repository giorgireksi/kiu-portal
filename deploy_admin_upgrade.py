import glob
import re

print("Applying Admin UI upgrades...")

# 1. Update global CSS
css_appends = """
/* =========================================
   ADMIN INTERFACE UPGRADES
   ========================================= */
/* Strict Role Separation: Hide student links from Admin */
.role-admin .only-student { 
    display: none !important; 
}

/* Premium Admin Dashboard Styling override */
.only-admin .content-box {
    background: rgba(255, 255, 255, 0.85) !important;
    border: 1px solid rgba(255, 255, 255, 0.5) !important;
    box-shadow: var(--kiu-shadow-md) !important;
    border-radius: 20px !important;
    backdrop-filter: var(--kiu-glass-blur);
}

.only-admin h3 {
    font-size: 16px !important;
    font-weight: 700 !important;
    color: var(--kiu-navy) !important;
}

#top-nav .nav-item.only-admin {
    background: rgba(10, 132, 255, 0.1);
    border-radius: 8px;
    padding: 10px 15px;
    margin: 5px;
}
"""

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css_appends)

# 2. Update HTML Files globally
html_files = glob.glob('*.html')
student_nav_ids = [
    'nav-calendar', 'nav-lms', 'nav-personal-data', 'nav-chancellery', 
    'nav-programs', 'nav-study-card', 'nav-registration', 'nav-timetable'
]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step A: Enforce 'only-student' class on the target nav items
    for nav_id in student_nav_ids:
        # Regex to match exactly `<div class="nav-item" id="nav_id"`
        content = re.sub(
            fr'<div class="nav-item" id="{nav_id}"',
            f'<div class="nav-item only-student" id="{nav_id}"',
            content
        )
    
    # Step B: Upgrade the 'nav-admin-scheduler' button UI inside nav
    content = content.replace(
        '<div class="nav-item only-admin" id="nav-admin-scheduler" onclick="navigate(\'admin-scheduler\')"><i class="fas fa-calendar-plus"></i> Master Scheduler</div>',
        '<div class="nav-item only-admin" id="nav-admin-scheduler" onclick="navigate(\'admin-scheduler\')" style="color: var(--kiu-blue); font-weight: bold;"><i class="fas fa-calendar-plus"></i> Master Scheduler</div>'
    )
    
    # Step C: Index.html specific Curriculum CMS aesthetic upgrades
    if file == 'index.html':
        # Replace the hard navy header with the new vibrant gradient
        content = content.replace(
            'background: var(--kiu-navy); color: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);',
            'background: var(--kiu-gradient-blue); color: white; padding: 20px; border-radius: 20px; box-shadow: var(--kiu-shadow-blue); backdrop-filter: var(--kiu-glass-blur); border: 1px solid rgba(255,255,255,0.3);'
        )
        
        # Soften the legacy warning box
        content = content.replace(
            'border: 2px solid #ffeeba; background: #fffcf0;',
            'border: 1px solid rgba(255, 193, 7, 0.3); background: rgba(255, 243, 205, 0.85); backdrop-filter: var(--kiu-glass-blur);'
        )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Admin UI separation patches injected successfully deployed to all HTML documents.")
