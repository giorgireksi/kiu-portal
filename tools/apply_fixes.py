import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Inter Font and Fix missing semicolons or classnames
html = html.replace(
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet">'
)
# Add some subtle background effect to body
html = html.replace('<body>', '<body style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%); min-height: 100vh;">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update script.js
with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix switchRegTab Semicolon TypeError
js = js.replace(
    "event.target.classList.add('active');['program', 'free', 'concentration', 'minor', 'history', 'selected'].forEach",
    "event.target.classList.add('active');\n    ['program', 'free', 'concentration', 'minor', 'history', 'selected'].forEach"
)

# Fix JS Faculty alignment issue
# "const faculty = document.getElementById('admin-generate-faculty').value;"
# Replace with mapping "const rawFac = ...; const facMap = {'cs':'Computer Science', 'mgt':'Business Management'}; const faculty = facMap[rawFac] || rawFac;"
js = js.replace(
    "const faculty = document.getElementById('admin-generate-faculty').value;",
    "const rawFac = document.getElementById('admin-generate-faculty').value; const facMap = {'cs':'Computer Science', 'mgt':'Business Management'}; const faculty = facMap[rawFac] || rawFac;"
)

# Safely handle value in updateGrade
js = js.replace(
    "if (['I', 'M', 'W'].includes(val.toUpperCase())) {",
    "if (['I', 'M', 'W'].includes(String(val).toUpperCase())) {"
)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Update styles.css
with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Swap Variables
css = css.replace(
    ":root {\n    --kiu-blue: #00a3e0;\n    --kiu-dark-blue: #0088cc;\n    --kiu-navy: #002147;\n    --kiu-bg: #f4f7f6;\n    --kiu-text-main: #333333;\n    --kiu-text-muted: #777777;\n    --kiu-border: #e0e0e0;\n    --kiu-white: #ffffff;\n    --kiu-green: #28a745;\n    --kiu-red: #dc3545;\n    --kiu-orange: #f39c12;\n    --kiu-table-header: #f8f9fa;\n}",
    """:root {
    --kiu-blue: #0A84FF;
    --kiu-dark-blue: #005CE6;
    --kiu-navy: #0B192C;
    --kiu-bg: transparent;
    --kiu-text-main: #1e293b;
    --kiu-text-muted: #64748b;
    --kiu-border: rgba(226, 232, 240, 0.6);
    --kiu-white: rgba(255, 255, 255, 0.75);
    --kiu-solid-white: #ffffff;
    --kiu-green: #34C759;
    --kiu-red: #FF3B30;
    --kiu-orange: #FF9500;
    --kiu-table-header: rgba(248, 250, 252, 0.6);
    --kiu-gradient-blue: linear-gradient(135deg, #0A84FF 0%, #005CE6 100%);
    --kiu-shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    --kiu-shadow-md: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    --kiu-shadow-blue: 0 8px 24px rgba(10, 132, 255, 0.35);
    --kiu-glass-blur: blur(16px);
}"""
)

# Fix Font Family
css = css.replace(
    "font-family: 'Noto Sans Georgian', sans-serif;",
    "font-family: 'Inter', 'Noto Sans Georgian', sans-serif;"
)

# Header Glassmorphism
css = css.replace(
    "background-color: var(--kiu-white);\n    height: 70px;",
    "background: rgba(255, 255, 255, 0.85);\n    backdrop-filter: var(--kiu-glass-blur);\n    -webkit-backdrop-filter: var(--kiu-glass-blur);\n    height: 70px;"
)

# Background changes
css = css.replace("background-color: var(--kiu-bg);", "")

# Content Box upgrades
css = css.replace(
    "border-radius: 6px;\n    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);",
    "border-radius: 16px;\n    box-shadow: var(--kiu-shadow-md);\n    background: rgba(255, 255, 255, 0.85);\n    backdrop-filter: var(--kiu-glass-blur);\n    border: 1px solid rgba(255, 255, 255, 0.4);"
)

# Buttons
css = css.replace(
    "border-radius: 20px;\n    height: 170px;",
    "border-radius: 24px;\n    height: 170px;\n    background: rgba(255, 255, 255, 0.85);\n    backdrop-filter: var(--kiu-glass-blur);\n    border: 1px solid rgba(255, 255, 255, 0.5);"
)
css = css.replace(
    "box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);\n    transition: all 0.2s;",
    "box-shadow: var(--kiu-shadow-sm);\n    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth spring */"
)
css = css.replace(
    "transform: translateY(-5px);\n    box-shadow: 0 8px 20px rgba(0, 163, 224, 0.15);",
    "transform: translateY(-8px) scale(1.02);\n    box-shadow: var(--kiu-shadow-blue);\n    border-color: rgba(10, 132, 255, 0.3);"
)

# KIU Blue Buttons
css = css.replace(
    "background-color: var(--kiu-blue);\n    color: white;\n    border: none;\n    padding: 8px 16px;\n    border-radius: 4px;",
    "background: var(--kiu-gradient-blue);\n    color: white;\n    border: none;\n    padding: 10px 20px;\n    border-radius: 8px;\n    box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);"
)
css = css.replace(
    "background-color: var(--kiu-dark-blue);",
    "transform: translateY(-2px);\n    box-shadow: 0 6px 16px rgba(10, 132, 255, 0.45); /* Pop effect */"
)

# Modals
css = css.replace(
    "background: white;\n    border-radius: 6px;",
    "background: rgba(255, 255, 255, 0.92);\n    backdrop-filter: var(--kiu-glass-blur);\n    border-radius: 20px;\n    border: 1px solid rgba(255,255,255,0.5);"
)
css = css.replace(
    "animation: modalSlideIn 0.3s ease;",
    "animation: modalSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Springy bounce */"
)
css = re.sub(r'transform: translateY\(-20px\);\s*opacity: 0;', 'transform: translateY(40px) scale(0.95);\n        opacity: 0;', css)
css = re.sub(r'transform: translateY\(0\);\s*opacity: 1;', 'transform: translateY(0) scale(1);\n        opacity: 1;', css)

# Tables Glassmorphism
css = css.replace(
    "background-color: var(--kiu-table-header);",
    "background: var(--kiu-table-header);\n    backdrop-filter: blur(8px);"
)

# LMS Cards
css = css.replace(
    "background: var(--kiu-white);\n    border-radius: 10px;",
    "background: rgba(255, 255, 255, 0.85);\n    backdrop-filter: var(--kiu-glass-blur);\n    border-radius: 16px;\n    border: 1px solid rgba(255,255,255,0.5);"
)

# Write CSS back
with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Patch applied successfully.")
