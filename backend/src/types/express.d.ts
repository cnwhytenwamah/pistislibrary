import type { Role } from "../database/models/User";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}
export {};
