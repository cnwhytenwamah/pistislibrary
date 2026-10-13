export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  hasPassword: boolean;
  createdAt: string;
};
