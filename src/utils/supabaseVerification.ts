import { supabase } from "@/supabase";
import { Database } from "@/types/supabase";

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export const verifyUser = async (uuid: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uuid);

  if (error) {
    console.log(error);
    return false;
  }

  if (!data || data.length === 0) {
    return false;
  }

  return true;
};

export const verifyEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email);

  if (error) {
    console.log(error);
    return false;
  }

  if (!data || data.length === 0) {
    return false;
  }

  return true;
};

export const getProfile = async (uuid: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uuid)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const getProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const updateProfile = async (
  uuid: string,
  updates: Partial<Tables<"profiles">>
) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", uuid);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export const createProfile = async (profile: Tables<"profiles">) => {
  const { data, error } = await supabase.from("profiles").insert([profile]);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export const deleteProfile = async (uuid: string) => {
  const { data, error } = await supabase.from("profiles").delete().eq("id", uuid);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export const getTransactions = async (uuid: string) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", uuid);

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const getTransaction = async (id: string) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const createTransaction = async (
  transaction: Omit<Tables<"transactions">, "id">
) => {
  const { data, error } = await supabase.from("transactions").insert([transaction]).select().single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const updateTransaction = async (
  id: string,
  updates: Partial<Tables<"transactions">>
) => {
  const { data, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const deleteTransaction = async (id: string) => {
  const { data, error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export const getCategories = async (uuid: string) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", uuid);

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const getCategory = async (id: string) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const createCategory = async (
  category: Omit<Tables<"categories">, "id">
) => {
  const { data, error } = await supabase.from("categories").insert([category]).select().single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const updateCategory = async (
  id: string,
  updates: Partial<Tables<"categories">>
) => {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const deleteCategory = async (id: string) => {
  const { data, error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.log(error);
    return false;
  }

  return true;
};

export const syncTransactions = async (
  uuid: string,
  transactions: Omit<Tables<"transactions">, "id">[]
) => {
  // Before inserting, fetch existing transaction IDs for the user
  const existingTransactions = await getTransactions(uuid);
  const existingTransactionIds = existingTransactions?.map((t) => t.id) || [];

  // Filter out transactions that already exist
  const newTransactions = transactions.filter(
    (t) => !existingTransactionIds.includes(t.id)
  );

  // Insert the new transactions
  if (newTransactions.length > 0) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(newTransactions);

    if (error) {
      console.log("Error inserting transactions:", error);
      return false;
    }
  }

  return true;
};

export const syncCategories = async (
  uuid: string,
  categories: Omit<Tables<"categories">, "id">[]
) => {
  // Before inserting, fetch existing category IDs for the user
  const existingCategories = await getCategories(uuid);
  const existingCategoryIds = existingCategories?.map((c) => c.id) || [];

  // Filter out categories that already exist
  const newCategories = categories.filter(
    (c) => !existingCategoryIds.includes(c.id)
  );

  // Insert the new categories
  if (newCategories.length > 0) {
    const { data, error } = await supabase
      .from("categories")
      .insert(newCategories);

    if (error) {
      console.log("Error inserting categories:", error);
      return false;
    }
  }

  return true;
};

export const getAllTransactions = async () => {
  const { data, error } = await supabase.from("transactions").select("*");

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const getAllCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*");

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const getCategoryByName = async (
  userId: string,
  name: string,
) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("name", name)
    .single();

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};

export const getAll = async (tableName: string) => {
  const { data, error } = await supabase
    .from(tableName as any)
    .select("*");

  if (error) {
    console.log(error);
    return null;
  }

  return data;
};
