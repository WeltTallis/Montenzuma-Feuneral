const fs = require('fs');
const f = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Replace dispatchForm state
c = c.replace(`  const [dispatchForm, setDispatchForm] = useState({

    selectedCoffinKey: '',

    qty: 1,

    dispatchedBy: '',

    receivedBy: '',

    driver: '',

    date: toKey(new Date()),

    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),

    destination: '',

    purpose: '',

    remarks: '',

  });`, `  const [dispatchCart, setDispatchCart] = useState([]); // { key, name, sub, unit, qty, maxQty }[]

  const [dispatchForm, setDispatchForm] = useState({

    dispatchedBy: '',

    receivedBy: '',

    driver: '',

    date: toKey(new Date()),

    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),

    destination: '',

    from: '',

    purpose: '',

    remarks: '',

  });

  const [previewDispatchId, setPreviewDispatchId] = useState('');`);

// 2. Replace openAviationDispatch
c = c.replace(`  const openAviationDispatch = () => {

    setDispatchForm(f => ({

      ...f,

      selectedCoffinKey: readyCoffins[0]?.key || '',

      qty: 1,

      date: toKey(new Date()),

      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),

      dispatchedBy: '',

      receivedBy: '',

      driver: '',

      destination: '',

      purpose: '',

      remarks: '',

    }));

    setDispatchStep(1);

    setShowDispatchModal(true);

  };`, `  const openAviationDispatch = () => {

    setDispatchCart([]);

    setPreviewDispatchId('DSP-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 100)).padStart(2, '0'));

    setDispatchForm(f => ({

      ...f,

      date: toKey(new Date()),

      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),

      dispatchedBy: '',

      receivedBy: '',

      driver: '',

      destination: '',

      from: '',

      purpose: '',

      remarks: '',

    }));

    setDispatchStep(1);

    setShowDispatchModal(true);

  };`);

// 3. Replace setSelectedCoffin with cart helpers
c = c.replace(`  const setSelectedCoffin = (key) => {

    setDispatchForm(f => ({ ...f, selectedCoffinKey: key, qty: 1 }));

  };`, `  const addToCart = (item) => {

    setDispatchCart(cart => {

      if (cart.find(c => c.key === item.key)) return cart;

      return [...cart, { key: item.key, name: item.name, sub: item.sub, unit: item.unit, qty: 1, maxQty: effQty(item) }];

    });

  };

  const removeFromCart = (key) => {

    setDispatchCart(cart => cart.filter(c => c.key !== key));

  };

  const updateCartQty = (key, qty) => {

    setDispatchCart(cart => cart.map(c => c.key === key ? { ...c, qty: Math.max(1, Math.min(qty, c.maxQty)) } : c));

  };

  const cartTotalUnits = dispatchCart.reduce((s, c) => s + (c.qty || 0), 0);`);

console.log('Phase 1 done');
fs.writeFileSync(f, c);
