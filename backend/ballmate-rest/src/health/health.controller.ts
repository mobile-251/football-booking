import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaService,
    @InjectMetric('health_check_calls_total') public counter: Counter<string>,
  ) { }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check system health' })
  check() {
    this.counter.inc();
    return this.health.check([
      () => this.http.pingCheck('api', 'http://localhost:3000'),
      async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { db: { status: 'up' } };
      },
    ]);
  }
}
