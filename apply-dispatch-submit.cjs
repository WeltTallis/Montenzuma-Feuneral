const fs = require('fs');
const file = 'd:/new/restpoint/FrontendClient/client/src/components/workshop/pages/StoreTab.jsx';
let c = fs.readFileSync(file, 'utf8');
const oldStr = "  const submitAviationDispatch = async () => {\n" +
"    const errors = [];\n" +
"    if (dispatchForm.selectedIds.length === 0) errors.push('Select at least one coffin');\n" +
"    if (!dispatchForm.dispatchedBy.trim()) errors.push('Enter dispatched by name');\n" +
"    if (!dispatchForm.receivedBy.trim()) errors.push('Enter received by name');\n" +
"    if (!dispatchForm.vehicle.trim()) errors.push('Enter vehicle/transport details');\n" +
"    if (!dispatchForm.driver.trim()) errors.push('Enter driver name');\n" +
"    if (!dispatchForm.destination.trim()) errors.push('Enter destination');\n" +
"    if (!dispatchForm.purpose.trim()) errors.push('Enter purpose of dispatch');\n" +
"\n" +
"    if (errors.length > 0) {\n" +
"      addToast(errors[0], 'error');\n" +
"      return;\n" +
"    }\n" +
"\n" +
"    setLoading(true);\n" +
"    try {\n" +
"      const promises = dispatchForm.selectedIds.map(key => {\n" +
"        const item = items.find(it => it.key === key);\n" +
"        if (!item) return Promise.resolve();\n" +
"        return workshopService.dispatchStoreItem({\n" +
"          item_key: item.key,\n" +
"          item_type: item.kind,\n" +
"          item_name: item.name,\n" +
"          item_sub: item.sub,\n" +
"          unit: item.unit,\n" +
"          qty: 1,\n" +
"          date: dispatchForm.date,\n" +
"          picked_by: dispatchForm.dispatchedBy,\n" +
"          notes: `DISPATCH LOG: Dispatched By: ${dispatchForm.dispatchedBy} | Received By: ${dispatchForm.receivedBy} | Vehicle: ${dispatchForm.vehicle} | Driver: ${dispatchForm.driver} | Destination: ${dispatchForm.destination} | Purpose: ${dispatchForm.purpose} | Remarks: ${dispatchForm.remarks} | Time: ${dispatchForm.time}`,\n" +
"        });\n" +
"      });\n" +
"\n" +
"      await Promise.all(promises);\n" +
"      addToast(`Successfully dispatched ${dispatchForm.selectedIds.length} coffin(s)`, 'success');\n" +
"      setShowDispatchModal(false);\n" +
"      setDispatchForm(f => ({ ...f, selectedIds: [] }));\n" +
"      loadStore();\n" +
"    } catch (error) {\n" +
"      addToast('Dispatch failed: ' + (error.message || 'Unknown error'), 'error');\n" +
"    } finally {\n" +
"      setLoading(false);\n" +
"    }\n" +
"  };";

const newStr = "  const submitAviationDispatch = async () => {\n" +
"    const errors = [];\n" +
"    if (!dispatchForm.selectedCoffinKey) errors.push('Select a coffin to dispatch');\n" +
"    if (!dispatchForm.dispatchedBy.trim()) errors.push('Enter dispatched by name');\n" +
"    if (!dispatchForm.destination.trim()) errors.push('Enter destination');\n" +
"\n" +
"    if (errors.length > 0) {\n" +
"      addToast(errors[0], 'error');\n" +
"      return;\n" +
"    }\n" +
"\n" +
"    const item = items.find(it => it.key === dispatchForm.selectedCoffinKey);\n" +
"    if (!item) { addToast('Selected coffin not found', 'error'); return; }\n" +
"    const q = dispatchForm.qty || 1;\n" +
"    if (q > effQty(item)) return addToast('Not enough stock in store', 'error');\n" +
"\n" +
"    setLoading(true);\n" +
"    try {\n" +
"      await workshopService.dispatchStoreItem({\n" +
"        item_key: item.key,\n" +
"        item_type: item.kind,\n" +
"        item_name: item.name,\n" +
"        item_sub: item.sub,\n" +
"        unit: item.unit,\n" +
"        qty: q,\n" +
"        date: dispatchForm.date,\n" +
"        picked_by: dispatchForm.dispatchedBy,\n" +
"        notes: 'DISPATCH LOG: Dispatched By: ' + dispatchForm.dispatchedBy + ' | Received By: ' + (dispatchForm.receivedBy || 'None') + ' | Driver: ' + dispatchForm.driver + ' | Destination: ' + dispatchForm.destination + ' | Purpose: ' + dispatchForm.purpose + ' | Remarks: ' + dispatchForm.remarks + ' | Time: ' + dispatchForm.time + (item.assignedToName ? ' | Assigned To: ' + item.assignedToName : ''),\n" +
"      });\n" +
"      addToast('Successfully dispatched ' + q + ' x ' + item.name, 'success');\n" +
"      setShowDispatchModal(false);\n" +
"      setDispatchForm(f => ({ ...f, selectedCoffinKey: '', qty: 1 }));\n" +
"      loadStore();\n" +
"    } catch (error) {\n" +
"      addToast('Dispatch failed: ' + (error.message || 'Unknown error'), 'error');\n" +
"    } finally {\n" +
"      setLoading(false);\n" +
"    }\n" +
"  };";

const search = oldStr.replace(/\r?\n/g, '\n');
const haystack = c.replace(/\r?\n/g, '\n');
if (haystack.includes(search)) {
  let fixed = haystack.split(search).join(newStr.replace(/\r?\n/g, '\n'));
  const usesCRLF = c.includes('\r\n');
  fs.writeFileSync(file, usesCRLF ? fixed.replace(/\n/g, '\r\n') : fixed);
  console.log('OK - submitAviationDispatch');
} else {
  console.log('NOT FOUND - submitAviationDispatch');
}