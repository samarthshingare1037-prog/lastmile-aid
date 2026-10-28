import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar, TopBar } from '@/app/shell';
import { useAppStore } from '@/app/store';
import { useIsMobile } from '@/hooks';
import { mockApi } from '@/api/mockApi';
import type { DeliveryTask } from '@/api/types';

function IncomingDispatchAlertBanner() {
  const user = useAppStore((s) => s.user);
  const navigate = useNavigate();
  const [claimedTask, setClaimedTask] = useState<DeliveryTask | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const checkAlerts = async () => {
    try {
      const courierId = user?.id || 'rider1';
      const allTasks = await mockApi.listTasks({});
      const alertTask = allTasks.find(
        (t) => (t.claimedBy === courierId || t.claimedBy === 'rider1') && t.status === 'CLAIMED'
      );
      setClaimedTask(alertTask || null);
      if (alertTask?.claimExpiresAtUtc) {
        setSecondsLeft(Math.max(0, Math.floor((new Date(alertTask.claimExpiresAtUtc).getTime() - Date.now()) / 1000)));
      }
    } catch {}
  };

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!claimedTask?.claimExpiresAtUtc) return;
    const expiry = claimedTask.claimExpiresAtUtc;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        checkAlerts();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [claimedTask]);

  if (!claimedTask) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #DC2626 0%, #D97706 100%)',
      color: '#FFFFFF',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
      zIndex: 1000,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 700 }}>
        <span style={{
          backgroundColor: '#FFFFFF', color: '#DC2626',
          padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 900,
        }}>
          🚨 DISPATCH ALERT
        </span>
        <span>
          New Dispatch Request: <strong>{claimedTask.quantity} {claimedTask.unit || 'meals'}</strong> for {claimedTask.siteName || 'Shelter'}
        </span>
        <span style={{
          backgroundColor: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '6px',
          fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: '0.8125rem',
        }}>
          ⏱️ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} to accept
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={async () => {
            const courierId = user?.id || 'rider1';
            await mockApi.acknowledgeTask(courierId, claimedTask.id);
            navigate('/rider');
            checkAlerts();
          }}
          style={{
            padding: '6px 14px', borderRadius: '8px', border: 'none',
            backgroundColor: '#10B981', color: '#FFFFFF', fontWeight: 800,
            fontSize: '0.8125rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          ✓ Accept Dispatch
        </button>

        <button
          onClick={() => navigate('/rider')}
          style={{
            padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)',
            backgroundColor: 'transparent', color: '#FFFFFF', fontWeight: 600,
            fontSize: '0.8125rem', cursor: 'pointer',
          }}
        >
          View Courier Hub →
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <a href="#main-content" className="skip-to-content">Skip to content</a>

      <Sidebar />

      {/* Main content area */}
      <div style={{
        marginLeft: isMobile ? 0 : (sidebarOpen ? 240 : 72),
        paddingBottom: isMobile ? 80 : 0,
        transition: 'margin-left 0.25s ease',
        minHeight: '100vh',
      }}>
        <TopBar />
        <IncomingDispatchAlertBanner />
        <main id="main-content" style={{ padding: '24px', maxWidth: 1280, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Outlet />
    </div>
  );
}
