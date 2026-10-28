import { prisma } from '../db.js';

export async function awardCredit(
  userId: string,
  creditType: 'DONOR' | 'VOLUNTEER' | 'HELPER',
  eventType: string,
  amount: number,
  multiplier: number,
  subjectId: string,
) {
  // Idempotency: check if credit already awarded for (userId, eventType, subjectId)
  const existing = await prisma.ledgerEntry.findFirst({
    where: { userId, eventType, subjectId },
  });
  if (existing) return existing;

  const entry = await prisma.ledgerEntry.create({
    data: {
      id: `led-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      creditType,
      eventType,
      amount,
      multiplier,
      subjectId,
      createdAtUtc: new Date().toISOString(),
    },
  });

  return entry;
}
