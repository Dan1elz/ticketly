import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EntityManager } from '@mikro-orm/postgresql';
import { Public } from '../auth/decorators/public.decorator';

// Usado pelo HEALTHCHECK do Docker e para diagnosticar 502 no proxy de borda.
// Responde 200 só se a API alcança o banco; senão 503 (o Docker marca "unhealthy").
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly em: EntityManager) {}

  @Public()
  @Get()
  async check() {
    // Query de verdade, e não orm.checkConnection(): no MikroORM 7 a conexão só abre
    // na primeira query, e o checkConnection responde "não conectado" até lá
    try {
      await this.em.getConnection().execute('select 1');
    } catch (error) {
      throw new ServiceUnavailableException(
        `Banco indisponível: ${(error as Error).message}`,
      );
    }
    return { status: 'ok' };
  }
}
