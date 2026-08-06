const fs = require('fs');
const f = 'FrontendClient/client/src/components/deceased/register/deceasedIntake.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find the finally block and add submitInProgressRef.current = false; before setIsSubmitting(false);
const oldStr = '        } finally {\n            setIsSubmitting(false);';
const newStr = '        } finally {\n            submitInProgressRef.current = false;\n            setIsSubmitting(false);';

if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    fs.writeFileSync(f, c);
    console.log('SUCCESS: finally block updated (LF)');
} else {
    // Try CRLF
    const oldStrCRLF = '        } finally {\r\n            setIsSubmitting(false);';
    const newStrCRLF = '        } finally {\r\n            submitInProgressRef.current = false;\r\n            setIsSubmitting(false);';
    if (c.includes(oldStrCRLF)) {
        c = c.replace(oldStrCRLF, newStrCRLF);
        fs.writeFileSync(f, c);
        console.log('SUCCESS: finally block updated (CRLF)');
    } else {
        console.log('ERROR: Could not find the finally block pattern');
        // Let's check what's actually there
        const idx = c.indexOf('} finally {');
        if (idx >= 0) {
            console.log('Found "} finally {" at index:', idx);
            console.log('Context:', JSON.stringify(c.substring(idx, idx + 80)));
        } else {
            console.log('Could not find "} finally {" at all');
        }
    }
}