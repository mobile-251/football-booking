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
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
