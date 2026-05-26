import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import ClientsClient from './clients-client';
import { redirect } from 'next/navigation';
import { Client } from '@/types';

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

  // Fetch clients and count active pets via join queries
  const { data: clientsRaw } = await supabase
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

  const initialClients: Client[] = (clientsRaw || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    joinedDate: c.joined_date,
    petsCount: c.pets?.length || 0,
  }));

  return <ClientsClient initialClients={initialClients} />;
}
