// Script to write the complete redesigned Leave Dashboard
const fs = require('fs');
const path = require('path');

const targetPath = path.join('C:', 'Users', 'User', 'Downloads', 'restpoint', 'FrontendClient', 'client', 'src', 'components', 'leave', 'Dashboard.jsx');

// Read the current file to understand its structure
const currentContent = fs.readFileSync(targetPath, 'utf8');
console.log('Current file length:', currentContent.length);
console.log('First 200 chars:', currentContent.substring(0, 200));