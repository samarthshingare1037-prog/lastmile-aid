import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { CreditTotals, LedgerEntry, LeaderboardEntry } from '@/api/types';
import { StatCard } from '@/components/ui';
import {
  Award, Trophy, Sparkles, CheckCircle2, TrendingUp, ShieldCheck,
  Star, Heart, ArrowUpRight, Flame, Clock
} from 'lucide-react';

export default function CreditsPage() {
  const user = useAppStore((s) => s.user);

  const [balance, setBalance] = useState(120);
  const [completedDeliveries, setCompletedDeliveries] = useState(8);
  const [totals, setTotals] = useState<CreditTotals>({ DONOR: 0, VOLUNTEER: 120, HELPER: 0 });
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [boardType, setBoardType] = useState<'VOLUNTEER' | 'HELPER' | 'DONOR'>('VOLUNTEER');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await mockApi.myCredits(user.id);
      setBalance(data.balance);
      setCompletedDeliveries(data.completedDeliveries);
      setTotals(data.totals);
      setEntries(data.entries.reverse());

      const board = await mockApi.leaderboard(boardType, 'MONTH');
      setLeaderboard(board);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, boardType]);

  const getTier = (pts: number) => {
    if (pts >= 250) return { name: 'Hero Tier', color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' };
    if (pts >= 100) return { name: 'Gold Tier', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
    if (pts >= 50) return { name: 'Silver Tier', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD' };
    return { name: 'Bronze Tier', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' };
  };

  const tier = getTier(balance);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Hero Badge Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)',
          borderRadius: '20px',
          padding: '2rem 2.5rem',
          color: '#FFFFFF',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
            <Award style={{ width: 16, height: 16 }} /> Verified Impact Recognition
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
            Impact Credits & Leaderboard
          </h1>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, maxWidth: '480px', marginTop: '4px', lineHeight: 1.4 }}>
            Credits are awarded idempotently upon shelter handover verification, recognizing food rescue milestones and route reliability.
          </p>
        </div>

        {/* Big Balance Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '1.5rem 2rem',
            textAlign: 'center',
            minWidth: '200px',
          }}
        >
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, opacity: 0.85 }}>Your Impact Balance</span>
          <div style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1, marginTop: '4px' }}>
            {balance}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: '6px',
              padding: '3px 12px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              color: tier.color,
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          >
            ★ {tier.name}
          </div>
          <button
            type="button"
            onClick={async () => {
              const uid = user?.id || 'donor1';
              await (mockApi as any).addDemoCredits(uid, 25);
              await loadData();
            }}
            style={{
              marginTop: '10px',
              padding: '5px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              width: '100%',
            }}
          >
            <Sparkles size={12} /> +25 Test Credits
          </button>
        </div>
      </div>

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
          title="Volunteer Courier Credits"
          value={totals.VOLUNTEER}
          subtitle="From verified deliveries"
          icon={<Award style={{ width: 22, height: 22 }} />}
          iconBg="rgba(15, 118, 110, 0.1)"
          iconColor="#0F766E"
        />
        <StatCard
          title="Emergency Helper Credits"
          value={totals.HELPER}
          subtitle="From micro-task assists"
          icon={<Heart style={{ width: 22, height: 22 }} />}
          iconBg="rgba(220, 38, 38, 0.1)"
          iconColor="#DC2626"
        />
        <StatCard
          title="Verified Deliveries"
          value={completedDeliveries}
          subtitle="Zero spoilage record"
          icon={<CheckCircle2 style={{ width: 22, height: 22 }} />}
          iconBg="rgba(21, 128, 61, 0.1)"
          iconColor="#15803D"
        />
        <StatCard
          title="Multiplier Status"
          value="1.2x Active"
          subtitle="Peak emergency bonus"
          icon={<Flame style={{ width: 22, height: 22 }} />}
          iconBg="rgba(245, 158, 11, 0.1)"
          iconColor="#D97706"
        />
      </div>

      {/* Grid: Leaderboard & Ledger */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        {/* Leaderboard Column */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy style={{ width: 22, height: 22, color: '#D97706' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Community Leaderboard
              </h2>
            </div>
          </div>

          {/* Leaderboard Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
            {[
              { id: 'VOLUNTEER', label: 'Couriers' },
              { id: 'HELPER', label: 'Emergency Helpers' },
              { id: 'DONOR', label: 'Food Donors' },
            ].map((tab) => {
              const active = boardType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setBoardType(tab.id as any)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--color-muted)',
                    border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Leaderboard Rankings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                No rankings recorded yet for this category.
              </div>
            ) : (
              leaderboard.map((item) => {
                const isMe = item.displayName === user?.displayName;
                const medal =
                  item.rank === 1 ? '🥇' :
                  item.rank === 2 ? '🥈' :
                  item.rank === 3 ? '🥉' : `#${item.rank}`;

                return (
                  <div
                    key={item.displayName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isMe ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isMe ? 'rgba(15, 118, 110, 0.05)' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, width: '28px', textAlign: 'center' }}>
                        {medal}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                          {item.displayName} {isMe && '(You)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                          {getTier(item.score).name}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>
                      {item.score} pts
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ledger Column */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Clock style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Idempotent Credit Ledger ({entries.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto' }}>
            {entries.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                No credit transactions yet. Complete your first delivery to earn impact credits!
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {entry.eventType.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                      {new Date(entry.createdAtUtc).toLocaleString()} • Multiplier: {entry.multiplier}x
                    </div>
                  </div>

                  <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#15803D', backgroundColor: '#F0FDF4', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #BBF7D0' }}>
                    +{entry.amount * entry.multiplier} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
