'use server';

import { db } from '@/lib/db';
import { inventoryItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getProfileOrEnsure } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

// Helper de validación de UUID
function isValidUUID(val: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

// Normalización de categoría a minúsculas en español
function normalizeCategory(val: string): string {
  if (!val) return 'medicamento';
  const norm = val.trim().toLowerCase();
  if (norm === 'food' || norm === 'comida') return 'comida';
  if (norm === 'medication' || norm === 'medicamento' || norm === 'medicamentos') return 'medicamento';
  if (norm === 'equipment' || norm === 'equipamiento' || norm === 'equipos') return 'equipamiento';
  if (norm === 'supplies' || norm === 'insumos') return 'insumos';
  return norm;
}

// Normalización de unidad a minúsculas en español
function normalizeUnit(val: string): string {
  if (!val) return 'unidades';
  const norm = val.trim().toLowerCase();
  if (norm === 'tablets' || norm === 'tabletas') return 'tabletas';
  if (norm === 'vials' || norm === 'frascos' || norm === 'ampollas') return 'frascos';
  if (norm === 'pieces' || norm === 'piezas' || norm === 'unidades') return 'unidades';
  return norm;
}

export async function restockInventoryItem(id: string, amount: number) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    if (!id || !isValidUUID(id)) {
      console.warn("restockInventoryItem: UUID de producto no válido:", id);
      return { error: 'Selección de producto no válida.' };
    }

    if (isNaN(amount) || amount <= 0) {
      console.warn("restockInventoryItem: Cantidad de reabastecimiento no válida:", amount);
      return { error: 'La cantidad de reabastecimiento debe ser un número entero positivo.' };
    }

    // Obtener stock actual
    const items = await db.select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.organizationId, orgId)
        )
      );

    const item = items[0];
    if (!item) {
      return { error: 'Producto no encontrado en el inventario.' };
    }

    const newStock = item.stock + Math.floor(amount);

    console.log(`restockInventoryItem: Reabasteciendo producto ${id} de ${item.stock} a ${newStock}`);

    // Actualizar en base de datos
    await db.update(inventoryItems)
      .set({ stock: newStock })
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.organizationId, orgId)
        )
      );

    revalidatePath('/inventory');
    revalidatePath('/');
    return { success: true, newStock };
  } catch (err: any) {
    console.error("Error en restockInventoryItem:", err);
    return { error: err.message || 'Ocurrió un error inesperado al reabastecer el producto.' };
  }
}

export async function updateInventoryStock(id: string, amount: number) {
  return restockInventoryItem(id, amount);
}

export async function createInventoryItem(state: any, formData: FormData) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const categoryRaw = formData.get('category') as string;
    const stockRaw = formData.get('stock') as string;
    const minStockRaw = formData.get('minStock') as string;
    const unitRaw = formData.get('unit') as string;
    const priceRaw = formData.get('price') as string;

    // 1. Validación y Sanitización
    if (!name || name.trim() === '') {
      return { error: 'El nombre del producto es obligatorio.' };
    }
    if (!sku || sku.trim() === '') {
      return { error: 'El código SKU es obligatorio.' };
    }
    if (!categoryRaw) {
      return { error: 'La selección de categoría es obligatoria.' };
    }
    if (!unitRaw || unitRaw.trim() === '') {
      return { error: 'El tipo de unidad es obligatorio.' };
    }

    const category = normalizeCategory(categoryRaw);
    const unit = normalizeUnit(unitRaw);

    const allowedCategories = ['medicamento', 'comida', 'equipamiento', 'insumos', 'Medication', 'Food', 'Equipment', 'Supplies'];
    if (!allowedCategories.includes(category)) {
      return { error: 'Categoría de producto no válida.' };
    }

    const stock = parseInt(stockRaw || '0', 10);
    const minStock = parseInt(minStockRaw || '0', 10);
    const price = parseFloat(priceRaw || '0');

    if (isNaN(stock) || stock < 0) {
      return { error: 'El stock inicial debe ser un número entero no negativo.' };
    }
    if (isNaN(minStock) || minStock < 0) {
      return { error: 'El nivel de stock mínimo debe ser un número entero no negativo.' };
    }
    if (isNaN(price) || price < 0) {
      return { error: 'El precio debe ser un número decimal no negativo.' };
    }

    console.log(`createInventoryItem: Insertando producto name=${name}, sku=${sku}, stock=${stock}, price=${price.toFixed(2)}`);

    await db.insert(inventoryItems).values({
      organizationId: orgId,
      name: name.trim(),
      sku: sku.trim(),
      category,
      stock,
      minStock,
      unit,
      price: price.toFixed(2),
    });

    revalidatePath('/inventory');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error("Error en createInventoryItem:", err);
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return { error: 'Ya existe un producto con este SKU en el inventario.' };
    }
    if (err.message?.includes('chk_inventory_category')) {
      return { error: 'Fallo de restricción de base de datos. Por favor ejecute: node scratch/alter_constraints.js' };
    }
    return { error: err.message || 'Ocurrió un error inesperado al registrar el producto.' };
  }
}

