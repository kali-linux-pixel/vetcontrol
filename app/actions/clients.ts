'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper to retrieve organization ID of current user
async function getOrgId(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Unauthenticated user.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) throw new Error('User profile configuration missing.');
  return profile.organization_id;
}

export async function createClient(state: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!name || !email || !phone) {
      return { error: 'Name, email, and phone are required fields.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('clients')
      .insert({
        organization_id: orgId,
        name,
        email,
        phone,
      });

    if (error) {
      return { error: `Failed to create client: ${error.message}` };
    }

    revalidatePath('/clients');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function updateClient(id: string, state: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!name || !email || !phone) {
      return { error: 'Name, email, and phone are required fields.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('clients')
      .update({ name, email, phone })
      .eq('id', id)
      .eq('organization_id', orgId); // Extra multi-tenant protection

    if (error) {
      return { error: `Failed to update client: ${error.message}` };
    }

    revalidatePath('/clients');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function deleteClient(id: string) {
  try {
    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Failed to delete client: ${error.message}` };
    }

    revalidatePath('/clients');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
