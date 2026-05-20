import os
import glob
from bs4 import BeautifulSoup

directory = "/home/reksi/Desktop/mock yo/originalkiewebsite"
files = glob.glob(os.path.join(directory, "*.html"))

for file in sorted(files):
    with open(file, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')
    print(f"\n--- {os.path.basename(file)} ---")
    
    nav_links = [a.get_text(strip=True) for a in soup.select('.nav-link, .menu-item, .sidebar a, .topbar a, ul.nav li a')]
    if not nav_links:
        nav_links = [a.get_text(strip=True) for a in soup.find_all('a') if len(a.get_text(strip=True)) > 2]
    print(f"Navigation/Links: {list(dict.fromkeys(nav_links))[:20]}")
    
    headers = [h.get_text(strip=True) for h in soup.find_all(['h1', 'h2', 'h3', 'h4'])]
    print(f"Headers: {list(dict.fromkeys(headers))[:20]}")

    cards = [c.get_text(strip=True) for c in soup.select('.card-header, .panel-heading, .title, .section-title, th')]
    if cards:
        print(f"Card/Table Headers: {list(dict.fromkeys(cards))[:20]}")
