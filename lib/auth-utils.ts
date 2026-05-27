import { createServerClient } from '@/src/lib/supabase';

/**
 * Ensures that the authenticated user has a profile and organization record.
 * If either is missing, it will automatically recreate it (with seeding data if new org is created).
 */
export async function ensureUserProfile(user: any) {
  const supabase = await createServerClient();

  // 1. Try to fetch the profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    // Profile exists. Let's check if the associated organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', profile.organization_id)
      .single();

    if (org) {
      // Both profile and organization exist, we are good!
      console.log(`Profile and organization already verified for user ${user.id}`);
      return profile;
    }
    console.warn(`Organization ${profile.organization_id} referenced by profile ${profile.id} is missing. Recreating...`);
  }

  console.log(`User profile or organization missing for user ${user.id}. Provisioning...`);

  // Extract metadata details passed from signup/auth
  const clinicName = user.user_metadata?.clinic_name || 'My Vet Clinic';
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Doctor';

  // 2. Create organization
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: clinicName,
      subscription_plan: 'free_trial',
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();

  if (orgError || !orgData) {
    console.error("ensureUserProfile: Failed to create organization:", orgError);
    throw new Error(`Failed to create organization: ${orgError ? orgError.message : 'Unknown error'}`);
  }

  const orgId = orgData.id;

  // 3. Create or update profile
  const { data: newProfile, error: profileUpsertError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      organization_id: orgId,
      email: user.email!,
      full_name: fullName,
      role: 'veterinarian'
    })
    .select()
    .single();

  if (profileUpsertError || !newProfile) {
    console.error("ensureUserProfile: Failed to create profile:", profileUpsertError);
    throw new Error(`Failed to create profile: ${profileUpsertError ? profileUpsertError.message : 'Unknown error'}`);
  }

  // 4. Seed onboarding data since organization was just created
  console.log(`Seeding onboarding data for organization ${orgId}...`);
  try {
    // 4a. Seed clients (Peruvian mock data)
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([
        { organization_id: orgId, name: 'Carlos Mendoza', email: 'carlos.m@mail.com', phone: '987654321', dni: '45829104', address: 'Av. Larco 456, Miraflores, Lima' },
        { organization_id: orgId, name: 'María Rodríguez', email: 'maria.r@mail.com', phone: '912345678', dni: '10928374', address: 'Jr. Junín 123, Trujillo' }
      ])
      .select();

    if (clientError || !clientData || clientData.length < 2) {
      console.warn("Seeding warning: failed to insert clients properly:", clientError);
    } else {
      const carlos = clientData.find(c => c.name === 'Carlos Mendoza');
      const maria = clientData.find(c => c.name === 'María Rodríguez');

      if (carlos && maria) {
        // 4b. Seed pets
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .insert([
            { organization_id: orgId, client_id: carlos.id, name: 'Kobu', species: 'dog', breed: 'Golden Retriever', age: '2 años', sex: 'Macho', weight: '28.4 kg' },
            { organization_id: orgId, client_id: maria.id, name: 'Michi', species: 'cat', breed: 'Siamés', age: '1 año', sex: 'Hembra', weight: '4.1 kg' }
          ])
          .select();

        if (petError || !petData || petData.length < 2) {
          console.warn("Seeding warning: failed to insert pets properly:", petError);
        } else {
          const kobuPet = petData.find(p => p.name === 'Kobu');
          const michiPet = petData.find(p => p.name === 'Michi');

          if (kobuPet && michiPet) {
            const todayStr = new Date().toISOString().split('T')[0];
            
            // 4c. Seed appointments (in Spanish)
            const { error: apptError } = await supabase
              .from('appointments')
              .insert([
                { organization_id: orgId, pet_id: kobuPet.id, date: todayStr, time: '09:00 AM', type: 'Consulta', status: 'Checked-in', veterinarian: fullName },
                { organization_id: orgId, pet_id: michiPet.id, date: todayStr, time: '01:15 PM', type: 'Vacunación', status: 'Scheduled', veterinarian: fullName }
              ]);

            if (apptError) {
              console.warn("Seeding warning: failed to insert appointments:", apptError);
            }

            // 4d. Seed clinical records (new table!)
            const { error: clinicalError } = await supabase
              .from('clinical_records')
              .insert([
                {
                  organization_id: orgId,
                  pet_id: kobuPet.id,
                  weight: '28.4 kg',
                  allergies: 'Ninguna',
                  diseases: 'Ninguna',
                  vaccines: 'Quíntuple (Anual), Rabia (Vigente)',
                  operations: 'Castración (2025)',
                  medicaments: 'Antipulgas NexGard',
                  notes: 'Paciente sano, excelente musculatura, peso ideal. Vacunas al día.'
                },
                {
                  organization_id: orgId,
                  pet_id: michiPet.id,
                  weight: '4.1 kg',
                  allergies: 'Sensibilidad al pollo comercial',
                  diseases: 'Ninguna',
                  vaccines: 'Triple Felina, Rabia (Pendiente refuerzo)',
                  operations: 'Esterilización (2025)',
                  medicaments: 'Desparasitante interno en gotas Profender',
                  notes: 'Presentó leve enrojecimiento dérmico por sensibilidad alimentaria. Se recomendó dieta hipoalergénica.'
                }
              ]);

            if (clinicalError) {
              console.warn("Seeding warning: failed to insert clinical records:", clinicalError);
            }

            // 4e. Seed sales (in Spanish)
            const { error: salesError } = await supabase
              .from('sales')
              .insert([
                { organization_id: orgId, client_id: carlos.id, pet_id: kobuPet.id, amount: 125.00, date: todayStr, status: 'Paid', item_description: 'Vacuna Rabia + Consulta General' },
                { organization_id: orgId, client_id: maria.id, pet_id: michiPet.id, amount: 85.00, date: todayStr, status: 'Paid', item_description: 'Desparasitación Triple Felina' }
              ]);

            if (salesError) {
              console.warn("Seeding warning: failed to insert sales:", salesError);
            }
          }
        }
      }
    }

    // 4f. Seed inventory items (in Spanish)
    const { error: invError } = await supabase
      .from('inventory_items')
      .insert([
        { organization_id: orgId, name: 'Amoxicilina 250mg Tabletas', sku: 'MED-AMX-250', category: 'medicamento', stock: 120, min_stock: 200, unit: 'tabletas', price: 0.85 },
        { organization_id: orgId, name: 'Vacuna Rabia (Defensor 3)', sku: 'VAC-RAB-DEF', category: 'medicamento', stock: 14, min_stock: 50, unit: 'frascos', price: 15.00 },
        { organization_id: orgId, name: 'Jeringas Descartables 3ml', sku: 'SUP-SYR-3ML', category: 'insumos', stock: 850, min_stock: 300, unit: 'unidades', price: 0.12 }
      ]);

    if (invError) {
      console.warn("Seeding warning: failed to insert inventory items:", invError);
    }

    console.log("Successfully completed seeding onboarding data.");
  } catch (seedErr) {
    console.error("An error occurred during onboarding database seeding:", seedErr);
  }

  return newProfile;
}

/**
 * Retrieves the user profile and corresponding organization ID.
 * If the profile is missing, it runs the fallback creation logic to self-heal.
 */
export async function getProfileOrEnsure() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Unauthenticated user.');
  }

  // Check if profile exists
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile && !profileErr) {
    // Check if organization exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', profile.organization_id)
      .single();

    if (org) {
      return { user, profile };
    }
  }

  // Fallback to auto-creation if profile or organization is missing
  const newProfile = await ensureUserProfile(user);
  return { user, profile: newProfile };
}
