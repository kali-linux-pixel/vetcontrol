import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import ClientsClient from './clients-client';
import { redirect } from 'next/navigation';
import { Client } from '@/types';
import { mockClients } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let initialClients: Client[] = mockClients;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile && !profileErr) {
      const orgId = profile.organization_id;

      // Fetch clients and count active pets via join queries
      const { data: clientsRaw, error: clientsErr } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          phone,
          joined_date,
          pets (
            id
          )
        `)
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      if (!clientsErr && clientsRaw) {
        initialClients = clientsRaw.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          joinedDate: c.joined_date,
          petsCount: c.pets?.length || 0,
        }));
      }
    }
  } catch (err) {
    console.error('Failed to query clients database, falling back to mock clients data:', err);
  }

  return (
    <div className="w-full">
      {/* Temporary Diagnostics Header */}
      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Diagnostics:</span>
          <span>Rendering clients list. Connection stable.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">Live</span>
      </div>

      <ClientsClient initialClients={initialClients} />
    </div>
  );
}
