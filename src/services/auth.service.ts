import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    city: string;
    country: string;
    age: number;
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    logger.info('Registering new user:', { email: input.email });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        city: input.city,
        country: input.country,
        age: input.age,
      },
    });

    // Generate token
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      city: user.city,
      country: user.country,
      age: user.age,
    });

    logger.info('User registered successfully:', { userId: user.id });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        city: user.city,
        country: user.country,
        age: user.age,
      },
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    logger.info('User login attempt:', { email: input.email });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      city: user.city,
      country: user.country,
      age: user.age,
    });

    logger.info('User logged in successfully:', { userId: user.id });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        city: user.city,
        country: user.country,
        age: user.age,
      },
    };
  },
};
