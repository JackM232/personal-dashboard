import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signToken, AuthedRequest } from "./middleware";

function toPublicUser(user: { id: string; email: string; username: string; role: string }) {
  return { id: user.id, email: user.email, username: user.username, role: user.role };
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
