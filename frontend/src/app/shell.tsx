import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { useIsMobile } from '@/hooks';
import type { Role } from '@/api/types';
import {
  LayoutDashboard, PlusCircle, Building2, DoorOpen, Award, Bell,
  ClipboardList, Map, AlertCircle, Activity, FileText, Users,
  Settings, Truck, Menu, Sun, Moon, LogOut, ChevronDown, X,
} from 'lucide-react';

const ROLE_LABELS: Record<Role, string> = {
  DONOR: 'Donor', RIDER: 'Volunteer', HELPER: 'Helper',
  NGO_OPERATOR: 'NGO Operator', ADMIN: 'Admin',
};

const NAV: Record<Role, { label: string; path: string; icon: React.ReactNode }[]> = {
  DONOR: [
    { label: 'Dashboard',    path: '/donor',         icon: <LayoutDashboard size={20} /> },
    { label: 'New Donation', path: '/donations/new', icon: <PlusCircle size={20} /> },
    { label: 'NGOs',         path: '/ngos',           icon: <Building2 size={20} /> },
    { label: 'Open Gate',    path: '/open-gate',      icon: <DoorOpen size={20} /> },
    { label: 'Credits',      path: '/credits',        icon: <Award size={20} /> },
    { label: 'Notifications',path: '/notifications',  icon: <Bell size={20} /> },
  ],
  RIDER: [
    { label: 'Dashboard',    path: '/rider',          icon: <LayoutDashboard size={20} /> },
    { label: 'Tasks',        path: '/tasks',           icon: <ClipboardList size={20} /> },
    { label: 'Map',          path: '/map',             icon: <Map size={20} /> },
    { label: 'Credits',      path: '/credits',         icon: <Award size={20} /> },
    { label: 'Notifications',path: '/notifications',   icon: <Bell size={20} /> },
  ],
  HELPER: [
    { label: 'Alerts',    path: '/helper',        icon: <AlertCircle size={20} /> },
    { label: 'My Task',   path: '/tasks',          icon: <ClipboardList size={20} /> },
    { label: 'Map',       path: '/map',            icon: <Map size={20} /> },
    { label: 'Credits',   path: '/credits',        icon: <Award size={20} /> },
  ],
  NGO_OPERATOR: [
    { label: 'Operations',   path: '/site/my',        icon: <Activity size={20} /> },
    { label: 'Incoming',     path: '/ngos',            icon: <Truck size={20} /> },
    { label: 'Profile',      path: '/ngos/my',         icon: <Building2 size={20} /> },
    { label: 'Notifications',path: '/notifications',   icon: <Bell size={20} /> },
  ],
  ADMIN: [
    { label: 'Console',   path: '/admin/console', icon: <Settings size={20} /> },
    { label: 'Donations', path: '/donor',          icon: <LayoutDashboard size={20} /> },
    { label: 'Sites',     path: '/ngos',           icon: <Building2 size={20} /> },
    { label: 'Users',     path: '/admin/users',    icon: <Users size={20} /> },
    { label: 'Audit',     path: '/admin/audit',    icon: <FileText size={20} /> },
    { label: 'Events',    path: '/notifications',  icon: <Activity size={20} /> },
  ],
};

/* ── Sidebar ─────────────────────────────────────────── */
export function Sidebar() {
  const { user, activeRole, sidebarOpen, toggleSidebar, isDarkMode, toggleDarkMode, logout } = useAppStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!user || !activeRole) return null;
  const items = NAV[activeRole] || [];

  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
        display: 'flex', justifyContent: 'space-around', height: 64,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {items.slice(0, 5).map((item) => (
          <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, padding: '6px 12px',
            textDecoration: 'none', fontSize: 10, fontWeight: 600,
            color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
            transition: 'color 0.15s',
          })}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    );
  }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, height: '100vh',
      width: sidebarOpen ? 240 : 72,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      zIndex: 30, transition: 'width 0.25s ease',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 60, padding: '0 16px',
        borderBottom: '1px solid var(--color-border)', flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: 'var(--color-primary-fg)', fontWeight: 800, fontSize: 13 }}>LA</span>
        </div>
        {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>LastMile Aid</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} title={item.label} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 8,
            textDecoration: 'none', fontSize: 14, fontWeight: 500,
            color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
            background: isActive ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent',
            transition: 'background 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          })}
            onMouseEnter={(e) => { if (!(e.currentTarget as HTMLElement).style.color.includes('primary')) { (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)'; } }}
            onMouseLeave={(e) => { if (!(e.currentTarget as HTMLElement).style.color.includes('primary')) { (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {sidebarOpen && item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button onClick={toggleDarkMode} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 8, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-muted)', fontSize: 14, fontWeight: 500,
          whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          {sidebarOpen && (isDarkMode ? 'Light Mode' : 'Dark Mode')}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginTop: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 13 }}>
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          {sidebarOpen && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'capitalize' }}>
                  {activeRole.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} style={{
                background: 'none', border: 'none', color: 'var(--color-muted)',
                cursor: 'pointer', display: 'flex', padding: 4,
                borderRadius: 6, transition: 'color 0.15s',
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-muted)'; }}
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ── TopBar ──────────────────────────────────────────── */
export function TopBar() {
  const { user, activeRole, toggleSidebar, isDarkMode } = useAppStore();
  const connectionStatus = useAppStore((s) => s.connectionStatus);

  const connColors = {
    connected:    { dot: '#22c55e', text: 'var(--color-success)' },
    reconnecting: { dot: '#f59e0b', text: 'var(--color-warning)' },
    offline:      { dot: '#94a3b8', text: 'var(--color-neutral)' },
  };
  const connLabels = { connected: 'Live', reconnecting: 'Reconnecting…', offline: 'Offline' };
  const conn = connColors[connectionStatus];

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 20px',
    }}>
      <button onClick={toggleSidebar} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--color-muted)', display: 'flex', padding: 8, borderRadius: 8,
      }}>
        <Menu size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: conn.text }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: conn.dot,
            display: 'inline-block',
          }} className={connectionStatus === 'connected' ? 'animate-pulse-soft' : ''} />
          {connLabels[connectionStatus]}
        </div>

        {/* Role switcher */}
        {user && user.roles.length > 1 && <RoleSwitcher />}

        {/* Notification bell */}
        <button style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--color-muted)', display: 'flex',
          padding: 8, borderRadius: 8,
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 7, height: 7, borderRadius: '50%', background: 'var(--color-danger)',
          }} />
        </button>
      </div>
    </header>
  );
}

/* ── Role Switcher ───────────────────────────────────── */
function RoleSwitcher() {
  const { user, activeRole, setActiveRole } = useAppStore();
  const [open, setOpen] = React.useState(false);
  if (!user || !activeRole) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        background: 'none', border: '1px solid var(--color-border)',
        cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
      }}>
        {ROLE_LABELS[activeRole]}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="animate-slide-up" style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 10, boxShadow: 'var(--shadow-lg)', minWidth: 160, padding: '4px 0', zIndex: 50,
        }}>
          {user.roles.map((role) => (
            <button key={role} onClick={() => { setActiveRole(role); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', padding: '9px 16px',
              background: role === activeRole ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'none',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              color: role === activeRole ? 'var(--color-primary)' : 'var(--color-text)',
            }}>
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
