import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Delete existing data
    await prisma.sessions.deleteMany({});
    await prisma.users.deleteMany({});

    // Create users with hashed passwords
    await prisma.users.create({
        data: {
            name: 'Alice Smith',
            email: 'alice@example.com',
            password: await bcrypt.hash('Password1!', 10),
        },
    });

    await prisma.users.create({
        data: {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            password: await bcrypt.hash('Password2@', 10),
        },
    });
}

main()
    .catch((e) => {
        console.error('Failed to seed database:', e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('Seed operation completed');
        await prisma.$disconnect();
    });