import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { DeliveryTask, Donation, ReceivingSite, DeliveryEvent } from '@/api/types';
import { StatusBadge, CountdownTimer } from '@/components/ui';
import {
  Sparkles, RefreshCw, AlertTriangle, Play, ShieldAlert, Ban,
  Truck, CheckCircle2, UserX, Clock, Building2, Terminal, ArrowRight,
  Database
} from 'lucide-react';

export default function AdminConsole() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [sites, setSites] = useState<ReceivingSite[]>([]);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  const refreshMatrix = async () => {
    try {
      const allDons = mockApi.sim.getAllDonations();
      const allTasks = mockApi.sim.getAllTasks();
      const allSites = mockApi.sim.getAllSites();
      const allEvents = mockApi.sim.getAllEvents();

      setDonations(allDons);
      setTasks(allTasks);
      setSites(allSites);
      setEvents(allEvents.reverse().slice(0, 30));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMatrix();
    const interval = setInterval(refreshMatrix, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerSim = async (action: string, fn: () => Promise<any>, successMsg: string) => {
    try {
      await fn();
      setSimMessage(successMsg);
      await refreshMatrix();
      setTimeout(() => setSimMessage(null), 4000);
    } catch (err: any) {
      alert(`Simulation error: ${err?.message || 'Failed'}`);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Console Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#0F766E', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
              ADMIN CONTROLS
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
              DETERMINISTIC DISPATCH & RESILIENCE SIMULATOR
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', marginTop: '4px' }}>
            Mission Control & Simulation Center
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/admin/audit')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Full Immutable Audit Log
          </button>
          <button
            onClick={refreshMatrix}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh Matrix
          </button>
        </div>
      </div>

      {simMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#15803D',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '1.5rem',
          }}
        >
          <CheckCircle2 style={{ width: 18, height: 18 }} />
          <span>{simMessage}</span>
        </div>
      )}

      {/* 3-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 340px) 1fr minmax(320px, 380px)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* COLUMN 1: Simulation Triggers */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
              1. Simulation Triggers
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              Execute stress scenarios and verify platform resilience.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Trigger 1: Run Matching */}
            <button
              onClick={() => {
                const targetDon = donations.find((d) => ['PUBLISHED', 'PARTIALLY_ALLOCATED', 'NEEDS_ASSISTANCE'].includes(d.status)) || donations[0];
                if (targetDon) {
                  triggerSim('matching', () => mockApi.sim.runMatching(targetDon.id), `Matching engine ran for ${targetDon.description.slice(0, 24)}!`);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                color: '#1D4ED8',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <Play style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div>Trigger Deterministic Matching</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>Run greedy allocation across shelters</div>
              </div>
            </button>

            {/* Trigger 2: Claim Expiry TTL */}
            <button
              onClick={() => triggerSim('claim_expiry', () => mockApi.sim.runClaimExpiry(), 'Claim TTL Sweeper ran: Stale claims returned to pool!')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #FDE68A',
                background: '#FFFBEB',
                color: '#B45309',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <Clock style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div>Expire Claim TTLs</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>Auto-reclaims unacknowledged missions</div>
              </div>
            </button>

            {/* Trigger 3: FEFO Sweeper */}
            <button
              onClick={() => triggerSim('sweeper', () => mockApi.sim.runExpirySweeper(), 'FEFO Sweeper evaluated all food expiry windows!')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: '#F8FAFC',
                color: 'var(--color-text)',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div>Run Expiry Sweeper</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-muted)' }}>Flag unallocated surplus near deadline</div>
              </div>
            </button>

            {/* Trigger 4: Simulate Rider Dropout */}
            <button
              onClick={() => {
                triggerSim(
                  'dropout',
                  () => mockApi.sim.makeRiderUnresponsive('rider1'),
                  'Simulated: Rider 1 went unresponsive! Active task auto-reassigned to pool!'
                );
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#B91C1C',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <UserX style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div>Simulate Rider Dropout</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>Tests unreliability fault tolerance</div>
              </div>
            </button>

            {/* Trigger 5: Simulate Shelter Full */}
            <button
              onClick={() => {
                const targetSite = sites.find((s) => s.status === 'OPEN') || sites[0];
                if (targetSite) {
                  triggerSim(
                    'site_full',
                    () => mockApi.sim.setSiteFull(targetSite.id),
                    `Simulated: ${targetSite.name} marked FULL! Reroute proposals triggered!`
                  );
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #FFEDD5',
                background: '#FFF7ED',
                color: '#C2410C',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              <Ban style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div>Simulate Shelter Full</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>Triggers automatic courier reroutes</div>
              </div>
            </button>

            {/* Trigger 6: Reset State */}
            <button
              onClick={() => triggerSim('reset', () => mockApi.sim.reset(), 'Reset store to initial wedding donation seed state!')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: '#FFFFFF',
                color: 'var(--color-muted)',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              <Database style={{ width: 18, height: 18, flexShrink: 0 }} />
              <div>
                <div>Reset Seed Data</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 400 }}>Restore fresh demo state</div>
              </div>
            </button>
          </div>
        </div>

        {/* COLUMN 2: Live Platform Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Donations */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
              Surplus Donations Matrix ({donations.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {donations.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StatusBadge status={d.status} size="sm" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{d.description.slice(0, 36)}...</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                      Allocated: <strong>{d.allocatedQty}/{d.quantity} {d.unit}</strong> • Delivered: <strong>{d.deliveredQty}</strong>
                    </div>
                  </div>

                  <CountdownTimer expiryUtc={d.expiryUtc} />
                </div>
              ))}
            </div>
          </div>

          {/* Active Tasks & Couriers */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
              Active Delivery Missions ({tasks.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <StatusBadge status={t.status} size="sm" />
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t.quantity} {t.unit} ➔ {t.siteName}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                      Courier: <strong>{t.claimedByName || 'Unclaimed'}</strong> • ETA: ~{t.etaMinutes} mins
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      background: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Shelters & Capacities */}
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
              Shelter Intake & Demand Status ({sites.length})
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {sites.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: s.status === 'FULL' ? '#FEF2F2' : '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{s.name}</span>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Demand: {s.demand.map((d) => `${d.demandQty} ${d.unit}`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Live Event Log */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Terminal style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Real-Time System Log
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '650px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{ev.type}</span>
                  <span style={{ color: 'var(--color-muted)', fontSize: '0.6875rem' }}>
                    {new Date(ev.createdAtUtc).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: 'var(--color-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                  Actor: <strong>{ev.actorName || ev.actor || 'System'}</strong>
                </div>
                <div style={{ color: 'var(--color-text)', marginTop: '2px', fontFamily: 'monospace', fontSize: '0.6875rem' }}>
                  {JSON.stringify(ev.payload)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
