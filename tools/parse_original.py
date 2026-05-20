import os
import glob
from bs4 import BeautifulSoup
import re

directory = "/home/reksi/Desktop/mock yo/originalkiewebsite"
files = glob.glob(os.path.join(directory, "*.html"))

for file in sorted(files):
    print(f"\n--- Analyzing {os.path.basename(file)} ---")
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    title = soup.title.string if soup.title else 'No title'
    print(f"Title: {title.strip()}")
    
    # Extract navigation or menus
    nav_items = set()
    for a in soup.find_all('a', class_=re.compile(r'nav|menu|link', re.I)):
        text = a.get_text(strip=True)
        if text: nav_items.add(text)
    
    # Just grab all link texts that seem important
    important_links = set()
    for el in soup.select('.menu-item, .nav-item, nav a, .sidebar a, header a'):
        txt = el.get_text(strip=True)
        if txt and len(txt) > 2: important_links.add(txt)
        
    print(f"Menu Items: {', '.join(sorted(list(important_links))[:20])}")
    
    # Extract headers
    headers = set()
    for h in soup.find_all(['h1', 'h2', 'h3']):
        htext = h.get_text(strip=True)
        if htext: headers.add(htext)
    
    print(f"Headers: {', '.join(sorted(list(headers))[:20])}")
    
    # Check for specific tables or forms
    tables = soup.find_all('table')
    print(f"Number of tables: {len(tables)}")
    
    # Extract active tab or page indicator if possible
    active = soup.find(class_=re.compile(r'active|current'))
    if active:
        print(f"Active element text: {active.get_text(strip=True)[:50]}")
