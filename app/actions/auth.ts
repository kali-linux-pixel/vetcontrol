'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ensureUserProfile } from '@/lib/auth-utils';

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'El correo electrónico y la contraseña son obligatorios.' };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Database verification check on login
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (user && !userError) {
    try {
      await ensureUserProfile(user);
    } catch (profileErr: any) {
      console.error("Login verification check failed:", profileErr);
      return { error: `La verificación de la base de datos falló: ${profileErr.message}` };
    }
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const clinicName = formData.get('clinicName') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password || !clinicName || !fullName) {
    return { error: 'Todos los campos son obligatorios.' };
  }

  const supabase = await createServerClient();

  // Register Auth User
  // Passing clinic_name and full_name in the options metadata.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        clinic_name: clinicName,
        full_name: fullName,
      }
    }
  });

  if (authError) {
    return { error: authError.message };
  }

  // Create Profile and Organization rows programmatically immediately
  if (authData.user) {
    try {
      await ensureUserProfile(authData.user);
    } catch (profileErr: any) {
      console.error("Signup profile configuration failed:", profileErr);
      return { error: `La configuración del perfil falló: ${profileErr.message}` };
    }
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
