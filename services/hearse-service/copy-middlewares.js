const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../app-global/middlewares');
const targetDir = path.join(__dirname, 'dist/services/app-global/middlewares');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
    'authMiddleware.js',
    'corsMiddleware.js',
    'errorHandler.js',
    'securityMiddleware.js',
    'serviceDiscovery.js',
    'tenant-validation.js',
    'tenantMiddleware.js'
];

// Copy each file
filesToCopy.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);
    
    if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        console.log(`Copied: ${file}`);
    } else {
        console.warn(`Warning: ${file} not found in source directory`);
    }
});

// Copy .d.ts files if they exist
const dtsFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.d.ts'));
dtsFiles.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Copied: ${file}`);
});

console.log('Middleware files copied successfully!');