import type { Urgency, TaskStatus, SiteStatus } from '@/api/types';

/* ========================================
   Status & Urgency Vocabulary
   Single source of truth for labels, icons, colors
   ======================================== */

export interface StatusConfig {
  label: string;
  icon: string;
  color: 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
}

// Urgency levels
export const URGENCY_CONFIG: Record<Urgency, StatusConfig> = {
  NORMAL:   { label: 'Normal',   icon: 'Clock',          color: 'neutral' },
  URGENT:   { label: 'Urgent',   icon: 'AlertTriangle',  color: 'warning' },
  CRITICAL: { label: 'Critical', icon: 'Flame',          color: 'danger' },
  EXPIRED:  { label: 'Expired',  icon: 'XCircle',        color: 'danger' },
};

// Task states
export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  OPEN:                   { label: 'Available',                    icon: 'CircleDot',    color: 'info' },
  CLAIMED:                { label: 'Claimed – awaiting ack',       icon: 'Hourglass',    color: 'warning' },
  ACKNOWLEDGED:           { label: 'Acknowledged',                 icon: 'ThumbsUp',     color: 'info' },
  PICKED_UP:              { label: 'Picked up',                    icon: 'Package',      color: 'info' },
  IN_TRANSIT:             { label: 'In transit',                   icon: 'Truck',        color: 'info' },
  REROUTE_PROPOSED:       { label: 'Reroute proposed',             icon: 'Route',        color: 'warning' },
  DELIVERED:              { label: 'Delivered – awaiting confirm',  icon: 'PackageCheck', color: 'info' },
  DELIVERED_VERIFIED:     { label: 'Verified',                     icon: 'BadgeCheck',   color: 'success' },
  FAILED_NO_DESTINATION:  { label: 'No safe destination',          icon: 'OctagonAlert', color: 'danger' },
  EXPIRED:                { label: 'Expired',                      icon: 'XCircle',      color: 'danger' },
  CANCELLED:              { label: 'Cancelled',                    icon: 'XCircle',      color: 'neutral' },
};

// Site status
export const SITE_STATUS_CONFIG: Record<SiteStatus, StatusConfig> = {
  OPEN:   { label: 'Open',   icon: 'CheckCircle2', color: 'success' },
  FULL:   { label: 'Full',   icon: 'Ban',          color: 'warning' },
  CLOSED: { label: 'Closed', icon: 'Lock',         color: 'neutral' },
};

// Verification status
export const VERIFICATION_CONFIG: Record<string, StatusConfig> = {
  VERIFIED:  { label: 'Verified',   icon: 'ShieldCheck',  color: 'success' },
  PENDING:   { label: 'Pending',    icon: 'Hourglass',    color: 'warning' },
  REJECTED:  { label: 'Rejected',   icon: 'ShieldX',      color: 'danger' },
  SUSPENDED: { label: 'Suspended',  icon: 'ShieldAlert',  color: 'danger' },
};

// Color map for status colors → Tailwind classes
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  info:    { bg: 'bg-[var(--color-info-bg)]',    text: 'text-[var(--color-info)]',    border: 'border-[var(--color-info)]' },
  success: { bg: 'bg-[var(--color-success-bg)]',  text: 'text-[var(--color-success)]',  border: 'border-[var(--color-success)]' },
  warning: { bg: 'bg-[var(--color-warning-bg)]',  text: 'text-[var(--color-warning)]',  border: 'border-[var(--color-warning)]' },
  danger:  { bg: 'bg-[var(--color-danger-bg)]',   text: 'text-[var(--color-danger)]',   border: 'border-[var(--color-danger)]' },
  neutral: { bg: 'bg-[var(--color-neutral-bg)]',   text: 'text-[var(--color-neutral)]',   border: 'border-[var(--color-neutral)]' },
  primary: { bg: 'bg-[var(--color-primary)]/10',  text: 'text-[var(--color-primary)]',  border: 'border-[var(--color-primary)]' },
};

// Error code → user message mapping
export const ERROR_MESSAGES: Record<string, string> = {
  ALREADY_CLAIMED:             'Someone else claimed this task.',
  CAPACITY_EXCEEDED:           'This is more than your declared capacity.',
  INCOMPATIBLE_SITE:           "This destination can't safely accept this item.",
  ETA_EXCEEDS_DEADLINE:        "It can't arrive before the safe deadline.",
  CLAIM_EXPIRED:               'Your claim expired and the task was returned.',
  DEMAND_EXCEEDED:             'The shelter no longer needs this quantity.',
  LISTING_CLOSED:              'This collection window has closed.',
  SOLD_OUT:                    'This collection window has closed.',
  EXPIRY_EXTENSION_FORBIDDEN:  "Expiry can't be extended after posting.",
  HELPER_CATEGORY_FORBIDDEN:   'This category is not available to public helpers.',
  VALIDATION_ERROR:            'Please check the form for errors.',
  RATE_LIMITED:                 'Too many requests. Try again shortly.',
  NETWORK_ERROR:               'You appear to be offline. Retrying…',
  INVALID_STATE_TRANSITION:    'This action is no longer available.',
};

// Item categories
export const ITEM_CATEGORIES = [
  { code: 'COOKED_MEAL',       label: 'Cooked Meals',         requiredCapabilities: [] as string[],                              requiresColdChain: false, helperAllowed: true,  handlingNotes: 'Consume within hours. Keep covered.' },
  { code: 'RAW_RATION_KIT',    label: 'Raw Ration Kit',       requiredCapabilities: ['CLEAN_WATER', 'COOKING_FUEL'],            requiresColdChain: false, helperAllowed: true,  handlingNotes: 'Requires clean water and cooking fuel at site.' },
  { code: 'COLD_CHAIN_FOOD',   label: 'Cold Chain Food',      requiredCapabilities: ['REFRIGERATION'],                          requiresColdChain: true,  helperAllowed: true,  handlingNotes: 'Must stay refrigerated. Cold bag required for transport.' },
  { code: 'PACKAGED_DRY_GOODS', label: 'Packaged Dry Goods', requiredCapabilities: ['DRY_STORAGE'],                            requiresColdChain: false, helperAllowed: true,  handlingNotes: 'Store in dry conditions.' },
  { code: 'INFANT_FORMULA',    label: 'Infant Formula',       requiredCapabilities: ['INFANT_CARE_PROCEDURE'],                  requiresColdChain: false, helperAllowed: false, handlingNotes: 'Specialized handling. Not available for public helpers.' },
] as const;

// Capability labels
export const CAPABILITY_LABELS: Record<string, string> = {
  CLEAN_WATER:          'Clean Water',
  COOKING_FUEL:         'Cooking Fuel',
  REFRIGERATION:        'Refrigeration',
  INFANT_CARE_PROCEDURE: 'Infant Care',
  DRY_STORAGE:          'Dry Storage',
};

// Safety buffer in minutes
export const SAFETY_BUFFER_MINUTES = 20;

// Claim TTL in minutes
export const CLAIM_TTL_MINUTES = 10;

// Worker interval in seconds
export const WORKER_INTERVAL_SECONDS = 30;
