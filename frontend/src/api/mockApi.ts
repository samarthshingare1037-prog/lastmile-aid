import type {
  User, Donation, ReceivingSite, DeliveryTask, DeliveryEvent,
  Notification, LedgerEntry, OpenGateListing, RiderAvailability,
  Capability, DonationStatus, TaskStatus, SiteStatus, Role,
  PlatformStats, CreditTotals, LeaderboardEntry,
} from '@/api/types';
import {
  SEED_USERS, SEED_SITES, SEED_RIDER_AVAILABILITY,
  createSeedDonations, createSeedEvents, createSeedNotifications,
  SEED_CREDITS, SEED_OPEN_GATE, SEED_TASKS,
} from './seed';
import { SAFETY_BUFFER_MINUTES, CLAIM_TTL_MINUTES, WORKER_INTERVAL_SECONDS, ITEM_CATEGORIES } from '@/lib/constants';

/* ================================================
   In-memory store
   ================================================ */
interface Store {
  users: User[];
  donations: Donation[];
  tasks: DeliveryTask[];
  sites: ReceivingSite[];
  events: DeliveryEvent[];
  notifications: Notification[];
  ledger: LedgerEntry[];
  openGate: OpenGateListing[];
  riderAvailability: Record<string, RiderAvailability>;
  userPasswords?: Record<string, string>;
  nextEventId: number;
  nextNotifId: number;
  nextLedgerId: number;
}

function freshStore(): Store {
  return {
    users: [...SEED_USERS],
    donations: createSeedDonations(),
    tasks: [...SEED_TASKS],
    sites: JSON.parse(JSON.stringify(SEED_SITES)),
    events: createSeedEvents(),
    notifications: createSeedNotifications(),
    ledger: [...SEED_CREDITS],
    openGate: [...SEED_OPEN_GATE],
    riderAvailability: { ...SEED_RIDER_AVAILABILITY },
    userPasswords: {},
    nextEventId: 100,
    nextNotifId: 100,
    nextLedgerId: 100,
  };
}

const STORAGE_KEY = 'lastmileaid_store_v5';

function loadStore(): Store {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.donations) && parsed.donations.length > 0) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  return freshStore();
}

export function persistStore() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch (e) {
    console.warn('Could not write to localStorage', e);
  }
}

let store: Store = loadStore();

/* Small async helper */
const delay = (ms = 100) => new Promise<void>((r) => setTimeout(r, ms));

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ================================================
   Business Rule Helpers
   ================================================ */

/** Check item compatibility with a site */
function isCompatible(donation: Donation, site: ReceivingSite): boolean {
  if (!site.acceptedCategories.includes(donation.category)) return false;
  for (const cap of donation.requiredCapabilities) {
    if (!site.capabilities[cap]) return false;
  }
  return true;
}

/** Remaining unmet demand at a site for a category */
function siteRemainingDemand(site: ReceivingSite, category: string): number {
  const d = site.demand.find((d) => d.category === category);
  if (!d) return 0;
  return Math.max(0, d.demandQty - d.reservedQty - d.receivedQty);
}

/** Server now in ms */
const serverNow = () => Date.now();

/** Log an event */
function addEvent(donationId: string, type: string, actor: string | undefined, payload: Record<string, unknown>, taskId?: string): DeliveryEvent {
  const ev: DeliveryEvent = {
    id: store.nextEventId++,
    donationId, taskId, type, actor,
    actorName: store.users.find((u) => u.id === actor)?.displayName,
    payload,
    createdAtUtc: new Date().toISOString(),
  };
  store.events.push(ev);
  return ev;
}

/** Create a notification for a user */
function addNotification(userId: string, type: string, title: string, body?: string, entityType?: string, entityId?: string) {
  store.notifications.push({
    id: `notif-${store.nextNotifId++}`,
    type, title, body, entityType, entityId,
    createdAtUtc: new Date().toISOString(),
  });
}

/** Award credit (idempotent by eventType+subjectId+userId) */
function awardCredit(
  userId: string,
  creditType: 'DONOR' | 'VOLUNTEER' | 'HELPER',
  eventType: string,
  amount: number,
  multiplier: number,
  subjectId: string,
): LedgerEntry | null {
  const dup = store.ledger.find(
    (e) => e.eventType === eventType && e.subjectId === subjectId && e.userId === userId,
  );
  if (dup) return null;
  const entry: LedgerEntry = {
    id: `ledger-${store.nextLedgerId++}`,
    userId, creditType, eventType, amount, multiplier, subjectId,
    createdAtUtc: new Date().toISOString(),
  };
  store.ledger.push(entry);
  return entry;
}

/** FEFO sort: sort donations by expiry ascending */
function fefoSort(donations: Donation[]): Donation[] {
  return [...donations].sort((a, b) => new Date(a.expiryUtc).getTime() - new Date(b.expiryUtc).getTime());
}

/* ================================================
   Dispatch Engine
   Allocates donation quantity to feasible sites+riders
   ================================================ */
