import {
  DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { s3 } from "../config/storage";

const Bucket = env.S3_BUCKET;
const expiresIn = env.SIGNED_URL_TTL_SECONDS;

export type HeadResult = { size: number; etag: string | null; contentType: string | null };

export const storageService = {
  /** Presigned PUT: the client uploads straight to the bucket. */
  presignUpload(params: { key: string; contentType: string; sizeBytes: number }) {
    return getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket,
        Key: params.key,
        ContentType: params.contentType,
        ContentLength: params.sizeBytes,
      }),
      { expiresIn }
    );
  },

  /** Presigned GET with a download/inline disposition. */
  presignDownload(params: {
    key: string;
    filename: string;
    disposition: "attachment" | "inline";
    contentType: string;
  }) {
    const safeName = params.filename.replace(/[^\w.\-]+/g, "_");
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket,
        Key: params.key,
        ResponseContentDisposition: `${params.disposition}; filename="${safeName}"`,
        ResponseContentType: params.contentType,
      }),
      { expiresIn }
    );
  },

  /** Images (covers, author photos): a public URL when configured, otherwise a signed URL. */
  async imageUrl(key: string) {
    if (env.S3_PUBLIC_URL) return `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: 3600 });
  },

  /** Returns object metadata, or null if the object doesn't exist. */
  async head(key: string): Promise<HeadResult | null> {
    try {
      const res = await s3.send(new HeadObjectCommand({ Bucket, Key: key }));
      return {
        size: res.ContentLength ?? 0,
        etag: res.ETag ? res.ETag.replace(/"/g, "") : null,
        contentType: res.ContentType ?? null,
      };
    } catch (err) {
      const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return null;
      throw err;
    }
  },

  /** Best-effort delete; failures are logged, not thrown. */
  async remove(key: string | null | undefined) {
    if (!key) return;
    try {
      await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
    } catch (err) {
      console.error(`Failed to delete storage object ${key}:`, err);
    }
  },
};
