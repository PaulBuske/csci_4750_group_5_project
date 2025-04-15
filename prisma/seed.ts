import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed operation...');

    try {
        // Check for existing users
        const userCount = await prisma.user.count();
        console.log(`Found ${userCount} existing users`);

        // Delete existing records
        const deletedCount = await prisma.user.deleteMany({});
        console.log(`Deleted ${deletedCount.count} existing users`);

        // Create new users
        const alice = await prisma.user.create({
            data: {
                name: 'Alice Smith',
                email: 'alice@example.com',
            },
        });

        const bob = await prisma.user.create({
            data: {
                name: 'Bob Johnson',
                email: 'bob@example.com',
            },
        });

        console.log('Created users:');
        console.log({ alice, bob });

        // Verify users were created
        const finalCount = await prisma.user.count();
        console.log(`Final user count: ${finalCount}`);
    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    }
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