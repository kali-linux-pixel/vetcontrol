import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/src/lib/supabase';
import { redirect } from 'next/navigation';
import ChatClient from './chat-client';
import { getProfileOrEnsure } from '@/lib/auth-utils';

export const metadata: Metadata = {
  title: 'Bandeja de Entrada - Conversaciones Realtime',
  description: 'Bandeja de entrada conversacional multi-inquilino para veterinarias en tiempo real.',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let clinicId = '';
  try {
    const { profile } = await getProfileOrEnsure();
    if (profile) {
      clinicId = profile.organization_id;
    }
  } catch (err) {
    console.error('Error fetching profile for Chat Page:', err);
  }

  if (!clinicId) {
    return (
      <div className="p-6 bg-white rounded-xl border border-neutral-100 shadow-2xs text-center text-xs text-rose-650 font-semibold">
        Error: No se pudo identificar la clínica asociada a este perfil.
      </div>
    );
  }

  return <ChatClient clinicId={clinicId} />;
}
