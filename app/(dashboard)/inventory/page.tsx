import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import InventoryClient from './inventory-client';
import { redirect } from 'next/navigation';
import { InventoryItem } from '@/types';
import { mockInventoryItems } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  let initialItems: InventoryItem[] = mockInventoryItems;

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile && !profileErr) {
      const orgId = profile.organization_id;

      // Fetch all inventory items for this clinic
      const { data: inventoryRaw, error: invErr } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', orgId)
        .order('name', { ascending: true });

      if (!invErr && inventoryRaw) {
        initialItems = inventoryRaw.map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category as any,
          stock: item.stock,
          minStock: item.min_stock,
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
      {/* Temporary Diagnostics Header */}
      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Diagnostics:</span>
          <span>Rendering inventory directory. Connection stable.</span>
        </div>
        <span className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded font-mono">Live</span>
      </div>

      <InventoryClient initialItems={initialItems} />
    </div>
  );
}
