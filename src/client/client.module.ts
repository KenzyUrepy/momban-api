import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { ClientService } from './client.service';

@Global()
@Module({
  controllers: [],
  exports: [ClientService],
  imports: [],
  providers: [ClientService, PrismaService],
})
export class ClientModule {}
