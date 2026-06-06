import { NextRequest, NextResponse } from "next/server";
import {
  assertAdminAccess,
  getAdminAccessErrorStatus,
} from "@/lib/admin-session";
import { createSupabaseServerClient } from "@/supabase/server";

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/webp", ["webp"]],
]);

const getImageExtension = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExtensions = allowedImageTypes.get(file.type);

  if (!allowedExtensions?.includes(extension)) {
    return null;
  }

  return extension === "jpeg" ? "jpg" : extension;
};

const validateImageFile = (file: File) => {
  const extension = getImageExtension(file);

  if (!allowedImageTypes.has(file.type) || !extension) {
    throw new Error("Upload a JPG, JPEG, PNG, or WEBP image.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Product images must be 5 MB or smaller.");
  }

  return extension;
};

export async function POST(request: NextRequest) {
  try {
    await assertAdminAccess();
    const formData = await request.formData();
    const file = formData.get("file");
    const oldImagePath = formData.get("oldImagePath");

    if (!(file instanceof File)) {
      throw new Error("Product image file is required.");
    }

    const extension = validateImageFile(file);
    const imagePath = `products/${new Date()
      .toISOString()
      .slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseServerClient();
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(imagePath, bytes, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    if (typeof oldImagePath === "string" && oldImagePath.trim()) {
      await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove([oldImagePath.trim()]);
    }

    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(imagePath);

    return NextResponse.json({
      imageUrl: data.publicUrl,
      imagePath,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to upload image.",
      },
      {
        status: getAdminAccessErrorStatus(error),
      },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertAdminAccess();
    const { imagePath } = (await request.json()) as {
      imagePath?: string;
    };

    if (!imagePath) {
      throw new Error("Image path is required.");
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([imagePath]);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete image.",
      },
      {
        status: getAdminAccessErrorStatus(error),
      },
    );
  }
}
