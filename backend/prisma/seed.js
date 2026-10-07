import bcrypt from 'bcryptjs';
import prisma from '../src/db.js';

async function main() {
  console.log('Seeding database with roles, users, and scoped projects...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator with full access to all projects, tasks, and role management',
    },
  });

  const leaderRole = await prisma.role.upsert({
    where: { name: 'PROJECT_LEADER' },
    update: {},
    create: {
      name: 'PROJECT_LEADER',
      description: 'Project Leader who can create projects, lead initiatives, and assign tasks to members',
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'MEMBER' },
    update: {},
    create: {
      name: 'MEMBER',
      description: 'Team Member who works on assigned projects and completes assigned tasks',
    },
  });

  console.log('Roles created: ADMIN, PROJECT_LEADER, MEMBER');

  // 2. Seed Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ismo.dev' },
    update: { roleId: adminRole.id },
    create: {
      name: 'Alex Admin (Administrator)',
      email: 'admin@ismo.dev',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  const leaderUser = await prisma.user.upsert({
    where: { email: 'leader@ismo.dev' },
    update: { roleId: leaderRole.id },
    create: {
      name: 'Sarah Leader (Project Lead)',
      email: 'leader@ismo.dev',
      password: hashedPassword,
      roleId: leaderRole.id,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'intern@ismo.dev' },
    update: { roleId: memberRole.id },
    create: {
      name: 'Pranat (Intern Demo)',
      email: 'intern@ismo.dev',
      password: hashedPassword,
      roleId: memberRole.id,
    },
  });

  console.log(`Users seeded:
  - Admin:  ${adminUser.email} (password123)
  - Leader: ${leaderUser.email} (password123)
  - Member: ${memberUser.email} (password123)`);

  // 3. Clear existing projects created by these users to avoid duplication
  await prisma.activityLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});

  // 4. Create Projects with Tasks and Assignments
  // Project 1: Assigned to intern
  const proj1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Platform Redesign',
      description: 'Revamping the core checkout experience and product catalog for high conversion.',
      status: 'In Progress',
      startDate: '2026-09-15',
      endDate: '2026-11-30',
      userId: leaderUser.id,
      assignedToId: memberUser.id,
      tasks: {
        create: [
          {
            name: 'Integrate Stripe Payment Gateway',
            description: 'Implement tokenized card charges, webhooks, and refund flow.',
            priority: 'High',
            status: 'In Progress',
            dueDate: '2026-10-25',
            creatorId: leaderUser.id,
            assignedToId: memberUser.id,
          },
          {
            name: 'Design Cart & Checkout Wireframes',
            description: 'Deliver mobile-first responsive wireframes in Figma.',
            priority: 'Medium',
            status: 'Completed',
            dueDate: '2026-09-28',
            creatorId: leaderUser.id,
            assignedToId: memberUser.id,
          },
        ],
      },
    },
  });

  // Project 2: Mobile Banking - Assigned to intern
  const proj2 = await prisma.project.create({
    data: {
      name: 'Mobile Banking Application',
      description: 'Cross-platform financial management app for seamless transfers and bill payments.',
      status: 'Not Started',
      startDate: '2026-10-10',
      endDate: '2026-12-20',
      userId: leaderUser.id,
      assignedToId: memberUser.id,
      tasks: {
        create: [
          {
            name: 'Setup React Native / Flutter Boilerplate',
            description: 'Configure environment, secure storage, and base routing.',
            priority: 'High',
            status: 'Pending',
            dueDate: '2026-10-18',
            creatorId: leaderUser.id,
            assignedToId: memberUser.id,
          },
          {
            name: 'Draft API contracts for transfer service',
            description: 'Define OpenAPI schema for fund transfer endpoints.',
            priority: 'Low',
            status: 'Pending',
            dueDate: '2026-10-22',
            creatorId: leaderUser.id,
            assignedToId: leaderUser.id, // Only leader assigned
          },
        ],
      },
    },
  });

  // Project 3: Internal AI Dashboard - Assigned ONLY to leader (not member)
  await prisma.project.create({
    data: {
      name: 'AI Analytics Dashboard',
      description: 'Internal business intelligence metrics tool with predictive forecasts.',
      status: 'Completed',
      startDate: '2026-08-01',
      endDate: '2026-09-30',
      userId: leaderUser.id,
      assignedToId: leaderUser.id, // Assigned to leader, NOT intern!
      tasks: {
        create: [
          {
            name: 'Train trend forecasting model',
            description: 'Export monthly aggregate metrics and train ARIMA model.',
            priority: 'High',
            status: 'Completed',
            dueDate: '2026-09-15',
            creatorId: leaderUser.id,
            assignedToId: leaderUser.id,
          },
        ],
      },
    },
  });

  // 5. Create Initial Activity Logs for Member
  await prisma.activityLog.create({
    data: {
      action: 'ASSIGNED',
      message: 'Sarah Leader assigned project "E-Commerce Platform Redesign" to you.',
      entityType: 'PROJECT',
      entityId: proj1.id,
      entityName: proj1.name,
      userId: leaderUser.id,
      targetUserId: memberUser.id,
      projectId: proj1.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'ASSIGNED',
      message: 'Sarah Leader assigned task "Integrate Stripe Payment Gateway" to you.',
      entityType: 'TASK',
      entityId: 'initial-task-1',
      entityName: 'Integrate Stripe Payment Gateway',
      userId: leaderUser.id,
      targetUserId: memberUser.id,
      projectId: proj1.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      action: 'UPDATED_STATUS',
      message: 'Task "Design Cart & Checkout Wireframes" was marked as Completed.',
      entityType: 'TASK',
      entityId: 'initial-task-2',
      entityName: 'Design Cart & Checkout Wireframes',
      userId: memberUser.id,
      targetUserId: memberUser.id,
      projectId: proj1.id,
    },
  });

  console.log('Seeding completed successfully with initial activities!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
