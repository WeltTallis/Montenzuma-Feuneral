import React from 'react';

/* ============================================================================
   SettingsView — coffin types, colors, production stages configuration.
   ============================================================================ */
const SettingsView = ({ coffinTypes = [], colors = [], onAddType, onRemoveType, onAddColor, onRemoveColor }) => {
  return (
    <div className="ec-settings-view">
      <div className="ec-view-header">
        <div>
          <div className="ec-view-subtitle">Configuration</div>
          <h1 className="ec-view-title">Workshop settings</h1>
        </div>
      </div>

      <div className="ec-settings-section">
        <h3>Coffin types</h3>
        <p>Register the coffin types your workshop produces. Each type has its own material and color options.</p>
        <div className="ec-settings-list">
          {coffinTypes.map((t) => (
            <div key={t} className="ec-settings-list-item">
              <span className="ec-sli-name">{t}</span>
              <span className="ec-sli-meta">Registered type</span>
              <button className="ec-sli-remove" onClick={() => onRemoveType?.(t)} title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
            </div>
          ))}
          {coffinTypes.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              No coffin types registered
            </div>
          )}
        </div>
        <div className="ec-settings-add-row">
          <input type="text" id="ec-new-type-name" className="ec-settings-add-input" placeholder="New coffin type (e.g. Hexagonal)" />
          <button className="ec-settings-add-btn" onClick={() => {
            const input = document.getElementById('ec-new-type-name');
            const name = input?.value?.trim();
            if (name) onAddType?.(name);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add type
          </button>
        </div>
      </div>

      <div className="ec-settings-section">
        <h3>Colors</h3>
        <p>Register the color variants available across coffin types. Each color has a hex value used for swatches.</p>
        <div className="ec-settings-list">
          {colors.map((c) => (
            <div key={c.name} className="ec-settings-list-item">
              <span className="ec-sli-color-swatch" style={{ background: c.hex }} />
              <span className="ec-sli-name">{c.name}</span>
              <span className="ec-sli-meta">{c.hex}</span>
              <button className="ec-sli-remove" onClick={() => onRemoveColor?.(c.name)} title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
            </div>
          ))}
          {colors.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              No colors registered
            </div>
          )}
        </div>
        <div className="ec-settings-add-row">
          <input type="text" id="ec-new-color-name" className="ec-settings-add-input" placeholder="Color name (e.g. Bronze)" style={{ flex: 1 }} />
          <input type="color" id="ec-new-color-hex" className="ec-settings-add-input" style={{ flex: '0 0 60px', padding: '5px', height: '38px' }} value="#cd7f32" />
          <button className="ec-settings-add-btn" onClick={() => {
            const nameInput = document.getElementById('ec-new-color-name');
            const hexInput = document.getElementById('ec-new-color-hex');
            const name = nameInput?.value?.trim();
            const hex = hexInput?.value || '#000000';
            if (name) onAddColor?.({ name, hex });
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add color
          </button>
        </div>
      </div>

      <div className="ec-settings-section">
        <h3>Production stages</h3>
        <p>Configure the build pipeline your coffins move through.</p>
        <div className="ec-settings-grid">
          <div className="ec-settings-field">
            <label>Stage 1</label>
            <input type="text" value="Building" />
          </div>
          <div className="ec-settings-field">
            <label>Stage 2</label>
            <input type="text" value="Waiting Bay" />
          </div>
          <div className="ec-settings-field">
            <label>Stage 3</label>
            <input type="text" value="Painting" />
          </div>
          <div className="ec-settings-field">
            <label>Stage 4</label>
            <input type="text" value="Interior" />
          </div>
          <div className="ec-settings-field" style={{ gridColumn: '1 / -1' }}>
            <label>Stage 5 (final)</label>
            <input type="text" value="Store" />
          </div>
        </div>
        <button className="ec-settings-save-btn" onClick={() => alert('Stages saved')}>Save stages</button>
      </div>
    </div>
  );
};

export default SettingsView;
