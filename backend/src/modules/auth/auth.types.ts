export type UserRole = "admin" | "user";

export interface User {
  userId: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
