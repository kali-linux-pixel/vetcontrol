'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Appointment } from '@/types';

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

export async function createAppointment(state: any, formData: FormData) {
  try {
    const petId = formData.get('petId') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const type = formData.get('type') as string;
    const status = formData.get('status') as string || 'Scheduled';
    const veterinarian = formData.get('veterinarian') as string;
    const notes = formData.get('notes') as string || null;

    if (!petId || !date || !time || !type || !veterinarian) {
      return { error: 'All fields (patient, date, time, service type, veterinarian) are required.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('appointments')
      .insert({
        organization_id: orgId,
        pet_id: petId,
        date,
        time,
        type,
        status,
        veterinarian,
        notes,
      });

    if (error) {
      return { error: `Failed to book appointment: ${error.message}` };
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function updateAppointment(id: string, state: any, formData: FormData) {
  try {
    const petId = formData.get('petId') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const type = formData.get('type') as string;
    const status = formData.get('status') as string;
    const veterinarian = formData.get('veterinarian') as string;
    const notes = formData.get('notes') as string || null;

    if (!petId || !date || !time || !type || !veterinarian || !status) {
      return { error: 'All fields are required.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('appointments')
      .update({
        pet_id: petId,
        date,
        time,
        type,
        status,
        veterinarian,
        notes,
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Failed to update appointment: ${error.message}` };
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function updateAppointmentStatus(id: string, newStatus: Appointment['status']) {
  try {
    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Failed to update status: ${error.message}` };
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}

export async function deleteAppointment(id: string) {
  try {
    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Failed to delete appointment: ${error.message}` };
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
