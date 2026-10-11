import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { AuthSessionUser, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'careconnect_super_secret_jwt_key_2026_elderly_assistance';
const TOKEN_EXPIRY = '7d';
export const AUTH_COOKIE_NAME = 'careconnect_token';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthSessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      location: user.location,
      kycStatus: user.kycStatus,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): AuthSessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSessionUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts session user from NextRequest (checks cookie or Authorization Bearer header)
 */
export function getSessionUser(req: NextRequest): AuthSessionUser | null {
  // Check cookie first
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    const user = verifyToken(cookie.value);
    if (user) return user;
  }

  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = verifyToken(token);
    if (user) return user;
  }

  return null;
}

/**
 * Middleware helper for API route authentication with role authorization
 */
export function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): { user: AuthSessionUser } | { errorResponse: NextResponse } {
  const user = getSessionUser(req);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]` },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Sets auth cookie on response
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Clears auth cookie on response
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
}
