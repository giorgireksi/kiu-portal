import os
import glob

FLAG_TOGGLE = '''
<div class="lang-switcher" style="margin-right: 15px; cursor: pointer; display: flex; align-items: center;" title="Change Language">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Flag_of_Georgia.svg/20px-Flag_of_Georgia.svg.png" alt="GE" style="border: 1px solid #ccc; border-radius: 2px;">
</div>
'''

directory = "/home/reksi/Desktop/mock yo"
files = glob.glob(os.path.join(directory, "*.html"))

for file_path in files:
    if "originalkiewebsite" in file_path:
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    if "lang-switcher" not in html:
        html = html.replace(
            '<div class="user-dropdown-trigger',
            FLAG_TOGGLE + '\n            <div class="user-dropdown-trigger'
        )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html)

print("Successfully injected flag toggle to all HTML files.")
