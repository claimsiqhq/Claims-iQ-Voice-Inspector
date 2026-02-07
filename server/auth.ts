import { type Request, Response, NextFunction } from "express";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        fullName: string | null;
        supabaseAuthId: string | null;
      };
    }
  }
}

export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Missing or invalid Authorization header" });
      return;
    }

    const token = authHeader.substring(7);

    let supabaseAuthId: string;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        res.status(401).json({ message: "Invalid token format" });
        return;
      }
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      supabaseAuthId = payload.sub;
    } catch (parseError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    const user = await storage.getUserBySupabaseId(supabaseAuthId);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email || "",
      role: user.role,
      fullName: user.fullName,
      supabaseAuthId: user.supabaseAuthId,
    };

    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication failed" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = undefined;
      next();
      return;
    }

    const token = authHeader.substring(7);
    const parts = token.split(".");
    if (parts.length !== 3) {
      req.user = undefined;
      next();
      return;
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    const supabaseAuthId = payload.sub;
    const user = await storage.getUserBySupabaseId(supabaseAuthId);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email || "",
        role: user.role,
        fullName: user.fullName,
        supabaseAuthId: user.supabaseAuthId,
      };
    } else {
      req.user = undefined;
    }

    next();
  } catch {
    req.user = undefined;
    next();
  }
}
