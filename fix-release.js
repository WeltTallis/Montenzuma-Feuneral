const fs = require('fs');
const path = require('path');
const f = path.join('FrontendClient', 'client', 'src', 'components', 'releaseform', 'ReleaseFormPage.jsx');
let c = fs.readFileSync(f, 'utf8');

// Remove the second BarcodeWrapper declaration (the old one with more styling)
const parts = c.split('const Barcode = ({ value }) => {');
if (parts.length > 1) {
  // Find and remove the old BarcodeWrapper before the Barcode component
  const beforeBarcode = parts[0];
  const afterBarcode = parts.slice(1).join('const Barcode = ({ value }) => {');
  
  // Remove the old BarcodeWrapper definition
  const cleaned = beforeBarcode.replace(/const BarcodeWrapper = styled.div`[\s\S]*?`;

\/\/ â.*?bwip-js Barcode Component â.*?
/, '');
  
  c = cleaned + 'const Barcode = ({ value }) => {' + afterBarcode;
}

fs.writeFileSync(f, c);
console.log('Fixed duplicate BarcodeWrapper');
