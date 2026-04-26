"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  let errorMsg = null;

  try {
    const supabase = await createClient();

    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      errorMsg = error.message;
    }
  } catch (error) {
    console.error("Login action failed:", error);
    errorMsg = "Configuration Supabase manquante sur le serveur. Vérifiez les variables d'environnement Vercel.";
  }

  if (errorMsg) {
    return { error: errorMsg };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  let errorMsg = null;

  try {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "client";
    const company_name = formData.get("company_name") as string;

    if (!email || !password) {
      errorMsg = "Email and password are required";
    } else {
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
        errorMsg = error.message;
      }
    }
  } catch (error) {
    console.error("Signup action failed:", error);
    errorMsg = "Configuration Supabase manquante sur le serveur. Vérifiez les variables d'environnement Vercel.";
  }

  if (errorMsg) {
    return { error: errorMsg };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Logout action failed:", error);
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
