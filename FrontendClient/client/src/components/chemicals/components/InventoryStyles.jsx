import styled from 'styled-components';

export const DashboardShell = styled.div`
  --chem-ink:#17352f; --chem-muted:#788a84; --chem-line:#e6ece8;
  min-height:100vh; padding:clamp(18px,3vw,36px); background:#f5f8f6; color:var(--chem-ink);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  h1,h2,h3,p { margin:0; } button,input,select,textarea { font:inherit; } button { cursor:pointer; }
  .eyebrow { display:flex;align-items:center;gap:7px;color:#5f8575;font-size:11px;font-weight:800;letter-spacing:.12em;margin-bottom:9px; }
  .error-banner { display:flex;align-items:center;gap:10px;padding:13px 15px;margin:0 0 18px;border:1px solid #f4c9c4;border-radius:12px;color:#a5382e;background:#fff3f1;font-size:13px; }
  .error-banner span { flex:1; } .error-banner button { border:0;color:inherit;background:none;font-weight:750; }
  .dashboard-layout { display:grid;grid-template-columns:minmax(230px,285px) minmax(0,1fr);align-items:start;gap:20px;margin-top:20px; }
  .inventory-main { min-width:0;display:grid;gap:18px; }
  .panel { background:#fff;border:1px solid var(--chem-line);border-radius:17px;box-shadow:0 5px 22px rgba(32,64,52,.035); }
  .panel-heading { display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 21px 14px; }
  .panel-heading h2 { font-size:16px;font-weight:780;letter-spacing:-.02em; }
  .panel-heading p { color:var(--chem-muted);font-size:12px;margin-top:5px; }
  .spin { animation:chem-spin .8s linear infinite; } @keyframes chem-spin { to { transform:rotate(360deg); } }
  @media(max-width:900px) { .dashboard-layout { grid-template-columns:1fr; } }
  @media(max-width:620px) { padding:16px 12px; }
`;

export const PageHeader = styled.header`
  display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px;
  h1 { font-size:clamp(24px,3vw,32px);line-height:1.15;letter-spacing:-.045em;font-weight:820; }
  p { color:#788a84;font-size:14px;margin-top:7px; }
  @media(max-width:760px) { align-items:flex-start;flex-direction:column; }
`;

export const HeaderActions = styled.div`
  display:flex;gap:9px;flex-wrap:wrap;
  @media(max-width:520px) { width:100%; > button { flex:1;justify-content:center; } }
`;

const ButtonBase = styled.button`
  display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 14px;border-radius:10px;font-size:13px;font-weight:720;
  transition:transform .16s ease,box-shadow .16s ease,background .16s ease;
  &:hover:not(:disabled) { transform:translateY(-1px); } &:disabled { opacity:.65;cursor:wait; }
`;

export const PrimaryButton = styled(ButtonBase)`
  color:#fff;border:1px solid #176b53;background:#176b53;box-shadow:0 4px 11px rgba(23,107,83,.15);
  &:hover:not(:disabled) { background:#105640; }
`;

export const SecondaryButton = styled(ButtonBase)`
  color:#34544a;border:1px solid #dfe8e3;background:#fff;
  &:hover:not(:disabled) { background:#f7faf8; }
`;