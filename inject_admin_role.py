import glob

html_files = glob.glob('/home/reksi/Desktop/mock yo/*.html')
for file in html_files:
    if "originalkiewebsite" in file: continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<option value="admin">' not in content:
        content = content.replace('<option value="professor">Professor View</option>', '<option value="professor">Professor View</option>\n                    <option value="admin">Admin View</option>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
print("Admin option injected globally.")
