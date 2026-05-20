const fs = require('fs');

function extractRules(file, selectors) {
    const css = fs.readFileSync(file, 'utf8');
    const regex = /([^\{\}]+)\{([^}]+)\}/gi;
    let match;
    while ((match = regex.exec(css)) !== null) {
        const sel = match[1].trim();
        const rules = match[2].trim();
        for (const s of selectors) {
            if (sel.includes(s)) {
                console.log('--- ' + sel + ' ---');
                console.log(rules);
            }
        }
    }
}

extractRules('assets/css/index-luxury.css', ['sch-stat-label', 'sch-rail-kicker', 'sch-rail-section-title', 'lux-card-title', 'lux-card-copy']);
extractRules('admin-scheduler.html', ['sch-stat-label', 'sch-rail-kicker', 'sch-rail-section-title', 'lux-card-title', 'lux-card-copy']);
