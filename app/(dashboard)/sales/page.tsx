import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import SalesClient from './sales-client';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { sales, clients, pets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const mockInvoices = [
  {
    id: 'inv-mock-1',
    clientName: 'Sarah Connor',
    petName: 'Max',
    amount: 125.00,
    date: '2026-05-26',
    status: 'Paid' as const,
    itemDescription: 'Rabies Booster + Consultation'
  },
  {
    id: 'inv-mock-2',
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
  let clientList: { id: string; name: string }[] = [];
  let petList: { id: string; name: string; clientId: string }[] = [];

  try {
    const { getProfileOrEnsure } = await import('@/lib/auth-utils');
    const { profile } = await getProfileOrEnsure();

    if (profile) {
      const orgId = profile.organization_id;

      // 1. Query invoices from sales database using Drizzle
      const dbInvoices = await db.select({
        id: sales.id,
        amount: sales.amount,
        date: sales.date,
        status: sales.status,
        itemDescription: sales.itemDescription,
        clientName: clients.name,
        petName: pets.name,
      })
      .from(sales)
      .leftJoin(clients, eq(sales.clientId, clients.id))
      .leftJoin(pets, eq(sales.petId, pets.id))
      .where(eq(sales.organizationId, orgId))
      .orderBy(sales.date);

      if (dbInvoices) {
        initialInvoices = dbInvoices.map((sale: any) => ({
          id: sale.id,
          clientName: sale.clientName || 'Walk-in Client',
          petName: sale.petName || 'Patient',
          amount: Number(sale.amount),
          date: sale.date,
          status: sale.status as any,
          itemDescription: sale.itemDescription,
        }));
      }

      // 2. Query clients list using Drizzle
      const dbClients = await db.select({
        id: clients.id,
        name: clients.name
      })
      .from(clients)
      .where(eq(clients.organizationId, orgId))
      .orderBy(clients.name);

      if (dbClients) {
        clientList = dbClients;
      }

      // 3. Query pets list using Drizzle
      const dbPets = await db.select({
        id: pets.id,
        name: pets.name,
        clientId: pets.clientId
      })
      .from(pets)
      .where(eq(pets.organizationId, orgId))
      .orderBy(pets.name);

      if (dbPets) {
        petList = dbPets;
      }
    }
  } catch (err) {
    console.error('Failed to query sales database, falling back to mock invoices data:', err);
  }

  return (
    <div className="w-full">
      <SalesClient 
        initialInvoices={initialInvoices} 
        clients={clientList} 
        pets={petList} 
      />
    </div>
  );
}
