"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  try {
    const supabase = await createClient();

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    console.error("Login action failed:", error);
    return {
      error:
        "Configuration Supabase manquante sur le serveur. Vérifiez les variables d'environnement Vercel.",
    };
  }
}

export async function signup(formData: FormData) {
  try {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "client";
    const company_name = formData.get("company_name") as string;

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          company_name: company_name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    console.error("Signup action failed:", error);
    return {
      error:
        "Configuration Supabase manquante sur le serveur. Vérifiez les variables d'environnement Vercel.",
    };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
