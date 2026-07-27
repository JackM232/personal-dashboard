import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { Role } from "../../generated/prisma";

export interface AuthedRequest extends Request {
  user?: { id: string; role: Role };
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, getSecret(), { expiresIn: "7d" });
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  let payload: { sub: string };
  try {
    payload = jwt.verify(token, getSecret()) as { sub: string };
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    return res.status(500).json({ error: "Failed to authenticate" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
