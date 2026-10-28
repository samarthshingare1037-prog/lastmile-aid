import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { Donation, DeliveryTask, DeliveryEvent } from '@/api/types';
import { StatusBadge, UrgencyBadge, CountdownTimer, ProgressBar, Modal } from '@/components/ui';
import {
  ArrowLeft, Clock, MapPin, ShieldAlert, CheckCircle2,
  Package, Truck, Building2, QrCode, AlertTriangle, Sparkles, RefreshCw
} from 'lucide-react';

export default function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [donation, setDonation] = useState<Donation | null>(null);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const data = await mockApi.getDonation(id);
      setDonation(data.donation);
      setTasks(data.tasks);
      setEvents(data.events);
    } catch (err: any) {
      setError(err?.message || 'Could not load donation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const interval = setInterval(fetchDetail, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await mockApi.cancelDonation(user.id, id, 'Donor cancelled manually');
      await fetchDetail();
      setShowCancelModal(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel donation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOpenGate = async () => {
    if (!id || !user) return;
    const confirmConversion = window.confirm(
      'Switch unallocated meals to Open Gate community collection at your pickup location?'
    );
    if (!confirmConversion) return;

    setActionLoading(true);
    try {
      await mockApi.switchToOpenGate(user.id, id, {
        opensAtUtc: new Date().toISOString(),
        closesAtUtc: donation?.expiryUtc || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        instructions: 'Community members can collect directly at the main entrance gate.',
      });
      await fetchDetail();
    } catch (err: any) {
      alert(err?.message || 'Failed to switch to Open Gate');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        <RefreshCw style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        Loading donation coordinates...
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '2rem', background: 'var(--color-surface)', borderRadius: '12px' }}>
        <AlertTriangle style={{ width: 36, height: 36, color: '#DC2626', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Donation Not Found</h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>{error || 'This donation record does not exist.'}</p>
        <button
          onClick={() => navigate('/donor')}
          style={{ padding: '8px 18px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/donor')}
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
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowQrModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <QrCode style={{ width: 15, height: 15 }} /> Pickup QR Pass
          </button>

          {['PUBLISHED', 'PARTIALLY_ALLOCATED', 'ALLOCATED', 'NEEDS_ASSISTANCE'].includes(donation.status) && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#DC2626',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel Donation
            </button>
          )}
        </div>
      </div>

      {/* Main Status & Hero Card */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <StatusBadge status={donation.status} size="md" />
              <CountdownTimer expiryUtc={donation.expiryUtc} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', marginTop: '0.5rem' }}>
              {donation.description}
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Total Surplus</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {donation.quantity} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{donation.unit}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
          <ProgressBar
            current={donation.deliveredQty}
            total={donation.quantity}
            unit={donation.unit}
            color="#0F766E"
            height={10}
          />
        </div>

        {/* Key Attributes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Category
            </span>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginTop: '2px' }}>{donation.category}</p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Pickup Location
            </span>
            <p style={{ fontWeight: 500, fontSize: '0.875rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
              {donation.pickup.address}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Safe Expiry Window
            </span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#DC2626', marginTop: '2px' }}>
              {new Date(donation.expiryUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(donation.expiryUtc).toLocaleDateString()})
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Distribution Mode
            </span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px', color: donation.mode === 'VOLUNTEER' ? 'var(--color-primary)' : '#7E22CE' }}>
              {donation.mode === 'VOLUNTEER' ? 'Volunteer Dispatch' : 'Open Gate Community'}
            </p>
          </div>
        </div>

        {donation.handlingInstructions && (
          <div style={{ marginTop: '1.25rem', padding: '10px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid var(--color-border)', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
            <strong>Handling instructions:</strong> {donation.handlingInstructions}
          </div>
        )}
      </div>

      {/* Exception banner if assistance needed */}
      {donation.status === 'NEEDS_ASSISTANCE' && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle style={{ width: 24, height: 24, color: '#D97706', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#92400E' }}>
                Unallocated Surplus — Courier Capacity Limited
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#B45309', marginTop: '2px' }}>
                Some portions have not yet found courier capacity before expiry. You can convert the remaining meals to an Open Gate listing for direct community collection.
              </div>
            </div>
          </div>
          <button
            onClick={handleConvertToOpenGate}
            disabled={actionLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#D97706',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Switch to Open Gate
          </button>
        </div>
      )}

      {/* Delivery Task Batches */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Dispatch & Allocation Batches ({tasks.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
              Splits generated by deterministic matching based on shelter capacity and rider limits.
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            Matching engine is currently analyzing nearby shelters...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 118, 110, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    <Truck style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                      {task.siteName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                      Batch: <strong>{task.quantity} {task.unit}</strong> • Courier: {task.claimedByName || 'Awaiting Claim'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={task.status} size="sm" />
                  <button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      background: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    View Task
                  </button>
                </div>
              </div>
            ))}
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
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
          Realtime Audit Trail ({events.length} events)
        </h2>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{ev.type}</span>
                  <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                    {new Date(ev.createdAtUtc).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: 'var(--color-muted)', marginTop: '2px' }}>
                  Actor: <strong>{ev.actorName || ev.actor || 'System'}</strong> • {JSON.stringify(ev.payload)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup QR Pass Modal */}
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="Pickup Verification QR Pass">
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div
            style={{
              width: '180px',
              height: '180px',
              margin: '0 auto 1.5rem',
              padding: '12px',
              borderRadius: '12px',
              border: '2px dashed var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#F8FAFC',
            }}
          >
            <QrCode style={{ width: 140, height: 140, color: 'var(--color-text)' }} />
          </div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
            Pass Code: #{donation.id.slice(-6).toUpperCase()}
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.25rem', maxWidth: '300px', margin: '0 auto' }}>
            Show this verification pass or QR code to the volunteer rider upon food handover.
          </p>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Surplus Donation">
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '1.25rem' }}>
            Are you sure you want to cancel this donation? Any active courier assignments will be cancelled and returned to the pool.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => setShowCancelModal(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Keep Active
            </button>
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: '#DC2626',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
