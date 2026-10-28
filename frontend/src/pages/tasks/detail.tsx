import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { DeliveryTask, DeliveryEvent } from '@/api/types';
import { StatusBadge, CountdownTimer, Modal } from '@/components/ui';
import {
  ArrowLeft, Truck, CheckCircle2, Clock, MapPin, Navigation,
  ShieldCheck, AlertTriangle, AlertCircle, Phone, Sparkles, RefreshCw,
  CornerDownRight, Route
} from 'lucide-react';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [task, setTask] = useState<DeliveryTask | null>(null);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery confirmation modal
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [recipientName, setRecipientName] = useState('Pooja Verma (Intake Coordinator)');
  const [recipientNotes, setRecipientNotes] = useState('All 60 meal boxes inspected, hot & sealed.');

  const fetchTask = async () => {
    if (!id) return;
    try {
      const data = await mockApi.getTask(id);
      setTask(data.task);
      setEvents(data.events);
    } catch (err: any) {
      setError(err?.message || 'Task not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    const interval = setInterval(fetchTask, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // Stepper state actions
  const handleAcknowledge = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await mockApi.acknowledgeTask(id, user.id);
      await fetchTask();
    } catch (err: any) {
      alert(err?.message || 'Could not acknowledge task');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await mockApi.pickupTask(id, user.id);
      await fetchTask();
    } catch (err: any) {
      alert(err?.message || 'Could not confirm pickup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await mockApi.deliverTask(id, user.id, {
        recipientName,
        notes: recipientNotes,
      });
      setShowDeliverModal(false);
      await fetchTask();
    } catch (err: any) {
      alert(err?.message || 'Could not record delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptReroute = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await mockApi.acceptReroute(id, user.id);
      await fetchTask();
    } catch (err: any) {
      alert(err?.message || 'Failed to accept reroute');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectReroute = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await mockApi.rejectReroute(id, user.id);
      await fetchTask();
    } catch (err: any) {
      alert(err?.message || 'Failed to reject reroute');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        <RefreshCw style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        Loading mission status...
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2rem', background: 'var(--color-surface)', borderRadius: '12px' }}>
        <AlertTriangle style={{ width: 36, height: 36, color: '#DC2626', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Task Not Found</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>{error || 'This task does not exist.'}</p>
        <button
          onClick={() => navigate('/tasks')}
          style={{ padding: '8px 18px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Return to Task Board
        </button>
      </div>
    );
  }

  // Determine current active step
  const steps = [
    { key: 'CLAIMED', label: 'Claimed', desc: '10m Acknowledgment TTL' },
    { key: 'ACKNOWLEDGED', label: 'En Route to Pickup', desc: 'Heading to Donor' },
    { key: 'PICKED_UP', label: 'Picked Up', desc: 'Food In Custody' },
    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'Heading to Shelter' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Intake Recorded' },
    { key: 'DELIVERED_VERIFIED', label: 'Verified', desc: 'Credits Issued' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'OPEN': return -1;
      case 'CLAIMED': return 0;
      case 'ACKNOWLEDGED': return 1;
      case 'PICKED_UP': return 2;
      case 'IN_TRANSIT': return 3;
      case 'REROUTE_PROPOSED': return 3;
      case 'DELIVERED': return 4;
      case 'DELIVERED_VERIFIED': return 5;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(task.status);
  const isMyTask = task.claimedBy === user?.id;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top back & refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-muted)',
            background: 'none',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Task Board
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={task.status} size="md" />
          <CountdownTimer expiryUtc={task.claimExpiresAtUtc || task.dropoffDeadlineUtc || ''} prefix="Safe deadline:" />
        </div>
      </div>

      {/* Reroute Proposal Emergency Banner */}
      {task.status === 'REROUTE_PROPOSED' && task.proposedReroute && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '2px solid #EA580C',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Route style={{ width: 28, height: 28, color: '#C2410C', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C2410C', textTransform: 'uppercase' }}>
                  SHELTER FULL • EMERGENCY REROUTE PROPOSED
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#EA580C', color: '#fff', padding: '2px 8px', borderRadius: '9999px' }}>
                  +{task.proposedReroute.extraCredits || 15} Bonus Credits
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9A3412', marginTop: '4px' }}>
                Reroute to: {task.proposedReroute.newSiteName}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#C2410C', marginTop: '2px' }}>
                Address: {task.proposedReroute.newSiteAddress} • Extra distance: +{task.proposedReroute.extraKm} km
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#9A3412', marginTop: '4px' }}>
                Reason: {task.proposedReroute.reason}
              </p>

              {isMyTask && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={handleAcceptReroute}
                    disabled={actionLoading}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      backgroundColor: '#C2410C',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Accept Reroute (+Bonus Credits)
                  </button>
                  <button
                    onClick={handleRejectReroute}
                    disabled={actionLoading}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: '1px solid #C2410C',
                      backgroundColor: 'transparent',
                      color: '#9A3412',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cannot Accept (Return to Hub)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stepper Progress Bar */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mission Execution Stepper
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: '0.5rem' }}>
          {steps.map((st, i) => {
            const isCompleted = currentStepIdx > i;
            const isCurrent = currentStepIdx === i;
            return (
              <div key={st.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    backgroundColor: isCompleted ? '#16A34A' : isCurrent ? 'var(--color-primary)' : '#E2E8F0',
                    color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--color-muted)',
                    marginBottom: '8px',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(15, 118, 110, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--color-text)' : 'var(--color-muted)' }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Overview Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', fontWeight: 600 }}>
              Mission #{task.id.slice(-6).toUpperCase()}
            </span>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '2px' }}>
              Transport {task.quantity} {task.unit} to {task.siteName}
            </h1>
          </div>

          {/* Action Button based on step */}
          {isMyTask && (
            <div>
              {task.status === 'CLAIMED' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={actionLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                  }}
                >
                  {actionLoading ? 'Acknowledging...' : 'Acknowledge & Begin Pickup'}
                  <Navigation style={{ width: 18, height: 18 }} />
                </button>
              )}

              {task.status === 'ACKNOWLEDGED' && (
                <button
                  onClick={handlePickup}
                  disabled={actionLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                  }}
                >
                  {actionLoading ? 'Recording Pickup...' : 'Confirm Food Picked Up'}
                  <CheckCircle2 style={{ width: 18, height: 18 }} />
                </button>
              )}

              {(task.status === 'PICKED_UP' || task.status === 'IN_TRANSIT') && (
                <button
                  onClick={() => setShowDeliverModal(true)}
                  disabled={actionLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                  }}
                >
                  Record Handover at Shelter
                  <CheckCircle2 style={{ width: 18, height: 18 }} />
                </button>
              )}

              {task.status === 'DELIVERED_VERIFIED' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontWeight: 700 }}>
                  <ShieldCheck style={{ width: 22, height: 22 }} /> Mission Completed & Verified!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Route Details Box */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--color-border)',
            marginBottom: '1.5rem',
          }}
        >
          {/* Pickup */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>
              <MapPin style={{ width: 14, height: 14 }} /> 1. Pickup Origin
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)', marginTop: '4px' }}>
              {task.pickupAddress}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              Donor contact available upon arrival.
            </div>
          </div>

          {/* Dropoff */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
              <MapPin style={{ width: 14, height: 14 }} /> 2. Destination Shelter
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)', marginTop: '4px' }}>
              {task.siteName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              {task.siteAddress}
            </div>
          </div>
        </div>

        {/* Dispatch Note */}
        {task.matchingMetadata?.note && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '0.8125rem', color: '#1E40AF' }}>
            <strong>Matching Engine Note:</strong> {task.matchingMetadata.note}
          </div>
        )}
      </div>

      {/* Realtime Event Log */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
          Mission Timeline & Events ({events.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  marginTop: '5px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{ev.type}</span>
                  <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                    {new Date(ev.createdAtUtc).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: 'var(--color-muted)', marginTop: '2px' }}>
                  By: <strong>{ev.actorName || ev.actor || 'System'}</strong> • {JSON.stringify(ev.payload)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deliver Handover Modal */}
      <Modal isOpen={showDeliverModal} onClose={() => setShowDeliverModal(false)} title="Record Delivery Handover">
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Shelter Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Handover Inspection Notes
            </label>
            <textarea
              rows={3}
              value={recipientNotes}
              onChange={(e) => setRecipientNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => setShowDeliverModal(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeliver}
              disabled={actionLoading}
              style={{
                padding: '8px 22px',
                borderRadius: '8px',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {actionLoading ? 'Submitting...' : 'Confirm Handover & Claim Credits'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
