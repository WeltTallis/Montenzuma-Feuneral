import React from 'react';

/* ============================================================================
   SearchBar — search input with icon.
   ============================================================================ */
const SearchBar = ({ placeholder, value, onChange, className }) => {
  return (
    <div className={`ec-search-bar ${className || ''}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          border: 'none',
          background: 'transparent',
          outline: 'none',
          flex: 1,
          fontSize: '13.5px',
          color: '#1a1a1a',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
};

export default SearchBar;