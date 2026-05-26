import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import PetsClient from './pets-client';
import { redirect } from 'next/navigation';
import { Pet } from '@/types';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const orgId = profile.organization_id;

  // 1. Fetch pets with owner names using relation join
  const { data: petsRaw } = await supabase
    .from('pets')
    .select(`
      id,
      name,
      species,
      breed,
      age,
      avatar_url,
      last_visit,
      client_id,
      clients (
        name
      )
    `)
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  // 2. Fetch clients to select owners in modal
  const { data: clientsRaw } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  const initialPets: Pet[] = (petsRaw || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    species: p.species as any,
    breed: p.breed,
    age: p.age,
    ownerName: p.clients?.name || 'Unknown',
    ownerId: p.client_id,
    avatar: p.avatar_url || undefined,
    lastVisit: p.last_visit || undefined,
  }));

  const clientsList = (clientsRaw || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }));

  return <PetsClient initialPets={initialPets} clientsList={clientsList} />;
}
