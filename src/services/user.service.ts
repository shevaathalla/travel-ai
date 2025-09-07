import { PrismaClient } from '@prisma/client';
import { UpdateUserInput } from '../schemas/user.schema';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  city: string;
  country: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

export const userService = {
  async getProfile(userId: string): Promise<UserProfile> {
    logger.info('Getting user profile:', { userId });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        country: true,
        age: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  async updateProfile(userId: string, input: UpdateUserInput): Promise<UserProfile> {
    logger.info('Updating user profile:', { userId, input });

    // Filter out undefined values to satisfy Prisma's exactOptionalPropertyTypes
    const updateData: Partial<{ name: string; city: string; country: string; age: number }> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.city !== undefined) {
      updateData.city = input.city;
    }
    if (input.country !== undefined) {
      updateData.country = input.country;
    }
    if (input.age !== undefined) {
      updateData.age = input.age;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        country: true,
        age: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('User profile updated successfully:', { userId });
    return user;
  },
};
