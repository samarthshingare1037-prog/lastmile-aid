import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { DeliveryTask, TaskStatus } from '@/api/types';
import { StatusBadge, UrgencyBadge, CountdownTimer, Modal } from '@/components/ui';
import {
  Truck, Clock, MapPin, AlertTriangle, ShieldCheck, CheckCircle2,
  Search, Filter, Navigation, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';

export default function TaskBoard() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'OPEN' | 'CRITICAL' | 'MY_TASKS' | 'COMPLETED'>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');

  // Claim modal
  const [selectedTaskToClaim, setSelectedTaskToClaim] = useState<DeliveryTask | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const data = await mockApi.listTasks({});
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async () => {
    if (!selectedTaskToClaim || !user) return;
    setClaiming(true);
    setClaimError(null);

    try {
      await mockApi.claimTask(selectedTaskToClaim.id, user.id);
      setSelectedTaskToClaim(null);
      await fetchTasks();
      navigate(`/tasks/${selectedTaskToClaim.id}`);
    } catch (err: any) {
      setClaimError(err?.message || 'Failed to claim task. It may have been claimed by another courier.');
    } finally {
      setClaiming(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const sName = (t.siteName || '').toLowerCase();
    const pAddr = (t.pickupAddress || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = sName.includes(query) || pAddr.includes(query) || t.id.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    // Tabs
    if (filterTab === 'OPEN') return t.status === 'OPEN';
    if (filterTab === 'CRITICAL') {
      const msLeft = new Date(t.dropoffDeadlineUtc || Date.now() + 2 * 3600 * 1000).getTime() - Date.now();
      return msLeft < 3600 * 1000 && t.status === 'OPEN';
    }
    if (filterTab === 'MY_TASKS') return t.claimedBy === user?.id;
    if (filterTab === 'COMPLETED') return ['DELIVERED', 'DELIVERED_VERIFIED'].includes(t.status);
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Courier Dispatch Board
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Real-time delivery missions sorted strictly by FEFO (First Expiring, First Out).
          </p>
        </div>

        <button
          onClick={fetchTasks}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
        </button>
      </div>

      {/* FEFO Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          marginBottom: '1.5rem',
        }}
      >
        <Clock style={{ width: 20, height: 20, color: '#1D4ED8', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8125rem', color: '#1E40AF', lineHeight: 1.4 }}>
          <strong>Deterministic FEFO Priority:</strong> Missions near their safe expiry limit receive elevated matching priority. When you claim a task, a <strong>10-minute claim TTL timer</strong> protects the allocation while you acknowledge.
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { id: 'OPEN', label: 'Available (Open)' },
            { id: 'CRITICAL', label: '🔥 Urgent (<1h)' },
            { id: 'MY_TASKS', label: 'My Claimed' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'ALL', label: 'All Tasks' },
          ].map((tab) => {
            const isSelected = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--color-muted)',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search style={{ width: 16, height: 16, position: 'absolute', left: '12px', top: '10px', color: 'var(--color-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination or address..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              outline: 'none',
              backgroundColor: 'var(--color-surface)',
            }}
          />
        </div>
      </div>

      {/* Task List Cards */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading dispatch board...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: '16px',
          }}
        >
          <CheckCircle2 style={{ width: 36, height: 36, color: '#16A34A', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Tasks in this Filter</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Try selecting a different tab or checking back shortly.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.25rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Left Route & Info */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <StatusBadge status={task.status} size="sm" />
                  <CountdownTimer expiryUtc={task.dropoffDeadlineUtc || ''} prefix="Safe deadline:" />
                  {task.requiresColdBag && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7', backgroundColor: '#E0F2FE', padding: '2px 8px', borderRadius: '9999px' }}>
                      ❄ Cold Bag Required
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    {task.quantity} {task.unit}
                  </h3>
                  <span style={{ color: 'var(--color-muted)' }}>➔</span>
                  <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {task.siteName}
                  </span>
                </div>

                {/* Route points */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '8px', fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin style={{ width: 14, height: 14, color: '#16A34A', flexShrink: 0 }} />
                    <span>Pickup: <strong>{task.pickupAddress}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin style={{ width: 14, height: 14, color: '#DC2626', flexShrink: 0 }} />
                    <span>Dropoff: <strong>{task.siteAddress}</strong></span>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '6px' }}>
                  Estimated transit: <strong>~{task.etaMinutes} mins</strong> • Courier: {task.claimedByName || 'Unclaimed'}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  View Mission
                </button>

                {task.status === 'OPEN' && (
                  <button
                    onClick={() => setSelectedTaskToClaim(task)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                    }}
                  >
                    Claim Task <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}

                {task.claimedBy === user?.id && ['CLAIMED', 'ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT'].includes(task.status) && (
                  <button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Continue Delivery <Navigation style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Confirmation Modal */}
      <Modal
        isOpen={!!selectedTaskToClaim}
        onClose={() => {
          setSelectedTaskToClaim(null);
          setClaimError(null);
        }}
        title="Confirm Task Claim"
      >
        {selectedTaskToClaim && (
          <div>
            {claimError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#B91C1C',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{claimError}</span>
              </div>
            )}

            <div style={{ backgroundColor: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                {selectedTaskToClaim.quantity} {selectedTaskToClaim.unit} ➔ {selectedTaskToClaim.siteName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                Pickup: {selectedTaskToClaim.pickupAddress}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#DC2626', fontWeight: 600, marginTop: '4px' }}>
                Deadline: {new Date(selectedTaskToClaim.dropoffDeadlineUtc || Date.now()).toLocaleTimeString()}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                marginBottom: '1.5rem',
              }}
            >
              <AlertTriangle style={{ width: 20, height: 20, color: '#D97706', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8125rem', color: '#92400E' }}>
                <strong>10-Minute Claim TTL:</strong> You have 10 minutes to acknowledge and begin the pickup. If unacknowledged, this task will auto-return to the open courier pool to prevent food spoilage.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedTaskToClaim(null)}
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
                onClick={handleClaim}
                disabled={claiming}
                style={{
                  padding: '8px 22px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: claiming ? 'not-allowed' : 'pointer',
                }}
              >
                {claiming ? 'Reserving...' : 'Confirm & Claim'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
