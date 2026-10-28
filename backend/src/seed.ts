import { prisma } from './db.js';

export async function seedDatabase() {
  console.log('Seeding database...');

  // Clean old records
  await prisma.deliveryEvent.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.deliveryTask.deleteMany();
  await prisma.openGateListing.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.receivingSite.deleteMany();
  await prisma.riderAvailability.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users
  await prisma.user.createMany({
    data: [
      {
        id: 'donor1',
        displayName: 'Vikram Sethi (Taj Lands End Banquets)',
        email: 'donor@lastmile.org',
        roles: JSON.stringify(['DONOR']),
        activeRole: 'DONOR',
      },
      {
        id: 'rider1',
        displayName: 'Aarav Patel (Courier #24)',
        email: 'rider@lastmile.org',
        roles: JSON.stringify(['RIDER']),
        activeRole: 'RIDER',
      },
      {
        id: 'helper1',
        displayName: 'Sneha Rao (Community Helper)',
        email: 'helper@lastmile.org',
        roles: JSON.stringify(['HELPER']),
        activeRole: 'HELPER',
        helperOptIn: true,
      },
      {
        id: 'ngo1',
        displayName: 'Pooja Verma (St. Jude Hope Haven)',
        email: 'shelter@lastmile.org',
        roles: JSON.stringify(['NGO_OPERATOR']),
        activeRole: 'NGO_OPERATOR',
      },
      {
        id: 'admin1',
        displayName: 'Priya Sharma (Dispatcher)',
        email: 'admin@lastmile.org',
        roles: JSON.stringify(['ADMIN']),
        activeRole: 'ADMIN',
      },
    ],
  });

  // 2. Rider Availabilities
  await prisma.riderAvailability.createMany({
    data: [
      { userId: 'rider1', isAvailable: true, capacityQty: 60, capacityUnit: 'meals', hasColdBag: true, radiusKm: 15.0 },
      { userId: 'rider2', isAvailable: true, capacityQty: 40, capacityUnit: 'meals', hasColdBag: false, radiusKm: 10.0 },
      { userId: 'rider3', isAvailable: true, capacityQty: 50, capacityUnit: 'meals', hasColdBag: true, radiusKm: 12.0 },
      { userId: 'rider4', isAvailable: false, capacityQty: 30, capacityUnit: 'meals', hasColdBag: false, radiusKm: 8.0 },
    ],
  });

  // 3. Receiving Sites
  await prisma.receivingSite.createMany({
    data: [
      {
        id: 'site1',
        orgName: 'Hope Foundation',
        name: 'St. Jude Hope Haven',
        address: '89 Byculla Relief Gate, South Mumbai',
        lat: 18.9750,
        lng: 72.8310,
        status: 'OPEN',
        verification: 'VERIFIED',
        acceptedCategories: JSON.stringify(['COOKED_MEAL', 'RAW_RATION_KIT', 'PACKAGED_DRY_GOODS']),
        capabilities: JSON.stringify({
          CLEAN_WATER: true,
          COOKING_FUEL: true,
          REFRIGERATION: true,
          INFANT_CARE_PROCEDURE: false,
          DRY_STORAGE: true,
        }),
        demand: JSON.stringify([
          { category: 'COOKED_MEAL', unit: 'meals', demandQty: 120, reservedQty: 60, receivedQty: 30 },
          { category: 'RAW_RATION_KIT', unit: 'kits', demandQty: 40, reservedQty: 0, receivedQty: 10 },
        ]),
      },
      {
        id: 'site2',
        orgName: 'Asha Welfare Trust',
        name: 'Asha Community Kitchen',
        address: '14 Ranade Road, Dadar West, Mumbai',
        lat: 19.0180,
        lng: 72.8420,
        status: 'OPEN',
        verification: 'VERIFIED',
        acceptedCategories: JSON.stringify(['COOKED_MEAL', 'COLD_CHAIN_FOOD']),
        capabilities: JSON.stringify({
          CLEAN_WATER: true,
          COOKING_FUEL: true,
          REFRIGERATION: true,
          INFANT_CARE_PROCEDURE: false,
          DRY_STORAGE: true,
        }),
        demand: JSON.stringify([
          { category: 'COOKED_MEAL', unit: 'meals', demandQty: 150, reservedQty: 60, receivedQty: 50 },
        ]),
      },
      {
        id: 'site3',
        orgName: 'SEWA Relief Network',
        name: 'SEWA Community Relief Center',
        address: '42 Parel Road, Central Mumbai',
        lat: 18.9950,
        lng: 72.8380,
        status: 'OPEN',
        verification: 'VERIFIED',
        acceptedCategories: JSON.stringify(['COOKED_MEAL', 'RAW_RATION_KIT', 'COLD_CHAIN_FOOD']),
        capabilities: JSON.stringify({
          CLEAN_WATER: true,
          COOKING_FUEL: false,
          REFRIGERATION: true,
          INFANT_CARE_PROCEDURE: false,
          DRY_STORAGE: true,
        }),
        demand: JSON.stringify([
          { category: 'COOKED_MEAL', unit: 'meals', demandQty: 80, reservedQty: 60, receivedQty: 20 },
        ]),
      },
    ],
  });

  // 4. Seed Donation (180 meals wedding surplus)
  const now = new Date();
  const expiry = new Date(now.getTime() + 3.5 * 3600 * 1000).toISOString();

  await prisma.donation.create({
    data: {
      id: 'don-wedding-180',
      donorId: 'donor1',
      category: 'COOKED_MEAL',
      description: 'Grand Wedding Banquet Surplus — 180 Fresh Meals (Dal, Biryani, Roti, Subzi)',
      quantity: 180,
      unit: 'meals',
      allocatedQty: 180,
      deliveredQty: 30,
      pickupAddress: 'Grand Hyatt Banquet Hall, 88 Marine Drive, Mumbai',
      pickupLat: 18.9442,
      pickupLng: 72.8238,
      availableFromUtc: now.toISOString(),
      expiryUtc: expiry,
      handlingInstructions: 'Hot packed in insulated stainless containers. Vegetarian.',
      requiredCapabilities: JSON.stringify([]),
      mode: 'VOLUNTEER',
      status: 'IN_PROGRESS',
      createdAtUtc: now.toISOString(),
    },
  });

  // 5. Delivery Tasks
  await prisma.deliveryTask.createMany({
    data: [
      {
        id: 'task-101',
        donationId: 'don-wedding-180',
        siteId: 'site1',
        siteName: 'St. Jude Hope Haven',
        quantity: 60,
        status: 'IN_TRANSIT',
        claimedBy: 'rider1',
        claimedByName: 'Aarav Patel (Courier #24)',
        etaMinutes: 18,
        etaSource: 'mock',
        assignmentReason: JSON.stringify({ note: 'FEFO matched: 60 meals split to site1 based on shelter unmet demand.' }),
      },
      {
        id: 'task-102',
        donationId: 'don-wedding-180',
        siteId: 'site2',
        siteName: 'Asha Community Kitchen',
        quantity: 60,
        status: 'OPEN',
        etaMinutes: 28,
        etaSource: 'mock',
        assignmentReason: JSON.stringify({ note: 'FEFO matched: 60 meals available for open courier pool claim.' }),
      },
      {
        id: 'task-103',
        donationId: 'don-wedding-180',
        siteId: 'site3',
        siteName: 'SEWA Community Relief Center',
        quantity: 60,
        status: 'OPEN',
        etaMinutes: 22,
        etaSource: 'mock',
        assignmentReason: JSON.stringify({ note: 'FEFO matched: 60 meals available for open courier pool claim.' }),
      },
    ],
  });

  // 6. Open Gate Listing
  await prisma.openGateListing.create({
    data: {
      id: 'og-marine-drive',
      donationId: 'don-wedding-180',
      venue: 'Gate 2 Distribution Pavilion, Marine Drive, South Mumbai',
      lat: 18.9442,
      lng: 72.8238,
      opensAtUtc: now.toISOString(),
      closesAtUtc: expiry,
      remainingQty: 45,
      status: 'ACTIVE',
      instructions: 'Walk-up collection open. Please bring containers if collecting more than 2 portions.',
    },
  });

  // 7. Credits
  await prisma.ledgerEntry.createMany({
    data: [
      {
        id: 'led-1',
        userId: 'rider1',
        creditType: 'VOLUNTEER',
        eventType: 'DELIVERY_VERIFIED',
        amount: 50,
        multiplier: 1.2,
        subjectId: 'task-101',
        createdAtUtc: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'led-2',
        userId: 'rider1',
        creditType: 'VOLUNTEER',
        eventType: 'DELIVERY_VERIFIED',
        amount: 60,
        multiplier: 1.0,
        subjectId: 'task-99',
        createdAtUtc: new Date(Date.now() - 7200 * 1000).toISOString(),
      },
      {
        id: 'led-3',
        userId: 'donor1',
        creditType: 'DONOR',
        eventType: 'DONATION_VERIFIED',
        amount: 100,
        multiplier: 1.0,
        subjectId: 'don-wedding-180',
        createdAtUtc: now.toISOString(),
      },
    ],
  });

  // 8. Delivery Events
  await prisma.deliveryEvent.createMany({
    data: [
      {
        donationId: 'don-wedding-180',
        type: 'donation.created',
        actor: 'donor1',
        actorName: 'Vikram Sethi',
        payload: JSON.stringify({ quantity: 180, category: 'COOKED_MEAL' }),
        createdAtUtc: now.toISOString(),
      },
      {
        donationId: 'don-wedding-180',
        type: 'donation.published',
        actor: 'donor1',
        actorName: 'Vikram Sethi',
        payload: JSON.stringify({ expiryUtc: expiry }),
        createdAtUtc: now.toISOString(),
      },
      {
        donationId: 'don-wedding-180',
        taskId: 'task-101',
        type: 'allocation.created',
        actor: 'system',
        actorName: 'Deterministic Dispatch Engine',
        payload: JSON.stringify({ taskId: 'task-101', siteId: 'site1', quantity: 60 }),
        createdAtUtc: now.toISOString(),
      },
      {
        donationId: 'don-wedding-180',
        taskId: 'task-101',
        type: 'task.claimed',
        actor: 'rider1',
        actorName: 'Aarav Patel',
        payload: JSON.stringify({ taskId: 'task-101' }),
        createdAtUtc: now.toISOString(),
      },
    ],
  });

  console.log('Database seeded successfully!');
}

// Run directly if called as a script
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
