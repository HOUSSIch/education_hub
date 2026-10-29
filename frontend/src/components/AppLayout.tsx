import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Icon, type IconName } from './Icon';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

interface NavItem { icon: IconName; label: string; path: string; }

const navigationByRole: Record<UserRole, NavItem[]> = {
  ETUDIANT: [
    { icon: 'dashboard', label: 'Tableau de bord', path: '/dashboard' }, { icon: 'book', label: 'Mes cours', path: '/courses' }, { icon: 'file', label: 'Mes devoirs', path: '/assignments' }, { icon: 'quiz', label: 'Mes quiz', path: '/quizzes' }, { icon: 'calendar', label: 'Mon emploi du temps', path: '/planning' }, { icon: 'chart', label: 'Mes résultats', path: '/results' }, { icon: 'profile', label: 'Profil', path: '/profile' },
  ],
  ENSEIGNANT: [
    { icon: 'dashboard', label: 'Tableau de bord', path: '/teacher/dashboard' }, { icon: 'book', label: 'Mes cours', path: '/teacher/courses' }, { icon: 'file', label: 'Mes devoirs', path: '/teacher/assignments' }, { icon: 'quiz', label: 'Mes quiz', path: '/teacher/quizzes' }, { icon: 'inbox', label: 'Soumissions', path: '/teacher/submissions' }, { icon: 'chart', label: 'Résultats Quiz', path: '/teacher/results' }, { icon: 'calendar', label: 'Mon emploi du temps', path: '/teacher/planning' }, { icon: 'warning', label: 'Mes réclamations', path: '/teacher/planning/complaints' }, { icon: 'profile', label: 'Profil', path: '/profile' },
  ],
  ADMIN: [
    { icon: 'dashboard', label: 'Tableau de bord', path: '/admin/dashboard' }, { icon: 'users', label: 'Utilisateurs', path: '/admin/users' }, { icon: 'book', label: 'Cours', path: '/admin/courses' }, { icon: 'file', label: 'Devoirs', path: '/admin/assignments' }, { icon: 'quiz', label: 'Quiz', path: '/admin/quizzes' }, { icon: 'calendar', label: 'Emploi du temps', path: '/admin/planning' }, { icon: 'warning', label: 'Réclamations planning', path: '/admin/planning/complaints' }, { icon: 'chart', label: 'Résultats', path: '/admin/results' }, { icon: 'profile', label: 'Profil', path: '/profile' },
  ],
};

const roleDetails: Record<UserRole, { label: string; color: string }> = {
  ETUDIANT: { label: 'Étudiant', color: '#818cf8' },
  ENSEIGNANT: { label: 'Enseignant', color: '#a78bfa' },
  ADMIN: { label: 'Administrateur', color: '#f59e0b' },
};

interface AppLayoutProps {
  children: ReactNode;
  /** Conservé pour les pages du template ; le rôle affiché vient toujours de Django. */
  role?: 'learner' | 'teacher' | 'admin';
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = navigationByRole[user.role];
  const role = roleDetails[user.role];
  const displayName = `${user.first_name} ${user.last_name}`.trim() || user.username;
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#07070f', overflow: 'hidden' }}>
      <aside style={{ width: sidebarCollapsed ? 70 : 240, transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', background: 'rgba(11,11,20,0.95)', borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowX: 'hidden', position: 'relative', zIndex: 10 }}>
        <div style={{ padding: sidebarCollapsed ? '14px 16px' : '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <Logo size="icon" style={{ width: 34, height: 44, flexShrink: 0 }} />
          {!sidebarCollapsed && <div style={{ overflow: 'hidden', minWidth: 0 }}><div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>HUB ÉDUCATIF</div><div style={{ fontSize: 10, color: '#D9A93A', whiteSpace: 'nowrap', fontStyle: 'italic' }}>Multimodal</div></div>}
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' }} className="scrollbar-custom">
          {navItems.map((item) => <NavLink key={item.path} to={item.path} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`} title={sidebarCollapsed ? item.label : undefined} style={sidebarCollapsed ? { justifyContent: 'center', padding: 10 } : {}}><Icon name={item.icon} size={19}/>{!sidebarCollapsed && <span>{item.label}</span>}</NavLink>)}
        </nav>
        <button onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} style={{ position: 'absolute', top: 22, right: -14, width: 28, height: 28, borderRadius: '50%', background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8', zIndex: 20 }} title={sidebarCollapsed ? 'Développer' : 'Réduire'}>{sidebarCollapsed ? '›' : '‹'}</button>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 60, background: 'rgba(11,11,20,0.9)', borderBottom: '1px solid rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, backdropFilter: 'blur(20px)', flexShrink: 0 }}>
          <div aria-label="Recherche contextuelle" title="Recherche disponible dans les pages de gestion" style={{ flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', gap: 10, color:'#64748b' }}><Icon name="search" size={18}/><span style={{fontSize:13}}>Utilisez la recherche des pages de gestion</span></div>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setUserMenuOpen((open) => !open)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700 }}>{initial}</div>
              <div style={{ textAlign: 'left' }}><div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{displayName}</div><div style={{ fontSize: 11, color: role.color }}>{role.label}</div></div><span style={{ color: '#64748b', fontSize: 12 }}>▾</span>
            </button>
            {userMenuOpen && <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#0f0f1c', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 8, minWidth: 180, zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <NavLink to="/profile" onClick={() => setUserMenuOpen(false)} className="sidebar-item" style={{ display: 'flex', padding: '9px 12px', color: '#cbd5e1' }}><Icon name="profile" size={18}/><span>Mon profil</span></NavLink>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color: '#f87171', fontSize: 13, cursor: 'pointer' }}><Icon name="logout" size={18}/><span>Déconnexion</span></button>
            </div>}
          </div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#07070f' }} className="scrollbar-custom">{children}</main>
      </div>
    </div>
  );
}
