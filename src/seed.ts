import 'dotenv/config'; // <-- loads .env automatically
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, UserRole } from '@prisma/client';
import { CryptoService } from './domains/auth/utilities/crypto.service';

const prisma = new PrismaClient();

async function seed() {
  try {
    // --- PART 1: Run Raw SQL ---
    const sqlFile = path.resolve(
      __dirname,
      '..',
      'docker-scripts',
      'db-alterations.sql',
    );
    if (!fs.existsSync(sqlFile)) throw new Error(`SQL file not found`);

    const sql = fs.readFileSync(sqlFile, 'utf-8');

    const cleanSql = sql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = cleanSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== ')');

    console.log(
      `[=====] Running ${statements.length} cleaned SQL statements...`,
    );

    for (const statement of statements) {
      try {
        if (!statement) continue;

        await prisma.$executeRawUnsafe(statement);
      } catch (err) {
        console.error(`[ERROR] Failed on statement:\n${statement}`);
        throw err;
      }
    }

    console.log('[====] Seeding Super Admin...');

    // Read from .env
    const username1 = process.env.ADMIN_USERNAME1!;
    const firstname1 = process.env.ADMIN_FIRSTNAME1!;
    const lastname1 = process.env.ADMIN_LASTNAME1!;
    const email1 = process.env.ADMIN_EMAIL1!;
    const passwordPlain1 = process.env.ADMIN_PASSWORD1!;
    const role1 = (process.env.ADMIN_ROLE1 as UserRole) || UserRole.ADMIN;
    const address1 = process.env.ADMIN_ADDRESS1!;
    const phone_number1 = process.env.ADMIN_PHONE_NUMBER1!;
    const age1 = Number(process.env.ADMIN_AGE1!);
    const isVerified1 = process.env.ADMIN_IS_VERIFIED1 === 'true';

    const username2 = process.env.ADMIN_USERNAME2!;
    const firstname2 = process.env.ADMIN_FIRSTNAME2!;
    const lastname2 = process.env.ADMIN_LASTNAME2!;
    const email2 = process.env.ADMIN_EMAIL2!;
    const passwordPlain2 = process.env.ADMIN_PASSWORD2!;
    const role2 = (process.env.ADMIN_ROLE2 as UserRole) || UserRole.ADMIN;
    const address2 = process.env.ADMIN_ADDRESS2!;
    const phone_number2 = process.env.ADMIN_PHONE_NUMBER2!;
    const age2 = Number(process.env.ADMIN_AGE2!);
    const isVerified2 = process.env.ADMIN_IS_VERIFIED2 === 'true';

    // Hash password

    const cryptoService = new CryptoService();
    const hashedPassword1 = await cryptoService.hashPassword(passwordPlain1);
    const hashedPassword2 = await cryptoService.hashPassword(passwordPlain2);

    await prisma.admin.upsert({
      where: { email: email1 },
      update: {},
      create: {
        username: username1,
        firstname: firstname1,
        lastname: lastname1,
        email: email1,
        password: hashedPassword1,
        role: role1,
        address: address1,
        phone_number: phone_number1,
        age: age1,
        isVerified: isVerified1,
      },
    });

    await prisma.admin.upsert({
      where: { email: email2 },
      update: {},
      create: {
        username: username2,
        firstname: firstname2,
        lastname: lastname2,
        email: email2,
        password: hashedPassword2,
        role: role2,
        address: address2,
        phone_number: phone_number2,
        age: age2,
        isVerified: isVerified2,
      },
    });

    console.log('[0000] Database cleared, patched, and Admin created!');
  } catch (error) {
    console.error('[ERROR] Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
