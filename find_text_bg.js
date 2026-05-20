const fs = require('fs');
const path = require('path');

function searchCssFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchCssFiles(fullPath);
        } else if (fullPath.endsWith('.css') || fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Look for any reference to background on specific elements
            const classesToFind = ['sch-stat-label', 'sch-rail-kicker', 'sch-rail-section-title', 'FACULTY STAFFING', 'Select Recipients'];
            for (const cls of classesToFind) {
                if (content.includes(cls)) {
                    console.log(`Found ${cls} in ${fullPath}`);
                    // print context lines
                    const lines = content.split('\n');
                    for(let i = 0; i < lines.length; i++) {
                        if (lines[i].includes(cls)) {
                            console.log(`Line ${i}: ${lines[i-2]}`);
                            console.log(`Line ${i}: ${lines[i-1]}`);
                            console.log(`Line ${i}: ${lines[i]}`);
                            console.log(`Line ${i}: ${lines[i+1]}`);
                            console.log(`Line ${i}: ${lines[i+2]}`);
                            console.log('---');
                        }
                    }
                }
            }
        }
    }
}

searchCssFiles(path.join(__dirname, 'assets'));
searchCssFiles(__dirname);
