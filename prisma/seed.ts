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

function generateDomain() {
  return crypto.randomBytes(16).toString('hex');
}

async function main() {
  const Admin = await prisma.admin.create({
    data: {
      email: 'admin@momban.met',
      name: 'admin',
      password: await generateHashedPassword('AdminMomBanBoo'),
    },
  });

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
      client_id: generateKey(),
      client_secret: generateKey(),
      domain: `https://${generateDomain()}.auth.momban.net:3001`,
      logout_uri: 'https://sample.app.momban.net:3002',
      name: "Ayamew's Application",
      origins: {
        create: {
          uri: 'https://sample.app.momban.net:3002',
        },
      },
      token_secret: {
        create: {
          access_token_secret: generateKey(),
          refresh_token_secret: generateKey(),
        },
      },
      user_id: Ayamew.id,
    },
  });
  const AyamewClientUser = await prisma.clientUser.create({
    data: {
      email: 'kenzy@momban.net',
      name: 'Kenzy',
      nickname: 'Kenzy',
      password: await generateHashedPassword('ClientUser'),
    },
  });

  const AyaMewOnAyaMewClient = await prisma.clientUsersOnClients.create({
    data: {
      client_id: AyamewClient.id,
      client_user_id: AyamewClientUser.id,
    },
  });

  console.log({
    Admin,
    AyaMewOnAyaMewClient,
    Ayamew,
    AyamewClient,
    AyamewClientUser,
  });
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
