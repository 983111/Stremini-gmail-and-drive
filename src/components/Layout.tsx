import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid, Folders, FileText, Settings, HelpCircle, LogOut,
  Bell, Menu, Database, ClipboardList, Presentation, Mail,
  X, ChevronRight, Moon, Sun, Monitor
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { GlobalSearch } from './GlobalSearch';

const NAV = [
  { to: '/',          icon: LayoutGrid,   label: 'Dashboard' },
  { to: '/drive',     icon: Folders,      label: 'Drive' },
  { to: '/mail',      icon: Mail,         label: 'Mail' },
  { to: '/docs',      icon: FileText,     label: 'Documents' },
  { to: '/databases', icon: Database,     label: 'Databases' },
  { to: '/forms',     icon: ClipboardList,label: 'Forms' },
  { to: '/slides',    icon: Presentation, label: 'Slides' },
];

type Theme = 'light' | 'dark' | 'system';

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem('theme') as Theme) || 'system'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const themeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const ThemeIcon = themeIcon;

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-border transition-transform duration-200 lg:relative lg:translate-x-0',
        'w-[232px] shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between pl-6 pr-4 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--text-primary)] flex items-center justify-center shrink-0">
              <span className="text-white text-[13px] font-bold tracking-tight leading-none">42</span>
            </div>
            <div className="leading-tight">
              <p className="text-[14px] font-semibold tracking-tight text-foreground">Think 42</p>
              <p className="text-[11px] text-muted">Workspace</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted hover:text-foreground p-1">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 overflow-y-auto space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] transition-colors duration-150',
                isActive
                  ? 'bg-[var(--accent-muted)] text-[var(--accent-color)] font-medium'
                  : 'text-muted hover:bg-surface-hover hover:text-foreground'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={1.75} className={isActive ? 'text-[var(--accent-color)]' : 'text-muted group-hover:text-foreground'} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto text-[var(--accent-color)] opacity-50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 py-5 border-t border-border space-y-0.5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <Settings size={16} strokeWidth={1.75} />
            <span>Settings</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13.5px] text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>

          {/* User chip */}
          {user && (
            <div className="flex items-center gap-2.5 px-3 pt-4 mt-2 border-t border-border">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--accent-muted)] shrink-0 flex items-center justify-center">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[10px] font-semibold text-[var(--accent-color)]">{user.email?.[0]?.toUpperCase()}</span>
                }
              </div>
              <p className="text-[12px] text-muted truncate">{user.email}</p>
            </div>
          )}

          <p className="px-3 pt-4 text-[10.5px] text-muted/70 tracking-wide">
            Think 42 AI Labs
          </p>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex items-center gap-3 px-6 border-b border-border bg-white shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-muted hover:text-foreground rounded-md hover:bg-surface-hover"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1 max-w-lg">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Theme cycle */}
            <button
              onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light')}
              className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-md transition-colors"
              title="Toggle theme"
            >
              <ThemeIcon size={16} strokeWidth={1.75} />
            </button>
            <button className="p-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-md transition-colors">
              <Bell size={16} strokeWidth={1.75} />
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--accent-muted)] ml-1.5 cursor-pointer">
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[12px] font-semibold text-[var(--accent-color)]">{user?.email?.[0]?.toUpperCase()}</div>
              }
            </div>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-auto bg-background">
          <Outlet />
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-lg border border-border shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-semibold text-[15px]">Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className="text-muted hover:text-foreground p-1 rounded-md hover:bg-surface-hover"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-2.5 uppercase tracking-wider">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light','dark','system'] as Theme[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-md border text-[12px] font-medium capitalize transition-colors',
                        theme === t
                          ? 'border-[var(--accent-color)] bg-[var(--accent-muted)] text-[var(--accent-color)]'
                          : 'border-border text-muted hover:bg-surface-hover hover:text-foreground'
                      )}
                    >
                      {t === 'light' ? <Sun size={16} strokeWidth={1.75}/> : t === 'dark' ? <Moon size={16} strokeWidth={1.75}/> : <Monitor size={16} strokeWidth={1.75}/>}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-md bg-[var(--text-primary)] text-white text-[13px] font-medium hover:opacity-85 transition-opacity">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
