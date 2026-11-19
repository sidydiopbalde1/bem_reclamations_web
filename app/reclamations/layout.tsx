'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { canManageUsers } from '@/lib/auth';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  MOYENS_GENERAUX: 'Moyens Généraux',
  REGULATEUR: 'Régulateur',
  VIGILE: 'Vigile',
  DELEGUE: 'Délégué',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#CC0000',
  MOYENS_GENERAUX: '#D97706',
  REGULATEUR: '#7C3AED',
  VIGILE: '#2563EB',
  DELEGUE: '#16A34A',
};

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const dim = `${size * 4}px`;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: dim,
        height: dim,
        fontSize: size <= 8 ? '12px' : '14px',
        background: '#CC0000',
      }}
    >
      {initials}
    </div>
  );
}

type LayoutUser = ReturnType<typeof useAuth>['user'];

function ReclamationsLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center animate-fade-in">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center text-white text-xl font-black"
          style={{ background: '#CC0000' }}>
          R
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="animate-spin-slow" width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#E2E8F0" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#CC0000" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          Chargement…
        </div>
      </div>
    </div>
  );
}

function getNavItems(role?: string) {
  const listLabel = role === 'REGULATEUR' ? 'Mes réclamations' : 'Liste des réclamations';
  const items = [
    {
      href: '/reclamations',
      label: 'Tableau de bord',
      icon: (
        <>
          <path d="M3 12.5 12 4l9 8.5"/>
          <path d="M5 10.5V19h14v-8.5"/>
        </>
      ),
      hidden: role === 'REGULATEUR' || role === 'DELEGUE',
    },
    {
      href: '/reclamations/list',
      label: listLabel,
      icon: (
        <>
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </>
      ),
    },
    {
      href: '/reclamations/new',
      label: 'Nouvelle réclamation',
      icon: <path d="M12 5v14M5 12h14"/>,
      hidden: role === 'MOYENS_GENERAUX' || role === 'REGULATEUR',
    },
  ];
  return items.filter((i) => !i.hidden);
}

function NavLinks({ pathname, user, onClose }: { pathname: string; user: LayoutUser; onClose?: () => void }) {
  const isActive = (href: string) => pathname === href;
  const NAV_ITEMS = getNavItems(user?.role);

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
            style={{
              background: active ? 'rgba(204,0,0,0.08)' : 'transparent',
              color: active ? '#CC0000' : '#475569',
              fontWeight: active ? 600 : 500,
            }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: active ? 1 : 0.6 }}
            >
              {icon}
            </svg>
            {label}
          </Link>
        );
      })}

      {user && canManageUsers(user.role) && (
        <Link
          href="/reclamations/users"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{
            background: isActive('/reclamations/users') ? 'rgba(204,0,0,0.08)' : 'transparent',
            color: isActive('/reclamations/users') ? '#CC0000' : '#475569',
            fontWeight: isActive('/reclamations/users') ? 600 : 500,
          }}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: isActive('/reclamations/users') ? 1 : 0.6 }}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="10" cy="7" r="4"/>
            <path d="M20 8v6M17 11h6"/>
          </svg>
          Utilisateurs
        </Link>
      )}

      {user && user.role === 'ADMIN' && (
        <Link
          href="/reclamations/logs"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{
            background: isActive('/reclamations/logs') ? 'rgba(204,0,0,0.08)' : 'transparent',
            color: isActive('/reclamations/logs') ? '#CC0000' : '#475569',
            fontWeight: isActive('/reclamations/logs') ? 600 : 500,
          }}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: isActive('/reclamations/logs') ? 1 : 0.6 }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Journaux d'activité
        </Link>
      )}
    </nav>
  );
}

function ReclamationsLayoutContent({
  children,
  user,
  loading,
  logout,
}: {
  children: React.ReactNode;
  user: LayoutUser;
  loading: boolean;
  logout: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user?.mustChangePassword && pathname !== '/reclamations/change-password') {
      router.replace('/reclamations/change-password');
    }
  }, [user, loading, router, pathname]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (loading) return <ReclamationsLoadingState />;
  if (!user) return null;

  // Page de changement de mot de passe obligatoire : pas de navigation
  if (user.mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ── Topbar ── */}
      <header
        className="sticky top-0 z-40 bg-white"
        style={{ borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
      >
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6">

          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <Link href="/reclamations" className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white flex-shrink-0"
                style={{ background: '#CC0000' }}
              >
                R
              </div>
              <span className="text-sm font-bold text-slate-800 hidden sm:block">Réclamations</span>
            </Link>
          </div>

          {/* Right: user pill + logout */}
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-2.5 rounded-full px-3 py-1.5"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <Avatar name={user.fullName} size={7} />
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-slate-800">{user.fullName}</p>
                <p className="text-[10px] font-medium" style={{ color: ROLE_COLORS[user.role] ?? '#CC0000' }}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2.5} className="hidden sm:block">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Déconnexion"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 max-w-[85vw] bg-white flex flex-col"
            style={{ boxShadow: '4px 0 24px rgba(15,23,42,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
                  style={{ background: '#CC0000' }}
                >
                  R
                </div>
                <span className="text-sm font-bold text-slate-800">Réclamations</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Drawer nav */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} user={user} onClose={() => setMobileOpen(false)} />
            </div>

            {/* Drawer footer */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <Avatar name={user.fullName} size={8} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{user.fullName}</div>
                  <div className="text-xs font-medium" style={{ color: ROLE_COLORS[user.role] ?? '#CC0000' }}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex min-h-[calc(100vh-56px)]">

        {/* Desktop sidebar */}
        <aside
          className="sticky top-14 hidden h-[calc(100vh-56px)] w-56 shrink-0 bg-white lg:flex lg:flex-col"
          style={{ borderRight: '1px solid #E2E8F0' }}
        >
          {/* Brand block */}
          <div className="px-5 py-5" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black text-white flex-shrink-0"
                style={{ background: '#CC0000' }}
              >
                R
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">BEM Dakar</div>
                <div className="text-sm font-bold text-slate-800">Réclamations</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
            <NavLinks pathname={pathname} user={user} />
          </div>

          {/* User footer */}
          <div className="px-4 py-4" style={{ borderTop: '1px solid #F1F5F9' }}>
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <Avatar name={user.fullName} size={8} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-800">{user.fullName}</div>
                <div className="text-[10px] font-medium" style={{ color: ROLE_COLORS[user.role] ?? '#CC0000' }}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0 px-4 py-6 md:px-6 lg:px-8 animate-fade-in">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function ReclamationsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  return (
    <Suspense fallback={<ReclamationsLoadingState />}>
      <ReclamationsLayoutContent user={user} loading={loading} logout={logout}>
        {children}
      </ReclamationsLayoutContent>
    </Suspense>
  );
}
