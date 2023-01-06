import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { ClientUserController } from './clientUser.controller';
import { ClientUserService } from './clientUser.service';

@Module({
  controllers: [ClientUserController],
  exports: [ClientUserService],
  imports: [],
  providers: [ClientUserService, PrismaService],
})
export class ClientUserModule {}
