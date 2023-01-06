import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as CryptoJS from 'crypto-js';
import * as AES from 'crypto-js/aes';
import { ClientService } from 'src/client/client.service';
import { ClientUserService } from 'src/clientUser/clientUser.service';

@Injectable()
export class AuthService {
  constructor(private clientUserService: ClientUserService, private clientService: ClientService) {}

  async openidConfiguration() {
    return {
      authorization_endpoint: `${process.env.SERVICE_URL}/connect/signin`,
      claims_locales_supported: ['ja-JP'],
      claims_supported: ['iss', 'sub', 'aud', 'exp', 'iat'],
      display_values_supported: 'page',
      id_token_signing_alg_values_supported: ['RS256'],
      issuer: `${process.env.SERVICE_URL}`,
      response_types_supported: 'code',
      scopes_supported: ['openid', 'profile', 'email'],
      subject_types_supported: 'public',
      token_endpoint: `${process.env.SERVICE_URL}/token`,
      token_endpoint_auth_methods_supported: 'client_secret_basic',
      ui_locales_supported: ['ja-JP'],
      userinfo_endpoint: `${process.env.SERVICE_URL}/connect/user-info`,
    };
  }

  async signin(userData: { email: string; password: string }, session: string, header, qurey) {
    const client = await this.clientService.getClient({ domain: header.origin });
    const user = await this.clientUserService.getClientUser(userData.email);
    if (!bcrypt.compareSync(userData.password, user.password)) {
      throw new UnauthorizedException();
    }

    const planeCode = {
      clientId: client.client_id,
      email: user.email,
      expired: new Date().getTime() / (1000 * 60 * 10),
    };
    const code = Buffer.from(JSON.stringify(planeCode)).toString('base64');

    return `${qurey.callback_uri.replace(/\/$/, '')}/api/auth/callback?state=${
      JSON.parse(session).state
    }&code=${code}&client_id=${client.client_id}&callback_uri=${client.callback_uri}`;
  }

  async verifyAndIssue(headers, query) {
    const secret = headers.authorization.replace(/Basic\s/, '');
    const clientCredentioals = Buffer.from(secret, 'base64').toString().split(':');

    const client = await this.clientService.getClient({ client_id: clientCredentioals[0] }, true);

    if (client.client_secret === clientCredentioals[1]) {
      const date = new Date();
      const decodedCode = JSON.parse(Buffer.from(query.code, 'base64').toString());
      if (date.getDate() > decodedCode.expired) {
        throw new HttpException('Invalid Error', HttpStatus.BAD_REQUEST);
      }

      const user = await this.clientUserService.getClientUser(decodedCode.email);
      if (!user) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const header = {
        alg: 'HS256',
        typ: 'JWT',
      };

      const codedClientId = AES.encrypt(client.client_id, process.env.SUB_ENCODE_KEY);

      const accessTokenClaim = {
        email: user.email,
        exp: (date.getTime() + 1000 * 60 * 60 * 1) / 1000,
        iat: date.getTime() / 1000,
        name: user.name,
        sub: `momban|${codedClientId}`,
      };
      const accessTokenPayload = this.generatePayload(header, accessTokenClaim);
      const accessToken = this.generateAccessToken(
        accessTokenPayload,
        client.token_secret.access_token_secret,
      );

      const refreshTokenClaim = {
        email: user.email,
        exp: (date.getTime() + 1000 * 60 * 60 * 24 * 90) / 1000,
        iat: date.getTime() / 1000,
        name: user.name,
        sub: `momban|${codedClientId}`,
      };
      const refreshTokenPayload = this.generatePayload(header, refreshTokenClaim);
      const refreshToken = this.generateRefreshToken(
        refreshTokenPayload,
        client.token_secret.refresh_token_secret,
      );

      const idTokenClaim = {
        aud: client.client_id,
        email: user.email,
        exp: (date.getTime() + 1000 * 60 * 60 * 24 * 10) / 1000,
        iat: date.getTime() / 1000,
        iss: 'https://localhost.api.momban.net:3000',
        name: user.name,
        sub: `momban|${codedClientId}`,
      };

      const idTokenPayload = this.generatePayload(header, idTokenClaim);
      const idToken = this.generateIDToken(idTokenPayload, client.client_secret);

      return {
        access_token: accessToken,
        expires_in: new Date().getTime() / (1000 * 60 * 10),
        id_token: idToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
      };
    }

    throw new HttpException('Invalid Error', HttpStatus.BAD_REQUEST);
  }

  async logout(headers) {
    const { authorization } = headers;
    const payload = JSON.parse(
      Buffer.from(authorization.replace(/Bearer\s/, '').split('.')[1], 'base64').toString(),
    );

    const sub = AES.decrypt(payload.sub.split('|')[1], process.env.SUB_ENCODE_KEY).toString(
      CryptoJS.enc.Utf8,
    );

    const clirnt = await this.clientService.getClient({ client_id: sub });
    return clirnt.logout_uri;
  }

  generatePayload(header: { alg: string; typ: string }, claim: object): string {
    const codedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const codedClaim = Buffer.from(JSON.stringify(claim)).toString('base64');
    return `${codedHeader}.${codedClaim}`;
  }

  generateAccessToken(payload: string, accessTokenSecret: string): string {
    const signature = AES.encrypt(payload, accessTokenSecret);
    return `${payload}.${signature}`;
  }

  generateRefreshToken(payload: string, refreshTokenSecret: string): string {
    const signature = AES.encrypt(payload, refreshTokenSecret);
    return `${payload}.${signature}`;
  }

  generateIDToken(payload: string, clientSecret: string): string {
    const signature = AES.encrypt(payload, clientSecret);
    return `${payload}.${signature}`;
  }
}
