import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@coordinate/core/auth";

/**
 * Vercel Blob client-upload handler. The browser uploads the file directly to
 * Blob (no function body-size limit); this route only mints a short-lived token
 * after checking the user is authenticated, and restricts content types/size.
 * Requires env BLOB_READ_WRITE_TOKEN (Vercel Blob store).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) throw new Error("Non autenticato");
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25MB
          addRandomSuffix: true,
        };
      },
      // No post-processing needed; the client saves the returned URL on the entity.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload error" },
      { status: 400 }
    );
  }
}
