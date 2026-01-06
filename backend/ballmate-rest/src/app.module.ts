import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { VenueModule } from './venue/venue.module';
import { FieldModule } from './field/field.module';
import { BookingModule } from './booking/booking.module';
import { ReviewModule } from './review/review.module';
import { PaymentModule } from './payment/payment.module';
import { RevenueModule } from './revenue/revenue.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { FavoriteModule } from './favorite/favorite.module';
import { NotificationModule } from './notification/notification.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    VenueModule,
    FieldModule,
    BookingModule,
    ReviewModule,
    PaymentModule,
    RevenueModule,
    HealthModule,
    FavoriteModule,
    NotificationModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

