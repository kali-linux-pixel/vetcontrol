'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
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
    return { error: 'All fields are required.' };
  }

  const supabase = await createServerClient();

  // Register Auth User
  // Passing clinic_name and full_name in the options metadata.
  // The PostgreSQL trigger public.handle_new_user() runs AFTER INSERT ON auth.users
  // and will atomically create the organization, user profile, and seed onboarding tables.
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

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
