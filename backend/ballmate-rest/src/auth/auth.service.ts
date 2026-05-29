import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create user with hashed password
    const user = await this.userService.create(registerDto);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by email
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    let playerInfo: { id: number; userId: number } | null = null;
    if (user.role === 'PLAYER') {
      const player = await this.prisma.player.findUnique({
        where: { userId: user.id },
        select: { id: true, userId: true },
      });
      playerInfo = player;
    }

    const baseUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      player: playerInfo,
    };

    if (user.role === 'FIELD_OWNER') {
      const fieldOwner = await this.prisma.fieldOwner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      const venues = fieldOwner
        ? await this.prisma.venue.findMany({
            where: { ownerId: fieldOwner.id, isActive: true },
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              district: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];

      return {
        ...tokens,
        user: {
          ...baseUser,
          fieldOwnerId: fieldOwner?.id,
          venues,
        },
      };
    }

    if (user.role === 'VENUE_MANAGER') {
      const venueManager = await this.prisma.venueManager.findUnique({
        where: { userId: user.id },
        include: {
          venue: {
            select: { id: true, name: true, address: true, city: true },
          },
        },
      });

      if (!venueManager || !venueManager.isActive) {
        throw new UnauthorizedException('Venue manager account is inactive');
      }

      return {
        ...tokens,
        user: {
          ...baseUser,
          venueId: venueManager.venueId,
          venueName: venueManager.venue.name,
          venues: [
            {
              id: venueManager.venue.id,
              name: venueManager.venue.name,
              address: venueManager.venue.address,
              city: venueManager.venue.city,
            },
          ],
        },
      };
    }

    return {
      ...tokens,
      user: baseUser,
    };
  }

  async refreshToken(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const jwtSecret = this.configService.get<string>(
      'jwt.secret',
      'default-secret',
    );
    const accessTokenExpiry =
      this.configService.get<string>('jwt.accessTokenExpiry') || '15m';
    const refreshTokenExpiry =
      this.configService.get<string>('jwt.refreshTokenExpiry') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: accessTokenExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: refreshTokenExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return { success: true };
  }

  async getUserFromToken(token: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: number;
        email: string;
        role: string;
      }>(token);

      return this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
        },
      });
    } catch (error) {
      Logger.error('Token verification failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}

