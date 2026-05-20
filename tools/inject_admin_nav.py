import glob
import re

html_files = glob.glob('*.html')

admin_nav = """
    <!-- DEDICATED ADMIN NAVIGATION -->
    <nav id="admin-nav" class="only-admin" style="display: flex; background: var(--kiu-navy); height: 75px; justify-content: center; align-items: center; gap: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%;">
        <div class="nav-item" onclick="navigate('home')" style="color: white; padding: 10px; cursor: pointer; text-align: center; border-radius: 8px; transition: 0.2s;"><i class="fas fa-hammer" style="display:block; margin-bottom:5px; font-size:16px;"></i> Curriculum CMS</div>
        <div class="nav-item" onclick="navigate('admin-scheduler')" style="color: var(--kiu-blue); font-weight: bold; padding: 10px; cursor: pointer; text-align: center; border-radius: 8px; transition: 0.2s; background: rgba(255,255,255,0.9);"><i class="fas fa-calendar-plus" style="display:block; margin-bottom:5px; font-size:16px;"></i> Master Scheduler</div>
        <div class="nav-item" onclick="navigate('library')" style="color: white; padding: 10px; cursor: pointer; text-align: center; border-radius: 8px; transition: 0.2s;"><i class="fas fa-book" style="display:block; margin-bottom:5px; font-size:16px;"></i> ბიბლიოთეკა</div>
        <div class="nav-item" onclick="navigate('orders')" style="color: white; padding: 10px; cursor: pointer; text-align: center; border-radius: 8px; transition: 0.2s;"><i class="fas fa-book-open" style="display:block; margin-bottom:5px; font-size:16px;"></i> ბრძანებები</div>
    </nav>
"""

# Update script.js to handle admin-nav
with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Make navigate show admin-nav if role is admin
js = js.replace(
    "const topNav = document.getElementById('top-nav');\n        if (topNav) {\n            topNav.style.display = (pageId === 'home') ? 'none' : 'flex';\n        }",
    "const topNav = document.getElementById('top-nav');\n        const adminNav = document.getElementById('admin-nav');\n        if (topNav) {\n            topNav.style.display = (pageId === 'home') ? 'none' : 'flex';\n        }\n        if (adminNav) {\n            // Always flex for Admin if it exists, CSS .only-admin handles actual visibility\n            adminNav.style.display = 'flex';\n        }"
)
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Make top-nav only-student only-professor
    content = re.sub(r'<nav id="top-nav">', '<nav id="top-nav" class="only-student only-professor">', content)
    
    # Remove the inline nav-admin-scheduler, nav-library and nav-orders from the old top-nav
    content = re.sub(r'<div class="nav-item.*?id="nav-admin-scheduler".*?</div>', '', content)
    content = re.sub(r'<div class="nav-item" id="nav-library".*?</div>', '', content)
    content = re.sub(r'<div class="nav-item" id="nav-orders".*?</div>', '', content)

    # Step 2: Inject admin-nav immediately after </header>
    # If admin-nav is already there, don't duplicate
    if '<nav id="admin-nav"' not in content:
        content = content.replace('</header>', '</header>' + admin_nav)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Dedicated Admin Navigation successfully injected and connected.")
