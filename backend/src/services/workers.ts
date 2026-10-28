import { prisma } from '../db.js';
import { runMatchingEngine } from './matching.js';

export async function runClaimExpiryWorker() {
  const now = new Date().toISOString();

  // Find tasks whose claim has expired
  const expiredTasks = await prisma.deliveryTask.findMany({
    where: {
      status: 'CLAIMED',
      claimExpiresAtUtc: { lte: now },
    },
  });

  for (const task of expiredTasks) {
    const prevRider = task.claimedBy;

    await prisma.deliveryTask.update({
      where: { id: task.id },
      data: {
        status: 'OPEN',
        claimedBy: null,
        claimedByName: null,
        claimExpiresAtUtc: null,
      },
    });

    await prisma.deliveryEvent.create({
      data: {
        donationId: task.donationId,
        taskId: task.id,
        type: 'task.claim_expired',
        actor: 'system',
        actorName: 'Claim TTL Worker',
        payload: JSON.stringify({
          taskId: task.id,
          expiredRiderId: prevRider,
          reason: '10-minute acknowledgment window exceeded without confirmation',
        }),
        createdAtUtc: new Date().toISOString(),
      },
    });

    // Re-evaluate matching
    await runMatchingEngine(task.donationId, 'claim_ttl_worker');
  }

  return expiredTasks.length;
}

export async function runExpirySweeper() {
  const now = new Date().toISOString();

  // Find donations past expiry date that are not yet delivered
  const expiredDons = await prisma.donation.findMany({
    where: {
      expiryUtc: { lte: now },
      status: { in: ['PUBLISHED', 'PARTIALLY_ALLOCATED', 'ALLOCATED', 'NEEDS_ASSISTANCE'] },
    },
  });

  for (const don of expiredDons) {
    await prisma.donation.update({
      where: { id: don.id },
      data: { status: 'EXPIRED_UNDELIVERED' },
    });

    // Cancel open tasks
    await prisma.deliveryTask.updateMany({
      where: { donationId: don.id, status: 'OPEN' },
      data: { status: 'EXPIRED' },
    });

    await prisma.deliveryEvent.create({
      data: {
        donationId: don.id,
        type: 'donation.expired_undelivered',
        actor: 'system',
        actorName: 'FEFO Safety Sweeper',
        payload: JSON.stringify({
          donationId: don.id,
          expiryUtc: don.expiryUtc,
          allocatedQty: don.allocatedQty,
          deliveredQty: don.deliveredQty,
        }),
        createdAtUtc: new Date().toISOString(),
      },
    });
  }

  return expiredDons.length;
}
