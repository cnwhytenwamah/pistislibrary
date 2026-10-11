export type CheckStatus = "ok" | "down";

export type HealthCheck = {
  status: CheckStatus;
  latencyMs: number;
  detail?: { workers?: number } & Record<string, unknown>;
  error?: string;
};

export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    queue: HealthCheck;
  };
};
