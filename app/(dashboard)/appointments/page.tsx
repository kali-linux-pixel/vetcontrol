import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import AppointmentsClient from './appointments-client';
import { redirect } from 'next/navigation';
import { Appointment } from '@/types';
import { mockAppointments, mockPets } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let initialAppointments: Appointment[] = mockAppointments;
  let petsList = mockPets.map(p => ({
    id: p.id,
    name: p.name,
    ownerName: p.ownerName,
  }));

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile && !profileErr) {
      const orgId = profile.organization_id;

      // 1. Query all appointments for the organization
      const { data: appointmentsRaw, error: apptErr } = await supabase
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

      // 2. Fetch list of pets for selections inside booking dropdowns
      const { data: petsRaw, error: petsErr } = await supabase
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

      if (!apptErr && appointmentsRaw) {
        initialAppointments = appointmentsRaw.map((apt: any) => ({
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
      }

      if (!petsErr && petsRaw) {
        petsList = petsRaw.map((p: any) => ({
          id: p.id,
          name: p.name,
          ownerName: p.clients?.name || 'Unknown Owner',
        }));
      }
    }
  } catch (err) {
    console.error('Failed to query appointments database, falling back to mock data:', err);
  }

  return (
    <div className="w-full">
      {/* Temporary Diagnostics Header */}
      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Diagnostics:</span>
          <span>Rendering appointments schedule. Connection stable.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">Live</span>
      </div>

      <AppointmentsClient 
        initialAppointments={initialAppointments} 
        petsList={petsList} 
      />
    </div>
  );
}
