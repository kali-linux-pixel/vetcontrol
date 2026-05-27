'use server';

import { db } from '@/lib/db';
import { clinicalRecords } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getProfileOrEnsure } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

// Helper de validación de UUID
function isValidUUID(val: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

export async function createClinicalRecord(state: any, formData: FormData) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const petId = formData.get('petId') as string;
    const weight = formData.get('weight') as string || null;
    const allergies = formData.get('allergies') as string || null;
    const diseases = formData.get('diseases') as string || null;
    const vaccines = formData.get('vaccines') as string || null;
    const operations = formData.get('operations') as string || null;
    const medicaments = formData.get('medicaments') as string || null;
    const notes = formData.get('notes') as string || null;

    if (!petId || !isValidUUID(petId)) {
      return { error: 'ID de mascota no válido.' };
    }

    console.log(`createClinicalRecord: Registrando consulta para mascota=${petId}, peso=${weight}`);

    await db.insert(clinicalRecords).values({
      organizationId: orgId,
      petId,
      weight,
      allergies,
      diseases,
      vaccines,
      operations,
      medicaments,
      notes,
    });

    revalidatePath('/pets');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error("Error en createClinicalRecord:", err);
    return { error: err.message || 'Ocurrió un error inesperado al registrar el historial clínico.' };
  }
}

export async function getClinicalRecords(petId: string) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    if (!petId || !isValidUUID(petId)) {
      return { error: 'ID de mascota no válido.', records: [] };
    }

    console.log(`getClinicalRecords: Consultando historial para mascota=${petId}`);

    const records = await db.select()
      .from(clinicalRecords)
      .where(
        and(
          eq(clinicalRecords.petId, petId),
          eq(clinicalRecords.organizationId, orgId)
        )
      )
      .orderBy(desc(clinicalRecords.createdAt));

    return { success: true, records };
  } catch (err: any) {
    console.error("Error en getClinicalRecords:", err);
    return { error: err.message || 'Error al consultar el historial clínico.', records: [] };
  }
}