export async function updateInventoryItem(id: string, state: any, formData: FormData) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    if (!id || !isValidUUID(id)) {
      return { error: 'ID de producto no válido.' };
    }

    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const categoryRaw = formData.get('category') as string;
    const stockRaw = formData.get('stock') as string;
    const minStockRaw = formData.get('minStock') as string;
    const unitRaw = formData.get('unit') as string;
    const priceRaw = formData.get('price') as string;

    // 1. Validación y Sanitización
    if (!name || name.trim() === '') {
      return { error: 'El nombre del producto es obligatorio.' };
    }
    if (!sku || sku.trim() === '') {
      return { error: 'El código SKU es obligatorio.' };
    }
    if (!categoryRaw) {
      return { error: 'La selección de categoría es obligatoria.' };
    }
    if (!unitRaw || unitRaw.trim() === '') {
      return { error: 'El tipo de unidad es obligatorio.' };
    }

    const category = normalizeCategory(categoryRaw);
    const unit = normalizeUnit(unitRaw);

    const allowedCategories = ['medicamento', 'comida', 'equipamiento', 'insumos', 'Medication', 'Food', 'Equipment', 'Supplies'];
    if (!allowedCategories.includes(category)) {
      return { error: 'Categoría de producto no válida.' };
    }

    const stock = parseInt(stockRaw || '0', 10);
    const minStock = parseInt(minStockRaw || '0', 10);
    const price = parseFloat(priceRaw || '0');

    if (isNaN(stock) || stock < 0) {
      return { error: 'El nivel de stock debe ser un número entero no negativo.' };
    }
    if (isNaN(minStock) || minStock < 0) {
      return { error: 'El nivel de stock mínimo debe ser un número entero no negativo.' };
    }
    if (isNaN(price) || price < 0) {
      return { error: 'El precio debe ser un número decimal no negativo.' };
    }

    console.log(`updateInventoryItem: Actualizando producto ID=${id}`);

    await db.update(inventoryItems)
      .set({
        name: name.trim(),
        sku: sku.trim(),
        category,
        stock,
        minStock,
        unit,
        price: price.toFixed(2),
      })
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.organizationId, orgId)
        )
      );

    revalidatePath('/inventory');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error("Error en updateInventoryItem:", err);
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return { error: 'Otro producto ya está usando este SKU.' };
    }
    return { error: err.message || 'Ocurrió un error inesperado al actualizar el producto.' };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    if (!id || !isValidUUID(id)) {
      return { error: 'ID de producto no válido.' };
    }

    console.log(`deleteInventoryItem: Eliminando producto ID=${id}`);

    await db.delete(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, id),
          eq(inventoryItems.organizationId, orgId)
        )
      );

    revalidatePath('/inventory');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteInventoryItem:", err);
    return { error: err.message || 'Ocurrió un error inesperado al eliminar el producto.' };
  }
}

export async function exportInventoryCSV() {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const items = await db.select()
      .from(inventoryItems)
      .where(eq(inventoryItems.organizationId, orgId))
      .orderBy(inventoryItems.name);

    // Generar cabeceras y contenido en español
    const headers = ['Nombre', 'SKU', 'Categoria', 'Nivel de Stock', 'Stock Minimo', 'Unidad', 'Precio'];
    const rows = items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.sku.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.stock,
      item.minStock,
      `"${item.unit.replace(/"/g, '""')}"`,
      parseFloat(item.price).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return { success: true, csv: csvContent };
  } catch (err: any) {
    console.error("Error en exportInventoryCSV:", err);
    return { error: err.message || 'Ocurrió un error al exportar el inventario.' };
  }
}
