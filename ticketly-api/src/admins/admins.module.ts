import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { Admin } from './entities/admin.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Admin])],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
