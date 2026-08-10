const fs = require('fs');
const path = 'C:\Users\User\Downloads\restpoint\FrontendClient\client\src\components\analysis\Dashboard.css';
const css = `/* Reset */
* { box-sizing: border-box; }

/* Color Variables */
:root {
  --color-orange: #EA580C;
  --color-orange-light: #FFF7ED;
  --color-secondary-foreground: #FFFFFF;
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-foreground: #0F172A;
  --color-muted: #F1F5F9;
  --color-muted-foreground: #64748B;
  --color-border: #E2E8F0;
  --color-border-light: #F1F5F9;
  --color-primary: #2563EB;
  --color-primary-foreground: #FFFFFF;
  --color-primary-light: #EFF6FF;
  --color-secondary: #7C3AED;
  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-success-border: #BBF7D0;
  --color-warning: #D97706;
  --color-warning-bg: #FFFBEB;
  --color-warning-border: #FDE68A;
  --color-danger: #DC2626;
  --color-danger-bg: #FEF2F2;
  --color-danger-border: #FECACA;
  --color-info: #0369A1;
  --color-info-bg: #F0F9FF;
  --color-info-border: #BAE6FD;
  --color-purple: #7C3AED;
  --color-purple-bg: #F5F3FF;
  --color-purple-border: #DDD6FE;
  --color-amber: #D97706;
  --color-navy: #1A1F2E;
  --font-body: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-headings: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
`;
fs.writeFileSync(path, css);
console.log('CSS base created');
