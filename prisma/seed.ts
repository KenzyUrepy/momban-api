import * as crypto from 'crypto';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function generateHashedPassword(password) {
  return await bcrypt.hash(password, 10);
}

function generateKey() {
  return crypto.randomBytes(256).toString('base64');
}

async function main() {
  const clientId = generateKey();
  const clientSecret = generateKey();
  const accessTokenSecret = generateKey();
  const RefreshTokenSecret = generateKey();
  const domain = crypto.randomBytes(16).toString('hex');
  const Ayamew = await prisma.user.create({
    data: {
      email: 'ayamew@momban.net',
      name: 'AyaMew',
      nickname: 'AyaMew',
      password: await generateHashedPassword('GeneralMomBanBoo'),
    },
  });
  const AyamewClient = await prisma.client.create({
    data: {
      callback_uri: 'https://sample.app.momban.net:3002/dashboard',
      client_id: clientId,
      client_secret: clientSecret,
      domain: `https://${domain}.auth.momban.net:3001`,
      logout_uri: 'https://sample.app.momban.net:3002',
      name: "Ayamew's Application",
      token_secret: {
        create: {
          access_token_secret: accessTokenSecret,
          refresh_token_secret: RefreshTokenSecret,
        },
      },
      user_id: Ayamew.id,
    },
  });
  const Kenzy = await prisma.clientUser.create({
    data: {
      email: 'kenzy@momban.net',
      name: 'Kenzy',
      nickname: 'Kenzy',
      password: await generateHashedPassword('ClientUser'),
    },
  });

  const BobOnAyaMewClient = await prisma.clientUsersOnClients.create({
    data: {
      client_id: AyamewClient.id,
      client_user_id: Kenzy.id,
    },
  });

  console.log({ Ayamew, AyamewClient, BobOnAyaMewClient, Kenzy });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
