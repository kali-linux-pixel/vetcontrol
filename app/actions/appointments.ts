'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Appointment } from '@/types';

import { getProfileOrEnsure } from '@/lib/auth-utils';

async function getOrgId(supabase: any) {
  try {
    const { profile } = await getProfileOrEnsure();
    return profile.organization_id;
  } catch (err: any) {
    throw new Error(`Configuración de perfil de usuario faltante: ${err.message}`);
  }
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
      return { error: 'Todos los campos (paciente, fecha, hora, tipo de servicio, veterinario) son obligatorios.' };
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
      return { error: `Error al programar la cita: ${error.message}` };
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
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
      return { error: 'Todos los campos son obligatorios.' };
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
      return { error: `Error al actualizar la cita: ${error.message}` };
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
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
      return { error: `Error al actualizar el estado de la cita: ${error.message}` };
    }

    if (newStatus === 'Cancelled') {
      try {
        const { data: apt } = await supabase
          .from('appointments')
          .select(`
            date,
            time,
            pets (
              name,
              clients (
                name,
                phone
              )
            )
          `)
          .eq('id', id)
          .eq('organization_id', orgId)
          .maybeSingle();

        if (apt) {
          const aptAny = apt as any;
          const pet = Array.isArray(aptAny.pets) ? aptAny.pets[0] : aptAny.pets;
          const client = Array.isArray(pet?.clients) ? pet.clients[0] : pet?.clients;
          if (client?.phone) {
            const { enqueueWhatsAppAutomation } = await import('@/app/actions/whatsapp');
            await enqueueWhatsAppAutomation(orgId, 'cancelled', {
              ownerName: client.name,
              phone: client.phone,
              petName: pet.name,
              date: aptAny.date,
              time: aptAny.time
            });
          }
        }
      } catch (err) {
        console.error("Failed to send WhatsApp status update alert:", err);
      }
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}

export async function deleteAppointment(id: string) {
  try {
    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    // Fetch details before deleting
    let aptDetails: any = null;
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          date,
          time,
          pets (
            name,
            clients (
              name,
              phone
            )
          )
        `)
        .eq('id', id)
        .eq('organization_id', orgId)
        .maybeSingle();
      aptDetails = data;
    } catch (err) {
      console.error("Error fetching appointment details for cancellation:", err);
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Error al eliminar la cita: ${error.message}` };
    }

    // Trigger WhatsApp cancellation if client phone exists
    if (aptDetails) {
      const pet = Array.isArray(aptDetails.pets) ? aptDetails.pets[0] : aptDetails.pets;
      const client = Array.isArray(pet?.clients) ? pet.clients[0] : pet?.clients;
      if (client?.phone) {
        try {
          const { enqueueWhatsAppAutomation } = await import('@/app/actions/whatsapp');
          await enqueueWhatsAppAutomation(orgId, 'cancelled', {
            ownerName: client.name,
            phone: client.phone,
            petName: pet.name,
            date: aptDetails.date,
            time: aptDetails.time
          });
        } catch (err) {
          console.error("Error triggering WhatsApp cancellation automation:", err);
        }
      }
    }

    revalidatePath('/appointments');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}

