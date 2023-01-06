import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { ClientModule } from './client/client.module';
import { ClientUserModule } from './clientUser/clientUser.module';
import { HttpExceptionFilter } from './filter/http-exception.filter';
import { UserModule } from './user/user.module';

@Module({
  controllers: [],
  imports: [AuthModule, UserModule, ClientModule, ClientUserModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
