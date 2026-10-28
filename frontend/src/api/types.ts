/* ========================================
   LastMile Aid — Domain Types
   Shared between mockApi and httpApi
   ======================================== */

export type Role = 'DONOR' | 'RIDER' | 'HELPER' | 'NGO_OPERATOR' | 'ADMIN';
export type Urgency = 'NORMAL' | 'URGENT' | 'CRITICAL' | 'EXPIRED';
export type SiteStatus = 'OPEN' | 'FULL' | 'CLOSED';

export type TaskStatus =
  | 'OPEN'
  | 'CLAIMED'
  | 'ACKNOWLEDGED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'REROUTE_PROPOSED'
  | 'DELIVERED'
  | 'DELIVERED_VERIFIED'
  | 'FAILED_NO_DESTINATION'
  | 'EXPIRED'
  | 'CANCELLED';

export type DonationStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'PARTIALLY_ALLOCATED'
  | 'ALLOCATED'
  | 'NEEDS_ASSISTANCE'
  | 'IN_PROGRESS'
  | 'OPEN_GATE'
  | 'COMPLETED'
  | 'CLOSED_WINDOW_ENDED'
  | 'EXCEPTION'
  | 'CANCELLED'
  | 'EXPIRED_UNDELIVERED';

export type DistributionMode = 'VOLUNTEER' | 'OPEN_GATE';

export type Capability =
  | 'CLEAN_WATER'
  | 'COOKING_FUEL'
  | 'REFRIGERATION'
  | 'INFANT_CARE_PROCEDURE'
  | 'DRY_STORAGE';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  displayName: string;
  email: string;
  roles: Role[];
  activeRole: Role;
  helperOptIn?: boolean;
  avatar?: string;
}

export interface RiderAvailability {
  isAvailable: boolean;
  capacityQty: number;
  capacityUnit: string;
  hasColdBag: boolean;
  radiusKm: number;
  windowFrom?: string;
  windowUntil?: string;
}

export interface ItemCategory {
  code: string;
  label: string;
  requiredCapabilities: Capability[];
  requiresColdChain: boolean;
  helperAllowed: boolean;
  handlingNotes?: string;
}

export interface Donation {
  id: string;
  donorId: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  allocatedQty: number;
  deliveredQty: number;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  availableFromUtc: string;
  expiryUtc: string;
  handlingInstructions?: string;
  requiredCapabilities: Capability[];
  mode: DistributionMode;
  status: DonationStatus;
  exceptionReason?: string;
  createdAtUtc: string;
}

export interface SiteDemand {
  category: string;
  unit: string;
  demandQty: number;
  reservedQty: number;
  receivedQty: number;
}

export interface ReceivingSite {
  id: string;
  organizationId: string;
  orgName: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: SiteStatus;
  verification: VerificationStatus;
  acceptedCategories: string[];
  capabilities: Record<Capability, boolean>;
  demand: SiteDemand[];
}

export interface DeliveryTask {
  id: string;
  donationId: string;
  siteId: string;
  siteName?: string;
  siteAddress?: string;
  siteCoordinates?: { lat: number; lng: number };
  pickupAddress?: string;
  pickupCoordinates?: { lat: number; lng: number };
  quantity: number;
  unit?: string;
  requiresColdBag?: boolean;
  dropoffDeadlineUtc?: string;
  status: TaskStatus;
  claimedBy?: string;
  claimedByName?: string;
  claimExpiresAtUtc?: string;
  claimedAtUtc?: string;
  deliveredAtUtc?: string;
  verifiedAtUtc?: string;
  pickupDeadlineUtc?: string;
  etaMinutes?: number;
  etaSource?: 'provider' | 'mock' | 'mock_fallback';
  proposedReroute?: {
    proposalId?: string;
    newSiteId: string;
    newSiteName: string;
    newSiteAddress?: string;
    extraKm?: number;
    extraCredits?: number;
    reason?: string;
    etaMinutes?: number;
  };
  reroute?: {
    proposalId: string;
    newSiteId: string;
    newSiteName?: string;
    etaMinutes: number;
    etaSource: string;
    alternates: string[];
  };
  assignmentReason?: {
    considered: number;
    rejections: { siteId?: string; riderId?: string; code: string }[];
    note: string;
  };
  matchingMetadata?: {
    note?: string;
  };
}

export interface DeliveryEvent {
  id: number;
  taskId?: string;
  donationId: string;
  type: string;
  actor?: string;
  actorName?: string;
  payload: Record<string, unknown>;
  createdAtUtc: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  readAtUtc?: string;
  createdAtUtc: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  creditType: 'DONOR' | 'VOLUNTEER' | 'HELPER';
  eventType: string;
  amount: number;
  multiplier: number;
  subjectId: string;
  createdAtUtc: string;
  reverses?: string;
}

export interface OpenGateListing {
  id: string;
  donationId: string;
  venue: string;
  lat: number;
  lng: number;
  opensAtUtc: string;
  closesAtUtc: string;
  remainingQty: number;
  totalQty: number;
  unit: string;
  directions?: string;
  instructions?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
}

export interface CreditTotals {
  DONOR: number;
  VOLUNTEER: number;
  HELPER: number;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: { field: string; message: string }[];
  requestId?: string;
}

export interface PlatformStats {
  mealsCoordinated: number;
  deliveriesVerified: number;
  activeShelters: number;
  activeVolunteers: number;
}
