import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { storageService } from "../../services/storage.service";
import { AppError } from "../../utils/AppError";
import type { PresignInput } from "./upload.schema";

const MB = 1024 * 1024;

const BOOK_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
};
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const FOLDERS = { book: "books", cover: "covers", authorPhoto: "authors" } as const;

export const uploadService = {
  async presign(input: PresignInput) {
    const isBook = input.kind === "book";
    const ext = (isBook ? BOOK_TYPES : IMAGE_TYPES)[input.contentType];
    if (!ext) {
      throw new AppError(
        400,
        isBook ? "Only PDF and EPUB files are allowed" : "Images must be JPEG, PNG or WebP"
      );
    }
    const maxMb = isBook ? env.MAX_BOOK_FILE_MB : env.MAX_COVER_MB;
    if (input.sizeBytes > maxMb * MB) {
      throw new AppError(400, `File too large (max ${maxMb} MB)`);
    }

    const key = `${FOLDERS[input.kind]}/${randomUUID()}.${ext}`;
    const uploadUrl = await storageService.presignUpload({
      key,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });

    return {
      key,
      uploadUrl,
      method: "PUT" as const,
      headers: { "Content-Type": input.contentType },
      expiresIn: env.SIGNED_URL_TTL_SECONDS,
    };
  },
};
