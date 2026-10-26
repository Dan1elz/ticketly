import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MikroORM } from '@mikro-orm/postgresql';
import { Public } from '../auth/decorators/public.decorator';

// Usado pelo HEALTHCHECK do Docker e para diagnosticar 502 no proxy de borda.
// Responde 200 só se a API alcança o banco; senão 503 (o Docker marca "unhealthy").
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly orm: MikroORM) {}

  @Public()
  @Get()
  async check() {
    const db = await this.orm.checkConnection();
    if (!db.ok) {
      throw new ServiceUnavailableException(`Banco indisponível: ${db.reason}`);
    }
    return { status: 'ok' };
  }
}
