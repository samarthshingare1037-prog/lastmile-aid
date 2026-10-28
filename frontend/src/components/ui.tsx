import React from 'react';
import { useCountdown, useUrgency } from '@/hooks';
import type { TaskStatus, DonationStatus, SiteStatus, Urgency } from '@/api/types';
import {
  Clock, AlertTriangle, AlertCircle, CheckCircle2, ShieldCheck,
  XCircle, Truck, MapPin, Sparkles, X
} from 'lucide-react';

/* ========================================================
   StatusBadge
   ======================================================== */

interface StatusBadgeProps {
  status: TaskStatus | DonationStatus | SiteStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const getMeta = () => {
    switch (status) {
      case 'OPEN':
        return { label: 'Open', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' };
      case 'CLAIMED':
        return { label: 'Claimed', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' };
      case 'ACKNOWLEDGED':
        return { label: 'Acknowledged', bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' };
      case 'PICKED_UP':
        return { label: 'Picked Up', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', dot: '#0284C7' };
      case 'IN_TRANSIT':
        return { label: 'In Transit', bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', dot: '#6366F1' };
      case 'REROUTE_PROPOSED':
        return { label: 'Reroute Proposed', bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5', dot: '#EA580C' };
      case 'DELIVERED':
        return { label: 'Delivered', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', dot: '#10B981' };
      case 'DELIVERED_VERIFIED':
        return { label: 'Verified', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' };
      case 'ALLOCATED':
        return { label: 'Allocated', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' };
      case 'PARTIALLY_ALLOCATED':
        return { label: 'Partially Allocated', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', dot: '#F59E0B' };
      case 'NEEDS_ASSISTANCE':
        return { label: 'Needs Assistance', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' };
      case 'OPEN_GATE':
        return { label: 'Open Gate Community', bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', dot: '#A855F7' };
      case 'COMPLETED':
        return { label: 'Completed', bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E' };
      case 'FULL':
        return { label: 'Capacity Full', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' };
      case 'CLOSED':
        return { label: 'Closed', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', dot: '#64748B' };
      case 'EXPIRED':
      case 'EXPIRED_UNDELIVERED':
        return { label: 'Expired', bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1', dot: '#94A3B8' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: '#F1F5F9', text: '#64748B', border: '#CBD5E1', dot: '#94A3B8' };
      default:
        return { label: status, bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', dot: '#64748B' };
    }
  };

  const meta = getMeta();
  const pad = size === 'sm' ? '3px 8px' : size === 'md' ? '4px 10px' : '6px 14px';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'md' ? '0.8125rem' : '0.875rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: pad,
        fontSize: fontSize,
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: meta.bg,
        color: meta.text,
        border: `1px solid ${meta.border}`,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: size === 'sm' ? '6px' : '8px',
          height: size === 'sm' ? '6px' : '8px',
          borderRadius: '50%',
          backgroundColor: meta.dot,
        }}
      />
      {meta.label}
    </span>
  );
}

/* ========================================================
   UrgencyBadge
   ======================================================== */

interface UrgencyBadgeProps {
  urgency: Urgency;
  showIcon?: boolean;
}

export function UrgencyBadge({ urgency, showIcon = true }: UrgencyBadgeProps) {
  const getStyle = () => {
    switch (urgency) {
      case 'CRITICAL':
        return {
          bg: '#FEF2F2',
          text: '#DC2626',
          border: '#FECACA',
          icon: <AlertCircle style={{ width: 13, height: 13 }} />,
          label: 'Critical (<1h)',
          pulse: true,
        };
      case 'URGENT':
        return {
          bg: '#FFFBEB',
          text: '#D97706',
          border: '#FDE68A',
          icon: <AlertTriangle style={{ width: 13, height: 13 }} />,
          label: 'Urgent (<3h)',
          pulse: false,
        };
      case 'NORMAL':
        return {
          bg: '#F0FDF4',
          text: '#16A34A',
          border: '#BBF7D0',
          icon: <Clock style={{ width: 13, height: 13 }} />,
          label: 'Normal (>3h)',
          pulse: false,
        };
      case 'EXPIRED':
      default:
        return {
          bg: '#F1F5F9',
          text: '#64748B',
          border: '#CBD5E1',
          icon: <XCircle style={{ width: 13, height: 13 }} />,
          label: 'Expired',
          pulse: false,
        };
    }
  };

  const style = getStyle();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {showIcon && style.icon}
      {style.label}
    </span>
  );
}

/* ========================================================
   CountdownTimer
   ======================================================== */

interface CountdownTimerProps {
  expiryUtc: string;
  prefix?: string;
}

export function CountdownTimer({ expiryUtc, prefix = 'Expires in' }: CountdownTimerProps) {
  const secondsLeft = useCountdown(expiryUtc);
  const urgency = useUrgency(expiryUtc);

  if (secondsLeft <= 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94A3B8', fontSize: '0.8125rem', fontWeight: 600 }}>
        <Clock style={{ width: 13, height: 13 }} />
        Expired
      </span>
    );
  }

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const color =
    urgency === 'CRITICAL' ? '#DC2626' :
    urgency === 'URGENT' ? '#D97706' : '#15803D';

  const timeStr = hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        color: color,
        fontWeight: 700,
        fontSize: '0.8125rem',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <Clock style={{ width: 13, height: 13 }} />
      <span>{prefix} {timeStr}</span>
    </span>
  );
}

/* ========================================================
   ProgressBar
   ======================================================== */

interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
  height?: number;
  showLabels?: boolean;
  unit?: string;
}

export function ProgressBar({
  current,
  total,
  color = '#0F766E',
  height = 8,
  showLabels = true,
  unit = 'meals',
}: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div style={{ width: '100%' }}>
      {showLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-muted)' }}>Progress: <strong>{current}</strong> / {total} {unit}</span>
          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{pct}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: height,
          borderRadius: '9999px',
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ========================================================
   StatCard
   ======================================================== */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'rgba(15, 118, 110, 0.1)',
  iconColor = '#0F766E',
  trend,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', fontWeight: 500 }}>
          {title}
        </div>
        <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.2, marginTop: '2px' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
      {trend && (
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D', backgroundColor: '#F0FDF4', padding: '2px 8px', borderRadius: '9999px' }}>
          {trend}
        </span>
      )}
    </div>
  );
}

/* ========================================================
   EmptyState
   ======================================================== */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: '12px',
      }}
    >
      {icon && (
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-muted)',
            marginBottom: '1rem',
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', maxWidth: '420px', lineHeight: 1.5, marginBottom: action ? '1.25rem' : 0 }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ========================================================
   Modal
   ======================================================== */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 540 }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: maxWidth,
          backgroundColor: 'var(--color-surface)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