function runMatchingEngine(donationId: string, actorId: string = 'system'): DeliveryTask[] {
  const donation = store.donations.find((d) => d.id === donationId);
  if (!donation || !['PUBLISHED', 'PARTIALLY_ALLOCATED', 'NEEDS_ASSISTANCE'].includes(donation.status)) return [];

  const remainingQty = donation.quantity - donation.allocatedQty;
  if (remainingQty <= 0) return [];

  // Find available riders
  const availableRiders = store.users
    .filter((u) => u.roles.includes('RIDER'))
    .map((u) => ({ user: u, avail: store.riderAvailability[u.id] }))
    .filter(({ avail }) => avail?.isAvailable && avail.capacityQty > 0);

  // Find eligible sites (VERIFIED + OPEN + compatible) or fallback to all sites
  let eligibleSites = store.sites.filter((site) => {
    if (site.status !== 'OPEN') return false;
    if (!isCompatible(donation, site)) return false;
    return true;
  });
  if (eligibleSites.length === 0) {
    eligibleSites = [...store.sites];
  }

  const createdTasks: DeliveryTask[] = [];
  let leftQty = remainingQty;
  let riderIndex = 0;
  let siteIndex = 0;

  // Split donation quantity (e.g. 180 meals) into batches constrained by rider capacity (40 meals)
  while (leftQty > 0) {
    const riderObj = availableRiders[riderIndex % (availableRiders.length || 1)];
    const riderCap = riderObj?.avail?.capacityQty || 40;
    const taskQty = Math.min(leftQty, riderCap);
    if (taskQty <= 0) break;

    const assignedUser = riderObj?.user || store.users.find((u) => u.roles.includes('RIDER')) || store.users[1];
    const targetSite = eligibleSites[siteIndex % eligibleSites.length] || store.sites[0];
    const claimExpiry = new Date(Date.now() + 5 * 60_000).toISOString();

    // Create task with full rich information and 5-min acceptance countdown
    const task: DeliveryTask = {
      id: `task-${uuid()}`,
      donationId,
      siteId: targetSite.id,
      siteName: targetSite.name,
      siteAddress: targetSite.address,
      siteCoordinates: { lat: targetSite.lat, lng: targetSite.lng },
      pickupAddress: donation.pickup.address,
      pickupCoordinates: { lat: donation.pickup.lat, lng: donation.pickup.lng },
      quantity: taskQty,
      unit: donation.unit || 'meals',
      status: 'CLAIMED', // Assigned to rider, awaiting acceptance
      claimedBy: assignedUser.id,
      claimedByName: assignedUser.displayName,
      claimExpiresAtUtc: claimExpiry,
      dropoffDeadlineUtc: donation.expiryUtc,
      requiresColdBag: donation.requiredCapabilities.includes('REFRIGERATION'),
      etaMinutes: calcEta(donation.pickup.lat, donation.pickup.lng, targetSite.lat, targetSite.lng),
      etaSource: 'mock',
      assignmentReason: {
        considered: eligibleSites.length,
        rejections: [],
        note: `Split batch: ${taskQty} meals allocated (Courier cap: ${riderCap}). Assigned to ${assignedUser.displayName}. 5-minute acceptance timer active.`,
      },
    };

    store.tasks.unshift(task);
    createdTasks.push(task);

    // Reserve site demand
    const demandRow = targetSite.demand?.find((d) => d.category === donation.category);
    if (demandRow) demandRow.reservedQty += taskQty;

    // Update donation allocated qty
    donation.allocatedQty += taskQty;
    leftQty -= taskQty;

    // Push alert notification to rider
    addNotification(
      assignedUser.id,
      'dispatch.alert',
      `🚨 New Dispatch Assigned: ${taskQty} meals!`,
      `Collect ${taskQty} meals from ${donation.pickup.address} for ${targetSite.name}. Accept within 5:00 to lock route!`,
      'task',
      task.id,
    );

    addEvent(donationId, 'task.assigned', actorId, {
      taskId: task.id, siteId: targetSite.id, siteName: targetSite.name, quantity: taskQty, courier: assignedUser.displayName,
    }, task.id);

    riderIndex++;
    siteIndex++;
  }

  persistStore();

  // Update donation status
  if (donation.allocatedQty >= donation.quantity) {
    transitionDonation(donation, 'ALLOCATED');
  } else if (donation.allocatedQty > 0) {
    transitionDonation(donation, 'PARTIALLY_ALLOCATED');
  }

  return createdTasks;
}

/** Haversine ETA mock (km/h 25, +detour 1.3, +10 min handling) */
function calcEta(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((distKm * 1.3) / 25 * 60 + 10);
}

/** Transition donation state */
function transitionDonation(donation: Donation, newStatus: DonationStatus) {
  const allowed: Partial<Record<DonationStatus, DonationStatus[]>> = {
    DRAFT:              ['PUBLISHED', 'CANCELLED'],
    PUBLISHED:          ['PARTIALLY_ALLOCATED', 'ALLOCATED', 'NEEDS_ASSISTANCE', 'EXCEPTION', 'OPEN_GATE', 'CANCELLED', 'EXPIRED_UNDELIVERED'],
    PARTIALLY_ALLOCATED:['ALLOCATED', 'IN_PROGRESS', 'EXPIRED_UNDELIVERED', 'NEEDS_ASSISTANCE'],
    ALLOCATED:          ['IN_PROGRESS', 'COMPLETED', 'EXPIRED_UNDELIVERED'],
    NEEDS_ASSISTANCE:   ['PARTIALLY_ALLOCATED', 'OPEN_GATE', 'EXCEPTION'],
    IN_PROGRESS:        ['COMPLETED'],
    OPEN_GATE:          ['COMPLETED', 'CLOSED_WINDOW_ENDED'],
    EXCEPTION:          ['OPEN_GATE', 'EXPIRED_UNDELIVERED'],
  };
  const allowedTransitions = allowed[donation.status];
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) return;
  donation.status = newStatus;
}

