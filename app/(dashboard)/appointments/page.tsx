import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import AppointmentsClient from './appointments-client';
import { redirect } from 'next/navigation';
import { Appointment } from '@/types';

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

  // 1. Query all appointments for the organization
  const { data: appointmentsRaw } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      time,
      type,
      status,
      veterinarian,
      notes,
      pets (
        id,
        name,
        species,
        clients (
          name
        )
      )
    `)
    .eq('organization_id', orgId)
    .order('date', { ascending: false })
    .order('time', { ascending: true });

  const initialAppointments: Appointment[] = (appointmentsRaw || []).map((apt: any) => ({
    id: apt.id,
    petName: apt.pets?.name || 'Unknown Patient',
    petSpecies: (apt.pets?.species as any) || 'other',
    ownerName: apt.pets?.clients?.name || 'Unknown Owner',
    date: apt.date,
    time: apt.time,
    type: apt.type as any,
    status: apt.status as any,
    veterinarian: apt.veterinarian,
    notes: apt.notes || undefined,
  }));

  // 2. Fetch list of pets for selections inside booking dropdowns
  const { data: petsRaw } = await supabase
    .from('pets')
    .select(`
      id,
      name,
      clients (
        name
      )
    `)
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  const petsList = (petsRaw || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    ownerName: p.clients?.name || 'Unknown Owner',
  }));

  return (
    <AppointmentsClient 
      initialAppointments={initialAppointments} 
      petsList={petsList} 
    />
  );
}
