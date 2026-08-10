import React from 'react';

// Define navigation items to make the component dynamic
const navLinks = [
  { name: 'Overview', href: '/overview' },
  { name: 'Deceased', href: '/deceased' },
  { name: 'Hearse', href: '/hearse' },
  { name: 'Coffins', href: '/coffins' },
  { name: 'Branches', href: '/branches' },
  { name: 'Records', href: '/records' },
];

export default function DashTopNav({ 
  activePage = 'Overview', 
  avatarUrl = 'https://storage.googleapis.com/banani-avatars/avatar/female/25-35/East%20Asian/0' 
}) {
  return (
    <header className="bg-surface border-b border-border px-8 flex items-center justify-between h-14">
      
      {/* LEFT SECTION: Logo, Brand Name, Badge */}
      <div className="flex items-center gap-3">
        {/* Logo Box */}
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          {/* Exact Activity/Heartbeat SVG from design - No Lucide */}
          <svg 
            className="text-primary-foreground" 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24"
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.42857" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
          </svg>
        </div>
        
        {/* Brand Name */}
        <span className="font-headings font-semibold text-base text-foreground tracking-tight">
          FuneralOps
        </span>
        
        {/* Environment/Mode Badge */}
        <span className="text-xs text-muted-foreground font-body bg-muted px-2 py-0.5 rounded-sm">
          Analytics
        </span>
      </div>

      {/* MIDDLE SECTION: Navigation Links */}
      <nav className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = link.name === activePage;
          
          return (
            <a
              key={link.name}
              href={link.href}
              className={`
                px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors
                ${isActive 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              {link.name}
            </a>
          );
        })}
      </nav>

      {/* RIGHT SECTION: Live Status & User Avatar */}
      <div className="flex items-center gap-3">
        {/* Live Status Pill */}
        <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
          {/* Green Pulse Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-deceased animate-pulse" />
          <span className="text-xs text-muted-foreground font-body">Live</span>
        </div>
        
        {/* User Avatar */}
        <img 
          src={avatarUrl} 
          alt="User Avatar" 
          className="w-7 h-7 rounded-full object-cover" 
        />
      </div>
      
    </header>
  );
}