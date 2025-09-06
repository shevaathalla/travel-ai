import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  city: string;
  age: number;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { iat: number; exp: number };
    return {
      userId: decoded.userId,
      email: decoded.email,
      city: decoded.city,
      age: decoded.age,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
