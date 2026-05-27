'use server';

import { db } from '@/lib/db';
import { sales, clients, pets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getProfileOrEnsure } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

// Helper de validación de UUID
function isValidUUID(val: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export async function createInvoice(state: any, formData: FormData) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const clientId = formData.get('clientId') as string;
    const petId = formData.get('petId') as string;
    const amountStr = formData.get('amount') as string || '0';
    const status = formData.get('status') as string || 'Pendiente';
    const itemDescription = formData.get('itemDescription') as string;
    const dateStr = formData.get('date') as string || new Date().toISOString().split('T')[0];

    // 1. Validación y Sanitización
    if (!clientId || !isValidUUID(clientId)) {
      console.warn("createInvoice: clientId no válido o ausente:", clientId);
      return { error: 'Se requiere una selección de cliente válida.' };
    }
    if (!petId || !isValidUUID(petId)) {
      console.warn("createInvoice: petId no válido o ausente:", petId);
      return { error: 'Se requiere una selección de mascota válida.' };
    }
    if (!itemDescription || itemDescription.trim() === '') {
      return { error: 'La descripción de los servicios es obligatoria.' };
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) {
      console.warn("createInvoice: Monto numérico no válido:", amountStr);
      return { error: 'El monto total debe ser un número decimal no negativo.' };
    }

    const validStatuses = ['Pagado', 'Pendiente', 'Reembolsado', 'Paid', 'Pending', 'Refunded'];
    if (!validStatuses.includes(status)) {
      console.warn("createInvoice: Estado de factura no válido:", status);
      return { error: 'Selección de estado de factura no válida.' };
    }

    // Validar y formatear fecha como YYYY-MM-DD
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      console.warn("createInvoice: Formato de fecha no válido:", dateStr);
      return { error: 'La fecha de facturación seleccionada no es válida.' };
    }
    const formattedDate = parsedDate.toISOString().split('T')[0];

    console.log(`createInvoice: Creando factura para cliente=${clientId}, mascota=${petId}, monto=${amount}, fecha=${formattedDate}`);

    await db.insert(sales).values({
      organizationId: orgId,
      clientId,
      petId,
      amount: amount.toFixed(2),
      status,
      itemDescription: itemDescription.trim(),
      date: formattedDate,
    });

    revalidatePath('/sales');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error("Error en createInvoice:", err);
    if (err.message?.includes('chk_sales_status')) {
      return { error: 'Fallo de restricción de base de datos. Por favor ejecute: node scratch/alter_constraints.js' };
    }
    return { error: err.message || 'Ocurrió un error inesperado al registrar la factura.' };
  }
}

export async function updateInvoiceStatus(id: string, status: string) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    if (!id || !isValidUUID(id)) {
      console.warn("updateInvoiceStatus: UUID de factura no válido:", id);
      return { error: 'ID de factura no válido.' };
    }

    const validStatuses = ['Pagado', 'Pendiente', 'Reembolsado', 'Paid', 'Pending', 'Refunded'];
    if (!validStatuses.includes(status)) {
      console.warn("updateInvoiceStatus: Estado de factura no válido:", status);
      return { error: 'Estado de factura no válido.' };
    }

    console.log(`updateInvoiceStatus: Actualizando factura ${id} a estado ${status}`);

    await db.update(sales)
      .set({ status })
      .where(
        and(
          eq(sales.id, id),
          eq(sales.organizationId, orgId)
        )
      );

    revalidatePath('/sales');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error("Error en updateInvoiceStatus:", err);
    return { error: err.message || 'Ocurrió un error inesperado al actualizar el estado de la factura.' };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    if (!id || !isValidUUID(id)) {
      console.warn("deleteInvoice: UUID no válido:", id);
      return { error: 'ID de factura no válido.' };
    }

    console.log(`deleteInvoice: Eliminando factura ${id}`);

    await db.delete(sales)
      .where(
        and(
          eq(sales.id, id),
          eq(sales.organizationId, orgId)
        )
      );

    revalidatePath('/sales');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteInvoice:", err);
    return { error: err.message || 'Ocurrió un error inesperado al eliminar la factura.' };
  }
}

export async function exportSalesCSV() {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    console.log("exportSalesCSV: Generando reporte de ventas para exportación");

    // Fetch invoices with client and pet names
    const invoices = await db.select({
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

    // Build CSV content in Spanish
    const headers = ['Folio de Factura', 'Fecha', 'Cliente', 'Paciente', 'Concepto', 'Total Billed', 'Estado'];
    const rows = invoices.map(inv => [
      `"${inv.id}"`,
      `"${inv.date}"`,
      `"${(inv.clientName || 'Cliente General').replace(/"/g, '""')}"`,
      `"${(inv.petName || 'Paciente').replace(/"/g, '""')}"`,
      `"${inv.itemDescription.replace(/"/g, '""')}"`,
      parseFloat(inv.amount).toFixed(2),
      `"${inv.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return { success: true, csv: csvContent };
  } catch (err: any) {
    console.error("Error en exportSalesCSV:", err);
    return { error: err.message || 'Ocurrió un error al exportar el historial de ventas.' };
  }
}
