import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

import { UserService } from './user.service';

@Module({
  controllers: [],
  exports: [UserService],
  imports: [],
  providers: [UserService, PrismaService],
})
export class UserModule {}
