import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Folders, FileText, Settings, Archive, HelpCircle, LogOut, Bell, Search as SearchIcon, X, Menu, Cpu, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [emailAlerts, setEmailAlerts] = useState(localStorage.getItem('emailAlerts') || 'All events');
  const [desktopNotifs, setDesktopNotifs] = useState(localStorage.getItem('desktopNotifs') || 'Enabled');
  const [digestFreq, setDigestFreq] = useState(localStorage.getItem('digestFreq') || 'Real-time');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const saveSettings = () => {
    localStorage.setItem('theme', theme);
    setIsSettingsOpen(false);
  };
  
  const saveNotifications = () => {
    localStorage.setItem('emailAlerts', emailAlerts);
    localStorage.setItem('desktopNotifs', desktopNotifs);
    localStorage.setItem('digestFreq', digestFreq);
    setIsNotificationsOpen(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-[260px] border-r border-border flex flex-col bg-background h-full z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0 shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Stremini</h1>
            <p className="text-[10px] tracking-[0.2em] font-medium text-muted uppercase mt-1">Workspace Suite</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 mb-8">
          <NavLink to="/docs" className="w-full bg-foreground text-background text-sm font-medium py-2.5 rounded-sm flex items-center justify-center space-x-2 hover:bg-foreground-hover transition-colors">
            <span>+</span> <span>New Entry</span>
          </NavLink>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavLink to="/" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-surface font-semibold text-foreground" : "text-muted hover:bg-surface")}>
            {({ isActive }) => (
              <>
                <LayoutGrid size={16} className={isActive ? "text-foreground" : "text-muted"} />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>
          <NavLink to="/drive" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-surface font-semibold text-foreground" : "text-muted hover:bg-surface")}>
            {({ isActive }) => (
              <>
                <Folders size={16} className={isActive ? "text-foreground" : "text-muted"} />
                <span>Drive Connect</span>
              </>
            )}
          </NavLink>
          <NavLink to="/mail" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-surface font-semibold text-foreground" : "text-muted hover:bg-surface")}>
            {({ isActive }) => (
              <>
                <Archive size={16} className={isActive ? "text-foreground" : "text-muted"} />
                <span>Mail Queue</span>
              </>
            )}
          </NavLink>
          <NavLink to="/docs" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-surface font-semibold text-foreground" : "text-muted hover:bg-surface")}>
            {({ isActive }) => (
              <>
                <FileText size={16} className={isActive ? "text-foreground" : "text-muted"} />
                <span>Documents</span>
              </>
            )}
          </NavLink>
          <NavLink to="/databases" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-surface font-semibold text-foreground" : "text-muted hover:bg-surface")}>
            {({ isActive }) => (
              <>
                <Database size={16} className={isActive ? "text-foreground" : "text-muted"} />
                <span>Databases</span>
              </>
            )}
          </NavLink>
        </nav>

        <div className="mt-auto px-4 py-6 border-t border-border space-y-1">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted hover:bg-surface rounded-sm transition-colors"
          >
            <HelpCircle size={16} className="text-muted" />
            <span>Help</span>
          </button>
          <button 
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted hover:bg-surface rounded-sm transition-colors cursor-pointer"
          >
            <LogOut size={16} className="text-muted" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        {/* Top Header */}
        <header className="h-[64px] border-b border-border flex items-center justify-between px-4 md:px-8 bg-background flex-shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-muted hover:text-foreground lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="font-semibold text-foreground hidden xs:block">
              Workspace
            </div>
          </div>
          
          <div className="flex-1 max-w-xl mx-2 md:mx-8 relative">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
               <SearchIcon size={14} className="text-muted" />
             </div>
             <input 
               type="text" 
               placeholder="Search..." 
               className="w-full bg-surface border-none text-sm rounded-sm pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-ring placeholder-muted transition-all"
               id="search-input"
             />
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
             <button 
               onClick={() => setIsNotificationsOpen(true)}
               className="p-2 text-muted hover:text-foreground transition-colors"
             >
               <Bell size={18} />
             </button>
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-muted hover:text-foreground transition-colors hidden sm:block"
             >
               <Settings size={18} />
             </button>
             <div className="w-7 h-7 rounded-full bg-surface-hover overflow-hidden border border-border-strong flex-shrink-0">
                {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : null}
             </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </main>

      {/* Modals */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="bg-background rounded-md w-full max-w-md shadow-xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-foreground font-semibold text-lg">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-muted hover:text-foreground"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-1">Theme Preference</label>
                <select 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full border border-border rounded-sm p-2 text-sm bg-surface outline-none"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-border bg-surface flex justify-end">
              <button onClick={saveSettings} className="bg-foreground text-background px-4 py-2 rounded-sm text-sm font-medium hover:bg-foreground-hover">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="bg-background rounded-md w-full max-w-sm shadow-xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-foreground font-semibold text-lg">Help Center</h2>
              <button onClick={() => setIsHelpOpen(false)} className="text-muted hover:text-foreground"><X size={18}/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted mb-4">Welcome to Stremini Workspace! Here you can manage your emails, drive documents, and notes all in one place with advanced intelligence.</p>
              <ul className="text-sm text-foreground-muted space-y-2 list-disc pl-4">
                <li>Use <strong>Drive Connect</strong> to preview your files and analyze them effortlessly.</li>
                <li>Go to <strong>Mail Queue</strong> to read, compose, reply, and summarize active threads.</li>
                <li>Visit <strong>Documents</strong> to write rich notes and use the assistant.</li>
                <li>Use <strong>AI Databases</strong> to build production-grade structured systems from a prompt.</li>
              </ul>
            </div>
            <div className="p-4 border-t border-border bg-surface flex justify-end">
              <button onClick={() => setIsHelpOpen(false)} className="border border-border-strong bg-background text-foreground px-4 py-2 rounded-sm text-sm font-medium hover:bg-surface">Got it</button>
            </div>
          </div>
        </div>
      )}

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4">
          <div className="bg-background rounded-md w-full max-w-md shadow-xl border border-border flex flex-col h-[500px]">
             <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-foreground font-semibold text-lg">Notifications</h2>
              <button onClick={() => setIsNotificationsOpen(false)} className="text-muted hover:text-foreground"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
               <div className="flex-1 flex flex-col items-center justify-center py-8 border-b border-border mb-4">
                 <Bell size={24} className="mx-auto mb-2 opacity-50 text-muted" />
                 <p className="text-sm font-medium text-muted">You're all caught up!</p>
                 <p className="text-xs mt-1 text-muted">No new notifications at this time.</p>
               </div>
               
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Email Alerts</span>
                    <select 
                      value={emailAlerts}
                      onChange={e => setEmailAlerts(e.target.value)}
                      className="border border-border rounded-sm p-1.5 text-xs bg-surface outline-none w-32"
                    >
                      <option>All events</option>
                      <option>Mentions only</option>
                      <option>None</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Desktop Notifications</span>
                    <select 
                      value={desktopNotifs}
                      onChange={e => setDesktopNotifs(e.target.value)}
                      className="border border-border rounded-sm p-1.5 text-xs bg-surface outline-none w-32"
                    >
                      <option>Enabled</option>
                      <option>Muted for 1h</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-muted">Digest Frequency</span>
                    <select 
                      value={digestFreq}
                      onChange={e => setDigestFreq(e.target.value)}
                      className="border border-border rounded-sm p-1.5 text-xs bg-surface outline-none w-32"
                    >
                      <option>Real-time</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
               </div>
            </div>
            <div className="p-4 border-t border-border bg-surface flex justify-end">
              <button onClick={saveNotifications} className="bg-foreground text-background px-4 py-2 rounded-sm text-sm font-medium hover:bg-foreground-hover">Save Preferences</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
