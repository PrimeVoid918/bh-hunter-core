import 'dotenv/config'; // <-- loads .env automatically
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, UserRole } from '@prisma/client';
// import * as bcrypt from 'bcryptjs'; // for hashing password

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
    const username = process.env.ADMIN_USERNAME!;
    const firstname = process.env.ADMIN_FIRSTNAME!;
    const lastname = process.env.ADMIN_LASTNAME!;
    const email = process.env.ADMIN_EMAIL!;
    const passwordPlain = process.env.ADMIN_PASSWORD!;
    const role = (process.env.ADMIN_ROLE as UserRole) || UserRole.ADMIN;
    const address = process.env.ADMIN_ADDRESS!;
    const phone_number = process.env.ADMIN_PHONE_NUMBER!;
    const age = Number(process.env.ADMIN_AGE!);
    const isVerified = process.env.ADMIN_IS_VERIFIED === 'true';

    // Hash password
    // const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        username,
        firstname,
        lastname,
        email,
        password: passwordPlain,
        role,
        address,
        phone_number,
        age,
        isVerified,
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
