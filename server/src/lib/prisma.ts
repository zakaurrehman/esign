import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Lazy initialization for serverless environments
let prismaClient: PrismaClient;

const getPrismaClient = () => {
  if (!prismaClient) {
    prismaClient = global.prisma || new PrismaClient({
      log: ['error'],
    });
    global.prisma = prismaClient;
  }
  return prismaClient;
};

// Initialize on first import
prismaClient = getPrismaClient();

// Support both named and default imports
export const prisma = prismaClient;
export default prismaClient;
