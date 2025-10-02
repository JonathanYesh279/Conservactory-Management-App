// Script to fix PersonalInfoTab.tsx by adding import and replacing hardcoded locations
const fs = require('fs');
const path = require('path');

const filePath = 'src/features/orchestras/details/components/tabs/PersonalInfoTab.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add import statement after existing imports
const importStatement = "import { VALID_LOCATIONS } from '../../../../../constants/locations'";
const importPattern = /import { useAuth } from '..\/..\/..\/..\/..\/services\/authContext'/;
content = content.replace(importPattern, `$&\n${importStatement}`);

// Replace the hardcoded locations dropdown
const oldLocationOptions = `                <option value="">בחר מיקום</option>
                <option value="אולם ערן">אולם ערן</option>
                <option value="סטודיו קאמרי 1">סטודיו קאמרי 1</option>
                <option value="סטודיו קאמרי 2">סטודיו קאמרי 2</option>
                <option value="אולפן הקלטות">אולפן הקלטות</option>
                <option value="חדר חזרות 1">חדר חזרות 1</option>
                <option value="חדר חזרות 2">חדר חזרות 2</option>
                <option value="חדר מחשבים">חדר מחשבים</option>
                {Array.from({length: 26}, (_, i) => (
                  <option key={i} value={\`חדר \${i + 1}\`}>חדר {i + 1}</option>
                ))}
                <option value="חדר תאוריה א">חדר תאוריה א</option>
                <option value="חדר תאוריה ב">חדר תאוריה ב</option>`;

const newLocationOptions = `                <option value="">בחר מיקום</option>
                {VALID_LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}`;

content = content.replace(oldLocationOptions, newLocationOptions);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed PersonalInfoTab.tsx successfully!');
