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

  // CREATE VENUES
  console.log('Creating venues...');

  const venue1 = await prisma.venue.create({
    data: {
      name: 'San Bong Da Thu Duc',
      description: 'San bong hien dai, day du tien nghi, co nhan tao cao cap',
      address: '123 Duong Vo Van Ngan, Phuong Linh Chieu',
      city: 'Ho Chi Minh',
      district: 'Thu Duc',
      latitude: 10.8505,
      longitude: 106.7717,
      openTime: '06:00',
      closeTime: '23:00',
      facilities: [
        'Bai dau xe',
        'Phong tam',
        'Quan ca phe',
        'Phong thay do',
        'Nha ve sinh',
      ],
      images: ['https://via.placeholder.com/400x300?text=Venue1'],
      ownerId: fieldOwner1.id,
      isActive: true,
    },
  });

  const venue2 = await prisma.venue.create({
    data: {
      name: 'San Bong Quan 1',
      description:
        'San bong trung tam thanh pho, tien loi, gan cac phuong tien giao thong',
      address: '456 Nguyen Hue, Phuong Ben Nghe',
      city: 'Ho Chi Minh',
      district: 'Quan 1',
      latitude: 10.7769,
      longitude: 106.7009,
      openTime: '07:00',
      closeTime: '22:00',
      facilities: ['Bai dau xe', 'Phong tam', 'Quan ca phe'],
      images: ['https://via.placeholder.com/400x300?text=Venue2'],
      ownerId: fieldOwner2.id,
      isActive: true,
    },
  });

  const venue3 = await prisma.venue.create({
    data: {
      name: 'San Bong Tan Binh',
      description: 'San bong cao cap, co mai che, phuc vu doi tuyen',
      address: '789 Duong Nguyen Huu Canh, Phuong 22',
      city: 'Ho Chi Minh',
      district: 'Binh Thanh',
      latitude: 10.8181,
      longitude: 106.7241,
      openTime: '05:30',
      closeTime: '23:30',
      facilities: [
        'Bai dau xe lon',
        'Phong tam cao cap',
        'Nha hang',
        'Gym',
        'Phong meeting',
      ],
      images: ['https://via.placeholder.com/400x300?text=Venue3'],
      ownerId: fieldOwner3.id,
      isActive: true,
    },
  });

  console.log('Created 3 venues');

  // CREATE FIELDS
  console.log('Creating fields...');

  const field1_1 = await prisma.field.create({
    data: {
      name: 'San 5 nguoi so 1',
      venueId: venue1.id,
      fieldType: FieldType.FIELD_5VS5,
      pricePerHour: 300000,
      description: 'San 5 nguoi co nhan tao chat luong cao',
      images: ['https://via.placeholder.com/400x300?text=Field5v5'],
      isActive: true,
    },
  });

  const field1_2 = await prisma.field.create({
    data: {
      name: 'San 7 nguoi so 1',
      venueId: venue1.id,
      fieldType: FieldType.FIELD_7VS7,
      pricePerHour: 500000,
      description: 'San 7 nguoi co mai che',
      images: ['https://via.placeholder.com/400x300?text=Field7v7'],
      isActive: true,
    },
  });

  await prisma.field.create({
    data: {
      name: 'San 11 nguoi',
      venueId: venue1.id,
      fieldType: FieldType.FIELD_11VS11,
      pricePerHour: 1000000,
      description: 'San 11 nguoi tieu chuan quoc te',
      images: ['https://via.placeholder.com/400x300?text=Field11v11'],
      isActive: true,
    },
  });

  const field2_1 = await prisma.field.create({
    data: {
      name: 'San 5 nguoi',
      venueId: venue2.id,
      fieldType: FieldType.FIELD_5VS5,
      pricePerHour: 350000,
      description: 'San 5 nguoi nam giua trung tam thanh pho',
      images: ['https://via.placeholder.com/400x300?text=Field5v5_Q1'],
      isActive: true,
    },
  });

  await prisma.field.create({
    data: {
      name: 'San 7 nguoi',
      venueId: venue2.id,
      fieldType: FieldType.FIELD_7VS7,
      pricePerHour: 550000,
      description: 'San 7 nguoi tien loi, de den',
      images: ['https://via.placeholder.com/400x300?text=Field7v7_Q1'],
      isActive: true,
    },
  });

  const field3_1 = await prisma.field.create({
    data: {
      name: 'San 5 nguoi cao cap',
      venueId: venue3.id,
      fieldType: FieldType.FIELD_5VS5,
      pricePerHour: 400000,
      description: 'San 5 nguoi cao cap voi he thong LED hien dai',
      images: ['https://via.placeholder.com/400x300?text=Field5v5_Premium'],
      isActive: true,
    },
  });

  const field3_2 = await prisma.field.create({
    data: {
      name: 'San 7 nguoi cao cap',
      venueId: venue3.id,
      fieldType: FieldType.FIELD_7VS7,
      pricePerHour: 600000,
      description: 'San 7 nguoi co mai che, co san phu',
      images: ['https://via.placeholder.com/400x300?text=Field7v7_Premium'],
      isActive: true,
    },
  });

  await prisma.field.create({
    data: {
      name: 'San 11 nguoi cao cap',
      venueId: venue3.id,
      fieldType: FieldType.FIELD_11VS11,
      pricePerHour: 1200000,
      description: 'San 11 nguoi tieu chuan, phu hop cho cac giai dau lon',
      images: ['https://via.placeholder.com/400x300?text=Field11v11_Premium'],
      isActive: true,
    },
  });

  console.log('Created 8 fields');

  // CREATE BOOKINGS
  console.log('Creating bookings...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      fieldId: field1_1.id,
      playerId: players[0].id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      totalPrice: 600000,
      status: BookingStatus.CONFIRMED,
      note: 'Booking for company team',
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      fieldId: field1_2.id,
      playerId: players[1].id,
      startTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 4.5 * 60 * 60 * 1000),
      totalPrice: 750000,
      status: BookingStatus.PENDING,
      note: 'Booking for semi-pro tournament',
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      fieldId: field2_1.id,
      playerId: players[2].id,
      startTime: new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 7 * 60 * 60 * 1000),
      totalPrice: 700000,
      status: BookingStatus.CONFIRMED,
      note: 'Weekly practice',
    },
  });

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(20, 0, 0, 0);

  const booking4 = await prisma.booking.create({
    data: {
      fieldId: field3_1.id,
      playerId: players[3].id,
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 1.5 * 60 * 60 * 1000),
      totalPrice: 800000,
      status: BookingStatus.PENDING,
    },
  });

  console.log('Created 4 bookings');

  // CREATE REVIEWS
  console.log('Creating reviews...');

  await prisma.review.create({
    data: {
      fieldId: field1_1.id,
      playerId: players[0].id,
      rating: 5,
      comment: 'Great field, grass is smooth, owner is helpful',
    },
  });

  await prisma.review.create({
    data: {
      fieldId: field1_2.id,
      playerId: players[1].id,
      rating: 4,
      comment: 'Good field but price is a bit high',
    },
  });

  await prisma.review.create({
    data: {
      fieldId: field2_1.id,
      playerId: players[2].id,
      rating: 5,
      comment: 'Located in city center, easy to access',
    },
  });

  await prisma.review.create({
    data: {
      fieldId: field3_1.id,
      playerId: players[3].id,
      rating: 5,
      comment: 'Premium field, great LED system, excellent service',
    },
  });

  await prisma.review.create({
    data: {
      fieldId: field3_2.id,
      playerId: players[4].id,
      rating: 4,
      comment: 'Nice field but restroom needs upgrade',
    },
  });

  console.log('Created 5 reviews');

  // CREATE PAYMENTS
  console.log('Creating payments...');

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 600000,
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.PAID,
      transactionId: 'TXN001',
      paidAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      amount: 750000,
      method: PaymentMethod.MOMO,
      status: PaymentStatus.PENDING,
      transactionId: null,
      paidAt: null,
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking3.id,
      amount: 700000,
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      transactionId: null,
      paidAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking4.id,
      amount: 800000,
      method: PaymentMethod.VNPAY,
      status: PaymentStatus.PENDING,
    },
  });

  console.log('Created 4 payments');

  // CREATE REVENUE REPORTS
  console.log('Creating revenue reports...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.revenueReport.create({
    data: {
      venueId: venue1.id,
      fieldId: field1_1.id,
      totalRevenue: 1300000,
      totalBookings: 2,
      reportDate: today,
    },
  });

  await prisma.revenueReport.create({
    data: {
      venueId: venue2.id,
      fieldId: field2_1.id,
      totalRevenue: 700000,
      totalBookings: 1,
      reportDate: today,
    },
  });

  await prisma.revenueReport.create({
    data: {
      venueId: venue3.id,
      fieldId: field3_1.id,
      totalRevenue: 800000,
      totalBookings: 1,
      reportDate: today,
    },
  });

  console.log('Created revenue reports');

  // SUMMARY
  console.log('');
  console.log('=====================================');
  console.log('BALLMATE SEED COMPLETED');
  console.log('=====================================');
  console.log('');
  console.log('Seed Data Summary:');
  console.log('   Users: 1 admin + 3 owners + 10 players = 14 total');
  console.log('   Venues: 3');
  console.log('   Fields: 8');
  console.log('   Bookings: 4');
  console.log('   Reviews: 5');
  console.log('   Payments: 4');
  console.log('   Revenue Reports: 3');
  console.log('');
  console.log('Test Credentials:');
  console.log('   Admin: admin@ballmate.com / password123');
  console.log('   Owner: owner1@ballmate.com / password123');
  console.log('   Player: player1@ballmate.com / password123');
  console.log('');
  console.log('Ready for development');
  console.log('=====================================');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
