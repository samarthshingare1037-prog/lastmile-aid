import React, { useState } from 'react';
import { useAppStore } from '@/app/store';
import {
  Heart, MapPin, Clock, Award, ShieldCheck, CheckCircle2,
  AlertTriangle, Navigation, ArrowRight, ToggleLeft, ToggleRight, Sparkles
} from 'lucide-react';

interface HelperAlert {
  id: string;
  title: string;
  description: string;
  location: string;
  distanceKm: number;
  credits: number;
  urgency: 'CRITICAL' | 'URGENT';
  claimed: boolean;
}

export default function HelperPage() {
  const user = useAppStore((s) => s.user);

  const [optIn, setOptIn] = useState(true);
  const [alerts, setAlerts] = useState<HelperAlert[]>([
    {
      id: 'h-1',
      title: 'Assist Unloading 60 Catering Boxes',
      description: 'Courier arriving in 12 mins at St. Jude Hope Haven. Need 1 person to help carry insulated trays into the intake kitchen.',
      location: 'St. Jude Hope Haven, South Mumbai',
      distanceKm: 0.6,
      credits: 25,
      urgency: 'CRITICAL',
      claimed: false,
    },
    {
      id: 'h-2',
      title: 'Walk 10 Dry Ration Packs to Elderly Care',
      description: 'Short 300-meter walk from Marine Drive drop point to Senior Living Annex.',
      location: 'Marine Drive Crossing',
      distanceKm: 1.2,
      credits: 30,
      urgency: 'URGENT',
      claimed: false,
    },
    {
      id: 'h-3',
      title: 'Open Gate Community Queue Support',
      description: 'Assist distribution coordinator in managing food line and verifying tokens for 45 minutes.',
      location: 'Asha Kitchen Distribution Gate',
      distanceKm: 2.1,
      credits: 40,
      urgency: 'URGENT',
      claimed: false,
    },
  ]);

  const [claimedAlerts, setClaimedAlerts] = useState<string[]>([]);

  const handleClaim = (alertId: string) => {
    setClaimedAlerts((prev) => [...prev, alertId]);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, claimed: true } : a))
    );
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
          borderRadius: '20px',
          padding: '2.5rem',
          color: '#FFFFFF',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
            <Heart style={{ width: 16, height: 16 }} /> Neighborhood Micro-Volunteering
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.02em' }}>
            Emergency Helper Hub
          </h1>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, maxWidth: '500px', marginTop: '4px', lineHeight: 1.4 }}>
            No vehicle required. Assist with walking micro-deliveries, shelter unloading, or distribution queues near you.
          </p>
        </div>

        {/* Opt-in switch */}
        <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '12px 18px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9, marginBottom: '4px' }}>
            Proximity Alert Radar
          </div>
          <button
            onClick={() => setOptIn(!optIn)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFFFFF',
              color: optIn ? '#DC2626' : '#64748B',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            {optIn ? <ToggleRight style={{ width: 20, height: 20, color: '#DC2626' }} /> : <ToggleLeft style={{ width: 20, height: 20 }} />}
            {optIn ? 'Radar Active (3 km)' : 'Radar Paused'}
          </button>
        </div>
      </div>

      {/* Helper Explanation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          marginBottom: '2rem',
        }}
      >
        <Sparkles style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8125rem', color: '#991B1B', lineHeight: 1.4 }}>
          <strong>Micro-Action Impact:</strong> When vehicle couriers face capacity limits or traffic delays, nearby helpers are dispatched for walking legs and unloading support. Completing tasks earns <strong>Helper Credits</strong>.
        </div>
      </div>

      {/* Alerts Stream */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '1rem' }}>
          Active Proximity Alerts ({alerts.filter((a) => !a.claimed).length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                background: 'var(--color-surface)',
                border: alert.claimed ? '1px solid #BBF7D0' : '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.25rem',
                backgroundColor: alert.claimed ? '#F0FDF4' : 'var(--color-surface)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: alert.urgency === 'CRITICAL' ? '#FEF2F2' : '#FFFBEB',
                      color: alert.urgency === 'CRITICAL' ? '#DC2626' : '#D97706',
                      border: alert.urgency === 'CRITICAL' ? '1px solid #FECACA' : '1px solid #FDE68A',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {alert.urgency === 'CRITICAL' ? '🔥 Critical Immediate' : '⚡ Urgent Assist'}
                  </span>

                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
                    ~{alert.distanceKm} km away from your location
                  </span>
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {alert.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  {alert.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text)', fontWeight: 600, marginTop: '8px' }}>
                  <MapPin style={{ width: 14, height: 14, color: '#DC2626' }} />
                  {alert.location}
                </div>
              </div>

              {/* Action Button */}
              <div>
                {alert.claimed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803D', fontWeight: 700, fontSize: '0.9375rem' }}>
                    <CheckCircle2 style={{ width: 18, height: 18 }} />
                    Assigned to You (+{alert.credits} pts)
                  </div>
                ) : (
                  <button
                    onClick={() => handleClaim(alert.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 22px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                    }}
                  >
                    Accept Assist (+{alert.credits} credits)
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
