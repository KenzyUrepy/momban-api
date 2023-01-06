import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import * as AES from 'crypto-js/aes';
import { ClientService } from 'src/client/client.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private clientService: ClientService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization.replace(/Bearer\s/, '');

    if (authorization === 'undefined') throw new UnauthorizedException('No AccessToken.');

    const claim = JSON.parse(Buffer.from(authorization.split('.')[1], 'base64').toString());

    if (claim.exp < new Date().getTime() / 1000) throw new UnauthorizedException('Expired Token');

    const codedClientId = claim.sub.split('|')[1];
    const clientId = AES.decrypt(codedClientId, process.env.SUB_ENCODE_KEY).toString(
      CryptoJS.enc.Utf8,
    );
    const client = await this.clientService.getClient({ client_id: clientId }, true);

    const decodedSignature = AES.decrypt(
      authorization.split('.')[2],
      client.token_secret.access_token_secret,
    ).toString(CryptoJS.enc.Utf8);

    const isSameSignature =
      `${authorization.split('.')[0]}.${authorization.split('.')[1]}` === decodedSignature;

    if (!isSameSignature) throw new UnauthorizedException('Invalid token.');

    return true;
  }
}
