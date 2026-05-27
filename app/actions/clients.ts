'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';
import { getProfileOrEnsure } from '@/lib/auth-utils';

// Helper to retrieve organization ID of current user
async function getOrgId(supabase: any) {
  try {
    const { profile } = await getProfileOrEnsure();
    return profile.organization_id;
  } catch (err: any) {
    throw new Error(`Configuración de perfil de usuario faltante: ${err.message}`);
  }
}

export async function searchClients(query: string) {
  try {
    if (!query || query.trim() === '') {
      return { clients: [] };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);
    const searchQuery = `%${query.trim().toLowerCase()}%`;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
    
    let queryBuilder = supabase
      .from('clients')
      .select('id, name, email, phone, dni, address')
      .eq('organization_id', orgId);

    if (isUuid) {
      queryBuilder = queryBuilder.eq('id', query.trim());
    } else {
      queryBuilder = queryBuilder.or(`name.ilike.${searchQuery},phone.ilike.${searchQuery},dni.ilike.${searchQuery}`);
    }

    const { data: matchedClients, error } = await queryBuilder.limit(8);

    if (error) {
      console.error("Error searching clients:", error);
      return { error: error.message };
    }

    // Fetch related pets for each matched client
    const clientsWithPets = await Promise.all((matchedClients || []).map(async (client: any) => {
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species, breed, age, sex, weight')
        .eq('client_id', client.id)
        .eq('organization_id', orgId);

      return {
        ...client,
        pets: petsData || []
      };
    }));

    return { clients: clientsWithPets };
  } catch (err: any) {
    console.error("searchClients unexpected error:", err);
    return { error: err.message || 'Ocurrió un error inesperado al buscar clientes.' };
  }
}

export async function createClient(state: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string;
    const dni = formData.get('dni') as string || null;
    const address = formData.get('address') as string || null;

    if (!name || !phone) {
      return { error: 'El nombre y el celular/teléfono son obligatorios.' };
    }

    // DNI Peru Validation: 8 digits, numbers only
    if (dni) {
      const cleanDni = dni.trim();
      if (!/^\d+$/.test(cleanDni)) {
        return { error: 'El DNI debe contener solo números.' };
      }
      if (cleanDni.length !== 8) {
        return { error: 'El DNI debe tener exactamente 8 dígitos para Perú.' };
      }
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    // Prevent duplicates by checking DNI or Phone in organization
    let existingClient: any = null;
    if (dni) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', orgId)
        .eq('dni', dni.trim())
        .maybeSingle();
      existingClient = data;
    }
    if (!existingClient && phone) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', orgId)
        .eq('phone', phone.trim())
        .maybeSingle();
      existingClient = data;
    }

    if (existingClient) {
      console.log(`[createClient] Cliente existente detectado (${existingClient.id}). Reutilizando en vez de duplicar.`);
      return { 
        success: true, 
        client: existingClient, 
        message: 'Cliente existente reutilizado (mismo DNI o celular).' 
      };
    }

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        organization_id: orgId,
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone.trim(),
        dni: dni ? dni.trim() : null,
        address: address ? address.trim() : null,
      })
      .select()
      .single();

    if (error) {
      return { error: `Error al registrar cliente: ${error.message}` };
    }

    revalidatePath('/clients');
    revalidatePath('/');
    return { success: true, client: newClient };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}

export async function updateClient(id: string, state: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string || null;
    const phone = formData.get('phone') as string;
    const dni = formData.get('dni') as string || null;
    const address = formData.get('address') as string || null;

    if (!name || !phone) {
      return { error: 'El nombre y el celular/teléfono son obligatorios.' };
    }

    // DNI Peru Validation: 8 digits, numbers only
    if (dni) {
      const cleanDni = dni.trim();
      if (!/^\d+$/.test(cleanDni)) {
        return { error: 'El DNI debe contener solo números.' };
      }
      if (cleanDni.length !== 8) {
        return { error: 'El DNI debe tener exactamente 8 dígitos para Perú.' };
      }
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);

    // Prevent DNI or phone duplication with another client profile during updates
    if (dni) {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', orgId)
        .eq('dni', dni.trim())
        .neq('id', id)
        .maybeSingle();
      if (data) {
        return { error: 'Ya existe otro cliente registrado con este número de DNI.' };
      }
    }
    if (phone) {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', orgId)
        .eq('phone', phone.trim())
        .neq('id', id)
        .maybeSingle();
      if (data) {
        return { error: 'Ya existe otro cliente registrado con este número de celular.' };
      }
    }

    const { error } = await supabase
      .from('clients')
      .update({ 
        name: name.trim(), 
        email: email ? email.trim() : null, 
        phone: phone.trim(), 
        dni: dni ? dni.trim() : null, 
        address: address ? address.trim() : null 
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      return { error: `Error al actualizar cliente: ${error.message}` };
    }

    revalidatePath('/clients');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
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
      return { error: `Error al eliminar cliente: ${error.message}` };
    }

    revalidatePath('/clients');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Ocurrió un error inesperado.' };
  }
}

export async function globalSearch(query: string) {
  try {
    if (!query || query.trim() === '') {
      return { clients: [], pets: [] };
    }

    const supabase = await createServerClient();
    const orgId = await getOrgId(supabase);
    const searchQuery = `%${query.trim().toLowerCase()}%`;

    // 1. Search clients (limit to 5)
    const { data: matchedClients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, phone, dni, address')
      .eq('organization_id', orgId)
      .or(`name.ilike.${searchQuery},phone.ilike.${searchQuery},dni.ilike.${searchQuery}`)
      .limit(5);

    if (clientError) {
      console.error("GlobalSearch client error:", clientError);
    }

    // Fetch related pets for matched clients
    const clientsWithPets = await Promise.all((matchedClients || []).map(async (client: any) => {
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, name, species, breed')
        .eq('client_id', client.id)
        .eq('organization_id', orgId);

      return {
        ...client,
        pets: petsData || []
      };
    }));

    // 2. Search pets by name, breed, or species (limit to 5)
    const { data: matchedPets, error: petError } = await supabase
      .from('pets')
      .select(`
        id,
        name,
        species,
        breed,
        age,
        sex,
        weight,
        client_id,
        clients (
          id,
          name,
          phone,
          dni
        )
      `)
      .eq('organization_id', orgId)
      .or(`name.ilike.${searchQuery},breed.ilike.${searchQuery},species.ilike.${searchQuery}`)
      .limit(5);

    if (petError) {
      console.error("GlobalSearch pet error:", petError);
    }

    // Format pets correctly
    const petsFormatted = (matchedPets || []).map((pet: any) => {
      const client = Array.isArray(pet.clients) ? pet.clients[0] : pet.clients;
      return {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.age,
        sex: pet.sex,
        weight: pet.weight,
        clientId: pet.client_id,
        clientName: client?.name || 'Desconocido',
        clientPhone: client?.phone || '',
        clientDni: client?.dni || ''
      };
    });

    return {
      clients: clientsWithPets,
      pets: petsFormatted
    };
  } catch (err: any) {
    console.error("GlobalSearch unexpected error:", err);
    return { error: err.message || 'Ocurrió un error inesperado al buscar.' };
  }
}
