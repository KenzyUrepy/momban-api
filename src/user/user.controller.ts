import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';

import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/userinfo')
  @UseGuards(AuthGuard)
  userInfo(@Headers() headers) {
    return this.userService.getMe(headers);
  }
}
