import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutGrid, Folders, FileText, Settings, Archive, HelpCircle, LogOut, Bell, Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const { user, signOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-[#111111] font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-[#EEEEEE] flex flex-col bg-[#FFFFFF] h-full flex-shrink-0 z-10">
        <div className="p-6 pb-8">
          <h1 className="text-xl font-bold tracking-tight text-[#111]">Executive</h1>
          <p className="text-[10px] tracking-[0.2em] font-medium text-[#888] uppercase mt-1">Productivity</p>
        </div>

        <div className="px-6 mb-8">
          <NavLink to="/docs" className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-sm flex items-center justify-center space-x-2 hover:bg-[#222] transition-colors">
            <span>+</span> <span>New Entry</span>
          </NavLink>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavLink to="/" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-[#F5F5F5] font-semibold text-[#111]" : "text-[#555] hover:bg-[#FAFAFA]")}>
            {({ isActive }) => (
              <>
                <LayoutGrid size={16} className={isActive ? "text-[#111]" : "text-[#888]"} />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>
          <NavLink to="/drive" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-[#F5F5F5] font-semibold text-[#111]" : "text-[#555] hover:bg-[#FAFAFA]")}>
            {({ isActive }) => (
              <>
                <Folders size={16} className={isActive ? "text-[#111]" : "text-[#888]"} />
                <span>Drive Connect</span>
              </>
            )}
          </NavLink>
          <NavLink to="/mail" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-[#F5F5F5] font-semibold text-[#111]" : "text-[#555] hover:bg-[#FAFAFA]")}>
            {({ isActive }) => (
              <>
                <Archive size={16} className={isActive ? "text-[#111]" : "text-[#888]"} />
                <span>Mail Queue</span>
              </>
            )}
          </NavLink>
          <NavLink to="/docs" className={({ isActive }) => cn("flex items-center space-x-3 px-3 py-2.5 text-sm rounded-sm transition-colors", isActive ? "bg-[#F5F5F5] font-semibold text-[#111]" : "text-[#555] hover:bg-[#FAFAFA]")}>
            {({ isActive }) => (
              <>
                <FileText size={16} className={isActive ? "text-[#111]" : "text-[#888]"} />
                <span>Documents</span>
              </>
            )}
          </NavLink>
        </nav>

        <div className="mt-auto px-4 py-6 border-t border-[#EEEEEE] space-y-1">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA] rounded-sm transition-colors"
          >
            <HelpCircle size={16} className="text-[#888]" />
            <span>Help</span>
          </button>
          <button 
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA] rounded-sm transition-colors cursor-pointer"
          >
            <LogOut size={16} className="text-[#888]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FDFDFD]">
        {/* Top Header */}
        <header className="h-[64px] border-b border-[#EEEEEE] flex items-center justify-between px-8 bg-[#FFFFFF] flex-shrink-0">
          <div className="flex items-center font-semibold text-[#111]">
            Workspace
          </div>
          
          <div className="flex-1 max-w-xl mx-8 relative">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
               <SearchIcon size={14} className="text-[#888]" />
             </div>
             <input 
               type="text" 
               placeholder="Search across Workspace..." 
               className="w-full bg-[#F5F5F5] border-none text-sm rounded-sm pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-[#DDDDDD] placeholder-[#888] transition-all"
             />
          </div>

          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setIsNotificationsOpen(true)}
               className="text-[#888] hover:text-[#111] transition-colors"
             >
               <Bell size={18} />
             </button>
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="text-[#888] hover:text-[#111] transition-colors"
             >
               <Settings size={18} />
             </button>
             <div className="w-7 h-7 rounded-full bg-[#EEE] overflow-hidden border border-[#DDD]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md w-full max-w-md shadow-xl border border-[#EEE]">
            <div className="flex items-center justify-between p-4 border-b border-[#EEE]">
              <h2 className="text-[#111] font-semibold text-lg">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[#888] hover:text-[#111]"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Theme Preference</label>
                <select className="w-full border border-[#EEE] rounded-sm p-2 text-sm bg-[#F5F5F5] outline-none">
                  <option>Light (Default)</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#333] mb-1">Email Notifications</label>
                <select className="w-full border border-[#EEE] rounded-sm p-2 text-sm bg-[#F5F5F5] outline-none">
                  <option>All actions</option>
                  <option>Mentions only</option>
                  <option>None</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#EEE] bg-[#FAFAFA] flex justify-end">
              <button onClick={() => setIsSettingsOpen(false)} className="bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#222]">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md w-full max-w-sm shadow-xl border border-[#EEE]">
            <div className="flex items-center justify-between p-4 border-b border-[#EEE]">
              <h2 className="text-[#111] font-semibold text-lg">Help Center</h2>
              <button onClick={() => setIsHelpOpen(false)} className="text-[#888] hover:text-[#111]"><X size={18}/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#555] mb-4">Welcome to Executive Productivity! Here you can manage your emails, drive documents, and notes all in one place with AI assistance.</p>
              <ul className="text-sm text-[#333] space-y-2 list-disc pl-4">
                <li>Use <strong>Drive Connect</strong> to preview your files and analyze them with Gemini.</li>
                <li>Go to <strong>Mail Queue</strong> to read, compose, reply, and summarize active threads.</li>
                <li>Visit <strong>Documents</strong> to write rich notes, use the AI assistant, or link Drive files.</li>
              </ul>
            </div>
            <div className="p-4 border-t border-[#EEE] bg-[#FAFAFA] flex justify-end">
              <button onClick={() => setIsHelpOpen(false)} className="border border-[#DDD] bg-white text-[#111] px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#F5F5F5]">Got it</button>
            </div>
          </div>
        </div>
      )}

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md w-full max-w-md shadow-xl border border-[#EEE] flex flex-col h-[500px]">
             <div className="flex items-center justify-between p-4 border-b border-[#EEE]">
              <h2 className="text-[#111] font-semibold text-lg">Notifications</h2>
              <button onClick={() => setIsNotificationsOpen(false)} className="text-[#888] hover:text-[#111]"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
               <div className="flex-1 flex flex-col items-center justify-center py-8 border-b border-[#EEEEEE] mb-4">
                 <Bell size={24} className="mx-auto mb-2 opacity-50 text-[#888]" />
                 <p className="text-sm font-medium text-[#888]">You're all caught up!</p>
                 <p className="text-xs mt-1 text-[#888]">No new notifications at this time.</p>
               </div>
               
               <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111]">Notification Preferences</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#333]">Email Alerts</span>
                    <select className="border border-[#EEE] rounded-sm p-1.5 text-xs bg-[#F5F5F5] outline-none w-32">
                      <option>All events</option>
                      <option>Mentions only</option>
                      <option>None</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#333]">Desktop Notifications</span>
                    <select className="border border-[#EEE] rounded-sm p-1.5 text-xs bg-[#F5F5F5] outline-none w-32">
                      <option>Enabled</option>
                      <option>Muted for 1h</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#333]">Digest Frequency</span>
                    <select className="border border-[#EEE] rounded-sm p-1.5 text-xs bg-[#F5F5F5] outline-none w-32">
                      <option>Real-time</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
               </div>
            </div>
            <div className="p-4 border-t border-[#EEE] bg-[#FAFAFA] flex justify-end">
              <button onClick={() => setIsNotificationsOpen(false)} className="bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#222]">Save Preferences</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
