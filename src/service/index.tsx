import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;

// const storageUrl =
//   "https://khpuigptjufryfxcnsrs.supabase.co/storage/v1/object/public/";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  return userId;
};

export const uploadImage = async (file: File) => {
  const { data, error } = await supabase.storage
    .from("PediClick-panarce")
    .upload(file.name, file);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
