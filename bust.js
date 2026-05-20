const fs = require('fs');
const path = require('path');

function updateFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory() && !p.includes('.git') && !p.includes('.gemini') && !p.includes('node_modules')) {
            updateFiles(p);
        } else if (p.endsWith('.html')) {
            let c = fs.readFileSync(p, 'utf8');
            if (c.includes('?v=20260418')) {
                c = c.replace(/\?v=20260418-[a-z0-9]+/g, '?v=' + Date.now());
                fs.writeFileSync(p, c);
                console.log('Updated ' + p);
            }
        }
    }
}
updateFiles(__dirname);
