import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import {
  PrometheusModule,
  makeCounterProvider,
} from '@willsoto/nestjs-prometheus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    makeCounterProvider({
      name: 'health_check_calls_total',
      help: 'Total number of health check calls',
    }),
  ],
})
export class HealthModule {}
