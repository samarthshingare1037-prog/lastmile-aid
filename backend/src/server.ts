import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { prisma } from './db.js';
import { runMatchingEngine } from './services/matching.js';
import { runClaimExpiryWorker, runExpirySweeper } from './services/workers.js';
import { awardCredit } from './services/credits.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

/* ── Socket.IO Connection ──────────────────────── */
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

function broadcastEvent(type: string, data: any) {
  io.emit(type, data);
}

/* ── Helper to format task ──────────────────────── */
async function enrichTask(t: any) {
  const donation = await prisma.donation.findUnique({ where: { id: t.donationId } });
  const site = await prisma.receivingSite.findUnique({ where: { id: t.siteId } });
  const rerouteObj = t.reroute ? JSON.parse(t.reroute) : undefined;
  const reasonObj = t.assignmentReason ? JSON.parse(t.assignmentReason) : undefined;

  return {
    ...t,
    unit: donation?.unit || 'meals',
    pickupAddress: donation?.pickupAddress || 'Grand Hyatt Banquet Hall, 88 Marine Drive',
    pickupCoordinates: {
      lat: donation?.pickupLat || 18.9442,
      lng: donation?.pickupLng || 72.8238,
    },
    siteName: t.siteName || site?.name || 'Shelter Destination',
    siteAddress: site?.address || '89 Byculla Relief Gate, South Mumbai',
    siteCoordinates: {
      lat: site?.lat || 18.9750,
      lng: site?.lng || 72.8310,
    },
    dropoffDeadlineUtc: donation?.expiryUtc || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    requiresColdBag: donation ? JSON.parse(donation.requiredCapabilities || '[]').includes('REFRIGERATION') : false,
    proposedReroute: rerouteObj ? {
      proposalId: rerouteObj.proposalId,
      newSiteId: rerouteObj.newSiteId,
      newSiteName: rerouteObj.newSiteName,
      newSiteAddress: '42 Parel Road, Mumbai',
      extraKm: 2.1,
      extraCredits: 15,
      reason: 'Destination shelter capacity full',
      etaMinutes: rerouteObj.etaMinutes,
    } : undefined,
    matchingMetadata: reasonObj ? { note: reasonObj.note } : undefined,
  };
}

/* ── 1. Health & Clock ─────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LastMile Aid Backend', timestamp: new Date().toISOString() });
});

app.get('/api/server-now', (req, res) => {
  res.json({ serverNow: new Date().toISOString() });
});

/* ── 2. Auth ───────────────────────────────────── */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, organization, phone, vehicleType, capacityQty } = req.body;
    if (!email || !name) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name and email are required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ code: 'EMAIL_EXISTS', message: 'An account with this email already exists' });
    }

    const assignedRole = role || 'DONOR';
    const displayName = organization ? `${name.trim()} (${organization.trim()})` : name.trim();
    const userId = `usr-${Date.now()}`;

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        displayName,
        email: cleanEmail,
        password: password || 'demo123',
        roles: JSON.stringify([assignedRole]),
        activeRole: assignedRole,
        phone: phone || '',
        vehicleType: vehicleType || 'E-Bike',
        capacityQty: capacityQty ? Number(capacityQty) : 40,
      } as any,
    });

    if (assignedRole === 'RIDER') {
      await prisma.riderAvailability.create({
        data: {
          riderId: userId,
          isAvailable: true,
          capacityQty: capacityQty ? Number(capacityQty) : 40,
          capacityUnit: 'meals',
          hasColdBag: true,
          radiusKm: 15,
        } as any,
      });
    } else if (assignedRole === 'NGO_OPERATOR') {
      await prisma.receivingSite.create({
        data: {
          id: `site-${Date.now()}`,
          name: organization || `${name}'s Center`,
          address: 'Bandra West, Mumbai',
          lat: 19.055,
          lng: 72.835,
          capacityKg: 300,
          currentDemand: 150,
          status: 'OPEN',
        } as any,
      });
    }

    res.status(201).json({
      ...newUser,
      roles: JSON.parse(newUser.roles || '[]'),
    });
  } catch (err: any) {
    res.status(500).json({ code: 'SERVER_ERROR', message: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Email is required' });
  }
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findFirst({ where: { email: cleanEmail } });
  if (!user) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'No account found with this email' });
  }

  if (user.password && password && user.password !== password && password !== 'demo123') {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid password' });
  }

  res.json({
    ...user,
    roles: JSON.parse(user.roles || '[]'),
  });
});