export async function createAppointmentSmart(state: any, formData: FormData) {
  try {
    const isNewClient = formData.get('isNewClient') === 'true';
    const clientIdRaw = formData.get('clientId') as string;
    
    const isNewPet = formData.get('isNewPet') === 'true';
    const petIdRaw = formData.get('petId') as string;

    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const type = formData.get('type') as string;
    const veterinarian = formData.get('veterinarian') as string;
    const notes = formData.get('notes') as string || null;

    if (!date || !time || !type || !veterinarian) {
      return { error: 'La fecha, hora, motivo de consulta y veterinario son obligatorios.' };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    let clientId = clientIdRaw;
    if (isNewClient) {
      const ownerName = formData.get('ownerName') as string;
      const ownerPhone = formData.get('ownerPhone') as string;
      const ownerDni = formData.get('ownerDni') as string || null;
      const ownerAddress = formData.get('ownerAddress') as string || null;
      const ownerEmail = formData.get('ownerEmail') as string || null;

      if (!ownerName || !ownerPhone) {
        return { error: 'El nombre del dueño y celular son obligatorios para registrar un nuevo cliente.' };
      }

      if (ownerDni) {
        const cleanDni = ownerDni.trim();
        if (!/^\d+$/.test(cleanDni)) {
          return { error: 'El DNI del dueño debe contener solo números.' };
        }
        if (cleanDni.length !== 8) {
          return { error: 'El DNI del dueño debe tener exactamente 8 dígitos para Perú.' };
        }
      }

      // Check DNI or Phone to prevent duplicate
      let query = supabase.from('clients').select('id').eq('organization_id', orgId);
      let existingClient: any = null;
      if (ownerDni) {
        const { data } = await query.eq('dni', ownerDni).maybeSingle();
        existingClient = data;
      }
      if (!existingClient) {
        const { data } = await supabase
          .from('clients')
          .select('id')
          .eq('organization_id', orgId)
          .eq('phone', ownerPhone)
          .maybeSingle();
        existingClient = data;
      }

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newC, error: errC } = await supabase
          .from('clients')
          .insert({
            organization_id: orgId,
            name: ownerName,
            phone: ownerPhone,
            dni: ownerDni,
            address: ownerAddress,
            email: ownerEmail
          })
          .select()
          .single();

        if (errC || !newC) {
          return { error: `Error al registrar nuevo cliente: ${errC?.message}` };
        }
        clientId = newC.id;
      }
    }

    let petId = petIdRaw;
    if (isNewPet || !petId) {
      const petName = formData.get('petName') as string;
      const petSpecies = formData.get('petSpecies') as string;
      const petBreed = formData.get('petBreed') as string;
      const petAge = formData.get('petAge') as string;
      const petSex = formData.get('petSex') as string || null;
      const petWeight = formData.get('petWeight') as string || null;

      if (!petName || !petSpecies || !petBreed || !petAge) {
        return { error: 'Los datos de la mascota (nombre, especie, raza y edad) son obligatorios.' };
      }

      // Check if pet already exists for this client
      const { data: existingPet } = await supabase
        .from('pets')
        .select('id')
        .eq('organization_id', orgId)
        .eq('client_id', clientId)
        .ilike('name', petName.trim())
        .eq('species', petSpecies)
        .maybeSingle();

      if (existingPet) {
        petId = existingPet.id;
      } else {
        const { data: newP, error: errP } = await supabase
          .from('pets')
          .insert({
            organization_id: orgId,
            client_id: clientId,
            name: petName,
            species: petSpecies,
            breed: petBreed,
            age: petAge,
            sex: petSex,
            weight: petWeight
          })
          .select()
          .single();

        if (errP || !newP) {
          return { error: `Error al registrar mascota: ${errP?.message}` };
        }
        petId = newP.id;
      }
    }

    // Now insert the appointment
    const { error: apptErr } = await supabase
      .from('appointments')
      .insert({
        organization_id: orgId,
        pet_id: petId,
        date,
        time,
        type,
        status: 'Scheduled',
        veterinarian,
        notes,
      });

    if (apptErr) {
      return { error: `Error al registrar cita: ${apptErr.message}` };
    }

    // Trigger WhatsApp confirmation automation
    try {
      // 1. Fetch Client info if not new client
      let ownerName = formData.get('ownerName') as string || 'Cliente';
      let ownerPhone = formData.get('ownerPhone') as string || '';
      
      if (!isNewClient && clientId) {
        const { data: c } = await supabase
          .from('clients')
          .select('name, phone')
          .eq('id', clientId)
          .maybeSingle();
        if (c) {
          ownerName = c.name;
          ownerPhone = c.phone;
        }
      }

      // 2. Fetch Pet info if not new pet
      let petName = formData.get('petName') as string || 'Mascota';
      if (!isNewPet && petId) {
        const { data: p } = await supabase
          .from('pets')
          .select('name')
          .eq('id', petId)
          .maybeSingle();
        if (p) {
          petName = p.name;
        }
      }

      if (ownerPhone) {
        const { enqueueWhatsAppAutomation } = await import('@/app/actions/whatsapp');
        await enqueueWhatsAppAutomation(orgId, 'confirmation', {
          ownerName,
          phone: ownerPhone,
          petName,
          date,
          time,
          veterinarian
        });
      }
    } catch (err) {
      console.error("Failed to trigger WhatsApp confirmation automation:", err);
    }

    revalidatePath('/appointments');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}
