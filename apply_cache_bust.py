import glob
import re
import time

html_files = glob.glob('*.html')
v = str(int(time.time()))

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex replace to append or update query string
    content = re.sub(r'href="styles\.css(\?v=[0-9]+)?"', f'href="styles.css?v={v}"', content)
    content = re.sub(r'src="core\.js(\?v=[0-9]+)?"', f'src="core.js?v={v}"', content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Cache-busting tags added with v={v}")
