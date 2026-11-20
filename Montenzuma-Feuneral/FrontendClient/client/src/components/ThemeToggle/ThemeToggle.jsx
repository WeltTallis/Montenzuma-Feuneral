import React, { useEffect, useState } from 'react';
import './ThemeToggle.css';

const SunIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2" />
    <path d="M12 21v2" />
    <path d="M4.22 4.22l1.42 1.42" />
    <path d="M18.36 18.36l1.42 1.42" />
    <path d="M1 12h2" />
    <path d="M21 12h2" />
    <path d="M4.22 19.78l1.42-1.42" />
    <path d="M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    try {
      // Default to light unless user explicitly set dark in localStorage
      return localStorage.getItem('theme') === 'dark';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (e) {}
  }, [isDark]);

  const toggle = () => setIsDark((v) => !v);

  return (
    <div className="tt-container" aria-hidden={false}>
      <button
        className={`tt-btn ${isDark ? 'tt-dark' : 'tt-light'}`}
        onClick={toggle}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-pressed={isDark}
      >
        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  );
};

export default ThemeToggle;
