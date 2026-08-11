const fs = require('fs');
const f = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);\n  const [previewDispatchId, setPreviewDispatchId] = useState('');");
fs.writeFileSync(f, c);
console.log('Done');
