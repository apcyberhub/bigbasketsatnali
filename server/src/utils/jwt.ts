import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { AuthUser } from '../types';

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthUser;
  } catch (error) {
    return null;
  }
}
