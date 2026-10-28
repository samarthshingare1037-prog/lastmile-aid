import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '@/api/mockApi';
import type { DeliveryEvent } from '@/api/types';
import {
  ShieldCheck, Search, Filter, Download, ArrowLeft, Terminal,
  Clock, CheckCircle2, RefreshCw
} from 'lucide-react';

export default function AdminAudit() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await mockApi.audit();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventTypes = ['ALL', ...Array.from(new Set(events.map((e) => e.type)))];

  const filtered = events.filter((ev) => {
    const matchesSearch =
      ev.type.toLowerCase().includes(search.toLowerCase()) ||
      (ev.actorName && ev.actorName.toLowerCase().includes(search.toLowerCase())) ||
      (ev.donationId && ev.donationId.toLowerCase().includes(search.toLowerCase())) ||
      (ev.taskId && ev.taskId.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (selectedType !== 'ALL' && ev.type !== selectedType) return false;
    return true;
  });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lastmile_audit_trail_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/admin/console')}
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
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Mission Control
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Immutable Delivery Audit Trail
            </h1>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #BBF7D0' }}>
              Verifiable Log
            </span>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Chronological record of every allocation, courier claim, transit milestone, handover verification, and credit issuance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={exportJson}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download style={{ width: 14, height: 14 }} /> Export JSON
          </button>
          <button
            onClick={fetchEvents}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'var(--color-surface)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ width: 16, height: 16, position: 'absolute', left: '12px', top: '10px', color: 'var(--color-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, actor, or payload..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter style={{ width: 14, height: 14, color: 'var(--color-muted)' }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', fontWeight: 600 }}>Event Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
            Showing {filtered.length} of {events.length} audit entries
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((ev) => {
            const isExpanded = expandedId === ev.id;
            return (
              <div
                key={ev.id}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  padding: '1rem 1.5rem',
                  transition: 'background-color 0.15s ease',
                  backgroundColor: isExpanded ? '#F8FAFC' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      #{ev.id}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(15, 118, 110, 0.1)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {ev.type}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      Actor: {ev.actorName || ev.actor || 'System Engine'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      {new Date(ev.createdAtUtc).toLocaleString()}
                    </span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
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
                      {isExpanded ? 'Hide Payload' : 'Inspect JSON'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '0.75rem', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0F172A', color: '#38BDF8', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(
                        {
                          id: ev.id,
                          type: ev.type,
                          actor: ev.actor,
                          actorName: ev.actorName,
                          donationId: ev.donationId,
                          taskId: ev.taskId,
                          createdAtUtc: ev.createdAtUtc,
                          payload: ev.payload,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
