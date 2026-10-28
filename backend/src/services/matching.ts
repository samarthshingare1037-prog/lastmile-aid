import { prisma } from '../db.js';
import type { Capability, SiteDemand } from '../types.js';

function calcEta(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((distKm * 1.3) / 25 * 60 + 10);
}

export async function runMatchingEngine(donationId: string, actorId = 'system') {
  const donation = await prisma.donation.findUnique({ where: { id: donationId } });
  if (!donation) return [];

  let leftQty = donation.quantity - donation.allocatedQty;
  if (leftQty <= 0) return [];

  const requiredCaps: Capability[] = JSON.parse(donation.requiredCapabilities || '[]');

  // Get verified OPEN sites
  const rawSites = await prisma.receivingSite.findMany({
    where: { status: 'OPEN', verification: 'VERIFIED' },
  });

  // Filter compatible sites with remaining demand
  interface CandidateSite {
    site: typeof rawSites[0];
    demand: SiteDemand;
    remaining: number;
    etaMinutes: number;
  }

  const candidateSites: CandidateSite[] = [];

  for (const s of rawSites) {
    const acceptedCats: string[] = JSON.parse(s.acceptedCategories || '[]');
    if (!acceptedCats.includes(donation.category)) continue;

    const caps: Record<string, boolean> = JSON.parse(s.capabilities || '{}');
    const hasAllCaps = requiredCaps.every((c) => !!caps[c]);
    if (!hasAllCaps) continue;

    const demands: SiteDemand[] = JSON.parse(s.demand || '[]');
    const d = demands.find((dm) => dm.category === donation.category);
    if (!d) continue;

    const remaining = Math.max(0, d.demandQty - d.reservedQty - d.receivedQty);
    if (remaining <= 0) continue;

    const eta = calcEta(donation.pickupLat, donation.pickupLng, s.lat, s.lng);
    candidateSites.push({ site: s, demand: d, remaining, etaMinutes: eta });
  }

  // Sort sites by proximity and remaining demand
  candidateSites.sort((a, b) => a.etaMinutes - b.etaMinutes || b.remaining - a.remaining);

  // Available couriers
  const availRiders = await prisma.riderAvailability.findMany({
    where: { isAvailable: true },
  });

  const createdTasks: any[] = [];
  let taskCounter = await prisma.deliveryTask.count() + 1;

  let riderIdx = 0;
  let siteIdx = 0;

  // Split large quantity (e.g. 180 meals) into batches matching rider capacity (e.g. 40 meals)
  while (leftQty > 0) {
    const rider = availRiders[riderIdx % (availRiders.length || 1)];
    const riderCap = rider?.capacityQty || 40;
    const taskQty = Math.min(leftQty, riderCap);
    if (taskQty <= 0) break;

    const cand = candidateSites[siteIdx % (candidateSites.length || 1)] || {
      site: rawSites[0],
      demand: { demandQty: 100, reservedQty: 0, receivedQty: 0 },
      remaining: 100,
      etaMinutes: 18,
    };

    const taskId = `task-${taskCounter++}`;
    const claimExpiry = new Date(Date.now() + 5 * 60_000).toISOString();
    const assignedRiderId = rider?.userId || 'rider1';

    const task = await prisma.deliveryTask.create({
      data: {
        id: taskId,
        donationId: donation.id,
        siteId: cand.site.id,
        siteName: cand.site.name,
        quantity: taskQty,
        status: 'CLAIMED',
        claimedBy: assignedRiderId,
        claimExpiresAtUtc: claimExpiry,
        etaMinutes: cand.etaMinutes,
        etaSource: 'mock',
        assignmentReason: JSON.stringify({
          note: `Split batch: ${taskQty} meals allocated (Courier cap: ${riderCap}). Assigned to ${assignedRiderId}. 5-minute acceptance timer active.`,
        }),
      },
    });

    createdTasks.push(task);

    // Update site demand reserved quantity
    const demands: SiteDemand[] = JSON.parse(cand.site.demand || '[]');
    const targetDemand = demands.find((dm) => dm.category === donation.category);
    if (targetDemand) {
      targetDemand.reservedQty += taskQty;
      await prisma.receivingSite.update({
        where: { id: cand.site.id },
        data: { demand: JSON.stringify(demands) },
      });
    }

    leftQty -= taskQty;

    // Log allocation event
    await prisma.deliveryEvent.create({
      data: {
        donationId: donation.id,
        taskId: task.id,
        type: 'allocation.created',
        actor: actorId,
        actorName: 'Deterministic Dispatch Engine',
        payload: JSON.stringify({
          taskId: task.id,
          siteId: cand.site.id,
          siteName: cand.site.name,
          quantity: taskQty,
          claimedBy: assignedRiderId,
          claimExpiresAtUtc: claimExpiry,
        }),
        createdAtUtc: new Date().toISOString(),
      },
    });

    riderIdx++;
    siteIdx++;
  }

  // Update donation allocated quantity and status
  const newAllocated = donation.quantity - leftQty;
  let newStatus = donation.status;
  if (newAllocated >= donation.quantity) {
    newStatus = 'ALLOCATED';
  } else if (newAllocated > 0) {
    newStatus = 'PARTIALLY_ALLOCATED';
  } else {
    newStatus = 'NEEDS_ASSISTANCE';
  }

  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      allocatedQty: newAllocated,
      status: newStatus,
    },
  });

  return createdTasks;
}