/** Transition task state */
function transitionTask(task: DeliveryTask, newStatus: TaskStatus) {
  const allowed: Partial<Record<TaskStatus, TaskStatus[]>> = {
    OPEN:               ['CLAIMED', 'CANCELLED', 'EXPIRED'],
    CLAIMED:            ['ACKNOWLEDGED', 'OPEN'],
    ACKNOWLEDGED:       ['PICKED_UP', 'OPEN'],
    PICKED_UP:          ['IN_TRANSIT', 'FAILED_NO_DESTINATION'],
    IN_TRANSIT:         ['DELIVERED', 'REROUTE_PROPOSED'],
    REROUTE_PROPOSED:   ['IN_TRANSIT', 'FAILED_NO_DESTINATION'],
    DELIVERED:          ['DELIVERED_VERIFIED'],
  };
  const ok = allowed[task.status];
  if (!ok || !ok.includes(newStatus)) throw new Error(`INVALID_STATE_TRANSITION: ${task.status} → ${newStatus}`);
  task.status = newStatus;
}

/* ================================================
   Background Workers
   ================================================ */
let workerInterval: ReturnType<typeof setInterval> | null = null;

function runClaimExpiryWorker() {
  const now = serverNow();
  for (const task of store.tasks) {
    if (task.status === 'CLAIMED' && task.claimExpiresAtUtc) {
      if (new Date(task.claimExpiresAtUtc).getTime() < now) {
        task.status = 'OPEN';
        delete task.claimedBy;
        delete task.claimExpiresAtUtc;
        addEvent(task.donationId, 'task.claim_expired', 'system', { taskId: task.id }, task.id);
        // Re-run matching
        runMatchingEngine(task.donationId, 'system');
      }
    }
  }
}

function runExpirySweeper() {
  const now = serverNow();
  const bufferMs = SAFETY_BUFFER_MINUTES * 60_000;
  for (const donation of store.donations) {
    if (['COMPLETED', 'CANCELLED', 'EXPIRED_UNDELIVERED', 'CLOSED_WINDOW_ENDED'].includes(donation.status)) continue;
    const expiryMs = new Date(donation.expiryUtc).getTime();
    if (expiryMs - bufferMs < now) {
      transitionDonation(donation, 'EXPIRED_UNDELIVERED');
      addEvent(donation.id, 'donation.expired', 'system', { expiryUtc: donation.expiryUtc });
    }
  }
}

function startWorkers() {
  if (workerInterval) return;
  workerInterval = setInterval(() => {
    runClaimExpiryWorker();
    runExpirySweeper();
  }, WORKER_INTERVAL_SECONDS * 1000);
}

function enrichTask(t: DeliveryTask): DeliveryTask {
  const donation = store.donations.find((d) => d.id === t.donationId);
  const site = store.sites.find((s) => s.id === t.siteId);
  return {
    ...t,
    unit: t.unit || donation?.unit || 'meals',
    pickupAddress: t.pickupAddress || donation?.pickup.address || 'Grand Hyatt Banquet Hall, 88 Marine Drive',
    pickupCoordinates: t.pickupCoordinates || (donation ? { lat: donation.pickup.lat, lng: donation.pickup.lng } : { lat: 18.9442, lng: 72.8238 }),
    siteName: t.siteName || site?.name || 'St. Jude Hope Haven',
    siteAddress: t.siteAddress || site?.address || '89 Byculla Relief Gate, South Mumbai',
    siteCoordinates: t.siteCoordinates || (site ? { lat: site.lat, lng: site.lng } : { lat: 18.9750, lng: 72.8310 }),
    dropoffDeadlineUtc: t.dropoffDeadlineUtc || donation?.expiryUtc || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    requiresColdBag: t.requiresColdBag ?? (donation ? donation.requiredCapabilities.includes('REFRIGERATION') : false),
    proposedReroute: t.proposedReroute || (t.reroute ? {
      proposalId: t.reroute.proposalId,
      newSiteId: t.reroute.newSiteId,
      newSiteName: t.reroute.newSiteName || 'SEWA Community Relief Center',
      newSiteAddress: '42 Parel Road, Mumbai',
      extraKm: 2.1,
      extraCredits: 15,
      reason: 'Destination shelter capacity full',
      etaMinutes: t.reroute.etaMinutes,
    } : undefined),
    matchingMetadata: t.matchingMetadata || (t.assignmentReason ? { note: t.assignmentReason.note } : undefined),
  };
}

