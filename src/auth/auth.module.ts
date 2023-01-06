import { Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { ClientService } from 'src/client/client.service';
import { ClientUserModule } from 'src/clientUser/clientUser.module';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  imports: [UserModule, ClientModule, ClientUserModule],
  providers: [UserService, AuthService, ClientService, PrismaService],
})
export class AuthModule {}
