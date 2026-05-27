import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import InventoryClient from './inventory-client';
import { redirect } from 'next/navigation';
import { InventoryItem } from '@/types';
import { mockInventoryItems } from '@/lib/mock-data';
import { db } from '@/lib/db';
import { inventoryItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let initialItems: InventoryItem[] = mockInventoryItems;

  try {
    const { getProfileOrEnsure } = await import('@/lib/auth-utils');
    const { profile } = await getProfileOrEnsure();

    if (profile) {
      const orgId = profile.organization_id;

      // Fetch all inventory items using Drizzle ORM
      const dbItems = await db.select()
        .from(inventoryItems)
        .where(eq(inventoryItems.organizationId, orgId))
        .orderBy(inventoryItems.name);

      if (dbItems) {
        initialItems = dbItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category as any,
          stock: item.stock,
          minStock: item.minStock,
          unit: item.unit,
          price: Number(item.price),
        }));
      }
    }
  } catch (err) {
    console.error('Failed to query inventory database, falling back to mock inventory data:', err);
  }

  return (
    <div className="w-full">
      <InventoryClient initialItems={initialItems} />
    </div>
  );
}
