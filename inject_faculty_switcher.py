import os
import glob

html_files = glob.glob('/home/reksi/Desktop/mock yo/*.html')

FACULTY_SWITCHER = '''
<div class="faculty-switcher" style="margin-right: 15px; display: flex; align-items: center;" title="Switch University Faculty/Tenant">
    <select id="faculty-select" onchange="switchFacultyTheme(this.value)" style="padding: 5px; border-radius: 4px; border: 1px solid var(--kiu-border); font-size: 12px; font-weight: bold; color: var(--kiu-navy); cursor: pointer; outline: none; background: #f8f9fa;">
        <option value="management">🏫 Management</option>
        <option value="cs">💻 Computer Science</option>
        <option value="law">⚖️ Law</option>
        <option value="medicine">🩺 Medicine</option>
        <option value="arts">🎨 Arts & Humanities</option>
    </select>
</div>
'''

for file in html_files:
    if "originalkiewebsite" in file: continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "faculty-switcher" not in content:
        content = content.replace('<div class="role-switcher"', FACULTY_SWITCHER + '\n            <div class="role-switcher"')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Injected Faculty Switcher globally.")
