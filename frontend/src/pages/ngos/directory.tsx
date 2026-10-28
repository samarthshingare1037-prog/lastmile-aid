import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '@/api/mockApi';
import type { ReceivingSite } from '@/api/types';
import { StatusBadge } from '@/components/ui';
import { CAPABILITY_LABELS } from '@/lib/constants';
import {
  Building2, ShieldCheck, MapPin, Search, Filter,
  Phone, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function NgoDirectory() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<ReceivingSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchSites = async () => {
    try {
      const data = await mockApi.listSites();
      setSites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const filtered = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.orgName.toLowerCase().includes(search.toLowerCase()) ||
      site.address.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && site.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Building2 style={{ width: 16, height: 16 }} /> Verified Intake Network
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', marginTop: '4px' }}>
          NGO & Shelter Directory
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
          Verified community kitchens, disaster relief shelters, and orphanages actively receiving surplus donations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
          background: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: '14px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ width: 16, height: 16, position: 'absolute', left: '12px', top: '10px', color: 'var(--color-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shelters or locations..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'OPEN', 'FULL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: statusFilter === st ? 700 : 500,
                backgroundColor: statusFilter === st ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === st ? '#FFFFFF' : 'var(--color-muted)',
                border: statusFilter === st ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              {st === 'ALL' ? 'All Shelters' : st === 'OPEN' ? 'Open (Accepting)' : 'Full'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Shelters */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading shelter directory...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Shelters Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Try clearing your search terms.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((site) => (
            <div
              key={site.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <StatusBadge status={site.status} size="sm" />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#15803D' }}>
                    <ShieldCheck style={{ width: 14, height: 14 }} /> Verified Partner
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                  {site.name}
                </h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                  {site.orgName}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '8px' }}>
                  <MapPin style={{ width: 14, height: 14, color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>{site.address}</span>
                </div>

                {/* Target Demand Requirements */}
                <div style={{ marginTop: '1rem', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                    Active Unmet Demand
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {site.demand.map((dm) => {
                      const unmet = Math.max(0, dm.demandQty - dm.reservedQty - dm.receivedQty);
                      return (
                        <span key={dm.category} style={{ fontSize: '0.75rem', fontWeight: 600, color: unmet > 0 ? '#15803D' : '#64748B', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                          {dm.category}: {unmet} {dm.unit}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Capabilities pills */}
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Object.entries(site.capabilities)
                    .filter(([_, enabled]) => enabled)
                    .map(([cap]) => (
                      <span key={cap} style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-muted)', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ {CAPABILITY_LABELS[cap] || cap}
                      </span>
                    ))}
                </div>
              </div>

              {/* View Dashboard button */}
              <button
                onClick={() => navigate(`/site/${site.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Manage Shelter Intake <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
