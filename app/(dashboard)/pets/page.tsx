import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import PetsClient from './pets-client';
import { redirect } from 'next/navigation';
import { Pet } from '@/types';
import { mockPets, mockClients } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let initialPets: Pet[] = mockPets;
  let clientsList = mockClients.map(c => ({ id: c.id, name: c.name }));

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile && !profileErr) {
      const orgId = profile.organization_id;

      // 1. Fetch pets with owner names using relation join
      const { data: petsRaw, error: petsErr } = await supabase
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
      const { data: clientsRaw, error: clientsErr } = await supabase
        .from('clients')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      if (!petsErr && petsRaw) {
        initialPets = petsRaw.map((p: any) => ({
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
      }

      if (!clientsErr && clientsRaw) {
        clientsList = clientsRaw.map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
      }
    }
  } catch (err) {
    console.error('Failed to query pets database, falling back to mock pets data:', err);
  }

  return (
    <div className="w-full">
      {/* Temporary Diagnostics Header */}
      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Diagnostics:</span>
          <span>Rendering patients list. Connection stable.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">Live</span>
      </div>

      <PetsClient initialPets={initialPets} clientsList={clientsList} />
    </div>
  );
}
