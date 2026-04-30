import { Outlet, NavLink } from 'react-router-dom';
import { LayoutGrid, Folders, FileText, Settings, Archive, HelpCircle, LogOut, Bell, Search as SearchIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen bg-[#FDFDFD] text-[#111111] font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-[260px] border-r border-[#EEEEEE] flex flex-col bg-[#FFFFFF] h-full flex-shrink-0 z-10">
        <div className="p-6 pb-8">
          <h1 className="text-xl font-bold tracking-tight text-[#111]">Executive</h1>
          <p className="text-[10px] tracking-[0.2em] font-medium text-[#888] uppercase mt-1">Productivity</p>
        </div>

        <div className="px-6 mb-8">
          <button className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-sm flex items-center justify-center space-x-2 hover:bg-[#222] transition-colors">
            <span>+</span> <span>New Entry</span>
          </button>
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
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#555] hover:bg-[#FAFAFA] rounded-sm transition-colors">
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
             <button className="text-[#888] hover:text-[#111] transition-colors">
               <Bell size={18} />
             </button>
             <button className="text-[#888] hover:text-[#111] transition-colors">
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
    </div>
  );
}
