import type {
  User, Donation, ReceivingSite, DeliveryTask, DeliveryEvent,
  Notification, LedgerEntry, OpenGateListing, RiderAvailability,
} from '@/api/types';

/**
 * Seed data for demo mode.
 * Fixed IDs and times relative to "now" so a reset gives the same demo.
 */

function nowPlus(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function nowMinus(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

/* ========================================
   Users
   ======================================== */

export const SEED_USERS: User[] = [
  {
    id: 'donor1',
    displayName: 'Vikram Sethi (Taj Lands End Banquets)',
    email: 'donor@lastmileaid.demo',
    roles: ['DONOR', 'ADMIN'],
    activeRole: 'DONOR',
  },
  {
    id: 'rider1',
    displayName: 'Aarav Patel (Courier #24 - E-Bike)',
    email: 'rider1@lastmileaid.demo',
    roles: ['RIDER', 'DONOR'],
    activeRole: 'RIDER',
  },
  {
    id: 'rider2',
    displayName: 'Priya Nair (Courier #18 - Scooter)',
    email: 'rider2@lastmileaid.demo',
    roles: ['RIDER'],
    activeRole: 'RIDER',
  },
  {
    id: 'rider3',
    displayName: 'Dev Kapoor (Courier #31 - Cargo Van)',
    email: 'rider3@lastmileaid.demo',
    roles: ['RIDER'],
    activeRole: 'RIDER',
  },
  {
    id: 'rider4',
    displayName: 'Sneha Rao (Community Helper #07)',
    email: 'rider4@lastmileaid.demo',
    roles: ['RIDER', 'HELPER'],
    activeRole: 'RIDER',
  },
  {
    id: 'helper1',
    displayName: 'Sneha Rao (Community Helper)',
    email: 'helper@lastmileaid.demo',
    roles: ['HELPER', 'RIDER'],
    activeRole: 'HELPER',
    helperOptIn: true,
  },
  {
    id: 'ngo1',
    displayName: 'Pooja Verma (St. Jude Hope Haven)',
    email: 'ngo1@lastmileaid.demo',
    roles: ['NGO_OPERATOR', 'ADMIN'],
    activeRole: 'NGO_OPERATOR',
  },
  {
    id: 'ngo2',
    displayName: 'Asha Welfare Trust',
    email: 'ngo2@lastmileaid.demo',
    roles: ['NGO_OPERATOR'],
    activeRole: 'NGO_OPERATOR',
  },
  {
    id: 'ngo3',
    displayName: 'SEWA Relief Network',
    email: 'ngo3@lastmileaid.demo',
    roles: ['NGO_OPERATOR'],
    activeRole: 'NGO_OPERATOR',
  },
  {
    id: 'admin1',
    displayName: 'Priya Sharma (Platform Dispatcher)',
    email: 'admin@lastmileaid.demo',
    roles: ['ADMIN', 'DONOR', 'RIDER', 'NGO_OPERATOR'],
    activeRole: 'ADMIN',
  },
];

/* ========================================
   Rider Availability
   ======================================== */

export const SEED_RIDER_AVAILABILITY: Record<string, RiderAvailability> = {
  rider1: { isAvailable: true, capacityQty: 60, capacityUnit: 'meals', hasColdBag: true, radiusKm: 15 },
  rider2: { isAvailable: true, capacityQty: 40, capacityUnit: 'meals', hasColdBag: false, radiusKm: 10 },
  rider3: { isAvailable: true, capacityQty: 50, capacityUnit: 'meals', hasColdBag: true, radiusKm: 20 },
  rider4: { isAvailable: true, capacityQty: 40, capacityUnit: 'meals', hasColdBag: false, radiusKm: 8 },
};

/* ========================================
   Receiving Sites (Mumbai Relief Corridor)
   ======================================== */

export const SEED_SITES: ReceivingSite[] = [
  {
    id: 'site1',
    organizationId: 'ngo1',
    orgName: 'Hope Foundation',
    name: 'St. Jude Hope Haven',
    address: '89 Byculla Relief Gate, South Mumbai',
    lat: 18.9750,
    lng: 72.8310,
    status: 'OPEN',
    verification: 'VERIFIED',
    acceptedCategories: ['COOKED_MEAL', 'RAW_RATION_KIT', 'PACKAGED_DRY_GOODS'],
    capabilities: {
      CLEAN_WATER: true,
      COOKING_FUEL: true,
      REFRIGERATION: true,
      INFANT_CARE_PROCEDURE: false,
      DRY_STORAGE: true,
    },
    demand: [
      { category: 'COOKED_MEAL', unit: 'meals', demandQty: 120, reservedQty: 60, receivedQty: 30 },
      { category: 'RAW_RATION_KIT', unit: 'kits', demandQty: 40, reservedQty: 0, receivedQty: 10 },
    ],
  },
  {
    id: 'site2',
    organizationId: 'ngo2',
    orgName: 'Asha Welfare Trust',
    name: 'Asha Community Kitchen',
    address: '14 Ranade Road, Dadar West, Mumbai',
    lat: 19.0180,
    lng: 72.8420,
    status: 'OPEN',
    verification: 'VERIFIED',
    acceptedCategories: ['COOKED_MEAL', 'COLD_CHAIN_FOOD', 'PACKAGED_DRY_GOODS'],
    capabilities: {
      CLEAN_WATER: true,
      COOKING_FUEL: true,
      REFRIGERATION: true,
      INFANT_CARE_PROCEDURE: false,
      DRY_STORAGE: true,
    },
    demand: [
      { category: 'COOKED_MEAL', unit: 'meals', demandQty: 150, reservedQty: 60, receivedQty: 50 },
    ],
  },
  {
    id: 'site3',
    organizationId: 'ngo3',
    orgName: 'SEWA Relief Network',
    name: 'SEWA Community Relief Center',
    address: '42 Parel Road, Central Mumbai',
    lat: 18.9950,
    lng: 72.8380,
    status: 'OPEN',
    verification: 'VERIFIED',
    acceptedCategories: ['COOKED_MEAL', 'RAW_RATION_KIT', 'COLD_CHAIN_FOOD'],
    capabilities: {
      CLEAN_WATER: true,
      COOKING_FUEL: false,
      REFRIGERATION: true,
      INFANT_CARE_PROCEDURE: false,
      DRY_STORAGE: true,
    },
    demand: [
      { category: 'COOKED_MEAL', unit: 'meals', demandQty: 80, reservedQty: 60, receivedQty: 20 },
    ],
  },
  {
    id: 'site4',
    organizationId: 'ngo1',
    orgName: 'Hope Foundation',
    name: 'Marine Drive Pavilion Camp',
    address: 'Gate 2 Distribution Pavilion, Marine Drive, South Mumbai',
    lat: 18.9442,
    lng: 72.8238,
    status: 'OPEN',
    verification: 'VERIFIED',
    acceptedCategories: ['COOKED_MEAL', 'PACKAGED_DRY_GOODS'],
    capabilities: {
      CLEAN_WATER: true,
      COOKING_FUEL: true,
      REFRIGERATION: false,
      INFANT_CARE_PROCEDURE: false,
      DRY_STORAGE: true,
    },
    demand: [
      { category: 'COOKED_MEAL', unit: 'meals', demandQty: 60, reservedQty: 0, receivedQty: 15 },
    ],
  },
];

/* ========================================
   Donations
   ======================================== */

export function createSeedDonations(): Donation[] {
  return [
    {
      id: 'don-wedding-180',
      donorId: 'donor1',
      category: 'COOKED_MEAL',
      description: 'Grand Banquet Surplus — 180 Fresh Hot Meals (Dal Makhani, Veg Biryani, Roti, Kheer)',
      quantity: 180,
      unit: 'meals',
      allocatedQty: 180,
      deliveredQty: 60,
      pickup: {
        lat: 18.9442,
        lng: 72.8238,
        address: 'Grand Hyatt Banquet Hall, 88 Marine Drive, Mumbai',
      },
      availableFromUtc: nowMinus(35),
      expiryUtc: nowPlus(155), // ~2.5 hours remaining
      handlingInstructions: 'Hot packed in insulated thermal food containers. Vegetarian. Contact Chef Vikram (+91 98201 44520)',
      requiredCapabilities: [],
      mode: 'VOLUNTEER',
      status: 'IN_PROGRESS',
      createdAtUtc: nowMinus(40),
    },
  ];
}

/* ========================================
   Tasks
   ======================================== */

export const SEED_TASKS: DeliveryTask[] = [
  {
    id: 'task-101',
    donationId: 'don-wedding-180',
    siteId: 'site1',
    siteName: 'St. Jude Hope Haven',
    siteAddress: '89 Byculla Relief Gate, South Mumbai',
    siteCoordinates: { lat: 18.9750, lng: 72.8310 },
    pickupAddress: 'Grand Hyatt Banquet Hall, 88 Marine Drive, Mumbai',
    pickupCoordinates: { lat: 18.9442, lng: 72.8238 },
    quantity: 60,
    unit: 'meals',
    status: 'IN_TRANSIT',
    claimedBy: 'rider1',
    claimedByName: 'Aarav Patel (Courier #24 - E-Bike)',
    claimedAtUtc: nowMinus(20),
    etaMinutes: 14,
    etaSource: 'mock',
    dropoffDeadlineUtc: nowPlus(90),
    requiresColdBag: false,
    assignmentReason: { considered: 4, rejections: [], note: 'FEFO matched: 60 meals dispatched to St. Jude Hope Haven (Unmet shelter demand: 120 meals).' },
  },
  {
    id: 'task-102',
    donationId: 'don-wedding-180',
    siteId: 'site2',
    siteName: 'Asha Community Kitchen',
    siteAddress: '14 Ranade Road, Dadar West, Mumbai',
    siteCoordinates: { lat: 19.0180, lng: 72.8420 },
    pickupAddress: 'Grand Hyatt Banquet Hall, 88 Marine Drive, Mumbai',
    pickupCoordinates: { lat: 18.9442, lng: 72.8238 },
    quantity: 60,
    unit: 'meals',
    status: 'OPEN',
    etaMinutes: 24,
    etaSource: 'mock',
    dropoffDeadlineUtc: nowPlus(120),
    requiresColdBag: false,
    assignmentReason: { considered: 4, rejections: [], note: 'FEFO matched: 60 meals available for open courier pool claim.' },
  },
  {
    id: 'task-103',
    donationId: 'don-wedding-180',
    siteId: 'site3',
    siteName: 'SEWA Community Relief Center',
    siteAddress: '42 Parel Road, Central Mumbai',
    siteCoordinates: { lat: 18.9950, lng: 72.8380 },
    pickupAddress: 'Grand Hyatt Banquet Hall, 88 Marine Drive, Mumbai',
    pickupCoordinates: { lat: 18.9442, lng: 72.8238 },
    quantity: 60,
    unit: 'meals',
    status: 'DELIVERED_VERIFIED',
    claimedBy: 'rider1',
    claimedByName: 'Aarav Patel (Courier #24 - E-Bike)',
    claimedAtUtc: nowMinus(45),
    deliveredAtUtc: nowMinus(15),
    verifiedAtUtc: nowMinus(10),
    etaMinutes: 0,
    etaSource: 'mock',
    dropoffDeadlineUtc: nowPlus(60),
    requiresColdBag: false,
    assignmentReason: { considered: 4, rejections: [], note: 'FEFO matched & completed: 60 meals safely received and verified.' },
  },
];

/* ========================================
   Events, Notifications, Credits
   ======================================== */

export function createSeedEvents(): DeliveryEvent[] {
  return [
    {
      id: 1,
      donationId: 'don-wedding-180',
      type: 'donation.created',
      actor: 'donor1',
      actorName: 'Vikram Sethi (Taj Lands End)',
      payload: { quantity: 180, category: 'COOKED_MEAL' },
      createdAtUtc: nowMinus(40),
    },
    {
      id: 2,
      donationId: 'don-wedding-180',
      type: 'donation.published',
      actor: 'donor1',
      actorName: 'Vikram Sethi (Taj Lands End)',
      payload: { expiryUtc: nowPlus(155) },
      createdAtUtc: nowMinus(35),
    },
    {
      id: 3,
      donationId: 'don-wedding-180',
      taskId: 'task-101',
      type: 'allocation.created',
      actor: 'system',
      actorName: 'Deterministic Dispatch Engine',
      payload: { taskId: 'task-101', siteId: 'site1', quantity: 60 },
      createdAtUtc: nowMinus(30),
    },
    {
      id: 4,
      donationId: 'don-wedding-180',
      taskId: 'task-101',
      type: 'task.claimed',
      actor: 'rider1',
      actorName: 'Aarav Patel (Courier #24)',
      payload: { taskId: 'task-101' },
      createdAtUtc: nowMinus(20),
    },
    {
      id: 5,
      donationId: 'don-wedding-180',
      taskId: 'task-103',
      type: 'task.verified',
      actor: 'ngo3',
      actorName: 'SEWA Relief Network',
      payload: { taskId: 'task-103', quantity: 60, status: 'DELIVERED_VERIFIED' },
      createdAtUtc: nowMinus(10),
    },
  ];
}

export function createSeedNotifications(): Notification[] {
  return [
    {
      id: 'notif-001',
      type: 'task.verified',
      title: 'Delivery Verified & Credits Awarded!',
      body: '60 meals verified by SEWA Community Relief Center. +50 Donor Impact Credits added to your balance!',
      entityType: 'donation',
      entityId: 'don-wedding-180',
      createdAtUtc: nowMinus(10),
    },
    {
      id: 'notif-002',
      type: 'donation.published',
      title: 'Surplus Banquet Broadcast Active',
      body: '180 cooked meals broadcast across Mumbai relief corridor. 1 task in transit by Aarav Patel.',
      entityType: 'donation',
      entityId: 'don-wedding-180',
      createdAtUtc: nowMinus(35),
    },
    {
      id: 'notif-003',
      type: 'system.welcome',
      title: 'Welcome to LastMile Aid',
      body: 'Live dispatch network active. Connect donors, riders, and shelters with zero food waste.',
      createdAtUtc: nowMinus(60),
      readAtUtc: nowMinus(30),
    },
  ];
}

export const SEED_CREDITS: LedgerEntry[] = [
  {
    id: 'led-1',
    userId: 'rider1',
    creditType: 'VOLUNTEER',
    eventType: 'DELIVERY_VERIFIED',
    amount: 50,
    multiplier: 1.2,
    subjectId: 'task-103',
    createdAtUtc: nowMinus(10),
  },
  {
    id: 'led-2',
    userId: 'rider1',
    creditType: 'VOLUNTEER',
    eventType: 'DELIVERY_VERIFIED',
    amount: 60,
    multiplier: 1.0,
    subjectId: 'task-99',
    createdAtUtc: nowMinus(120),
  },
  {
    id: 'led-3',
    userId: 'donor1',
    creditType: 'DONOR',
    eventType: 'DONATION_VERIFIED',
    amount: 100,
    multiplier: 1.0,
    subjectId: 'don-wedding-180',
    createdAtUtc: nowMinus(10),
  },
  {
    id: 'led-4',
    userId: 'helper1',
    creditType: 'HELPER',
    eventType: 'HANDOUT_VERIFIED',
    amount: 40,
    multiplier: 1.0,
    subjectId: 'og-marine-drive',
    createdAtUtc: nowMinus(50),
  },
];

export const SEED_OPEN_GATE: OpenGateListing[] = [
  {
    id: 'og-marine-drive',
    donationId: 'don-wedding-180',
    venue: 'Gate 2 Distribution Pavilion, Marine Drive, South Mumbai',
    lat: 18.9442,
    lng: 72.8238,
    opensAtUtc: nowMinus(30),
    closesAtUtc: nowPlus(155),
    remainingQty: 45,
    totalQty: 60,
    unit: 'meals',
    status: 'ACTIVE',
    instructions: 'Walk-up collection open. Please bring containers if collecting more than 2 portions.',
  },
];

/* ========================================
   Demo credentials
   ======================================== */

export const DEMO_CREDENTIALS: { label: string; email: string; password: string; role: string }[] = [
  { label: 'Donor',     email: 'donor@lastmileaid.demo',  password: 'demo123', role: 'DONOR' },
  { label: 'Rider',     email: 'rider1@lastmileaid.demo', password: 'demo123', role: 'RIDER' },
  { label: 'Shelter',   email: 'ngo1@lastmileaid.demo',   password: 'demo123', role: 'NGO_OPERATOR' },
  { label: 'Admin',     email: 'admin@lastmileaid.demo',  password: 'demo123', role: 'ADMIN' },
];
