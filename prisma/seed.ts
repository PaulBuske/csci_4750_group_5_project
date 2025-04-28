import { PrismaClient, UserRole, PayStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, subDays, startOfDay, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    await prisma.timeEntry.deleteMany({});
    await prisma.payPeriod.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});

    const adminUser = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@example.com',
            password: await bcrypt.hash('Admin123!', 10),
            role: UserRole.ADMIN,
            hourlyRate: 35.00
        }
    });

    const managerUser = await prisma.user.create({
        data: {
            name: 'Manager User',
            email: 'manager@example.com',
            password: await bcrypt.hash('Manager123!', 10),
            role: UserRole.MANAGER,
            hourlyRate: 28.50
        }
    });

    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Alice Smith',
                email: 'alice@example.com',
                password: await bcrypt.hash('Password1!', 10),
                role: UserRole.EMPLOYEE,
                hourlyRate: 22.50
            }
        }),
        prisma.user.create({
            data: {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                password: await bcrypt.hash('Password2@', 10),
                role: UserRole.EMPLOYEE,
                hourlyRate: 20.75
            }
        }),
        prisma.user.create({
            data: {
                name: 'Charlie Davis',
                email: 'charlie@example.com',
                password: await bcrypt.hash('Password3#', 10),
                role: UserRole.EMPLOYEE,
                hourlyRate: 18.25
            }
        })
    ]);

    const now = new Date();
    const payPeriods = [];

    for (let i = 0; i < 6; i++) {
        const endDate = startOfDay(subDays(now, i * 14));
        const startDate = startOfDay(subDays(endDate, 13));

        for (const user of [...users, managerUser]) {
            const payPeriod = await prisma.payPeriod.create({
                data: {
                    userId: user.userId,
                    startDate,
                    endDate,
                    status: i > 2 ? PayStatus.PAID : i > 0 ? PayStatus.PROCESSED : PayStatus.PENDING,
                    totalHours: 0,
                    grossPay: 0
                }
            });
            payPeriods.push(payPeriod);

            let totalMinutes = 0;
            for (let day = 0; day < 10; day++) {
                if (day % 7 >= 5) continue;

                const clockInTime = addHours(addDays(startDate, day), 9);

                const workHours = 8 + Math.random();
                const clockOutTime = addHours(clockInTime, workHours);
                const durationMinutes = Math.floor(workHours * 60);

                await prisma.timeEntry.create({
                    data: {
                        userId: user.userId,
                        payPeriodId: payPeriod.payPeriodId,
                        clockInTime,
                        clockOutTime,
                        minutesWorked: durationMinutes,
                        notes: Math.random() > 0.8 ? "Worked on special project" : null
                    }
                });

                totalMinutes += durationMinutes;
            }

            const totalHours = +(totalMinutes / 60).toFixed(2);
            const grossPay = +(totalHours * Number(user.hourlyRate)).toFixed(2);

            await prisma.payPeriod.update({
                where: { payPeriodId: payPeriod.payPeriodId },
                data: {
                    totalHours,
                    grossPay
                }
            });
        }
    }

    await prisma.session.create({
        data: {
            userId: adminUser.userId,
            expiresAt: addDays(now, 7)
        }
    });

    await prisma.session.create({
        data: {
            userId: users[0].userId,
            expiresAt: addDays(now, 7)
        }
    });

    console.log(`Database seeded with: 
  - ${users.length + 2} users
  - ${payPeriods.length} pay periods
  - Multiple time entries per user per pay period
  - 2 active sessions`);
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