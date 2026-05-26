import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import SalesClient from './sales-client';
import { redirect } from 'next/navigation';

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

  // Query invoices from sales database
  const { data: salesRaw } = await supabase
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

  const initialInvoices = (salesRaw || []).map((sale: any) => ({
    id: `inv-${sale.id.substring(0, 4).toLowerCase()}`,
    clientName: sale.clients?.name || 'Walk-in Client',
    petName: sale.pets?.name || 'Patient',
    amount: Number(sale.amount),
    date: sale.date,
    status: sale.status as any,
    itemDescription: sale.item_description,
  }));

  return <SalesClient initialInvoices={initialInvoices} />;
}
