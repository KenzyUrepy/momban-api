import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Response,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ClientUserService } from 'src/clientUser/clientUser.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserService } from 'src/user/user.service';

import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly clientUserService: ClientUserService,
  ) {}

  @Get('/.well-known/openid-configuration')
  discoveryEndpoint() {
    return this.authService.openidConfiguration();
  }

  @Post('/connect/signin')
  async signinUser(
    @Req() req: Request,
    @Headers() headers,
    @Body() userData: { email: string; password: string; referer: string },
    @Query() qurey,
  ) {
    return await this.authService.signin(userData, req.cookies['_session'], headers, qurey);
  }

  @Post('/connect/signup')
  async createUser(
    @Req() req: Request,
    @Body() userData: { email: string; name: string; password: string; referer: string },
    @Query() query,
  ): Promise<string> {
    return this.clientUserService.createClientUser(userData, query, req.cookies['session']);
  }

  @Post('/token')
  async tokenEndpoint(@Headers() headers, @Query() query, @Response() response) {
    const tokens = await this.authService.verifyAndIssue(headers, query);
    return response.send(tokens);
  }

  @Get('logout')
  @UseGuards(AuthGuard)
  async logout(@Headers() headers) {
    return this.authService.logout(headers);
  }
}
