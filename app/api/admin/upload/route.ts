import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { requireAdminSession } from "@/lib/admin/requireSession";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const blob = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: 6 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Blob upload failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to upload image." },
      { status: 500 },
    );
  }
}
