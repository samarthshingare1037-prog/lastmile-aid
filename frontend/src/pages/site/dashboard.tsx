import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { ReceivingSite, DeliveryTask, SiteStatus, Capability } from '@/api/types';
import { StatusBadge, Modal } from '@/components/ui';
import { CAPABILITY_LABELS } from '@/lib/constants';
import {
  Building2, ShieldCheck, CheckCircle2, AlertTriangle, Clock,
  Truck, ArrowLeft, Plus, Edit2, Ban, RefreshCw, Award
} from 'lucide-react';

export default function SiteDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [site, setSite] = useState<ReceivingSite | null>(null);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Demand editing modal
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('COOKED_MEAL');
  const [newDemandQty, setNewDemandQty] = useState(150);

  const fetchSite = async () => {
    try {
      const sites = await mockApi.listSites();
      const currentSite = sites.find((s) => s.id === id) || sites[0];
      setSite(currentSite);

      if (currentSite) {
        const allTasks = await mockApi.listTasks({});
        setTasks(allTasks.filter((t) => t.siteId === currentSite.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSite();
    const interval = setInterval(fetchSite, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleStatusChange = async (newStatus: SiteStatus) => {
    if (!site || !user) return;
    setActionLoading(true);
    try {
      await mockApi.updateSiteStatus(site.id, newStatus, user.id);
      await fetchSite();
    } catch (err: any) {
      alert(err?.message || 'Failed to update site status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCapabilityToggle = async (cap: Capability) => {
    if (!site) return;
    const updated = {
      ...site.capabilities,
      [cap]: !site.capabilities[cap],
    };
    try {
      await mockApi.updateSiteCapabilities(site.id, updated);
      await fetchSite();
    } catch (err: any) {
      alert(err?.message || 'Failed to update capability');
    }
  };

  const handleUpdateDemand = async () => {
    if (!site) return;
    try {
      await mockApi.updateSiteDemand(site.id, selectedCat, newDemandQty);
      setShowDemandModal(false);
      await fetchSite();
    } catch (err: any) {
      alert(err?.message || 'Failed to update demand');
    }
  };

  const handleVerifyReceipt = async (taskId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await mockApi.verifyDelivery(taskId, user.id);
      await fetchSite();
    } catch (err: any) {
      alert(err?.message || 'Failed to verify receipt');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !site) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        <RefreshCw style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        Loading receiving site dashboard...
      </div>
    );
  }

  const incomingDeliveries = tasks.filter((t) => ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(t.status));
  const verifiedDeliveries = tasks.filter((t) => t.status === 'DELIVERED_VERIFIED');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/ngos')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-muted)',
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back to NGO Directory
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {site.name}
            </h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
              <ShieldCheck style={{ width: 14, height: 14 }} /> Verified Site
            </span>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {site.orgName} • {site.address}
          </p>
        </div>

        {/* Status Switcher Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface)', padding: '6px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          {(['OPEN', 'FULL', 'CLOSED'] as SiteStatus[]).map((st) => {
            const isSelected = site.status === st;
            const bg =
              st === 'OPEN' ? '#15803D' :
              st === 'FULL' ? '#DC2626' : '#64748B';
            return (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  backgroundColor: isSelected ? bg : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--color-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'OPEN' ? '🟢 Open (Accepting)' : st === 'FULL' ? '🔴 Capacity Full' : '⚪ Closed'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Capacity Alert if FULL */}
      {site.status === 'FULL' && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderRadius: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Ban style={{ width: 24, height: 24, color: '#DC2626', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#B91C1C' }}>
              Intake Capacity Locked (Full)
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#991B1B', marginTop: '2px' }}>
              New allocations will not be dispatched here. In-transit deliveries will be offered automated reroute proposals to partner shelters.
            </div>
          </div>
        </div>
      )}

      {/* Grid: Demand Table & Capabilities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Unmet Demand Editor */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Target Demand Requirements
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                Matching engine caps incoming batches to your remaining unmet demand.
              </p>
            </div>

            <button
              onClick={() => setShowDemandModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 118, 110, 0.1)',
                color: 'var(--color-primary)',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Edit2 style={{ width: 14, height: 14 }} /> Edit Target
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {site.demand.map((dm) => {
              const remaining = Math.max(0, dm.demandQty - dm.reservedQty - dm.receivedQty);
              return (
                <div
                  key={dm.category}
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {dm.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: remaining > 0 ? '#15803D' : '#64748B' }}>
                      {remaining > 0 ? `${remaining} ${dm.unit} still needed` : 'Demand Satisfied'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.75rem', color: 'var(--color-muted)', backgroundColor: '#F8FAFC', padding: '8px', borderRadius: '6px' }}>
                    <div>Target: <strong>{dm.demandQty}</strong></div>
                    <div>Reserved: <strong>{dm.reservedQty}</strong></div>
                    <div>Received: <strong>{dm.receivedQty}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Site Capabilities Toggles */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            Facility Storage & Safety Capabilities
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
            Items requiring cold chain or special handling are only dispatched if checked.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(Object.keys(CAPABILITY_LABELS) as Capability[]).map((cap) => {
              const enabled = !!site.capabilities[cap];
              return (
                <div
                  key={cap}
                  onClick={() => handleCapabilityToggle(cap)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: enabled ? '1px solid #BBF7D0' : '1px solid var(--color-border)',
                    backgroundColor: enabled ? '#F0FDF4' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: enabled ? '#15803D' : 'var(--color-text)' }}>
                    {CAPABILITY_LABELS[cap]}
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => {}}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incoming Deliveries & Verification */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
          Incoming & Delivered Batches ({tasks.length})
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
          When couriers arrive with meals, click <strong>Confirm Receipt & Verify</strong> to release volunteer credits and close the loop.
        </p>

        {tasks.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            No delivery batches currently assigned to this site.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <StatusBadge status={task.status} size="sm" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      Batch #{task.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {task.quantity} {task.unit} from {task.pickupAddress}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                    Courier: <strong>{task.claimedByName || 'Awaiting assignment'}</strong> • ETA: ~{task.etaMinutes} mins
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {task.status === 'DELIVERED' && (
                    <button
                      onClick={() => handleVerifyReceipt(task.id)}
                      disabled={actionLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        backgroundColor: '#15803D',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                      }}
                    >
                      <CheckCircle2 style={{ width: 16, height: 16 }} /> Confirm Receipt & Issue Credits
                    </button>
                  )}

                  {task.status === 'DELIVERED_VERIFIED' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', fontWeight: 700, color: '#15803D' }}>
                      <CheckCircle2 style={{ width: 16, height: 16 }} /> Verified & Accepted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demand Edit Modal */}
      <Modal isOpen={showDemandModal} onClose={() => setShowDemandModal(false)} title="Update Site Food Demand">
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Category
            </label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <option value="COOKED_MEAL">Cooked Meals</option>
              <option value="RAW_RATION_KIT">Raw Ration Kits</option>
              <option value="COLD_CHAIN_FOOD">Cold Chain Food</option>
              <option value="PACKAGED_DRY_GOODS">Packaged Dry Goods</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Target Demand (Quantity)
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              value={newDemandQty}
              onChange={(e) => setNewDemandQty(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => setShowDemandModal(false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'none' }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateDemand}
              style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700 }}
            >
              Save Demand
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
