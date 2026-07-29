import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { Role } from "../../generated/prisma";
import { signToken, AuthedRequest } from "./middleware";

interface UserRow {
  id: string;
  email: string;
  username: string;
  role: string;
  name: string | null;
  timeZone: string | null;
  bio: string | null;
  createdAt: Date;
}

function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    name: user.name,
    timeZone: user.timeZone,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

// Node ships the full IANA list, so the zone the browser offered is the zone we
// can validate against here — no table to keep in sync.
function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// "field not sent" leaves the column alone; an empty string clears it.
function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

export async function register(req: Request, res: Response) {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: "email, username, and password are required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, passwordHash },
    });

    const token = signToken(user.id, user.role);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email or username already in use" });
    }
    res.status(500).json({ error: "Failed to register" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id, user.role);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Failed to log in" });
  }
}

export async function me(req: AuthedRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(toPublicUser(user));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

export async function updateMe(req: AuthedRequest, res: Response) {
  const { email, username, name, timeZone, bio } = req.body;

  if (email !== undefined && (typeof email !== "string" || !email.trim())) {
    return res.status(400).json({ error: "email cannot be empty" });
  }
  if (username !== undefined && (typeof username !== "string" || !username.trim())) {
    return res.status(400).json({ error: "username cannot be empty" });
  }

  const normalizedZone = optionalText(timeZone);
  if (normalizedZone && !isValidTimeZone(normalizedZone)) {
    return res.status(400).json({ error: "Invalid time zone" });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        email: email === undefined ? undefined : email.trim(),
        username: username === undefined ? undefined : username.trim(),
        name: optionalText(name),
        timeZone: normalizedZone,
        bio: optionalText(bio),
      },
    });
    res.json(toPublicUser(user));
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email or username already in use" });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function changePassword(req: AuthedRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // The existing token stays valid — it carries only id and role, neither of
    // which a password change touches, so the session survives the update.
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
}

// ─────────────────────────────────────────
// /api/users — admin-only user management
// ─────────────────────────────────────────

export async function listUsers(req: AuthedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({ orderBy: { username: "asc" } });
    res.json(users.map(toPublicUser));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function updateUserRole(req: AuthedRequest, res: Response) {
  const { role } = req.body;

  if (!isEnumValue(Role, role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (role === Role.ADMIN) {
    return res.status(400).json({ error: "ADMIN cannot be granted through the API" });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }
    if (target.role === Role.ADMIN) {
      return res.status(400).json({ error: "ADMIN users cannot be modified" });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
    });
    res.json(toPublicUser(user));
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to update user role" });
  }
}
