import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './InventoryStyles';

const TITLES = {
    add: 'Add chemical',
    edit: 'Edit chemical details',
    receive: 'Receive stock',
    usage: 'Record chemical usage',
    ppe: 'Request protective equipment',
    transfer: 'Distribute stock to branch',
};

const ChemicalDialog = ({ mode, chemical, chemicals, branches, mainBranchSlug, branchId, onClose, onSubmit }) => {
    const [values, setValues] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setValues({
            name: chemical?.chemical_name || '',
            category: chemical?.category || '',
            unit: chemical?.unit || 'liters',
            current_stock: chemical?.current_stock ?? 0,
            min_stock_level: chemical?.min_stock_level ?? 0,
            reorder_level: chemical?.reorder_level ?? 0,
            unit_cost: chemical?.unit_cost ?? 0,
            hazard_level: chemical?.hazard_level || 'low',
            supplier: chemical?.supplier || '',
            batch_number: chemical?.batch_number || '',
            notes: '',
            quantity: '',
            quantity_used: '',
            usage_notes: '',
            received_by: '',
            item_name: '',
            quantity_requested: 1,
            requested_by: '',
            to_branch_slug: branches.find((branch) => !branch.isMain)?.slug || '',
            chemical_id: chemical?.chemical_id || chemicals[0]?.chemical_id || '',
        });
        setError('');
    }, [chemical, chemicals, mode]);

    const setField = (event) => {
        const { name, value } = event.target;
        setValues((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            let payload = values;
            if (mode === 'usage') {
                payload = {
                    chemical_id: values.chemical_id,
                    quantity_used: Number(values.quantity_used),
                    usage_notes: values.usage_notes.trim() || undefined,
                    branch_id: branchId || undefined,
                };
            } else if (mode === 'receive') {
                payload = {
                    quantity: Number(values.quantity),
                    notes: values.notes.trim() || undefined,
                    received_by: values.received_by.trim() || undefined,
                };
            } else if (mode === 'ppe') {
                payload = {
                    item_name: values.item_name.trim(),
                    quantity_requested: Number(values.quantity_requested),
                    requested_by: values.requested_by.trim(),
                };
            } else if (mode === 'transfer') {
                payload = {
                    chemical_id: chemical.chemical_id,
                    to_branch_slug: values.to_branch_slug,
                    quantity: Number(values.quantity),
                    notes: values.notes.trim() || undefined,
                };

            } else if (mode === 'add') {
                payload = {
                    ...values,
                    name: values.name.trim(),
                    current_stock: Number(values.current_stock),
                    min_stock_level: Number(values.min_stock_level),
                    reorder_level: Number(values.reorder_level),
                    unit_cost: Number(values.unit_cost),
                };
            } else if (mode === 'edit') {
                payload = {
                    ...values,
                    name: values.name.trim(),
                    min_stock_level: Number(values.min_stock_level),
                    reorder_level: Number(values.reorder_level),
                    unit_cost: Number(values.unit_cost),
                };
            }

            const succeeded = await onSubmit(payload);
            if (succeeded !== false) onClose();
        } catch (submitError) {
            setError(submitError?.message || 'Could not save this change. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const field = (label, name, options = {}) => (
        <label className="dialog-field" key={name}>
            <span>{label}{options.required && <b aria-hidden="true"> *</b>}</span>
            {options.as === 'select' ? (
                <select name={name} value={values[name] ?? ''} onChange={setField} required={options.required}>
                    {options.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
            ) : options.as === 'textarea' ? (
                <textarea name={name} value={values[name] ?? ''} onChange={setField} rows={3} placeholder={options.placeholder || ''} />
            ) : (
                <input
                    name={name}
                    type={options.type || 'text'}
                    min={options.min}
                    step={options.step}
                    value={values[name] ?? ''}
                    onChange={setField}
                    placeholder={options.placeholder || ''}
                    required={options.required}
                />
            )}
        </label>
    );

    return (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
            <section className="chemical-dialog" role="dialog" aria-modal="true" aria-labelledby="chemical-dialog-title">
                <header className="dialog-header">
                    <div><h2 id="chemical-dialog-title">{TITLES[mode]}</h2><p>{mode === 'ppe' ? 'Tell your team what protective supplies are needed.' : mode === 'transfer' ? 'Move stock from the main warehouse to a registered branch.' : mode === 'add' || mode === 'receive' ? 'All incoming stock is recorded at the main warehouse first.' : 'Update inventory using the current branch context.'}</p></div>
                    <button type="button" className="dialog-close" aria-label="Close dialog" onClick={onClose} disabled={submitting}><X size={18} /></button>
                </header>
                <form onSubmit={handleSubmit}>
                    <div className="dialog-body">
                        {error && <div className="dialog-error" role="alert"><AlertCircle size={16} />{error}</div>}
                        {(mode === 'add' || mode === 'edit') && (
                            <>
                                <div className="dialog-grid">
                                    {field('Chemical name', 'name', { required: true, placeholder: 'e.g. Formalin' })}
                                    {field('Category', 'category', { placeholder: 'e.g. Embalming' })}
                                    {field('Unit', 'unit', { required: true, placeholder: 'liters, bottles, kg' })}
                                    {field('Hazard level', 'hazard_level', { as: 'select', options: ['low', 'medium', 'high'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })) })}
                                    {mode === 'add' && field('Opening stock', 'current_stock', { type: 'number', min: 0, step: 'any', required: true })}
                                    {field('Minimum stock', 'min_stock_level', { type: 'number', min: 0, step: 'any', required: true })}
                                    {field('Reorder level', 'reorder_level', { type: 'number', min: 0, step: 'any' })}
                                    {field('Unit cost', 'unit_cost', { type: 'number', min: 0, step: 'any' })}
                                    {field('Supplier', 'supplier')}
                                    {field('Batch number', 'batch_number')}
                                </div>
                                {field('Notes', 'notes', { as: 'textarea', placeholder: 'Optional inventory notes' })}
                            </>
                        )}
                        {mode === 'receive' && (
                            <div className="dialog-grid">
                                <div className="dialog-context"><strong>{chemical?.chemical_name}</strong><span>Current stock: {Number(chemical?.current_stock ?? 0).toLocaleString()} {chemical?.unit}</span></div>
                                {field(`Quantity received (${chemical?.unit || 'units'})`, 'quantity', { type: 'number', min: 0.01, step: 'any', required: true })}
                                {field('Received by', 'received_by', { placeholder: 'Optional team member name' })}
                                {field('Notes', 'notes', { as: 'textarea', placeholder: 'Delivery or batch details' })}
                            </div>
                        )}
                        {mode === 'usage' && (
                            <div className="dialog-grid">
                                {!chemical && field('Chemical', 'chemical_id', { as: 'select', required: true, options: chemicals.map((item) => ({ value: item.chemical_id, label: `${item.chemical_name} (${item.current_stock ?? 0} ${item.unit})` })) })}
                                {chemical && <div className="dialog-context"><strong>{chemical.chemical_name}</strong><span>Available: {Number(chemical.current_stock ?? 0).toLocaleString()} {chemical.unit}</span></div>}
                                {field(`Quantity used${chemical?.unit ? ` (${chemical.unit})` : ''}`, 'quantity_used', { type: 'number', min: 0.01, step: 'any', required: true })}
                                {field('Usage notes', 'usage_notes', { as: 'textarea', placeholder: 'Optional reason or reference' })}
                            </div>
                        )}
                        {mode === 'ppe' && (
                            <div className="dialog-grid">
                                {field('Protective item', 'item_name', { required: true, placeholder: 'e.g. Nitrile gloves' })}
                                {field('Quantity requested', 'quantity_requested', { type: 'number', min: 1, step: 1, required: true })}
                                {field('Requested by', 'requested_by', { required: true, placeholder: 'Your name' })}
                            </div>
                        )}
                        {mode === 'transfer' && (
                            <div className="dialog-grid">
                                <div className="dialog-context"><strong>{chemical?.chemical_name}</strong><span>Main warehouse stock: {Number(chemical?.current_stock ?? 0).toLocaleString()} {chemical?.unit}</span></div>
                                {field('Destination branch', 'to_branch_slug', {
                                    as: 'select',
                                    required: true,
                                    options: branches.filter((branch) => branch.slug !== mainBranchSlug).map((branch) => ({ value: branch.slug, label: branch.name })),
                                })}
                                {field(`Quantity to distribute (${chemical?.unit || 'units'})`, 'quantity', { type: 'number', min: 0.01, max: Number(chemical?.current_stock ?? 0), step: 'any', required: true })}
                                {field('Notes', 'notes', { as: 'textarea', placeholder: 'Optional dispatch notes' })}
                            </div>
                        )}
                    </div>
                    <footer className="dialog-footer">
                        <SecondaryButton type="button" onClick={onClose} disabled={submitting}>Cancel</SecondaryButton>
                        <PrimaryButton type="submit" disabled={submitting || (mode === 'usage' && !chemical && !chemicals.length)}>
                            {submitting ? 'Saving…' : mode === 'receive' ? 'Receive stock' : mode === 'usage' ? 'Record usage' : mode === 'ppe' ? 'Submit request' : mode === 'transfer' ? 'Distribute stock' : mode === 'edit' ? 'Save changes' : 'Add chemical'}
                        </PrimaryButton>
                    </footer>
                </form>
            </section>
            <style>{`
        .dialog-backdrop { position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(18,39,32,.48);backdrop-filter:blur(3px); }
        .chemical-dialog { width:min(580px,100%);max-height:min(90vh,800px);overflow:auto;border:1px solid #e4ebe7;border-radius:18px;background:#fff;box-shadow:0 24px 80px rgba(13,42,30,.25); }
        .dialog-header { display:flex;align-items:flex-start;justify-content:space-between;gap:15px;padding:21px 23px 17px;border-bottom:1px solid #edf1ee; }
        .dialog-header h2 { color:#1f4336;font-size:18px;letter-spacing:-.03em; }.dialog-header p { color:#809189;font-size:12px;margin-top:6px; }
        .dialog-close { width:32px;height:32px;display:grid;place-items:center;flex:0 0 auto;border:1px solid #e6ece8;border-radius:9px;color:#62796e;background:#fff; }
        .dialog-close:disabled { opacity:.5; }.dialog-body { display:grid;gap:14px;padding:19px 23px; }
        .dialog-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px; }
        .dialog-field { min-width:0;display:grid;gap:6px; }.dialog-field > span { color:#566f63;font-size:11px;font-weight:720; }.dialog-field b { color:#c45c49; }
        .dialog-field input,.dialog-field select,.dialog-field textarea { width:100%;min-height:39px;padding:9px 10px;border:1px solid #e0e8e3;border-radius:9px;outline:none;color:#315244;background:#fff;font-size:12px; }
        .dialog-field textarea { resize:vertical; }.dialog-field input:focus,.dialog-field select:focus,.dialog-field textarea:focus { border-color:#6fa68a;box-shadow:0 0 0 3px rgba(70,143,105,.1); }
        .dialog-context { grid-column:1/-1;display:grid;gap:5px;padding:11px 12px;border:1px solid #e2eee6;border-radius:10px;background:#f4f9f6; }.dialog-context strong { color:#315d48;font-size:13px; }.dialog-context span { color:#788e82;font-size:11px; }
        .dialog-error { display:flex;align-items:center;gap:8px;padding:10px 11px;border:1px solid #f1c9c4;border-radius:9px;color:#a33d32;background:#fff3f1;font-size:12px; }
        .dialog-footer { display:flex;justify-content:flex-end;gap:9px;padding:14px 23px 20px;border-top:1px solid #edf1ee; }
        @media(max-width:520px) { .dialog-backdrop { padding:8px; }.chemical-dialog { max-height:94vh; }.dialog-header { padding:17px 16px 14px; }.dialog-body { padding:15px 16px; }.dialog-footer { padding:12px 16px 16px; }.dialog-grid { grid-template-columns:1fr; }.dialog-context { grid-column:auto; } }
      `}</style>
        </div>
    );
};

export default ChemicalDialog;