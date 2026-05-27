'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';

import { getProfileOrEnsure } from '@/lib/auth-utils';

async function getOrgId(supabase: any) {
  try {
    const { profile } = await getProfileOrEnsure();
    return profile.organization_id;
  } catch (err: any) {
    throw new Error(`Configuración de perfil de usuario faltante: ${err.message}`);
  }
}

export async function createPet(state: any, formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string;
    const name = formData.get('name') as string;
    const species = formData.get('species') as string;
    const breed = formData.get('breed') as string;
    const age = formData.get('age') as string;
    const sex = formData.get('sex') as string || null;
    const weight = formData.get('weight') as string || null;
    const avatarUrl = formData.get('avatarUrl') as string || null;

    if (!clientId || !name || !species || !breed || !age) {
      return { error: 'Todos los campos (propietario, nombre, especie, raza, edad) son obligatorios.' };
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
        sex,
        weight,
        avatar_url: avatarUrl,
      });

    if (error) {
      return { error: `Error al registrar mascota: ${error.message}` };
    }

    revalidatePath('/pets');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}

export async function updatePet(id: string, state: any, formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string;
    const name = formData.get('name') as string;
    const species = formData.get('species') as string;
    const breed = formData.get('breed') as string;
    const age = formData.get('age') as string;
    const sex = formData.get('sex') as string || null;
    const weight = formData.get('weight') as string || null;
    const avatarUrl = formData.get('avatarUrl') as string || null;

    if (!clientId || !name || !species || !breed || !age) {
      return { error: 'Todos los campos (propietario, nombre, especie, raza, edad) son obligatorios.' };
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
        sex,
        weight,
        avatar_url: avatarUrl,
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Error al actualizar mascota: ${error.message}` };
    }

    revalidatePath('/pets');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
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
      return { error: `Error al eliminar mascota: ${error.message}` };
    }

    revalidatePath('/pets');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}
