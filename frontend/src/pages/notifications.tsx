import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/app/store';
import { mockApi } from '@/api/mockApi';
import type { Notification } from '@/api/types';
import {
  Bell, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  ShieldAlert, Award, Package, RefreshCw
} from 'lucide-react';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const data = await mockApi.notifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.readAtUtc).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await mockApi.markRead(user.id, unreadIds);
      await fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('task') || type.includes('delivery')) return <Package style={{ width: 18, height: 18, color: 'var(--color-primary)' }} />;
    if (type.includes('credit')) return <Award style={{ width: 18, height: 18, color: '#D97706' }} />;
    if (type.includes('expiry') || type.includes('alert')) return <AlertTriangle style={{ width: 18, height: 18, color: '#DC2626' }} />;
    return <Bell style={{ width: 18, height: 18, color: 'var(--color-muted)' }} />;
  };

  const filtered = filterUnread ? notifications.filter((n) => !n.readAtUtc) : notifications;

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Notifications & Dispatch Alerts
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real-time updates on courier assignments, transit confirmations, and impact credits.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: filterUnread ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: filterUnread ? 'rgba(15, 118, 110, 0.1)' : 'var(--color-surface)',
              color: filterUnread ? 'var(--color-primary)' : 'var(--color-text)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {filterUnread ? 'Showing Unread' : 'Filter Unread'}
          </button>

          <button
            onClick={handleMarkAllRead}
            style={{
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
            Mark All Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
          <CheckCircle2 style={{ width: 36, height: 36, color: '#16A34A', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>All Caught Up!</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            No new alerts at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item) => {
            const isUnread = !item.readAtUtc;
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--color-surface)',
                  border: isUnread ? '1px solid rgba(15, 118, 110, 0.4)' : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  backgroundColor: isUnread ? 'rgba(15, 118, 110, 0.03)' : 'var(--color-surface)',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: isUnread ? 'rgba(15, 118, 110, 0.1)' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getIcon(item.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontWeight: isUnread ? 800 : 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                      {new Date(item.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {item.body && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                      {item.body}
                    </p>
                  )}

                  {item.entityType && item.entityId && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          if (item.entityType === 'donation') navigate(`/donations/${item.entityId}`);
                          else if (item.entityType === 'task') navigate(`/tasks/${item.entityId}`);
                          else if (item.entityType === 'credit') navigate('/credits');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--color-primary)',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        View {item.entityType} details <ArrowRight style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
