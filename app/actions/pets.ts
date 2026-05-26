'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';

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

export async function createPet(state: any, formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string;
    const name = formData.get('name') as string;
    const species = formData.get('species') as string;
    const breed = formData.get('breed') as string;
    const age = formData.get('age') as string;
    const avatarUrl = formData.get('avatarUrl') as string || null;

    if (!clientId || !name || !species || !breed || !age) {
      return { error: 'All fields (owner, name, species, breed, age) are required.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('pets')
      .insert({
        organization_id: orgId,
        client_id: clientId,
        name,
        species,
        breed,
        age,
        avatar_url: avatarUrl,
      });

    if (error) {
      return { error: `Failed to register pet: ${error.message}` };
    }

    revalidatePath('/pets');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function updatePet(id: string, state: any, formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string;
    const name = formData.get('name') as string;
    const species = formData.get('species') as string;
    const breed = formData.get('breed') as string;
    const age = formData.get('age') as string;
    const avatarUrl = formData.get('avatarUrl') as string || null;

    if (!clientId || !name || !species || !breed || !age) {
      return { error: 'All fields (owner, name, species, breed, age) are required.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('pets')
      .update({
        client_id: clientId,
        name,
        species,
        breed,
        age,
        avatar_url: avatarUrl,
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Failed to update pet: ${error.message}` };
    }

    revalidatePath('/pets');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function deletePet(id: string) {
  try {
    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Failed to delete pet: ${error.message}` };
    }

    revalidatePath('/pets');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
