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

  await prisma.revenueReport.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.field.deleteMany();
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
    { name: 'Sân Bóng Thủ Đức', address: '123 Võ Văn Ngân, Thủ Đức, TP.HCM', city: 'Hồ Chí Minh', district: 'Thủ Đức' },
    { name: 'Sân Bóng Quận 9', address: '456 Lê Văn Việt, Quận 9, TP.HCM', city: 'Hồ Chí Minh', district: 'Quận 9' },
    { name: 'Sân Bóng Bình Thạnh', address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM', city: 'Hồ Chí Minh', district: 'Bình Thạnh' },
    { name: 'Sân Bóng Gò Vấp', address: '321 Quang Trung, Gò Vấp, TP.HCM', city: 'Hồ Chí Minh', district: 'Gò Vấp' },
    { name: 'Sân Bóng Tân Bình', address: '654 Cộng Hòa, Tân Bình, TP.HCM', city: 'Hồ Chí Minh', district: 'Tân Bình' },
    { name: 'Sân Bóng Phú Nhuận', address: '987 Phan Xích Long, Phú Nhuận, TP.HCM', city: 'Hồ Chí Minh', district: 'Phú Nhuận' },
    { name: 'Sân Bóng Quận 7', address: '147 Nguyễn Văn Linh, Quận 7, TP.HCM', city: 'Hồ Chí Minh', district: 'Quận 7' },
    { name: 'Sân Bóng Quận 2', address: '258 Trần Não, Quận 2, TP.HCM', city: 'Hồ Chí Minh', district: 'Quận 2' },
    { name: 'Sân Bóng Quận 1', address: '369 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', city: 'Hồ Chí Minh', district: 'Quận 1' },
    { name: 'Sân Bóng Quận 3', address: '741 Võ Thị Sáu, Quận 3, TP.HCM', city: 'Hồ Chí Minh', district: 'Quận 3' },
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

  // Pricing structure - base prices that will be adjusted per field type
  const basePricing = {
    weekday: {
      morning: 200000,   // 06:00-16:00
      evening: 350000,   // 16:00-22:00
      night: 150000,     // 22:00-23:00
    },
    weekend: {
      morning: 250000,   // 06:00-16:00
      evening: 400000,   // 16:00-22:00
      night: 150000,     // 22:00-23:00
    }
  };

  // Price multipliers per field type
  const priceMultipliers = {
    FIELD_5VS5: 1,
    FIELD_7VS7: 1.3,
    FIELD_11VS11: 1.8,
  };

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

    for (const fieldConfig of fieldTypes) {
      const multiplier = priceMultipliers[fieldConfig.type];

      for (let j = 1; j <= fieldConfig.count; j++) {
        const field = await prisma.field.create({
          data: {
            name: `${fieldConfig.prefix} - ${String.fromCharCode(64 + j)}`,
            fieldType: fieldConfig.type,
            isActive: true,
            venueId: venue.id,
          },
        });

        // Create pricing for Weekdays (Mon-Fri)
        await prisma.fieldPricing.createMany({
          data: [
            {
              fieldId: field.id,
              dayType: 'WEEKDAY',
              startTime: '06:00',
              endTime: '16:00',
              price: Math.round(basePricing.weekday.morning * multiplier),
            },
            {
              fieldId: field.id,
              dayType: 'WEEKDAY',
              startTime: '16:00',
              endTime: '22:00',
              price: Math.round(basePricing.weekday.evening * multiplier),
            },
            {
              fieldId: field.id,
              dayType: 'WEEKDAY',
              startTime: '22:00',
              endTime: '23:00',
              price: Math.round(basePricing.weekday.night * multiplier),
            },
          ],
        });

        // Create pricing for Weekends (Sat-Sun)
        await prisma.fieldPricing.createMany({
          data: [
            {
              fieldId: field.id,
              dayType: 'WEEKEND',
              startTime: '06:00',
              endTime: '16:00',
              price: Math.round(basePricing.weekend.morning * multiplier),
            },
            {
              fieldId: field.id,
              dayType: 'WEEKEND',
              startTime: '16:00',
              endTime: '22:00',
              price: Math.round(basePricing.weekend.evening * multiplier),
            },
            {
              fieldId: field.id,
              dayType: 'WEEKEND',
              startTime: '22:00',
              endTime: '23:00',
              price: Math.round(basePricing.weekend.night * multiplier),
            },
          ],
        });
      }
    }

    console.log(`Created venue: ${venueInfo.name} with ${config.field5 + config.field7 + config.field11} fields`);
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
