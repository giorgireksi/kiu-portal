const fs = require('fs');
const path = require('path');
const {
    SHELL_PAGES,
    SHARED_SHELL_ASSETS,
    ROUTE_CLEARANCE_CSS,
    CHROME_BUST
} = require('./chrome-clearance-manifest.js');

function bumpAssetVersion(html, assetPath) {
    const escaped = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${escaped}\\?v=[^"'\\s>]+`, 'g');
    return html.replace(re, `${assetPath}?v=${CHROME_BUST}`);
}

for (const page of SHELL_PAGES) {
    const filePath = path.join(__dirname, '..', page);
    let html = fs.readFileSync(filePath, 'utf8');
    for (const asset of SHARED_SHELL_ASSETS) {
        if (html.includes(asset)) html = bumpAssetVersion(html, asset);
    }
    for (const asset of ROUTE_CLEARANCE_CSS) {
        if (html.includes(asset)) html = bumpAssetVersion(html, asset);
    }
    fs.writeFileSync(filePath, html);
}

console.log(`Bumped ${SHELL_PAGES.length} shell pages to ${CHROME_BUST}`);