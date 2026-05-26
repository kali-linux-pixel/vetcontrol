'use server';

import { createServerClient } from '@/src/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function restockInventoryItem(id: string, amount: number) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthenticated user.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.organization_id) throw new Error('Profile config missing.');

    const orgId = profile.organization_id;

    // Fetch active item stock
    const { data: item, error: fetchErr } = await supabase
      .from('inventory_items')
      .select('stock')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !item) {
      return { error: 'Inventory product not found.' };
    }

    const newStock = item.stock + amount;

    // Update in database
    const { error: updateErr } = await supabase
      .from('inventory_items')
      .update({ stock: newStock })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (updateErr) {
      return { error: `Failed to restock: ${updateErr.message}` };
    }

    revalidatePath('/inventory');
    revalidatePath('/');
    return { success: true, newStock };
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' };
  }
}
