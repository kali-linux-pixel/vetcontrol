'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';

// Helper de validación de UUID
function isValidUUID(val: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export async function createPublicBooking(orgId: string, state: any, formData: FormData) {
  try {
    if (!orgId || !isValidUUID(orgId)) {
      return { error: 'Enlace de reserva no válido. Falta el código de la clínica.' };
    }

    const ownerName = formData.get('ownerName') as string;
    const ownerPhone = formData.get('ownerPhone') as string;
    const ownerDni = formData.get('ownerDni') as string || null;
    const ownerEmail = formData.get('ownerEmail') as string || null;
    const ownerAddress = formData.get('ownerAddress') as string || null;

    const petName = formData.get('petName') as string;
    const petSpecies = formData.get('petSpecies') as string;
    const petBreed = formData.get('petBreed') as string;
    const petAge = formData.get('petAge') as string;
    const petSex = formData.get('petSex') as string || null;
    const petWeight = formData.get('petWeight') as string || null;

    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const type = formData.get('type') as string;
    const notes = formData.get('notes') as string || null;

    // Validation
    if (!ownerName || !ownerPhone) {
      return { error: 'El nombre del dueño y celular son obligatorios.' };
    }
    if (ownerDni) {
      const cleanDni = ownerDni.trim();
      if (!/^\d+$/.test(cleanDni)) {
        return { error: 'El DNI debe contener solo números.' };
      }
      if (cleanDni.length !== 8) {
        return { error: 'El DNI debe tener exactamente 8 dígitos para Perú.' };
      }
    }
    if (!petName || !petSpecies || !petBreed || !petAge) {
      return { error: 'Los datos de la mascota (nombre, especie, raza y edad) son obligatorios.' };
    }
    if (!date || !time || !type) {
      return { error: 'La fecha, hora y motivo de consulta son obligatorios.' };
    }

    const supabase = await createServerClient();

    // Verify Organization exists
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgErr || !org) {
      return { error: 'Clínica veterinaria no encontrada o inactiva.' };
    }

    // 1. Check if client already exists (check DNI or Phone)
    let clientId: string | null = null;
    let query = supabase.from('clients').select('id').eq('organization_id', orgId);

    if (ownerDni) {
      const { data: byDni } = await query.eq('dni', ownerDni).maybeSingle();
      if (byDni) clientId = byDni.id;
    }

    if (!clientId) {
      const { data: byPhone } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', orgId)
        .eq('phone', ownerPhone)
        .maybeSingle();
      if (byPhone) clientId = byPhone.id;
    }

    // 2. If client does not exist, create it
    if (!clientId) {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({
          organization_id: orgId,
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          dni: ownerDni,
          address: ownerAddress
        })
        .select()
        .single();

      if (clientErr || !newClient) {
        console.error("PublicBooking: failed to create client:", clientErr);
        return { error: `Error al registrar sus datos: ${clientErr?.message}` };
      }
      clientId = newClient.id;
    }

    // 3. Check if pet already exists for this client
    let petId: string | null = null;
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
      // Create new pet record
      const { data: newPet, error: petErr } = await supabase
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

      if (petErr || !newPet) {
        console.error("PublicBooking: failed to create pet:", petErr);
        return { error: `Error al registrar datos de la mascota: ${petErr?.message}` };
      }
      petId = newPet.id;
    }

    // 4. Register Scheduled Appointment (Mapped to Scheduled)
    const { error: apptErr } = await supabase
      .from('appointments')
      .insert({
        organization_id: orgId,
        pet_id: petId,
        date,
        time,
        type,
        status: 'Scheduled',
        veterinarian: 'Recepcionista (Reserva Pública)',
        notes: notes || 'Reserva online de cliente'
      });

    if (apptErr) {
      console.error("PublicBooking: failed to create appointment:", apptErr);
      return { error: `Error al agendar la cita: ${apptErr.message}` };
    }

    // Revalidate paths for dashboard
    revalidatePath('/appointments');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, clinicName: org.name };
  } catch (err: any) {
    console.error("PublicBooking unexpected error:", err);
    return { error: err.message || 'Ocurrió un error inesperado al procesar su reserva.' };
  }
}
