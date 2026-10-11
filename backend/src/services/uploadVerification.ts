import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { storageService } from "./storage.service";

const MB = 1024 * 1024;

export type UploadKind = "book" | "cover" | "authorPhoto";

/** Confirms the client really uploaded the object and that it respects the size cap. */
export async function verifyUpload(key: string, kind: UploadKind) {
  const head = await storageService.head(key);
  if (!head) throw new AppError(400, `Upload not found in storage (${kind}). Upload it first.`);
  const maxMb = kind === "book" ? env.MAX_BOOK_FILE_MB : env.MAX_COVER_MB;
  if (head.size > maxMb * MB) {
    await storageService.remove(key);
    throw new AppError(400, `The ${kind} file exceeds the size limit`);
  }
  return head;
}