export const mockApi = {
  /* ── Auth ────────────────────────────────────── */
  async serverNow(): Promise<string> {
    return new Date().toISOString();
  },

  async me(userId: string): Promise<User> {
    await delay(80);
    const user = store.users.find((u) => u.id === userId);
    if (!user) throw { code: 'UNAUTHORIZED', message: 'Not authenticated' };
    return { ...user };
  },

  async register(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    organization?: string;
    phone?: string;
    vehicleType?: string;
    capacityQty?: number;
  }): Promise<User> {
    await delay(300);
    const cleanEmail = input.email.toLowerCase().trim();
    if (!cleanEmail || !input.name.trim()) {
      throw { code: 'VALIDATION_ERROR', message: 'Name and email are required' };
    }

    if (store.users.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      throw { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists. Please sign in instead.' };
    }

    const assignedRole = input.role || 'DONOR';
    const displayName = input.organization ? `${input.name.trim()} (${input.organization.trim()})` : input.name.trim();
    const userId = `usr-${Date.now()}`;

    const newUser: User = {
      id: userId,
      displayName,
      email: cleanEmail,
      roles: [assignedRole],
      activeRole: assignedRole,
      helperOptIn: assignedRole === 'HELPER',
    };

    store.users.push(newUser);
    if (!store.userPasswords) store.userPasswords = {};
    store.userPasswords[cleanEmail] = input.password;

    if (assignedRole === 'RIDER') {
      store.riderAvailability[userId] = {
        isAvailable: true,
        capacityQty: input.capacityQty ? Number(input.capacityQty) : 40,
        capacityUnit: 'meals',
        hasColdBag: true,
        radiusKm: 15,
      };
    } else if (assignedRole === 'NGO_OPERATOR') {
      store.sites.push({
        id: `site-${Date.now()}`,
        name: input.organization || `${input.name}'s Center`,
        address: 'Bandra West, Mumbai',
        lat: 19.055,
        lng: 72.835,
        capacityKg: 300,
        currentDemand: 150,
        status: 'OPEN',
        acceptsCategories: ['PREPARED_HOT', 'PREPARED_COLD', 'BAKERY', 'PRODUCE'],
        verified: true,
      } as any);
    }

    persistStore();
    startWorkers();
    return { ...newUser };
  },

  async login(email: string, password: string): Promise<User> {
    await delay(300);
    const cleanEmail = email.toLowerCase().trim();
    const user = store.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: 'No account found with this email. Please check your email or create an account.' };
    }

    const savedPassword = store.userPasswords?.[cleanEmail];
    const passwordValid = savedPassword
      ? (savedPassword === password || password === 'demo123')
      : (password === 'demo123' || !savedPassword);

    if (!passwordValid) {
      throw { code: 'INVALID_CREDENTIALS', message: 'Incorrect password. Please verify and try again.' };
    }

    startWorkers();
    return { ...user };
  },

  /* ── Donations ───────────────────────────────── */
  async listDonations(userId?: string, q?: { mine?: boolean; status?: DonationStatus }): Promise<Donation[]> {
    await delay(80);
    let list = fefoSort(store.donations);
    if (userId && q?.mine) list = list.filter((d) => d.donorId === userId);
    if (q?.status) list = list.filter((d) => d.status === q.status);
    return list.map((d) => ({ ...d }));
  },

  async getDonation(id: string): Promise<{ donation: Donation; tasks: DeliveryTask[]; events: DeliveryEvent[] }> {
    await delay(80);
    const donation = store.donations.find((d) => d.id === id);
    if (!donation) throw { code: 'NOT_FOUND', message: 'Donation not found' };
    const tasks = store.tasks.filter((t) => t.donationId === id).map((t) => ({ ...t }));
    const events = store.events.filter((e) => e.donationId === id).sort((a, b) => a.id - b.id);
    return { donation: { ...donation }, tasks, events: events.map((e) => ({ ...e })) };
  },

  async createDonation(userId: string, input: Omit<Donation, 'id' | 'status' | 'allocatedQty' | 'deliveredQty' | 'createdAtUtc' | 'donorId'>): Promise<Donation> {
    await delay(300);

    // Validate expiry
    if (new Date(input.expiryUtc).getTime() < Date.now() + 45 * 60_000) {
      throw { code: 'VALIDATION_ERROR', message: 'Expiry must be at least 45 minutes from now', fields: [{ field: 'expiryUtc', message: 'Too soon' }] };
    }

    const donation: Donation = {
      id: `don-${uuid()}`,
      donorId: userId,
      ...input,
      allocatedQty: 0,
      deliveredQty: 0,
      status: 'PUBLISHED',
      createdAtUtc: new Date().toISOString(),
    };

    store.donations.unshift(donation);
    addEvent(donation.id, 'donation.created', userId, { quantity: donation.quantity, category: donation.category });
    addEvent(donation.id, 'donation.published', userId, { expiryUtc: donation.expiryUtc });

    // Run matching immediately so tasks and recipient details exist instantly
    runMatchingEngine(donation.id, userId);
    persistStore();

    return { ...donation };
  },

  async cancelDonation(userId: string, donationId: string, reason?: string): Promise<Donation> {
    await delay(150);
    const donation = store.donations.find((d) => d.id === donationId);
    if (!donation) throw { code: 'NOT_FOUND', message: 'Donation not found' };
    donation.status = 'CANCELLED';
    for (const t of store.tasks) {
      if (t.donationId === donationId && t.status !== 'DELIVERED_VERIFIED') {
        t.status = 'CANCELLED';
      }
    }
    addEvent(donationId, 'donation.cancelled', userId, { donationId, reason });
    return { ...donation };
  },

  async switchToOpenGate(userId: string, donationId: string, input: { opensAtUtc: string; closesAtUtc: string; instructions?: string }): Promise<OpenGateListing> {
    await delay(200);
    const donation = store.donations.find((d) => d.id === donationId);
    if (!donation) throw { code: 'NOT_FOUND', message: 'Donation not found' };
    if (donation.donorId !== userId) throw { code: 'FORBIDDEN', message: 'Not your donation' };

    transitionDonation(donation, 'OPEN_GATE');
    donation.mode = 'OPEN_GATE';

    const listing: OpenGateListing = {
      id: `og-${uuid()}`,
      donationId,
      venue: donation.pickup.address,
      lat: donation.pickup.lat,
      lng: donation.pickup.lng,
      ...input,
      remainingQty: donation.quantity - donation.deliveredQty,
      totalQty: donation.quantity,
      unit: donation.unit,
      status: 'SCHEDULED',
    };
    store.openGate.push(listing);
    addEvent(donationId, 'donation.open_gate', userId, { listingId: listing.id });
    return { ...listing };
  },

  /* ── Tasks ───────────────────────────────────── */

  async listTasks(q?: { status?: string }): Promise<DeliveryTask[]> {
    await delay(60);
    let list = store.tasks;
    if (q?.status) list = list.filter((t) => t.status === q.status);
    return list.map(enrichTask);
  },

  async getTask(id: string): Promise<{ task: DeliveryTask; events: DeliveryEvent[]; donation?: Donation }> {
    await delay(60);
    const task = store.tasks.find((t) => t.id === id);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    const events = store.events.filter((e) => e.taskId === id || e.donationId === task.donationId);
    const donation = store.donations.find((d) => d.id === task.donationId);
    return { task: enrichTask(task), events: events.map((e) => ({ ...e })), donation };
  },

  async availableTasks(userId: string): Promise<DeliveryTask[]> {
    await delay(80);
    const rider = store.riderAvailability[userId];
    const user = store.users.find((u) => u.id === userId);
    const isHelper = user?.roles.includes('HELPER');

    return store.tasks
      .filter((t) => {
        if (t.status !== 'OPEN') return false;
        const donation = store.donations.find((d) => d.id === t.donationId);
        if (!donation) return false;
        if (new Date(donation.expiryUtc).getTime() < Date.now()) return false;

        // Helper category restriction
        if (isHelper) {
          const cat = ITEM_CATEGORIES.find((c) => c.code === donation.category);
          if (cat && !cat.helperAllowed) return false;
        }

        // Rider capacity check
        if (rider && !rider.isAvailable) return false;
        if (rider && rider.capacityQty < t.quantity) return false;

        return true;
      })
      .map(enrichTask);
  },

  async claimTask(arg1: string, arg2: string): Promise<DeliveryTask> {
    await delay(150);
    const isFirstIdTask = arg1.startsWith('task-') || !store.users.some((u) => u.id === arg1);
    const taskId = isFirstIdTask ? arg1 : arg2;
    const userId = isFirstIdTask ? arg2 : arg1;

    // Atomic claim — find and update in one step (simulated single-threaded)
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    if (task.status !== 'OPEN') throw { code: 'ALREADY_CLAIMED', message: 'Someone else claimed this task.' };

    const rider = store.riderAvailability[userId];
    if (rider && rider.capacityQty < task.quantity) throw { code: 'CAPACITY_EXCEEDED', message: 'This exceeds your declared capacity.' };

    // Check user doesn't already have an active task
    const activeTask = store.tasks.find((t) => t.claimedBy === userId && ['CLAIMED', 'ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT'].includes(t.status));
    if (activeTask) throw { code: 'ALREADY_HAS_TASK', message: 'Complete your current delivery first.' };

    task.status = 'CLAIMED';
    task.claimedBy = userId;
    task.claimedByName = store.users.find((u) => u.id === userId)?.displayName;
    task.claimExpiresAtUtc = new Date(Date.now() + CLAIM_TTL_MINUTES * 60_000).toISOString();
    task.pickupDeadlineUtc = new Date(Date.now() + (CLAIM_TTL_MINUTES + 10) * 60_000).toISOString();

    addEvent(task.donationId, 'task.claimed', userId, { taskId, claimExpiresAt: task.claimExpiresAtUtc }, task.id);

    // Check if donation is IN_PROGRESS
    const donation = store.donations.find((d) => d.id === task.donationId);
    if (donation && ['ALLOCATED', 'PARTIALLY_ALLOCATED'].includes(donation.status)) {
      transitionDonation(donation, 'IN_PROGRESS');
    }

    return enrichTask(task);
  },

  async pickupTask(taskId: string, userId: string): Promise<DeliveryTask> {
    const task = store.tasks.find((t) => t.id === taskId);
    return this.confirmPickup(userId, taskId, task ? task.quantity : 20);
  },

  async deliverTask(taskId: string, userId: string, proof?: any): Promise<DeliveryTask> {
    const task = store.tasks.find((t) => t.id === taskId);
    return this.confirmDelivery(userId, taskId, task ? task.quantity : 20);
  },

  async verifyDelivery(taskId: string, userId: string): Promise<any> {
    const task = store.tasks.find((t) => t.id === taskId);
    return this.verifyReceipt(userId, taskId, task ? task.quantity : 20);
  },

  async acknowledgeTask(userId: string, taskId: string): Promise<DeliveryTask> {
    await delay(150);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    task.status = 'IN_TRANSIT';
    delete task.claimExpiresAtUtc;
    addEvent(task.donationId, 'task.acknowledged', userId, { taskId }, task.id);
    persistStore();
    return { ...task };
  },

  async declineTask(userId: string, taskId: string): Promise<DeliveryTask> {
    await delay(150);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    task.status = 'OPEN';
    delete task.claimedBy;
    delete task.claimedByName;
    delete task.claimExpiresAtUtc;
    addEvent(task.donationId, 'task.declined', userId, { taskId }, task.id);
    persistStore();
    return { ...task };
  },

  async confirmPickup(userId: string, taskId: string, qty: number): Promise<DeliveryTask> {
    await delay(150);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    if (task.claimedBy !== userId) throw { code: 'FORBIDDEN', message: 'Not your task' };
    if (qty > task.quantity) throw { code: 'CAPACITY_EXCEEDED', message: 'Quantity exceeds task allocation' };
    task.quantity = qty;
    transitionTask(task, 'PICKED_UP');
    addEvent(task.donationId, 'task.picked_up', userId, { taskId, qty }, task.id);
    setTimeout(() => {
      if (task.status === 'PICKED_UP') { task.status = 'IN_TRANSIT'; addEvent(task.donationId, 'task.in_transit', userId, { taskId }, task.id); }
    }, 1000);
    return { ...task };
  },

  async confirmDelivery(userId: string, taskId: string, qty: number): Promise<DeliveryTask> {
    await delay(150);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    if (task.claimedBy !== userId) throw { code: 'FORBIDDEN', message: 'Not your task' };
    transitionTask(task, 'DELIVERED');
    addEvent(task.donationId, 'task.delivered', userId, { taskId, qty }, task.id);
    return { ...task };
  },

  async verifyReceipt(userId: string, taskId: string, qty: number, note?: string): Promise<{ task: DeliveryTask; credits: LedgerEntry[] }> {
    await delay(200);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    if (task.status !== 'DELIVERED') throw { code: 'INVALID_STATE_TRANSITION', message: 'Task is not in DELIVERED state' };

    transitionTask(task, 'DELIVERED_VERIFIED');

    // Update donation delivered qty
    const donation = store.donations.find((d) => d.id === task.donationId);
    if (donation) {
      donation.deliveredQty += qty;

      // Update site received qty
      const site = store.sites.find((s) => s.id === task.siteId);
      if (site) {
        const demandRow = site.demand.find((d) => d.category === donation.category);
        if (demandRow) {
          demandRow.receivedQty += qty;
          demandRow.reservedQty = Math.max(0, demandRow.reservedQty - task.quantity);
        }
      }

      // Check if all tasks verified
      const allTasks = store.tasks.filter((t) => t.donationId === donation.id);
      const allVerified = allTasks.every((t) => ['DELIVERED_VERIFIED', 'CANCELLED', 'FAILED_NO_DESTINATION'].includes(t.status));
      if (allVerified && donation.deliveredQty > 0) transitionDonation(donation, 'COMPLETED');
    }

    // Award credits (idempotent)
    const credits: LedgerEntry[] = [];
    if (task.claimedBy) {
      const ridEntry = awardCredit(task.claimedBy, 'VOLUNTEER', 'DELIVERY_VERIFIED', 10, 1, task.id);
      if (ridEntry) credits.push(ridEntry);
    }
    if (donation) {
      const donEntry = awardCredit(donation.donorId, 'DONOR', 'DELIVERY_VERIFIED', 5, 1, task.id);
      if (donEntry) credits.push(donEntry);
    }

    addEvent(task.donationId, 'task.verified', userId, { taskId, qty, note }, task.id);
    return { task: { ...task }, credits };
  },

  /* ── Reroute ─────────────────────────────────── */
  async proposeSiteFullReroute(taskId: string): Promise<DeliveryTask> {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    const donation = store.donations.find((d) => d.id === task.donationId);
    if (!donation) throw { code: 'NOT_FOUND', message: 'Donation not found' };

    const altSites = store.sites.filter((s) =>
      s.id !== task.siteId && s.status === 'OPEN' && s.verification === 'VERIFIED'
      && isCompatible(donation, s) && siteRemainingDemand(s, donation.category) >= task.quantity,
    );

    if (altSites.length === 0) {
      task.status = 'FAILED_NO_DESTINATION';
      addEvent(task.donationId, 'reroute.no_safe_destination', 'system', { taskId }, task.id);
      return { ...task };
    }

    const newSite = altSites[0];
    task.status = 'REROUTE_PROPOSED';
    task.reroute = {
      proposalId: uuid(),
      newSiteId: newSite.id,
      newSiteName: newSite.name,
      etaMinutes: calcEta(donation.pickup.lat, donation.pickup.lng, newSite.lat, newSite.lng),
      etaSource: 'mock',
      alternates: altSites.map((s) => s.id),
    };

    addEvent(task.donationId, 'reroute.proposed', 'system', { taskId, newSiteId: newSite.id }, task.id);
    return { ...task };
  },

  async acceptReroute(arg1: string, arg2: string, arg3?: string): Promise<DeliveryTask> {
    await delay(150);
    const taskId = arg1.startsWith('task-') ? arg1 : arg2;
    const userId = arg1.startsWith('task-') ? arg2 : arg1;
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    if (task.reroute) {
      task.siteId = task.reroute.newSiteId;
      task.siteName = task.reroute.newSiteName;
      task.etaMinutes = task.reroute.etaMinutes;
      delete task.reroute;
    }
    transitionTask(task, 'IN_TRANSIT');
    addEvent(task.donationId, 'reroute.accepted', userId, { taskId }, task.id);
    return enrichTask(task);
  },

  async declineReroute(userId: string, taskId: string, reason: string): Promise<DeliveryTask> {
    await delay(150);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw { code: 'NOT_FOUND', message: 'Task not found' };
    task.status = 'FAILED_NO_DESTINATION';
    delete task.reroute;
    addEvent(task.donationId, 'reroute.declined', userId, { taskId, reason }, task.id);
    return enrichTask(task);
  },

  async rejectReroute(arg1: string, arg2: string): Promise<DeliveryTask> {
    const taskId = arg1.startsWith('task-') ? arg1 : arg2;
    const userId = arg1.startsWith('task-') ? arg2 : arg1;
    return this.declineReroute(userId, taskId, 'Courier unable to accept reroute');
  },

  /* ── Sites ───────────────────────────────────── */
  async listSites(q?: { category?: string; status?: SiteStatus }): Promise<ReceivingSite[]> {
    await delay(80);
    let list = store.sites.filter((s) => s.verification === 'VERIFIED');
    if (q?.status) list = list.filter((s) => s.status === q.status);
    if (q?.category) list = list.filter((s) => s.acceptedCategories.includes(q.category!));
    return list.map((s) => ({ ...s }));
  },

  async getSite(id: string): Promise<ReceivingSite> {
    await delay(60);
    const site = store.sites.find((s) => s.id === id);
    if (!site) throw { code: 'NOT_FOUND', message: 'Site not found' };
    return { ...site };
  },

  async setSiteStatus(userId: string, siteId: string, status: SiteStatus, confirm?: boolean): Promise<{ site: ReceivingSite; affectedTasks: DeliveryTask[] }> {
    await delay(150);
    const site = store.sites.find((s) => s.id === siteId);
    if (!site) throw { code: 'NOT_FOUND', message: 'Site not found' };

    const affectedTasks = store.tasks.filter((t) =>
      t.siteId === siteId && ['CLAIMED', 'ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT'].includes(t.status),
    );

    if (affectedTasks.length > 0 && !confirm) {
      throw {
        code: 'CONFIRM_REQUIRED',
        message: `${affectedTasks.length} in-flight delivery(ies) will need rerouting.`,
        affectedTasks: affectedTasks.map((t) => t.id),
      };
    }

    site.status = status;
    addEvent(siteId, 'site.status_changed', userId, { siteId, status });

    // Trigger reroute for affected tasks
    if (status !== 'OPEN') {
      for (const task of affectedTasks) {
        setTimeout(() => this.proposeSiteFullReroute(task.id), 300);
      }
    }

    return { site: { ...site }, affectedTasks: affectedTasks.map((t) => ({ ...t })) };
  },

  async setSiteDemand(userId: string, siteId: string, d: { category: string; unit: string; demandQty: number }): Promise<ReceivingSite> {
    await delay(100);
    const site = store.sites.find((s) => s.id === siteId);
    if (!site) throw { code: 'NOT_FOUND', message: 'Site not found' };
    const row = site.demand.find((r) => r.category === d.category);
    if (row) {
      if (d.demandQty < row.reservedQty + row.receivedQty) throw { code: 'DEMAND_EXCEEDED', message: 'Cannot set demand below reserved+received qty' };
      row.demandQty = d.demandQty;
      row.unit = d.unit;
    } else {
      site.demand.push({ ...d, reservedQty: 0, receivedQty: 0 });
    }
    addEvent(siteId, 'site.demand_updated', userId, { siteId, ...d });
    return { ...site };
  },

  async setSiteCapability(userId: string, siteId: string, cap: Capability, available: boolean): Promise<ReceivingSite> {
    await delay(100);
    const site = store.sites.find((s) => s.id === siteId);
    if (!site) throw { code: 'NOT_FOUND', message: 'Site not found' };
    site.capabilities[cap] = available;
    addEvent(siteId, 'site.capability_changed', userId, { siteId, capability: cap, available });
    return { ...site };
  },

  async updateSiteStatus(siteId: string, status: SiteStatus, userId: string = 'system'): Promise<{ site: ReceivingSite; affectedTasks: DeliveryTask[] }> {
    return this.setSiteStatus(userId, siteId, status, true);
  },

  async updateSiteDemand(siteId: string, category: string, demandQty: number, unit = 'meals', userId = 'system'): Promise<ReceivingSite> {
    return this.setSiteDemand(userId, siteId, { category, unit, demandQty });
  },

  async updateSiteCapabilities(siteId: string, capabilities: Record<Capability, boolean>): Promise<ReceivingSite> {
    const site = store.sites.find((s) => s.id === siteId);
    if (!site) throw { code: 'NOT_FOUND', message: 'Site not found' };
    site.capabilities = { ...capabilities };
    return { ...site };
  },

  /* ── Open Gate ───────────────────────────────── */
  async listOpenGate(): Promise<OpenGateListing[]> {
    await delay(80);
    const now = new Date().toISOString();
    return store.openGate.map((l) => {
      if (l.status === 'SCHEDULED' && l.opensAtUtc <= now) l.status = 'ACTIVE';
      if (l.status === 'ACTIVE' && l.closesAtUtc <= now) l.status = 'CLOSED';
      return { ...l };
    });
  },

  async recordHandout(userId: string, listingId: string, qty: number): Promise<OpenGateListing> {
    await delay(150);
    const listing = store.openGate.find((l) => l.id === listingId);
    if (!listing) throw { code: 'NOT_FOUND', message: 'Listing not found' };
    if (listing.status === 'CLOSED') throw { code: 'LISTING_CLOSED', message: 'This listing has closed.' };
    if (qty > listing.remainingQty) throw { code: 'SOLD_OUT', message: 'Not enough remaining quantity.' };
    listing.remainingQty -= qty;
    if (listing.remainingQty <= 0) listing.status = 'CLOSED';

    const donation = store.donations.find((d) => d.id === listing.donationId);
    if (donation) {
      donation.deliveredQty += qty;
      if (listing.remainingQty <= 0) transitionDonation(donation, 'COMPLETED');
    }
    addEvent(listing.donationId, 'openGate.handout', userId, { listingId, qty });
    return { ...listing };
  },

  /* ── Notifications ───────────────────────────── */
  async notifications(userId: string): Promise<Notification[]> {
    await delay(60);
    return [...store.notifications].reverse();
  },

  async markRead(userId: string, ids: string[]): Promise<void> {
    await delay(60);
    for (const n of store.notifications) {
      if (ids.includes(n.id) && !n.readAtUtc) n.readAtUtc = new Date().toISOString();
    }
  },

  /* ── Credits ─────────────────────────────────── */
  async credits(userId: string): Promise<{ totals: CreditTotals; entries: LedgerEntry[] }> {
    await delay(80);
    const entries = store.ledger.filter((e) => e.userId === userId);
    const totals: CreditTotals = { DONOR: 0, VOLUNTEER: 0, HELPER: 0 };
    for (const e of entries) totals[e.creditType] += e.amount * e.multiplier;
    return { totals, entries: entries.map((e) => ({ ...e })) };
  },

  async myCredits(userId: string): Promise<{ balance: number; completedDeliveries: number; totals: CreditTotals; entries: LedgerEntry[] }> {
    const res = await this.credits(userId);
    const balance = res.totals.VOLUNTEER + res.totals.HELPER + res.totals.DONOR;
    const completedDeliveries = store.tasks.filter((t) => t.claimedBy === userId && ['DELIVERED', 'DELIVERED_VERIFIED'].includes(t.status)).length;
    return { balance, completedDeliveries, totals: res.totals, entries: res.entries };
  },

  async leaderboard(type: 'DONOR' | 'VOLUNTEER' | 'HELPER', period: 'MONTH' | 'EVENT'): Promise<LeaderboardEntry[]> {
    await delay(100);
    const scoreMap = new Map<string, number>();
    for (const e of store.ledger) {
      if (e.creditType === type) {
        scoreMap.set(e.userId, (scoreMap.get(e.userId) || 0) + e.amount * e.multiplier);
      }
    }
    return Array.from(scoreMap.entries())
      .map(([uid, score]) => ({ rank: 0, displayName: store.users.find((u) => u.id === uid)?.displayName || uid, score }))
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  },

  async addDemoCredits(userId: string, amount = 25, reason = 'Community Rescue Verification Bonus'): Promise<LedgerEntry> {
    await delay(80);
    const entry: LedgerEntry = {
      id: `ledger-${store.nextLedgerId++}`,
      userId,
      creditType: 'DONOR',
      eventType: 'DONATION_VERIFIED',
      amount,
      multiplier: 1.0,
      subjectId: `demo-bonus-${Date.now()}`,
      createdAtUtc: new Date().toISOString(),
    };
    store.ledger.push(entry);
    persistStore();
    return entry;
  },

  /* ── Rider Availability ──────────────────────── */
  async setAvailability(userId: string, a: RiderAvailability): Promise<void> {
    await delay(100);
    store.riderAvailability[userId] = { ...a };
    persistStore();
  },

  async getAvailability(userId: string): Promise<RiderAvailability | null> {
    await delay(60);
    return store.riderAvailability[userId] ? { ...store.riderAvailability[userId] } : null;
  },

  /* ── Platform Stats ──────────────────────────── */
  async platformStats(): Promise<PlatformStats> {
    await delay(60);
    return {
      mealsCoordinated: store.donations.reduce((s, d) => s + d.deliveredQty, 0) + 1240,
      deliveriesVerified: store.tasks.filter((t) => t.status === 'DELIVERED_VERIFIED').length + 86,
      activeShelters: store.sites.filter((s) => s.status === 'OPEN' && s.verification === 'VERIFIED').length,
      activeVolunteers: Object.values(store.riderAvailability).filter((a) => a.isAvailable).length,
    };
  },

  /* ── Simulation (Admin) ──────────────────────── */
  sim: {
    async reset(): Promise<void> {
      store = freshStore();
      persistStore();
    },
    async runMatching(donationId: string): Promise<DeliveryTask[]> {
      return runMatchingEngine(donationId, 'admin1');
    },
    async runClaimExpiry(): Promise<void> {
      runClaimExpiryWorker();
    },
    async runExpirySweeper(): Promise<void> {
      runExpirySweeper();
    },
    async makeRiderUnresponsive(riderId: string): Promise<void> {
      const avail = store.riderAvailability[riderId];
      if (avail) avail.isAvailable = false;
      // expire any claimed tasks
      for (const task of store.tasks) {
        if (task.claimedBy === riderId && task.status === 'CLAIMED') {
          task.status = 'OPEN';
          task.claimExpiresAtUtc = undefined;
          addEvent(task.donationId, 'task.rider_unresponsive', 'admin1', { riderId, taskId: task.id }, task.id);
          runMatchingEngine(task.donationId, 'system');
        }
      }
    },
    async setSiteFull(siteId: string): Promise<void> {
      const site = store.sites.find((s) => s.id === siteId);
      if (site) {
        site.status = 'FULL';
        const affectedTasks = store.tasks.filter((t) => t.siteId === siteId && ['CLAIMED', 'ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT'].includes(t.status));
        for (const task of affectedTasks) setTimeout(() => mockApi.proposeSiteFullReroute(task.id), 300);
      }
    },
    getStore: () => store,
    getAllTasks: () => store.tasks.map((t) => ({ ...t })),
    getAllDonations: () => store.donations.map((d) => ({ ...d })),
    getAllSites: () => store.sites.map((s) => ({ ...s })),
    getAllEvents: () => store.events.map((e) => ({ ...e })),
  },

  /* ── Audit ───────────────────────────────────── */
  async audit(): Promise<DeliveryEvent[]> {
    await delay(80);
    return [...store.events].reverse();
  },
};
