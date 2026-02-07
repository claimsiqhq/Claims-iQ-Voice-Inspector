import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const DOCUMENTS_BUCKET = "claim-documents";
export const PHOTOS_BUCKET = "inspection-photos";

export async function ensurePhotoBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === PHOTOS_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(PHOTOS_BUCKET, {
      public: false,
      fileSizeLimit: 25 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/heic"],
    });
    console.log(`Created storage bucket: ${PHOTOS_BUCKET}`);
  }
}
