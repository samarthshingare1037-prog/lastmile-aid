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

export type Capability =
  | 'CLEAN_WATER'
  | 'COOKING_FUEL'
  | 'REFRIGERATION'
  | 'INFANT_CARE_PROCEDURE'
  | 'DRY_STORAGE';

export interface SiteDemand {
  category: string;
  unit: string;
  demandQty: number;
  reservedQty: number;
  receivedQty: number;
}
