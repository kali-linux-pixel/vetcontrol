import React from 'react';
import { createServerClient } from '@/src/lib/supabase';
import InventoryClient from './inventory-client';
import { redirect } from 'next/navigation';
import { InventoryItem } from '@/types';

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

  // Fetch all inventory items for this clinic
  const { data: inventoryRaw } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  const initialItems: InventoryItem[] = (inventoryRaw || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category as any,
    stock: item.stock,
    minStock: item.min_stock,
    unit: item.unit,
    price: Number(item.price),
  }));

  return <InventoryClient initialItems={initialItems} />;
}
