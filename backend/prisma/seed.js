import bcrypt from 'bcryptjs';
import prisma from '../src/db.js';

async function main() {
  console.log('Seeding database with initial data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create or upsert demo user
  const user = await prisma.user.upsert({
    where: { email: 'intern@ismo.dev' },
    update: {},
    create: {
      name: 'Pranat (Intern Demo)',
      email: 'intern@ismo.dev',
      password: hashedPassword,
    },
  });

  console.log(`Demo user ready: ${user.email} (Password: password123)`);

  // 2. Clear existing demo projects for this user to avoid duplication
  await prisma.project.deleteMany({
    where: { userId: user.id },
  });

  // 3. Create Projects with Tasks
  await prisma.project.create({
    data: {
      name: 'E-Commerce Platform Redesign',
      description: 'Revamping the core checkout experience and product catalog for high conversion.',
      status: 'In Progress',
      startDate: '2026-09-15',
      endDate: '2026-11-30',
      userId: user.id,
      tasks: {
        create: [
          {
            name: 'Integrate Stripe Payment Gateway',
            description: 'Implement tokenized card charges, webhooks, and refund flow.',
            priority: 'High',
            status: 'In Progress',
            dueDate: '2026-10-25',
          },
          {
            name: 'Design Cart & Checkout Wireframes',
            description: 'Deliver mobile-first responsive wireframes in Figma.',
            priority: 'Medium',
            status: 'Completed',
            dueDate: '2026-09-28',
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: 'Mobile Banking Application',
      description: 'Cross-platform financial management app for seamless transfers and bill payments.',
      status: 'Not Started',
      startDate: '2026-10-10',
      endDate: '2026-12-20',
      userId: user.id,
      tasks: {
        create: [
          {
            name: 'Setup React Native / Flutter Boilerplate',
            description: 'Configure environment, secure storage, and base routing.',
            priority: 'High',
            status: 'Pending',
            dueDate: '2026-10-18',
          },
          {
            name: 'Draft API contracts for transfer service',
            description: 'Define OpenAPI schema for fund transfer endpoints.',
            priority: 'Low',
            status: 'Pending',
            dueDate: '2026-10-22',
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      name: 'AI Analytics Dashboard',
      description: 'Internal business intelligence metrics tool with predictive forecasts.',
      status: 'Completed',
      startDate: '2026-08-01',
      endDate: '2026-09-30',
      userId: user.id,
      tasks: {
        create: [
          {
            name: 'Train trend forecasting model',
            description: 'Export monthly aggregate metrics and train ARIMA model.',
            priority: 'High',
            status: 'Completed',
            dueDate: '2026-09-15',
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

