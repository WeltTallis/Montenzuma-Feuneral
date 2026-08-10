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

// ============================================
// Copy knex migration files into dist so the built server can run them
// ============================================
const migrationsSourceDir = path.join(__dirname, 'migrations');
const migrationsTargetDir = path.join(__dirname, 'dist/services/hearse-service/migrations');

if (fs.existsSync(migrationsSourceDir)) {
    if (!fs.existsSync(migrationsTargetDir)) {
        fs.mkdirSync(migrationsTargetDir, { recursive: true });
    }
    fs.readdirSync(migrationsSourceDir)
        .filter(f => f.endsWith('.js'))
        .forEach(file => {
            fs.copyFileSync(path.join(migrationsSourceDir, file), path.join(migrationsTargetDir, file));
            console.log(`Copied migration: ${file}`);
        });
} else {
    console.warn('Warning: migrations directory not found in source');
}

// Copy .d.ts files if they exist
const dtsFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.d.ts'));
dtsFiles.forEach(file => {
    const sourceFile = path.join(sourceDir, file);
    const targetFile = path.join(targetDir, file);
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Copied: ${file}`);
});

console.log('Middleware files copied successfully!');