/* Reads the claim form and reports stylesheet + JSX integrity. */
import { readFileSync } from 'node:fs';
import { parse } from '@babel/parser';

const P =
  'C:/Users/User/Downloads/restpoint/FrontendClient/client/src/modules/insurance/amani/claimAplication.jsx';

const src = readFileSync(P, 'utf8');
const css = src.split('const styles = `')[1].split('`;')[0];

const open = (css.match(/{/g) || []).length;
const close = (css.match(/}/g) || []).length;

console.log('braces balanced :', open === close, `(${open}/${close})`);
console.log('@scope removed  :', !css.includes('@scope'));
console.log('header jsx      :', src.includes('className="hdr-brand"'));
console.log('intro jsx       :', src.includes('className="intro-title"'));
console.log('file inputs     :', src.includes('type="file"'));
console.log('dashed border   :', css.includes('border-bottom: 1.5px dashed'));

try {
  parse(src, { sourceType: 'module', plugins: ['jsx'] });
  console.log('PARSE           : OK');
} catch (e) {
  console.log('PARSE           : FAIL -', e.message);
}