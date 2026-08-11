const fs = require('fs');
const path = require('path');

const serviceDir = 'D:\\new\\restpoint\\services\\analytics-service';
const controllersDir = path.join(serviceDir, 'controllers');

const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.controller.ts'));

for (const file of controllerFiles) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove asyncHandler import if present
  content = content.replace(/import asyncHandler from 'express-async-handler';\n?/g, '');
  
  // Replace: const func = asyncHandler(async (req: any, res: any): Promise<void> => {
  // With: export const func = async (req: any, res: any): Promise<void> => {
  content = content.replace(
    /const (\w+) = asyncHandler\(async \(req: any, res: any\): Promise<void> => \{/g,
    'export const $1 = async (req: any, res: any): Promise<void> => {'
  );
  
  // Replace: export const func = asyncHandler(async (req: any, res: any): Promise<void> => {
  // With: export const func = async (req: any, res: any): Promise<void> => {
  content = content.replace(
    /export const (\w+) = asyncHandler\(async \(req: any, res: any\): Promise<void> => \{/g,
    'export const $1 = async (req: any, res: any): Promise<void> => {'
  );
  
  // Fix closing: replace `});` with `}` for function endings
  // Pattern: line with only `});` after a function body
  content = content.replace(/\n\}\n\}\);\n(\s*\/\/)/g, '\n}\n$1');
  content = content.replace(/\n\}\n\}\);\n(\s*\/\*)/g, '\n}\n$1');
  content = content.replace(/\n\}\n\}\);\n(\s*const |\s*function |\s*export )/g, '\n}\n$1');
  
  // Handle case where there's no comment after - just next function or EOF
  content = content.replace(/\n\}\n\}\);\n\n/g, '\n}\n\n');
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + file);
}
