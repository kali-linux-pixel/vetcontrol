import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import SettingsClient from './settings-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single();

  return (
    <SettingsClient
      initialFullName={profile.full_name || 'Dr. E. Blackwell'}
      initialClinicName={org?.name || 'VetControl Downtown'}
      initialEmail={profile.email}
    />
  );
}
