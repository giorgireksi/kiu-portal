import glob
import re
import time

print("Deploying Radical Role Interface Distinctions...")

css_injection = """
/* =========================================
   ROLE DISTINCTION ENGINES
   ========================================= */
   
/* 1. PROFESSOR: COMMAND CENTER (Dark Mode, High Density) */
body.role-professor {
    background: #0f172a !important;
    color: #e2e8f0 !important;
}
.role-professor header {
    background: #1e293b !important;
    border-bottom: 2px solid #3b82f6 !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
}
.role-professor header .header-title { color: #f8fafc !important; }
.role-professor header i { color: #94a3b8 !important; }
.role-professor .content-box {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
    padding: 12px 16px !important;
    color: #f8fafc !important;
}
.role-professor .content-box h3 {
    color: #60a5fa !important;
    font-size: 14px !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #334155;
    padding-bottom: 8px;
    margin-bottom: 12px;
}
.role-professor .kiu-table { background: #0f172a; border-color: #334155; }
.role-professor .kiu-table th { 
    background: #020617; 
    color: #94a3b8; 
    border-color: #334155; 
    text-transform: uppercase; 
    font-size: 10px; 
    letter-spacing: 1px;
}
.role-professor .kiu-table td { border-color: #334155; color: #cbd5e1; }
.role-professor .kiu-btn-blue, .role-professor .kiu-btn-outline {
    background: #3b82f6 !important;
    color: white !important;
    border: none !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    padding: 8px 12px !important;
}
nav#prof-nav.only-professor {
    display: flex !important;
}

/* 2. ADMIN: ENTERPRISE ERP (Strict Monochrome, Slim Spacing) */
body.role-admin {
    background: #f1f5f9 !important; /* Flat cool grey */
}
.role-admin header {
    background: #ffffff !important;
    border-bottom: 1px solid #cbd5e1 !important;
    height: 60px !important;
}
.role-admin .content-box {
    background: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 2px !important; /* Sharp corners */
    box-shadow: none !important;
    padding: 12px !important;
}
.role-admin .content-box h3 {
    font-size: 13px !important;
    color: #334155 !important;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
}
.role-admin input, .role-admin select {
    border-radius: 2px !important;
    border: 1px solid #cbd5e1 !important;
    background: #f8fafc !important;
    font-size: 12px !important;
    padding: 6px !important;
}
.role-admin .kiu-btn-blue, .role-admin .kiu-btn-outline {
    border-radius: 2px !important;
    font-size: 11px !important;
    text-transform: uppercase !important;
    padding: 6px 10px !important;
}
nav#admin-nav.only-admin {
    height: 50px !important;
    background: #0f172a !important; /* Extremely dark */
}
.role-admin .dashboard-admin {
    gap: 15px !important; /* Tighter layout */
}
"""

with open('styles.css', 'a', encoding='utf-8') as f:
    f.write(css_injection)

# Read HTML files and inject Navigation
html_files = glob.glob('*.html')
prof_nav = """
    <!-- DEDICATED PROFESSOR NAVIGATION -->
    <nav id="prof-nav" class="only-professor" style="display: none; background: #020617; height: 65px; justify-content: center; align-items: center; gap: 20px; width: 100%; border-bottom: 1px solid #334155;">
        <div class="nav-item" onclick="navigate('home')" style="color: #94a3b8;"><i class="fas fa-th-large" style="display:block; margin-bottom:5px; font-size:16px;"></i> Teaching Matrix</div>
        <div class="nav-item" onclick="navigate('gradebook')" style="color: #60a5fa;"><i class="fas fa-check-double" style="display:block; margin-bottom:5px; font-size:16px;"></i> Gradebook</div>
        <div class="nav-item" onclick="alert('Attendance System Loaded')" style="color: #94a3b8;"><i class="fas fa-user-clock" style="display:block; margin-bottom:5px; font-size:16px;"></i> Attendance</div>
        <div class="nav-item" onclick="navigate('library')" style="color: #94a3b8;"><i class="fas fa-book" style="display:block; margin-bottom:5px; font-size:16px;"></i> Library Reference</div>
    </nav>
"""

v = str(int(time.time()))

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Step 1: Secure #top-nav to only-student
    content = content.replace('<nav id="top-nav" class="only-student only-professor">', '<nav id="top-nav" class="only-student">')
    
    # Step 2: Inject prof-nav
    if 'id="prof-nav"' not in content:
        content = content.replace('</header>', '</header>' + prof_nav)

    # Step 3: Cache Bust
    content = re.sub(r'href="styles\.css(\?v=[0-9]+)?"', f'href="styles.css?v={v}"', content)
    content = re.sub(r'src="script\.js(\?v=[0-9]+)?"', f'src="script.js?v={v}"', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

# Update Script.js DOM logic
with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

js_replacement = """        const adminNav = document.getElementById('admin-nav');
        const profNav = document.getElementById('prof-nav');
        if (topNav) {
            topNav.style.display = (pageId === 'home') ? 'none' : 'flex';
        }
        if (adminNav) {
            adminNav.style.display = 'flex';
        }
        if (profNav) {
            profNav.style.display = 'flex';
        }"""

js = js.replace(
    "const topNav = document.getElementById('top-nav');\n        const adminNav = document.getElementById('admin-nav');\n        if (topNav) {\n            topNav.style.display = (pageId === 'home') ? 'none' : 'flex';\n        }\n        if (adminNav) {\n            // Always flex for Admin if it exists, CSS .only-admin handles actual visibility\n            adminNav.style.display = 'flex';\n        }",
    js_replacement
)

js = re.sub(r'styles\.css(\?v=[0-9]+)?', f'styles.css?v={v}', js)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Roles successfully forked.")
