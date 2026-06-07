const fs = require('fs');

const filePath = 'd:/mock yo - Copy/registration.html';
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '<div class="content-box surface-card" style="border-top-left-radius: 0; border-top-right-radius: 0;">';
const endMarker = '<!-- ECTS Sticky Footer -->';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `${startMarker}\n                <div id="student-reg-content-container" style="padding: 20px;">\n                    <!-- Dynamically rendered via the split registration runtime -->\n                </div>\n            </div>\n\n            `;
    
    // String split
    const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully replaced content.');
} else {
    console.log('Markers not found!');
}