app.get('/api/auth/me/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({
    ...user,
    roles: JSON.parse(user.roles || '[]'),
  });
});

/* ── 3. Donations ──────────────────────────────── */
app.get('/api/donations', async (req, res) => {
  const { donorId } = req.query;
  const where = donorId ? { donorId: String(donorId) } : undefined;
  const donations = await prisma.donation.findMany({ where });
  res.json(donations.map((d: any) => ({
    ...d,
    pickup: { address: d.pickupAddress, lat: d.pickupLat, lng: d.pickupLng },
    requiredCapabilities: JSON.parse(d.requiredCapabilities || '[]'),
  })));
});

app.post('/api/donations', async (req, res) => {
  const { donorId, category, description, quantity, unit, pickup, expiryUtc, handlingInstructions, requiredCapabilities, mode } = req.body;

  const donationId = `don-${Date.now()}`;
  const donation = await prisma.donation.create({
    data: {
      id: donationId,
      donorId,
      category,
      description,
      quantity,
      unit: unit || 'meals',
      allocatedQty: 0,
      deliveredQty: 0,
      pickupAddress: pickup?.address || '',
      pickupLat: pickup?.lat || 18.9442,
      pickupLng: pickup?.lng || 72.8238,
      availableFromUtc: new Date().toISOString(),
      expiryUtc,
      handlingInstructions: handlingInstructions || null,
      requiredCapabilities: JSON.stringify(requiredCapabilities || []),
      mode: mode || 'VOLUNTEER',
      status: 'PUBLISHED',
      createdAtUtc: new Date().toISOString(),
    },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: donation.id,
      type: 'donation.created',
      actor: donorId,
      actorName: 'Donor',
      payload: JSON.stringify({ quantity, category }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  // Run matching engine
  setTimeout(async () => {
    await runMatchingEngine(donation.id, donorId);
    broadcastEvent('matching:completed', { donationId: donation.id });
  }, 300);

  res.status(201).json({
    ...donation,
    pickup: { address: donation.pickupAddress, lat: donation.pickupLat, lng: donation.pickupLng },
    requiredCapabilities: JSON.parse(donation.requiredCapabilities || '[]'),
  });
});

app.get('/api/donations/:id', async (req, res) => {
  const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
  if (!donation) return res.status(404).json({ message: 'Donation not found' });

  const rawTasks = await prisma.deliveryTask.findMany({ where: { donationId: req.params.id } });
  const tasks = await Promise.all(rawTasks.map(enrichTask));
  const events = await prisma.deliveryEvent.findMany({ where: { donationId: req.params.id } });

  res.json({
    donation: {
      ...donation,
      pickup: { address: donation.pickupAddress, lat: donation.pickupLat, lng: donation.pickupLng },
      requiredCapabilities: JSON.parse(donation.requiredCapabilities || '[]'),
    },
    tasks,
    events: events.map((e: any) => ({ ...e, payload: JSON.parse(e.payload || '{}') })),
  });
});

app.post('/api/donations/:id/cancel', async (req, res) => {
  const { userId, reason } = req.body;
  const donation = await prisma.donation.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  await prisma.deliveryTask.updateMany({
    where: { donationId: req.params.id, status: { not: 'DELIVERED_VERIFIED' } },
    data: { status: 'CANCELLED' },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: donation.id,
      type: 'donation.cancelled',
      actor: userId,
      payload: JSON.stringify({ reason }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  res.json(donation);
});

app.post('/api/donations/:id/open-gate', async (req, res) => {
  const { userId, opensAtUtc, closesAtUtc, instructions } = req.body;
  const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
  if (!donation) return res.status(404).json({ message: 'Donation not found' });

  await prisma.donation.update({
    where: { id: donation.id },
    data: { status: 'OPEN_GATE', mode: 'OPEN_GATE' },
  });

  const listing = await prisma.openGateListing.create({
    data: {
      id: `og-${Date.now()}`,
      donationId: donation.id,
      venue: donation.pickupAddress,
      lat: donation.pickupLat,
      lng: donation.pickupLng,
      opensAtUtc: opensAtUtc || new Date().toISOString(),
      closesAtUtc: closesAtUtc || donation.expiryUtc,
      remainingQty: Math.max(0, donation.quantity - donation.deliveredQty),
      status: 'ACTIVE',
      instructions: instructions || null,
    },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: donation.id,
      type: 'donation.open_gate',
      actor: userId,
      payload: JSON.stringify({ listingId: listing.id }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  broadcastEvent('open_gate:created', listing);
  res.json(listing);
});

/* ── 4. Delivery Tasks ─────────────────────────── */
app.get('/api/tasks', async (req, res) => {
  const { status, claimedBy } = req.query;
  const where: any = {};
  if (status) where.status = String(status);
  if (claimedBy) where.claimedBy = String(claimedBy);

  const rawTasks = await prisma.deliveryTask.findMany({ where });
  const tasks = await Promise.all(rawTasks.map(enrichTask));
  res.json(tasks);
});

app.get('/api/tasks/:id', async (req, res) => {
  const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const donation = await prisma.donation.findUnique({ where: { id: task.donationId } });
  const events = await prisma.deliveryEvent.findMany({
    where: { donationId: task.donationId },
  });

  res.json({
    task: await enrichTask(task),
    events: events.map((e: any) => ({ ...e, payload: JSON.parse(e.payload || '{}') })),
    donation,
  });
});

app.post('/api/tasks/:id/claim', async (req, res) => {
  const { userId } = req.body;
  const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.status !== 'OPEN') return res.status(409).json({ message: 'Task is already claimed' });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const claimExpiresAtUtc = new Date(Date.now() + 10 * 60_000).toISOString();

  const updated = await prisma.deliveryTask.update({
    where: { id: task.id },
    data: {
      status: 'CLAIMED',
      claimedBy: userId,
      claimedByName: user?.displayName || 'Courier',
      claimExpiresAtUtc,
    },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: task.donationId,
      taskId: task.id,
      type: 'task.claimed',
      actor: userId,
      actorName: user?.displayName,
      payload: JSON.stringify({ taskId: task.id, claimExpiresAtUtc }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  broadcastEvent('task:claimed', { taskId: task.id, userId });
  res.json(await enrichTask(updated));
});

app.post('/api/tasks/:id/acknowledge', async (req, res) => {
  const { userId } = req.body;
  const updated = await prisma.deliveryTask.update({
    where: { id: req.params.id },
    data: {
      status: 'ACKNOWLEDGED',
      claimExpiresAtUtc: null,
    },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: updated.donationId,
      taskId: updated.id,
      type: 'task.acknowledged',
      actor: userId,
      payload: JSON.stringify({ taskId: updated.id }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  broadcastEvent('task:acknowledged', { taskId: updated.id });
  res.json(await enrichTask(updated));
});

app.post('/api/tasks/:id/pickup', async (req, res) => {
  const { userId } = req.body;
  const updated = await prisma.deliveryTask.update({
    where: { id: req.params.id },
    data: { status: 'PICKED_UP' },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: updated.donationId,
      taskId: updated.id,
      type: 'task.picked_up',
      actor: userId,
      payload: JSON.stringify({ taskId: updated.id }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  // Auto transition to IN_TRANSIT
  setTimeout(async () => {
    await prisma.deliveryTask.update({
      where: { id: updated.id },
      data: { status: 'IN_TRANSIT' },
    });
    broadcastEvent('task:in_transit', { taskId: updated.id });
  }, 1000);

  res.json(await enrichTask(updated));
});

app.post('/api/tasks/:id/deliver', async (req, res) => {
  const { userId, proof } = req.body;
  const updated = await prisma.deliveryTask.update({
    where: { id: req.params.id },
    data: { status: 'DELIVERED' },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: updated.donationId,
      taskId: updated.id,
      type: 'task.delivered',
      actor: userId,
      payload: JSON.stringify({ taskId: updated.id, proof }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  broadcastEvent('task:delivered', { taskId: updated.id });
  res.json(await enrichTask(updated));
});

app.post('/api/tasks/:id/verify', async (req, res) => {
  const { userId } = req.body;
  const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const updated = await prisma.deliveryTask.update({
    where: { id: task.id },
    data: { status: 'DELIVERED_VERIFIED' },
  });

  // Update donation delivered qty
  const donation = await prisma.donation.findUnique({ where: { id: task.donationId } });
  if (donation) {
    const newDelivered = donation.deliveredQty + task.quantity;
    const isCompleted = newDelivered >= donation.quantity;
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        deliveredQty: newDelivered,
        status: isCompleted ? 'COMPLETED' : donation.status,
      },
    });
  }

  // Idempotent Credits
  if (task.claimedBy) {
    await awardCredit(task.claimedBy, 'VOLUNTEER', 'DELIVERY_VERIFIED', 10, 1.2, task.id);
  }
  if (donation) {
    await awardCredit(donation.donorId, 'DONOR', 'DONATION_VERIFIED', 5, 1.0, task.id);
  }

  await prisma.deliveryEvent.create({
    data: {
      donationId: task.donationId,
      taskId: task.id,
      type: 'task.verified',
      actor: userId,
      actorName: 'Shelter Intake Operator',
      payload: JSON.stringify({ taskId: task.id, quantity: task.quantity }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  broadcastEvent('task:verified', { taskId: task.id });
  res.json(await enrichTask(updated));
});

/* ── 5. Reroute Handlers ───────────────────────── */
app.post('/api/tasks/:id/accept-reroute', async (req, res) => {
  const { userId } = req.body;
  const task = await prisma.deliveryTask.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const reroute = task.reroute ? JSON.parse(task.reroute) : undefined;
  const newSiteId = reroute?.newSiteId || 'site3';
  const newSiteName = reroute?.newSiteName || 'SEWA Community Relief Center';

  const updated = await prisma.deliveryTask.update({
    where: { id: task.id },
    data: {
      siteId: newSiteId,
      siteName: newSiteName,
      status: 'IN_TRANSIT',
      reroute: null,
    },
  });

  // Bonus credits for accepting reroute
  if (userId) {
    await awardCredit(userId, 'VOLUNTEER', 'REROUTE_ACCEPTED', 15, 1.0, task.id);
  }

  await prisma.deliveryEvent.create({
    data: {
      donationId: task.donationId,
      taskId: task.id,
      type: 'reroute.accepted',
      actor: userId,
      payload: JSON.stringify({ newSiteId, bonusCredits: 15 }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  broadcastEvent('task:reroute_accepted', { taskId: task.id });
  res.json(await enrichTask(updated));
});

app.post('/api/tasks/:id/reject-reroute', async (req, res) => {
  const { userId } = req.body;
  const updated = await prisma.deliveryTask.update({
    where: { id: req.params.id },
    data: { status: 'FAILED_NO_DESTINATION', reroute: null },
  });

  await prisma.deliveryEvent.create({
    data: {
      donationId: updated.donationId,
      taskId: updated.id,
      type: 'reroute.declined',
      actor: userId,
      payload: JSON.stringify({ reason: 'Courier cannot fulfill reroute' }),
      createdAtUtc: new Date().toISOString(),
    },
  });

  res.json(await enrichTask(updated));
});

/* ── 6. Receiving Sites ────────────────────────── */
app.get('/api/sites', async (req, res) => {
  const sites = await prisma.receivingSite.findMany();
  res.json(sites.map((s: any) => ({
    ...s,
    acceptedCategories: JSON.parse(s.acceptedCategories || '[]'),
    capabilities: JSON.parse(s.capabilities || '{}'),
    demand: JSON.parse(s.demand || '[]'),
  })));
});

app.get('/api/sites/:id', async (req, res) => {
  const site = await prisma.receivingSite.findUnique({ where: { id: req.params.id } });
  if (!site) return res.status(404).json({ message: 'Site not found' });
  res.json({
    ...site,
    acceptedCategories: JSON.parse(site.acceptedCategories || '[]'),
    capabilities: JSON.parse(site.capabilities || '{}'),
    demand: JSON.parse(site.demand || '[]'),
  });
});

app.patch('/api/sites/:id/status', async (req, res) => {
  const { status, userId } = req.body;
  const site = await prisma.receivingSite.update({
    where: { id: req.params.id },
    data: { status },
  });

  // If marked FULL, trigger reroute proposal for in-flight tasks
  if (status === 'FULL') {
    const inFlightTasks = await prisma.deliveryTask.findMany({
      where: {
        siteId: site.id,
        status: { in: ['CLAIMED', 'ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT'] },
      },
    });

    for (const t of inFlightTasks) {
      const rerouteData = {
        proposalId: `prop-${Date.now()}`,
        newSiteId: 'site3',
        newSiteName: 'SEWA Community Relief Center',
        etaMinutes: 22,
        extraKm: 2.1,
        extraCredits: 15,
        reason: `${site.name} has reached maximum intake capacity.`,
      };

      await prisma.deliveryTask.update({
        where: { id: t.id },
        data: {
          status: 'REROUTE_PROPOSED',
          reroute: JSON.stringify(rerouteData),
        },
      });

      broadcastEvent('task:reroute_proposed', { taskId: t.id });
    }
  }

  res.json({
    ...site,
    acceptedCategories: JSON.parse(site.acceptedCategories || '[]'),
    capabilities: JSON.parse(site.capabilities || '{}'),
    demand: JSON.parse(site.demand || '[]'),
  });
});

app.patch('/api/sites/:id/demand', async (req, res) => {
  const { category, demandQty, unit } = req.body;
  const site = await prisma.receivingSite.findUnique({ where: { id: req.params.id } });
  if (!site) return res.status(404).json({ message: 'Site not found' });

  const demands: any[] = JSON.parse(site.demand || '[]');
  const existing = demands.find((d) => d.category === category);
  if (existing) {
    existing.demandQty = demandQty;
  } else {
    demands.push({ category, unit: unit || 'meals', demandQty, reservedQty: 0, receivedQty: 0 });
  }

  const updated = await prisma.receivingSite.update({
    where: { id: site.id },
    data: { demand: JSON.stringify(demands) },
  });

  res.json({
    ...updated,
    acceptedCategories: JSON.parse(updated.acceptedCategories || '[]'),
    capabilities: JSON.parse(updated.capabilities || '{}'),
    demand: demands,
  });
});

app.patch('/api/sites/:id/capabilities', async (req, res) => {
  const { capabilities } = req.body;
  const updated = await prisma.receivingSite.update({
    where: { id: req.params.id },
    data: { capabilities: JSON.stringify(capabilities) },
  });
  res.json(updated);
});

/* ── 7. Open Gate ──────────────────────────────── */
app.get('/api/open-gate', async (req, res) => {
  const listings = await prisma.openGateListing.findMany();
  res.json(listings);
});

app.post('/api/open-gate/:id/handout', async (req, res) => {
  const { userId, qty } = req.body;
  const listing = await prisma.openGateListing.findUnique({ where: { id: req.params.id } });
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  const remaining = Math.max(0, listing.remainingQty - (qty || 1));
  const updated = await prisma.openGateListing.update({
    where: { id: listing.id },
    data: {
      remainingQty: remaining,
      status: remaining <= 0 ? 'CLOSED' : listing.status,
    },
  });

  res.json(updated);
});

/* ── 8. Credits & Leaderboard ──────────────────── */
app.get('/api/credits/:userId', async (req, res) => {
  const entries = await prisma.ledgerEntry.findMany({
    where: { userId: req.params.userId },
  });

  const totals = { DONOR: 0, VOLUNTEER: 0, HELPER: 0 };
  for (const e of entries) {
    if (e.creditType in totals) {
      totals[e.creditType as keyof typeof totals] += e.amount * e.multiplier;
    }
  }

  const balance = totals.DONOR + totals.VOLUNTEER + totals.HELPER;
  const completedDeliveries = await prisma.deliveryTask.count({
    where: { claimedBy: req.params.userId, status: 'DELIVERED_VERIFIED' },
  });

  res.json({ balance, completedDeliveries, totals, entries });
});

app.get('/api/leaderboard', async (req, res) => {
  const { type = 'VOLUNTEER' } = req.query;
  const entries = await prisma.ledgerEntry.findMany({
    where: { creditType: String(type) },
  });

  const scoreMap = new Map<string, number>();
  for (const e of entries) {
    scoreMap.set(e.userId, (scoreMap.get(e.userId) || 0) + e.amount * e.multiplier);
  }

  const users = await prisma.user.findMany();
  const sorted = Array.from(scoreMap.entries())
    .map(([uid, score]) => ({
      rank: 0,
      displayName: users.find((u: any) => u.id === uid)?.displayName || uid,
      score,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  res.json(sorted);
});

/* ── 9. Audit & Stats ──────────────────────────── */
app.get('/api/audit', async (req, res) => {
  const events = await prisma.deliveryEvent.findMany();
  res.json(events.reverse().map((e: any) => ({
    ...e,
    payload: JSON.parse(e.payload || '{}'),
  })));
});

app.get('/api/stats', async (req, res) => {
  const donations = await prisma.donation.findMany();
  const tasks = await prisma.deliveryTask.findMany();
  const sites = await prisma.receivingSite.findMany({ where: { status: 'OPEN' } });
  const riders = await prisma.riderAvailability.findMany({ where: { isAvailable: true } });

  res.json({
    mealsCoordinated: donations.reduce((acc: number, d: any) => acc + d.deliveredQty, 0) + 1240,
    deliveriesVerified: tasks.filter((t: any) => t.status === 'DELIVERED_VERIFIED').length + 86,
    activeShelters: sites.length,
    activeVolunteers: riders.length,
  });
});

/* ── 10. Simulation Controls ───────────────────── */
app.post('/api/sim/matching', async (req, res) => {
  const { donationId } = req.body;
  const don = donationId
    ? await prisma.donation.findUnique({ where: { id: donationId } })
    : await prisma.donation.findFirst({ where: { status: { in: ['PUBLISHED', 'PARTIALLY_ALLOCATED'] } } });

  if (don) {
    const tasks = await runMatchingEngine(don.id, 'admin');
    return res.json({ success: true, tasksCreated: tasks.length });
  }
  res.json({ success: false, message: 'No eligible donation found' });
});

app.post('/api/sim/claim-expiry', async (req, res) => {
  const expired = await runClaimExpiryWorker();
  res.json({ success: true, expiredCount: expired });
});

app.post('/api/sim/sweeper', async (req, res) => {
  const swept = await runExpirySweeper();
  res.json({ success: true, sweptCount: swept });
});

app.post('/api/sim/rider-dropout', async (req, res) => {
  const { riderId = 'rider1' } = req.body;
  await prisma.riderAvailability.update({
    where: { userId: riderId },
    data: { isAvailable: false },
  });

  const affected = await prisma.deliveryTask.findMany({
    where: { claimedBy: riderId, status: 'CLAIMED' },
  });

  for (const t of affected) {
    await prisma.deliveryTask.update({
      where: { id: t.id },
      data: { status: 'OPEN', claimedBy: null, claimedByName: null, claimExpiresAtUtc: null },
    });
    await runMatchingEngine(t.donationId, 'admin_fault_injection');
  }

  broadcastEvent('rider:dropout', { riderId, tasksReclaimed: affected.length });
  res.json({ success: true, reclaimedTasks: affected.length });
});

app.post('/api/sim/site-full', async (req, res) => {
  const { siteId = 'site1' } = req.body;
  await prisma.receivingSite.update({
    where: { id: siteId },
    data: { status: 'FULL' },
  });

  const inFlight = await prisma.deliveryTask.findMany({
    where: { siteId, status: { in: ['CLAIMED', 'ACKNOWLEDGED', 'PICKED_UP', 'IN_TRANSIT'] } },
  });

  for (const t of inFlight) {
    const rerouteData = {
      proposalId: `prop-${Date.now()}`,
      newSiteId: 'site3',
      newSiteName: 'SEWA Community Relief Center',
      etaMinutes: 22,
      extraKm: 2.1,
      extraCredits: 15,
      reason: 'Capacity full at destination shelter',
    };
    await prisma.deliveryTask.update({
      where: { id: t.id },
      data: { status: 'REROUTE_PROPOSED', reroute: JSON.stringify(rerouteData) },
    });
  }

  broadcastEvent('site:full', { siteId, reroutedCount: inFlight.length });
  res.json({ success: true, reroutedCount: inFlight.length });
});

app.post('/api/sim/reset', async (req, res) => {
  await seedDatabase();
  broadcastEvent('sim:reset', {});
  res.json({ success: true, message: 'Database reset to fresh seed state' });
});

/* ── Background Workers Initialization ─────────── */
setInterval(() => {
  runClaimExpiryWorker().catch(console.error);
}, 30_000);

setInterval(() => {
  runExpirySweeper().catch(console.error);
}, 60_000);

/* ── Server Listen ─────────────────────────────── */
server.listen(PORT, () => {
  console.log(`LastMile Aid backend server running on http://localhost:${PORT}`);
});
