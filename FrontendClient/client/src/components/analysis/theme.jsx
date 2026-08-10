// Dashboard Theme Configuration
// This file provides consistent styling to prevent overflow and overlapping

export const dashboardTheme = {
  // Container styles
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '0 24px',
    width: '100%',
  },

  // Calendar section
  calendar: {
    overflowX: 'auto',
    overflowY: 'visible',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },

  // Calendar cell - prevent overlapping
  calendarCell: {
    flexShrink: 0,
    width: 64,
    position: 'relative',
    zIndex: 1,
  },
  calendarCellHover: {
    zIndex: 5,
  },
  calendarCellSelected: {
    zIndex: 2,
    transform: 'translateY(-2px)',
  },

  // Section card
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    width: '100%',
  },

  // Hearse operations - allow horizontal scroll
  hearseScroll: {
    overflowX: 'auto',
    overflowY: 'visible',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },

  // Prevent all children from overflowing
  noOverflow: {
    maxWidth: '100%',
    overflowX: 'hidden',
  },
};

// Helper to apply container padding
export const containerStyle = {
  ...dashboardTheme.container,
  boxSizing: 'border-box',
};

export default dashboardTheme;
