import {
  PrismaClient,
  UserRole,
  FieldType,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  Player,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Ballmate seed...');

  // CLEAR EXISTING DATA
  console.log('Clearing existing data...');

  await prisma.bookingComboUsage.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.playerCombo.deleteMany();
  await prisma.comboPackage.deleteMany();
  await prisma.coinTransaction.deleteMany();
  await prisma.topUpOrder.deleteMany();
  await prisma.bookingHold.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.checkInRewardConfig.deleteMany();
  await prisma.topUpPackage.deleteMany();
  await prisma.venueService.deleteMany();
  await prisma.revenueReport.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.field.deleteMany();
  await prisma.venueManager.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.fieldOwner.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  console.log('Data cleared');

  // CREATE USERS
  console.log('Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ballmate.com',
      password: hashedPassword,
      fullName: 'Admin Ballmate',
      phoneNumber: '0901234567',
      role: UserRole.ADMIN,
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      isActive: true,
    },
  });

  // Create Admin record
  await prisma.admin.create({
    data: {
      userId: adminUser.id,
    },
  });

  // Create Field Owner Users
  const owner1User = await prisma.user.create({
    data: {
      email: 'owner1@ballmate.com',
      password: hashedPassword,
      fullName: 'Nguyen Van A',
      phoneNumber: '0901234568',
      role: UserRole.FIELD_OWNER,
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      isActive: true,
    },
  });

  const fieldOwner1 = await prisma.fieldOwner.create({
    data: {
      userId: owner1User.id,
    },
  });

  const owner2User = await prisma.user.create({
    data: {
      email: 'owner2@ballmate.com',
      password: hashedPassword,
      fullName: 'Tran Thi B',
      phoneNumber: '0901234569',
      role: UserRole.FIELD_OWNER,
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      isActive: true,
    },
  });

  const fieldOwner2 = await prisma.fieldOwner.create({
    data: {
      userId: owner2User.id,
    },
  });

  const owner3User = await prisma.user.create({
    data: {
      email: 'owner3@ballmate.com',
      password: hashedPassword,
      fullName: 'Le Van C',
      phoneNumber: '0901234570',
      role: UserRole.FIELD_OWNER,
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      isActive: true,
    },
  });

  const fieldOwner3 = await prisma.fieldOwner.create({
    data: {
      userId: owner3User.id,
    },
  });

  // Create Player Users
  const players: Player[] = [];
  for (let i = 1; i <= 10; i++) {
    const playerUser = await prisma.user.create({
      data: {
        email: `player${i}@ballmate.com`,
        password: hashedPassword,
        fullName: `Player ${i}`,
        phoneNumber: `090123456${i}`,
        role: UserRole.PLAYER,
        avatarUrl: `https://i.pravatar.cc/150?img=${i + 5}`,
        isActive: true,
      },
    });

    const player = await prisma.player.create({
      data: {
        userId: playerUser.id,
      },
    });

    players.push(player);
  }

  console.log(`Created users: 1 admin, 3 owners, ${players.length} players`);

  // CREATE VENUES FOR OWNER 1
  console.log('Creating venues for owner1...');

  const venueNames = [
    {
      name: 'Sân Bóng Thủ Đức',
      address: '123 Võ Văn Ngân, Thủ Đức, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Thủ Đức',
    },
    {
      name: 'Sân Bóng Quận 9',
      address: '456 Lê Văn Việt, Quận 9, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Quận 9',
    },
    {
      name: 'Sân Bóng Bình Thạnh',
      address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Bình Thạnh',
    },
    {
      name: 'Sân Bóng Gò Vấp',
      address: '321 Quang Trung, Gò Vấp, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Gò Vấp',
    },
    {
      name: 'Sân Bóng Tân Bình',
      address: '654 Cộng Hòa, Tân Bình, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Tân Bình',
    },
    {
      name: 'Sân Bóng Phú Nhuận',
      address: '987 Phan Xích Long, Phú Nhuận, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Phú Nhuận',
    },
    {
      name: 'Sân Bóng Quận 7',
      address: '147 Nguyễn Văn Linh, Quận 7, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Quận 7',
    },
    {
      name: 'Sân Bóng Quận 2',
      address: '258 Trần Não, Quận 2, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Quận 2',
    },
    {
      name: 'Sân Bóng Quận 1',
      address: '369 Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
    },
    {
      name: 'Sân Bóng Quận 3',
      address: '741 Võ Thị Sáu, Quận 3, TP.HCM',
      city: 'Hồ Chí Minh',
      district: 'Quận 3',
    },
  ];

  // Field configurations: each venue has different number of fields per type
  const fieldConfigs = [
    { field5: 2, field7: 2, field11: 1 },
    { field5: 3, field7: 1, field11: 1 },
    { field5: 1, field7: 2, field11: 2 },
    { field5: 2, field7: 3, field11: 1 },
    { field5: 1, field7: 1, field11: 1 },
    { field5: 3, field7: 2, field11: 1 },
    { field5: 2, field7: 1, field11: 2 },
    { field5: 1, field7: 3, field11: 1 },
    { field5: 2, field7: 2, field11: 2 },
    { field5: 3, field7: 1, field11: 2 },
  ];

  const marketBands: Record<
    FieldType,
    { startTime: string; endTime: string; price: number }[]
  > = {
    [FieldType.FIELD_5VS5]: [
      { startTime: '06:00', endTime: '09:00', price: 200000 },
      { startTime: '09:00', endTime: '17:00', price: 250000 },
      { startTime: '17:00', endTime: '20:00', price: 400000 },
      { startTime: '20:00', endTime: '23:00', price: 330000 },
    ],
    [FieldType.FIELD_7VS7]: [
      { startTime: '06:00', endTime: '09:00', price: 350000 },
      { startTime: '09:00', endTime: '17:00', price: 450000 },
      { startTime: '17:00', endTime: '20:00', price: 650000 },
      { startTime: '20:00', endTime: '23:00', price: 550000 },
    ],
    [FieldType.FIELD_11VS11]: [
      { startTime: '06:00', endTime: '09:00', price: 600000 },
      { startTime: '09:00', endTime: '17:00', price: 800000 },
      { startTime: '17:00', endTime: '20:00', price: 1200000 },
      { startTime: '20:00', endTime: '23:00', price: 1000000 },
    ],
  };

  let firstVenueId: number | null = null;

  for (let i = 0; i < venueNames.length; i++) {
    const venueInfo = venueNames[i];
    const config = fieldConfigs[i];

    // Create venue
    const venue = await prisma.venue.create({
      data: {
        name: venueInfo.name,
        address: venueInfo.address,
        city: venueInfo.city,
        district: venueInfo.district,
        latitude: 10.8 + Math.random() * 0.2,
        longitude: 106.6 + Math.random() * 0.2,
        description: `Sân bóng đá chất lượng cao tại ${venueInfo.district}. Trang bị đầy đủ tiện nghi, mặt cỏ nhân tạo cao cấp.`,
        images: [
          'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
          'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800',
        ],
        openTime: '06:00',
        closeTime: '23:00',
        ownerId: fieldOwner1.id,
      },
    });

    // Create fields for each type
    const fieldTypes = [
      { type: FieldType.FIELD_5VS5, count: config.field5, prefix: '5' },
      { type: FieldType.FIELD_7VS7, count: config.field7, prefix: '7' },
      { type: FieldType.FIELD_11VS11, count: config.field11, prefix: '11' },
    ];

    if (firstVenueId === null) firstVenueId = venue.id;

    for (const fieldConfig of fieldTypes) {
      const bands = marketBands[fieldConfig.type];

      for (let j = 1; j <= fieldConfig.count; j++) {
        const field = await prisma.field.create({
          data: {
            name: `${fieldConfig.prefix} - ${String.fromCharCode(64 + j)}`,
            fieldType: fieldConfig.type,
            isActive: true,
            venueId: venue.id,
          },
        });

        for (const dayType of ['WEEKDAY', 'WEEKEND'] as const) {
          await prisma.fieldPricing.createMany({
            data: bands.map((b) => ({
              fieldId: field.id,
              dayType,
              startTime: b.startTime,
              endTime: b.endTime,
              price: b.price,
            })),
          });
        }
      }
    }

    console.log(
      `Created venue: ${venueInfo.name} with ${config.field5 + config.field7 + config.field11} fields`,
    );
  }

  // Top-up packages (1 coin = 1.000 VND)
  await prisma.topUpPackage.createMany({
    data: [
      { name: '200K', priceVnd: 200000, baseCoin: 200, bonusCoin: 0, sortOrder: 1 },
      { name: '500K (+10%)', priceVnd: 500000, baseCoin: 500, bonusCoin: 50, sortOrder: 2 },
      { name: '1M (+15%)', priceVnd: 1000000, baseCoin: 1000, bonusCoin: 150, sortOrder: 3 },
      { name: '2M (+20%)', priceVnd: 2000000, baseCoin: 2000, bonusCoin: 400, sortOrder: 4 },
    ],
  });

  // Check-in rewards 1-30
  const checkInRewards: { streakDay: number; coinReward: number; isMilestone: boolean; label?: string }[] = [];
  for (let d = 1; d <= 30; d++) {
    let coin = 1;
    if (d <= 2) coin = 1;
    else coin = Math.min(30, Math.round(1 + ((d - 2) * 29) / 28));
    checkInRewards.push({
      streakDay: d,
      coinReward: coin,
      isMilestone: d === 7 || d === 14 || d === 30,
      label: d === 30 ? 'Max streak' : undefined,
    });
  }
  await prisma.checkInRewardConfig.createMany({
    data: checkInRewards.map((r) => ({
      streakDay: r.streakDay,
      coinReward: r.coinReward,
      isMilestone: r.isMilestone,
      label: r.label,
    })),
  });

  const allPlayers = await prisma.player.findMany();
  for (const p of allPlayers) {
    await prisma.wallet.create({ data: { playerId: p.id, coinBalance: 0 } });
  }

  if (firstVenueId) {
    await prisma.comboPackage.createMany({
      data: [
        {
          venueId: firstVenueId,
          fieldType: FieldType.FIELD_5VS5,
          name: 'Combo 10 sân 5',
          matchCount: 10,
          priceCoin: 3100,
          validityDays: 60,
        },
        {
          venueId: firstVenueId,
          fieldType: FieldType.FIELD_7VS7,
          name: 'Combo 10 sân 7',
          matchCount: 10,
          priceCoin: 5000,
          validityDays: 60,
        },
        {
          venueId: firstVenueId,
          fieldType: FieldType.FIELD_11VS11,
          name: 'Combo 10 sân 11',
          matchCount: 10,
          priceCoin: 9000,
          validityDays: 60,
        },
        {
          venueId: firstVenueId,
          fieldType: FieldType.FIELD_11VS11,
          name: 'Combo 5 sân 11',
          matchCount: 5,
          priceCoin: 4700,
          validityDays: 45,
        },
      ],
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
