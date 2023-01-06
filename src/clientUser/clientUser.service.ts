import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ClientService } from 'src/client/client.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ClientUserService {
  constructor(private prismaService: PrismaService, private clientService: ClientService) {}

  async getClientUser(email: string): Promise<ClientUser> {
    const clientUser = await this.prismaService.clientUser.findUnique({
      where: { email },
    });

    if (!clientUser) {
      throw new UnauthorizedException();
    }

    return clientUser;
  }

  async createClientUser(
    userData: { email: string; password: string; referer: string },
    query,
    session,
  ): Promise<string> {
    const client = await this.clientService.getClient({ domain: userData.referer });
    userData.password = await bcrypt.hash(userData.password, 10);
    await this.prismaService.clientUser
      .create({
        data: { email: userData.email, password: userData.password },
      })
      .then(async (data) => {
        await this.prismaService.clientUsersOnClients.create({
          data: {
            client_id: client.id,
            client_user_id: data.id,
          },
        });
      });

    const planeCode = {
      clientId: client.client_id,
      email: userData.email,
      expired: new Date().getTime() / (1000 * 60 * 10),
    };
    const code = Buffer.from(JSON.stringify(planeCode)).toString('base64');

    const decodedSession = JSON.parse(Buffer.from(session, 'base64').toString());

    return `${decodedSession.domain}/api/auth/callback?state=${decodedSession.state}&code=${code}&client_idi=${client.client_id}&callback_uri=${client.callback_uri}`;
  }

  async getMe(headers) {
    const { authorization } = headers;
    const payload = JSON.parse(
      Buffer.from(authorization.replace(/Bearer\s/, '').split('.')[1], 'base64').toString(),
    );

    const clientUserinfo = await this.prismaService.clientUser.findUnique({
      where: { email: payload.email },
    });

    return {
      email: clientUserinfo.email,
      name: clientUserinfo.name,
      sub: payload.sub,
    };
  }
}
