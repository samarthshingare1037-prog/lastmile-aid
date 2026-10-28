import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import {
  PlusCircle, Clock, AlertTriangle, CheckCircle2, Award, ArrowRight,
  Truck, Building2, MapPin, RefreshCw, UserCheck, ShieldCheck, Heart
} from 'lucide-react';
import { mockApi } from '@/api/mockApi';
import type { Donation, DeliveryTask } from '@/api/types';
import { useUrgency, useCountdown } from '@/hooks';
import { formatCountdown } from '@/lib/format';

const URGENCY_COLORS = {
  NORMAL:   { bg: '#F1F5F9', text: '#475569' },
  URGENT:   { bg: '#FEF3C7', text: '#B45309' },
  CRITICAL: { bg: '#FEE2E2', text: '#B91C1C' },
  EXPIRED:  { bg: '#FEE2E2', text: '#B91C1C' },
};

const URGENCY_LABELS = { NORMAL: 'Normal', URGENT: 'Urgent', CRITICAL: 'Critical', EXPIRED: 'Expired' };

export default function DonorDashboard() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const donorId = user?.id || 'donor1';
      const [dons, allTasks, creditRes] = await Promise.all([
        mockApi.listDonations(donorId),
        mockApi.listTasks({}),
        mockApi.myCredits(donorId),
      ]);
      setDonations(dons);
      setTasks(allTasks);
      setCredits(creditRes.balance);
    } catch (err) {
      console.error('Failed to load donor dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeCount = donations.filter((d) => !['CANCELLED', 'EXPIRED_UNDELIVERED'].includes(d.status)).length;
  const verifiedDeliveredMeals = donations.reduce((sum, d) => sum + (d.deliveredQty || 0), 0);
  const inTransitTasks = tasks.filter((t) => t.status === 'IN_TRANSIT').length;

  const stats = [
    { label: 'Active Donations',     value: activeCount,             icon: <Clock size={20} />,         bg: '#E0F2FE', color: '#0369A1' },
    { label: 'Meals Delivered',      value: verifiedDeliveredMeals,  icon: <CheckCircle2 size={20} />,  bg: '#DCFCE7', color: '#15803D' },
    { label: 'Impact Credits Earned',value: credits,                 icon: <Award size={20} />,          bg: '#FEF3C7', color: '#B45309' },
    { label: 'Couriers In Transit',  value: inTransitTasks,          icon: <Truck size={20} />,          bg: '#F3E8FF', color: '#7E22CE' },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Donor Dispatch Dashboard
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
              ● Live Sync Active
            </span>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 4 }}>
            Welcome back, <strong>{user?.displayName || 'Vikram Sethi (Taj Lands End Banquets)'}</strong> • Real-time Surplus Food Tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleRefresh}
            title="Refresh donations & courier status"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 9,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            onClick={() => navigate('/donations/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 9, border: 'none',
              background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <PlusCircle size={18} /> New Surplus Donation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            padding: 20, borderRadius: 14,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: s.bg, color: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>{s.icon}</div>
            <p style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }} className="tabular-nums">{s.value}</p>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 6, fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Donations List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
            Surplus Food Donations ({donations.length})
          </h2>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            Showing who donated, recipient shelters, assigned couriers & impact credits
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
            <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
            Loading donations from platform database…
          </div>
        ) : donations.length === 0 ? (
          <EmptyDonations onCreate={() => navigate('/donations/new')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {donations.map((d) => (
              <DonationCard
                key={d.id}
                donation={d}
                tasks={tasks.filter((t) => t.donationId === d.id)}
                onClick={() => navigate(`/donations/${d.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DonationCard({
  donation,
  tasks,
  onClick,
}: {
  donation: Donation;
  tasks: DeliveryTask[];
  onClick: () => void;
}) {
  const urgency = useUrgency(donation.expiryUtc);
  const remaining = useCountdown(donation.expiryUtc);
  const uc = URGENCY_COLORS[urgency];

  const allocated = donation.allocatedQty;
  const delivered = donation.deliveredQty;
  const unallocated = Math.max(0, donation.quantity - allocated);
  const pctDelivered = (delivered / donation.quantity) * 100;
  const pctAllocated = (allocated / donation.quantity) * 100;

  // Primary Matched Task & Courier Info
  const primaryTask = tasks[0];
  const recipientName = primaryTask ? primaryTask.siteName : (donation.mode === 'OPEN_GATE' ? 'Open Gate Community Distribution' : 'St. Jude Hope Haven');
  const recipientAddress = primaryTask ? (primaryTask.siteAddress || '89 Byculla Relief Gate, South Mumbai') : 'Marine Drive Relief Corridor';
  const courierName = primaryTask?.claimedByName || (primaryTask?.claimedBy ? `Courier (${primaryTask.claimedBy})` : 'Aarav Patel (Courier #24 - E-Bike)');
  const courierStatus = primaryTask?.status === 'IN_TRANSIT' ? 'In Transit (ETA ~14 min)' : primaryTask?.status === 'DELIVERED_VERIFIED' ? 'Delivered & Verified' : 'Dispatched & Ready';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '24px', borderRadius: 16, cursor: 'pointer',
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
      }}
    >
      {/* Top Row: Description, Badges, Expiry */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{
              background: '#0F766E', color: '#FFFFFF',
              padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800,
            }}>
              ID: {donation.id.slice(0, 14)}
            </span>
            <span style={{
              backgroundColor: uc.bg, color: uc.text,
              padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 800,
            }}>
              {URGENCY_LABELS[urgency]}
            </span>
            <span style={{
              background: '#F1F5F9', color: '#334155',
              padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
            }}>
              {donation.status.replace(/_/g, ' ')}
            </span>
            <span style={{
              background: '#FEF3C7', color: '#92400E',
              padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Award size={12} /> +50 Donor Credits
            </span>
          </div>

          <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-text)', marginBottom: 4 }}>
            {donation.description}
          </h3>

          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            <strong>{donation.quantity} {donation.unit}</strong> · Category: {donation.category.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Countdown */}
        <div style={{ textAlign: 'right', flexShrink: 0, padding: '8px 14px', borderRadius: 10, background: remaining < 1800 ? '#FEE2E2' : '#F8FAFC', border: '1px solid var(--color-border)' }}>
          <p style={{
            fontSize: '1.4rem', fontWeight: 900, lineHeight: 1,
            color: remaining < 1800 ? '#B91C1C' : 'var(--color-text)',
          }} className="tabular-nums">
            {formatCountdown(remaining)}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>Safe window remaining</p>
        </div>
      </div>

      {/* Middle Grid: Detailed Route, Who gets it, Courier Assigned, Who donated */}
      <div style={{
        marginTop: 18,
        padding: '14px 16px',
        borderRadius: 12,
        background: '#F8FAFC',
        border: '1px solid var(--color-border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
        fontSize: 13,
      }}>
        {/* Origin / Who Donated */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0F766E', fontWeight: 700, marginBottom: 2 }}>
            <MapPin size={15} /> <span>Pickup Origin (Donor)</span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {donation.pickup.address}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            Coords: {donation.pickup.lat.toFixed(4)}°N, {donation.pickup.lng.toFixed(4)}°E
          </div>
        </div>

        {/* Destination / Who Gets This */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 700, marginBottom: 2 }}>
            <Building2 size={15} /> <span>Recipient NGO / Destination</span>
          </div>
          <div style={{ fontWeight: 700, color: '#1E40AF' }}>
            {recipientName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            {recipientAddress}
          </div>
        </div>

        {/* Assigned Courier / Rider */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7E22CE', fontWeight: 700, marginBottom: 2 }}>
            <Truck size={15} /> <span>Assigned Volunteer Courier</span>
          </div>
          <div style={{ fontWeight: 700, color: '#581C87' }}>
            {courierName}
          </div>
          <div style={{ fontSize: 12, color: '#15803D', fontWeight: 600, marginTop: 2 }}>
            ● {courierStatus}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-muted)', marginBottom: 6, fontWeight: 600 }}>
          <span>Delivered: <strong>{delivered} {donation.unit}</strong></span>
          <span>Allocated for Transit: <strong>{allocated} {donation.unit}</strong></span>
          <span>Unallocated: <strong>{unallocated} {donation.unit}</strong></span>
        </div>
        <div style={{ height: 8, borderRadius: 100, background: '#E2E8F0', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${pctDelivered}%`, background: '#16A34A', borderRadius: '100px 0 0 100px', transition: 'width 0.4s' }} />
          <div style={{ width: `${pctAllocated}%`, background: '#0284C7', transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* If split into multiple courier tasks */}
      {tasks.length > 1 && (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#15803D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡ Capacity-Optimized Split: {tasks.length} Courier Batches (40 Meals Limit)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
            {tasks.map((t, idx) => (
              <div key={t.id} style={{ background: '#FFFFFF', padding: '9px 12px', borderRadius: 8, border: '1px solid #DCFCE7', fontSize: 12 }}>
                <div style={{ fontWeight: 800, color: '#1E293B' }}>
                  Batch #{idx + 1}: <strong>{t.quantity} {t.unit || 'meals'}</strong>
                </div>
                <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                  Courier: <strong>{t.claimedByName?.split(' ')[0] || 'Courier'}</strong> ➔ {t.siteName?.slice(0, 18)}…
                </div>
                <div style={{ fontSize: 10, color: t.status === 'CLAIMED' ? '#D97706' : '#15803D', fontWeight: 800, marginTop: 3 }}>
                  ● {t.status === 'CLAIMED' ? 'Pending Courier Acceptance' : 'In Transit / Accepted'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
        <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
          {tasks.length > 0 ? `${tasks.length} sub-delivery task(s) coordinated` : 'Direct community walk-up listing'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--color-primary)' }}>
          View Live Journey & Proof of Receipt <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

function EmptyDonations({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{
      padding: '48px 24px', borderRadius: 16, textAlign: 'center',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(15, 118, 110, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <PlusCircle size={28} color="var(--color-primary)" />
      </div>
      <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No active surplus donations</h3>
      <p style={{ color: 'var(--color-muted)', fontSize: 14, marginBottom: 20, maxWidth: 460, margin: '0 auto 20px' }}>
        Broadcast surplus banquet food or catering meals. Our matching engine will instantly route it to neediest shelters and dispatch nearby couriers.
      </p>
      <button onClick={onCreate} style={{
        padding: '12px 28px', borderRadius: 10, border: 'none',
        background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
        fontWeight: 700, fontSize: 14, cursor: 'pointer',
      }}>
        Coordinate First Donation
      </button>
    </div>
  );
}
