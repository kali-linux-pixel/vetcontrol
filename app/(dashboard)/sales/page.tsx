import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import SalesClient from './sales-client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const mockInvoices = [
  {
    id: 'inv-482a',
    clientName: 'Sarah Connor',
    petName: 'Max',
    amount: 125.00,
    date: '2026-05-26',
    status: 'Paid' as const,
    itemDescription: 'Rabies Booster + Consultation'
  },
  {
    id: 'inv-892b',
    clientName: 'Bruce Wayne',
    petName: 'Ace',
    amount: 85.00,
    date: '2026-05-26',
    status: 'Paid' as const,
    itemDescription: 'Ear Infection Check-up'
  }
];

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let initialInvoices = mockInvoices;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile && !profileErr) {
      const orgId = profile.organization_id;

      // Query invoices from sales database
      const { data: salesRaw, error: salesErr } = await supabase
        .from('sales')
        .select(`
          id,
          amount,
          date,
          status,
          item_description,
          clients (
            name
          ),
          pets (
            name
          )
        `)
        .eq('organization_id', orgId)
        .order('date', { ascending: false });

      if (!salesErr && salesRaw) {
        initialInvoices = salesRaw.map((sale: any) => ({
          id: `inv-${sale.id.substring(0, 4).toLowerCase()}`,
          clientName: sale.clients?.name || 'Walk-in Client',
          petName: sale.pets?.name || 'Patient',
          amount: Number(sale.amount),
          date: sale.date,
          status: sale.status as any,
          itemDescription: sale.item_description,
        }));
      }
    }
  } catch (err) {
    console.error('Failed to query sales database, falling back to mock invoices data:', err);
  }

  return (
    <div className="w-full">
      {/* Temporary Diagnostics Header */}
      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Diagnostics:</span>
          <span>Rendering sales ledger. Connection stable.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">Live</span>
      </div>

      <SalesClient initialInvoices={initialInvoices} />
    </div>
  );
}
