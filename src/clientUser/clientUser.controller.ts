import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';

import { ClientUserService } from './clientUser.service';

@Controller()
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

  @Get('/userinfo')
  @UseGuards(AuthGuard)
  userInfo(@Headers() headers) {
    return this.clientUserService.getMe(headers);
  }
}
