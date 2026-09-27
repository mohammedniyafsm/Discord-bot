const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.server.findMany().then(servers => {
  console.log("SERVERS:", servers);
  return prisma.interactionLog.findMany();
}).then(logs => {
  console.log("LOGS:", logs);
}).finally(() => prisma.$disconnect());
