import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { OpenGateListing } from '@/api/types';
import { CountdownTimer, Modal } from '@/components/ui';
import {
  Building2, MapPin, Clock, Users, QrCode, CheckCircle2,
  Share2, AlertCircle, Sparkles, RefreshCw
} from 'lucide-react';

export default function OpenGatePage() {
  const user = useAppStore((s) => s.user);

  const [listings, setListings] = useState<OpenGateListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<OpenGateListing | null>(null);
  const [handoutQty, setHandoutQty] = useState(2);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListings = async () => {
    try {
      const data = await mockApi.listOpenGate();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleClaimPass = async () => {
    if (!selectedListing || !user) return;
    setActionLoading(true);
    try {
      await mockApi.recordHandout(user.id, selectedListing.id, handoutQty);
      setClaimSuccess(true);
      await fetchListings();
    } catch (err: any) {
      alert(err?.message || 'Failed to claim collection token');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7E22CE 0%, #581C87 100%)',
          borderRadius: '20px',
          padding: '2.5rem',
          color: '#FFFFFF',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
          <Building2 style={{ width: 16, height: 16 }} /> Direct Community Food Redistribution
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
          Open Gate Community Listings
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.85, maxWidth: '600px', marginTop: '6px', lineHeight: 1.4 }}>
          Public walk-up distributions where surplus meals are provided directly to individuals, families, and neighborhood helpers without courier transit.
        </p>
      </div>

      {/* Info Alert */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: '#FAF5FF',
          border: '1px solid #E9D5FF',
          marginBottom: '2rem',
        }}
      >
        <Sparkles style={{ width: 20, height: 20, color: '#7E22CE', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8125rem', color: '#6B21A8' }}>
          <strong>Decentralized Food Access:</strong> Anyone can collect meals during the open window. Click <strong>Get Collection Token</strong> to reserve a digital pass for pickup.
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading Open Gate listings...
        </div>
      ) : listings.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <CheckCircle2 style={{ width: 36, height: 36, color: '#16A34A', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No Active Walk-Up Distributions</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Check back during peak afternoon and evening catering hours.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {listings.map((item) => {
            const isClosed = item.status === 'CLOSED' || item.remainingQty <= 0;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  opacity: isClosed ? 0.6 : 1,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: isClosed ? '#F1F5F9' : '#FAF5FF',
                        color: isClosed ? '#64748B' : '#7E22CE',
                        border: isClosed ? '1px solid #CBD5E1' : '1px solid #E9D5FF',
                      }}
                    >
                      {item.status === 'SCHEDULED' ? 'Scheduled' : item.status === 'ACTIVE' ? 'Active Collection' : 'Closed'}
                    </span>

                    <CountdownTimer expiryUtc={item.closesAtUtc} prefix="Closes in:" />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginTop: '4px' }}>
                    {item.venue}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '6px' }}>
                    <MapPin style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
                    {item.venue}
                  </div>

                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>Meals Remaining</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7E22CE' }}>
                      {item.remainingQty} <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>portions</span>
                    </span>
                  </div>

                  {item.instructions && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '0.75rem', lineHeight: 1.4 }}>
                      {item.instructions}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedListing(item);
                      setClaimSuccess(false);
                    }}
                    disabled={isClosed}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: isClosed ? '#94A3B8' : '#7E22CE',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: isClosed ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isClosed ? 'Collection Ended' : 'Get Collection Token'}
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Free Surplus Food at ${item.venue}`,
                          text: `Collect meals today at ${item.venue}`,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 style={{ width: 16, height: 16, color: 'var(--color-muted)' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Claim Token Modal */}
      <Modal
        isOpen={!!selectedListing}
        onClose={() => {
          setSelectedListing(null);
          setClaimSuccess(false);
        }}
        title="Reserve Meal Collection Token"
      >
        {selectedListing && (
          <div>
            {!claimSuccess ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
                  Reserve your portion at <strong>{selectedListing.venue}</strong>. Show your token code to the distribution organizer on site.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Number of Meals Requested
                  </label>
                  <select
                    value={handoutQty}
                    onChange={(e) => setHandoutQty(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.9375rem',
                    }}
                  >
                    <option value={1}>1 meal (Individual)</option>
                    <option value={2}>2 meals</option>
                    <option value={4}>4 meals (Family pack)</option>
                    <option value={6}>6 meals</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    onClick={() => setSelectedListing(null)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'none' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClaimPass}
                    disabled={actionLoading}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '8px',
                      backgroundColor: '#7E22CE',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actionLoading ? 'Generating Pass...' : 'Generate Token Pass'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CheckCircle2 style={{ width: 44, height: 44, color: '#16A34A', margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  Collection Pass Confirmed!
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                  Reserved {handoutQty} meals at {selectedListing.venue}
                </p>

                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    margin: '1.25rem auto',
                    borderRadius: '12px',
                    border: '2px dashed #7E22CE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FAF5FF',
                  }}
                >
                  <QrCode style={{ width: 120, height: 120, color: '#7E22CE' }} />
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#7E22CE', letterSpacing: '0.05em' }}>
                  TOKEN: #OG-{selectedListing.id.slice(-4).toUpperCase()}
                </div>

                <button
                  onClick={() => setSelectedListing(null)}
                  style={{
                    marginTop: '1.5rem',
                    padding: '8px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#7E22CE',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
