import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { DeliveryTask, RiderAvailability } from '@/api/types';
import { StatCard, StatusBadge, CountdownTimer } from '@/components/ui';
import {
  Truck, Award, Clock, CheckCircle2, AlertTriangle, ArrowRight,
  ShieldCheck, MapPin, Navigation, ToggleLeft, ToggleRight, Sparkles, RefreshCw, XCircle
} from 'lucide-react';

function DispatchAcceptanceTimer({ expiryUtc, onExpire }: { expiryUtc: string; onExpire?: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(expiryUtc).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiryUtc).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryUtc, onExpire]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      borderRadius: '20px',
      background: isUrgent ? '#FEE2E2' : '#FEF3C7',
      color: isUrgent ? '#B91C1C' : '#B45309',
      fontWeight: 800,
      fontSize: '0.875rem',
      fontVariantNumeric: 'tabular-nums',
      border: `1px solid ${isUrgent ? '#FCA5A5' : '#FDE68A'}`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    }}>
      <Clock size={15} className="animate-spin" />
      <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')} remaining to accept</span>
    </div>
  );
}

export default function RiderDashboard() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [availability, setAvailability] = useState<RiderAvailability>({
    isAvailable: true,
    capacityQty: 40,
    capacityUnit: 'meals',
    hasColdBag: true,
    radiusKm: 15,
  });
  const [incomingAlertTask, setIncomingAlertTask] = useState<DeliveryTask | null>(null);
  const [activeTask, setActiveTask] = useState<DeliveryTask | null>(null);
  const [availableTasks, setAvailableTasks] = useState<DeliveryTask[]>([]);
  const [credits, setCredits] = useState<number>(120);
  const [completedCount, setCompletedCount] = useState<number>(8);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    const courierId = user?.id || 'rider1';
    try {
      const allTasks = await mockApi.listTasks({});

      // Incoming alert task awaiting rider acceptance (CLAIMED with active timer)
      const incoming = allTasks.find(
        (t) => (t.claimedBy === courierId || t.claimedBy === 'rider1') && t.status === 'CLAIMED'
      );
      setIncomingAlertTask(incoming || null);

      // Active accepted task in progress
      const myActive = allTasks.find(
        (t) => (t.claimedBy === courierId || t.claimedBy === 'rider1') &&
          ['ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT', 'REROUTE_PROPOSED'].includes(t.status)
      );
      setActiveTask(myActive || null);

      // Available tasks in open pool
      const openTasks = allTasks.filter((t) => t.status === 'OPEN');
      setAvailableTasks(openTasks);

      // Credits
      const creds = await mockApi.myCredits(courierId);
      setCredits(creds.balance);
      setCompletedCount(creds.completedDeliveries);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleOnline = () => {
    setAvailability((prev) => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  const updateCapacity = (cap: number) => {
    setAvailability((prev) => ({ ...prev, capacityQty: cap }));
  };

  const handleAcceptDispatch = async (taskId: string) => {
    const courierId = user?.id || 'rider1';
    setActionLoading(taskId);
    try {
      await mockApi.acknowledgeTask(courierId, taskId);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to accept dispatch');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineDispatch = async (taskId: string) => {
    const courierId = user?.id || 'rider1';
    setActionLoading(taskId);
    try {
      await (mockApi as any).declineTask(courierId, taskId);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to decline dispatch');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaim = async (taskId: string) => {
    const courierId = user?.id || 'rider1';
    setActionLoading(taskId);
    try {
      await mockApi.claimTask(taskId, courierId);
      await loadData();
      navigate(`/tasks/${taskId}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to claim task');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Banner & Online Toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          padding: '1.5rem 2rem',
          borderRadius: '16px',
          background: availability.isAvailable
            ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)'
            : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
          color: '#FFFFFF',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.3s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, opacity: 0.9 }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: availability.isAvailable ? '#4ADE80' : '#CBD5E1',
                boxShadow: availability.isAvailable ? '0 0 8px #4ADE80' : 'none',
              }}
            />
            {availability.isAvailable ? 'DISPATCH READY' : 'OFFLINE'}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
            Volunteer Courier Hub
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.85, marginTop: '2px' }}>
            Matching time-sensitive surplus food to verified shelters across your route.
          </p>
        </div>

        {/* Toggle + Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={toggleOnline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              color: availability.isAvailable ? '#0F766E' : '#334155',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {availability.isAvailable ? <ToggleRight style={{ width: 22, height: 22, color: '#0F766E' }} /> : <ToggleLeft style={{ width: 22, height: 22, color: '#64748B' }} />}
            {availability.isAvailable ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Capacity & Readiness Controls */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Truck style={{ width: 22, height: 22, color: 'var(--color-primary)' }} />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Current Vehicle Capacity: <span style={{ color: 'var(--color-primary)' }}>{availability.capacityQty} meals limit</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              Surplus donations larger than this (e.g. 180 meals) are automatically split across multiple couriers.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {[20, 40, 60, 100].map((cap) => (
            <button
              key={cap}
              onClick={() => updateCapacity(cap)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                border: availability.capacityQty === cap ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: availability.capacityQty === cap ? 'rgba(15, 118, 110, 0.1)' : 'var(--color-surface)',
                color: availability.capacityQty === cap ? 'var(--color-primary)' : 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              {cap} meals
            </button>
          ))}
        </div>
      </div>

      {/* 🚨 INCOMING DISPATCH ALERT SECTION WITH LIVE COUNTDOWN TIMER */}
      {incomingAlertTask && (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF2F2 100%)',
            border: '2px solid #F59E0B',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#DC2626', color: '#FFFFFF',
                padding: '4px 10px', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}>
                🚨 INCOMING DISPATCH ALERT
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#B45309' }}>
                Action Required: Courier Acceptance
              </span>
            </div>

            {/* Countdown Section */}
            <DispatchAcceptanceTimer
              expiryUtc={incomingAlertTask.claimExpiresAtUtc || new Date(Date.now() + 5 * 60_000).toISOString()}
              onExpire={loadData}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E293B', marginBottom: '6px' }}>
                Deliver {incomingAlertTask.quantity} {incomingAlertTask.unit || 'meals'} to {incomingAlertTask.siteName || 'Shelter'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.4 }}>
                <strong>Pickup:</strong> {incomingAlertTask.pickupAddress || 'Grand Hyatt Banquet Hall, 88 Marine Drive'}<br />
                <strong>Destination:</strong> {incomingAlertTask.siteAddress || '89 Byculla Relief Gate, South Mumbai'} (~{incomingAlertTask.etaMinutes || 15}m transit)
              </p>
              <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '6px', fontWeight: 700 }}>
                💡 Split Courier Batch: Matched to your 40-meal vehicle capacity limit.
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Volunteer Recognition:</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F766E', marginTop: '2px' }}>
                +50 Impact Credits
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                Awarded idempotently upon shelter handover verification.
              </div>
            </div>
          </div>

          {/* Action Buttons: Accept & Decline */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button
              type="button"
              disabled={actionLoading === incomingAlertTask.id}
              onClick={() => handleAcceptDispatch(incomingAlertTask.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
              }}
            >
              <CheckCircle2 style={{ width: 18, height: 18 }} />
              {actionLoading === incomingAlertTask.id ? 'Locking Route...' : 'Accept Dispatch & Lock Route'}
            </button>

            <button
              type="button"
              disabled={actionLoading === incomingAlertTask.id}
              onClick={() => handleDeclineDispatch(incomingAlertTask.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 20px',
                backgroundColor: '#FFFFFF',
                color: '#DC2626',
                borderRadius: '10px',
                border: '1px solid #FCA5A5',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <XCircle style={{ width: 16, height: 16 }} /> Decline / Pass to Next Rider
            </button>
          </div>
        </div>
      )}

      {/* Active Mission Card if in progress */}
      {activeTask && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(15, 118, 110, 0.06) 100%)',
            border: '2px solid #2563EB',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ACTIVE MISSION IN PROGRESS
                </span>
                <StatusBadge status={activeTask.status} size="sm" />
                <CountdownTimer expiryUtc={activeTask.dropoffDeadlineUtc || ''} prefix="Safe Delivery Window:" />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
                Deliver {activeTask.quantity} {activeTask.unit || 'meals'} to {activeTask.siteName || 'Shelter'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                Pickup: {activeTask.pickupAddress || 'Origin'}
              </p>
            </div>

            <button
              onClick={() => navigate(`/tasks/${activeTask.id}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              Continue Mission <Navigation style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      )}

      {/* Stats Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard
          title="Active Missions"
          value={activeTask ? '1 IN TRANSIT' : incomingAlertTask ? '1 ALERT' : 'READY'}
          subtitle={activeTask ? activeTask.siteName : incomingAlertTask ? 'Acceptance pending' : 'No active mission'}
          icon={<Truck style={{ width: 22, height: 22 }} />}
          iconBg="rgba(37, 99, 235, 0.1)"
          iconColor="#2563EB"
        />
        <StatCard
          title="Verified Deliveries"
          value={completedCount}
          subtitle="All-time completed"
          icon={<CheckCircle2 style={{ width: 22, height: 22 }} />}
          iconBg="rgba(21, 128, 61, 0.1)"
          iconColor="#15803D"
        />
        <StatCard
          title="Impact Credits"
          value={credits}
          subtitle="Redeemable badge rank"
          icon={<Award style={{ width: 22, height: 22 }} />}
          iconBg="rgba(245, 158, 11, 0.1)"
          iconColor="#D97706"
          trend="+15 this week"
        />
        <StatCard
          title="On-Time Reliability"
          value="100%"
          subtitle="Zero expired claims"
          icon={<ShieldCheck style={{ width: 22, height: 22 }} />}
          iconBg="rgba(15, 118, 110, 0.1)"
          iconColor="#0F766E"
        />
      </div>

      {/* Available Missions Pool */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Open Dispatch Pool ({availableTasks.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              Surplus food batches split to respect courier vehicle limits. Claim to accept.
            </p>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            View Kanban Board →
          </button>
        </div>

        {availableTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            No unassigned missions currently in the pool. Standing by for donor surplus broadcasts.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {availableTasks.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  background: 'var(--color-surface)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      SPLIT BATCH: {t.quantity} {t.unit || 'meals'}
                    </span>
                    <CountdownTimer expiryUtc={t.dropoffDeadlineUtc || ''} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {t.siteName || 'Destination Shelter'}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Pickup: {t.pickupAddress}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
                    ~{t.etaMinutes || 20}m transit
                  </span>
                  <button
                    onClick={() => handleClaim(t.id)}
                    disabled={actionLoading === t.id}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    {actionLoading === t.id ? 'Claiming...' : 'Claim Batch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
