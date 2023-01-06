import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prismaService: PrismaService) {}

  async getClient(clientInput: Prisma.ClientWhereUniqueInput, withTokenSecret = false) {
    return await this.prismaService.client.findUnique({
      include: { token_secret: withTokenSecret },
      where: {
        ...clientInput,
      },
    });
  }
}
