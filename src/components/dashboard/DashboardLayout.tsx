import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Leaf, LayoutDashboard, BookOpen, UtensilsCrossed, Camera, BarChart3,
  MessageCircle, CalendarDays, User, LogOut, Menu, X, ChevronRight, Lock
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard',          icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/dashboard/journal',  icon: <BookOpen size={18} />,        label: 'Food Journal' },
  { to: '/dashboard/recipes',  icon: <UtensilsCrossed size={18} />, label: 'Food & Recipes' },
  { to: '/dashboard/analyzer', icon: <Camera size={18} />,          label: 'AI Analyzer' },
  { to: '/dashboard/analytics',icon: <BarChart3 size={18} />,       label: 'Analytics' },
  { to: '/dashboard/chat',     icon: <MessageCircle size={18} />,   label: 'Nutrition Chat' },
  { to: '/dashboard/meal-plan',icon: <CalendarDays size={18} />,    label: 'Meal Planner' },
  { to: '/dashboard/profile',  icon: <User size={18} />,            label: 'Profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const isProfileComplete = user?.isProfileComplete ?? true;

  // Close sidebar on route change (mobile)
  useEffect(() => { 
    setSidebarOpen(false); 
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLockedClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    setLockedNotice(`Please complete your profile details first to unlock ${label}.`);
    setTimeout(() => setLockedNotice(null), 3500);
  };

  const currentPage = navItems.find(n => n.end
    ? location.pathname === n.to
    : location.pathname.startsWith(n.to))?.label || 'Dashboard';

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0B1E29] text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-green-400" strokeWidth={2.2} />
        </div>
        <div className="font-serif-display text-xl font-bold text-white tracking-tight">
          Nutri<span className="text-green-400">Craft</span>
        </div>
        {sidebarOpen && (
          <button
            className="ml-auto md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Navigation</p>
          {!isProfileComplete && (
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              <Lock size={10} /> Locked
            </span>
          )}
        </div>
        {navItems.map((item) => {
          const isItemLocked = !isProfileComplete && item.to !== '/dashboard/profile';
          const isProfileTab = item.to === '/dashboard/profile';

          if (isItemLocked) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={(e) => handleLockedClick(e, item.label)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-400 hover:bg-white/5 opacity-60 cursor-not-allowed transition-all text-left"
                title="Complete profile first to unlock"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
                <Lock size={13} className="ml-auto text-amber-400/80 shrink-0" />
              </button>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-green-600/20 text-green-400 font-semibold border-r-2 border-green-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                } ${isProfileTab && !isProfileComplete ? 'ring-1 ring-amber-500/40 bg-amber-500/10 text-amber-300' : ''}`
              }
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
              {isProfileTab && !isProfileComplete ? (
                <span className="ml-auto text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                  Required 1st
                </span>
              ) : (
                <ChevronRight size={14} className="ml-auto opacity-40" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/10 shrink-0 bg-[#07151e]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-green-400">
              {isProfileComplete ? 'Pro Member' : 'Profile Setup Required'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-800 antialiased selection:bg-green-100 selection:text-green-800">
      {/* ── Desktop Sidebar (Sticky & Fixed width, no margin hacks) ─── */}
      <aside className="hidden md:flex w-64 min-w-[16rem] h-screen sticky top-0 shrink-0 z-30 border-r border-white/5 shadow-md">
        {renderSidebarContent()}
      </aside>

      {/* ── Mobile Sidebar Drawer ───────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl">
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* ── Main Content Area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="text-slate-400 hover:text-green-600 transition-colors font-medium">
                Home
              </Link>
              {currentPage !== 'Dashboard' && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="font-bold text-slate-800">{currentPage}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-green-600 transition-colors hidden sm:block">
              Landing Page
            </Link>
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <Link to="/dashboard/profile" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-green-700 transition-colors">
                  {user?.name}
                </div>
                <div className="text-[10px] text-green-600 font-medium">Verified Client</div>
              </div>
            </Link>
          </div>
        </header>

        {/* Global Floating Locked Notice Toast */}
        {lockedNotice && (
          <div className="fixed top-18 right-6 z-50 p-4 rounded-2xl bg-amber-900/95 text-amber-100 border border-amber-500/60 shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 backdrop-blur-md transition-all animate-bounce">
            <Lock size={16} className="text-amber-400 shrink-0" />
            <span>{lockedNotice}</span>
          </div>
        )}

        {/* Onboarding Notice Banner for Incomplete Profiles */}
        {!isProfileComplete && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-bold text-amber-950">Nutritional Profile Setup Required:</span>
              <span className="text-amber-900 hidden md:inline">
                Please complete and save your biometric details below to calculate your daily caloric targets and unlock all NutriCraft features.
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold text-[10px] border border-amber-300 uppercase tracking-wider shrink-0">
              Step 1 Required
            </span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 safe-area-bottom">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1E29]/95 backdrop-blur-md border-t border-white/10 px-2 pt-1.5 pb-2 safe-area-bottom md:hidden flex items-center justify-around shadow-2xl">
        {(!isProfileComplete
          ? [
              { to: '/dashboard/profile', icon: <User size={18} />, label: 'Profile' },
              { to: '/dashboard',         icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
              { to: '/dashboard/journal', icon: <BookOpen size={18} />, label: 'Journal' },
              { to: '/dashboard/recipes', icon: <UtensilsCrossed size={18} />, label: 'Recipes' },
            ]
          : navItems.slice(0, 5)
        ).map((item) => {
          const isLocked = !isProfileComplete && item.to !== '/dashboard/profile';
          const isActive = location.pathname === item.to;

          if (isLocked) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={(e) => handleLockedClick(e, item.label)}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium text-slate-500 opacity-50 cursor-not-allowed"
              >
                <div className="p-1 relative">
                  {item.icon}
                  <Lock size={10} className="absolute -top-0.5 -right-0.5 text-amber-400" />
                </div>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? 'text-green-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-green-500/20' : ''}`}>
                {item.icon}
              </div>
              <span className="truncate max-w-[56px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
