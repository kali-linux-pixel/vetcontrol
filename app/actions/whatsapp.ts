'use server';

import { db } from '@/lib/db';
import { organizations, whatsappQueue } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getProfileOrEnsure } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { sendWhatsAppMessage } from '@/lib/whatsapp-api';

// Fallback templates in professional Spanish
const DEFAULT_TEMPLATES = {
  confirmation: 'Hola {{dueño}} 👋, confirmamos la cita de {{mascota}} para el {{fecha}} a las {{hora}} con el veterinario {{veterinario}} en {{clínica}}. ¡Le esperamos!',
  reminder: 'Hola {{dueño}} 👋, te recordamos la cita de {{mascota}} para mañana {{fecha}} a las {{hora}} con el veterinario {{veterinario}} en {{clínica}}. Si tienes algún inconveniente, avísanos.',
  vaccine: 'Hola {{dueño}} 👋, te recordamos que {{mascota}} tiene pendiente su vacuna: {{vacuna}} para el {{fecha}}. Sugerimos programar su cita en {{clínica}}.',
  followup: 'Hola {{dueño}} 👋, ¿cómo sigue {{mascota}} de su última consulta? Queremos saber si ha evolucionado favorablemente. Atentamente, {{clínica}}.',
  deworming: 'Hola {{dueño}} 👋, le toca el control de desparasitación de {{mascota}} para la fecha {{fecha}}. Escríbenos para agendar su cita en {{clínica}}.',
  cancelled: 'Hola {{dueño}} 👋, te informamos que la cita de {{mascota}} programada para el {{fecha}} a las {{hora}} ha sido cancelada. Si deseas reprogramar, contáctanos. {{clínica}}'
};

export async function getWhatsAppConfig() {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    });

    if (!org) {
      return { error: 'Organización no encontrada.' };
    }

    return {
      success: true,
      config: {
        whatsappEnabled: org.whatsappEnabled,
        whatsappPhone: org.whatsappPhone || '',
        whatsappProvider: org.whatsappProvider || 'mock',
        whatsappPhoneNumberId: org.whatsappPhoneNumberId || '',
        whatsappBusinessId: org.whatsappBusinessId || '',
        whatsappAccessToken: org.whatsappAccessToken || '',
        
        templateConfirmation: org.templateConfirmation || DEFAULT_TEMPLATES.confirmation,
        templateReminder: org.templateReminder || DEFAULT_TEMPLATES.reminder,
        templateVaccine: org.templateVaccine || DEFAULT_TEMPLATES.vaccine,
        templateFollowup: org.templateFollowup || DEFAULT_TEMPLATES.followup,
        templateDeworming: org.templateDeworming || DEFAULT_TEMPLATES.deworming,
        templateCancelled: org.templateCancelled || DEFAULT_TEMPLATES.cancelled,

        autoConfirmationEnabled: org.autoConfirmationEnabled,
        autoReminderEnabled: org.autoReminderEnabled,
        autoVaccineEnabled: org.autoVaccineEnabled,
        autoFollowupEnabled: org.autoFollowupEnabled,
        autoDewormingEnabled: org.autoDewormingEnabled,
      }
    };
  } catch (err: any) {
    console.error("Error en getWhatsAppConfig:", err);
    return { error: err.message || 'Error al obtener la configuración de WhatsApp.' };
  }
}

export async function saveWhatsAppConfig(state: any, formData: FormData) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const whatsappEnabled = formData.get('whatsappEnabled') === 'true';
    const whatsappPhone = formData.get('whatsappPhone') as string;
    const whatsappProvider = formData.get('whatsappProvider') as string;
    const whatsappPhoneNumberId = formData.get('whatsappPhoneNumberId') as string || null;
    const whatsappBusinessId = formData.get('whatsappBusinessId') as string || null;
    const whatsappAccessToken = formData.get('whatsappAccessToken') as string || null;

    const templateConfirmation = formData.get('templateConfirmation') as string || null;
    const templateReminder = formData.get('templateReminder') as string || null;
    const templateVaccine = formData.get('templateVaccine') as string || null;
    const templateFollowup = formData.get('templateFollowup') as string || null;
    const templateDeworming = formData.get('templateDeworming') as string || null;
    const templateCancelled = formData.get('templateCancelled') as string || null;

    const autoConfirmationEnabled = formData.get('autoConfirmationEnabled') === 'true';
    const autoReminderEnabled = formData.get('autoReminderEnabled') === 'true';
    const autoVaccineEnabled = formData.get('autoVaccineEnabled') === 'true';
    const autoFollowupEnabled = formData.get('autoFollowupEnabled') === 'true';
    const autoDewormingEnabled = formData.get('autoDewormingEnabled') === 'true';

    await db.update(organizations)
      .set({
        whatsappEnabled,
        whatsappPhone,
        whatsappProvider,
        whatsappPhoneNumberId,
        whatsappBusinessId,
        whatsappAccessToken,
        templateConfirmation,
        templateReminder,
        templateVaccine,
        templateFollowup,
        templateDeworming,
        templateCancelled,
        autoConfirmationEnabled,
        autoReminderEnabled,
        autoVaccineEnabled,
        autoFollowupEnabled,
        autoDewormingEnabled,
      })
      .where(eq(organizations.id, orgId));

    revalidatePath('/whatsapp');
    return { success: true };
  } catch (err: any) {
    console.error("Error en saveWhatsAppConfig:", err);
    return { error: err.message || 'Error al guardar la configuración.' };
  }
}

export async function getWhatsAppQueue() {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    const queue = await db.select()
      .from(whatsappQueue)
      .where(eq(whatsappQueue.organizationId, orgId))
      .orderBy(desc(whatsappQueue.createdAt))
      .limit(100);

    return { success: true, queue };
  } catch (err: any) {
    console.error("Error en getWhatsAppQueue:", err);
    return { error: err.message || 'Error al obtener la cola de mensajes.', queue: [] };
  }
}

export async function resendWhatsAppMessage(id: string) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    // Retrieve message details
    const msg = await db.query.whatsappQueue.findFirst({
      where: and(
        eq(whatsappQueue.id, id),
        eq(whatsappQueue.organizationId, orgId)
      )
    });

    if (!msg) {
      return { error: 'Mensaje no encontrado.' };
    }

    // Retrieve clinic config
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    });

    if (!org) {
      return { error: 'Configuración de clínica faltante.' };
    }

    console.log(`Reenviando mensaje ${id} a ${msg.phone} a través del proveedor ${org.whatsappProvider}`);

    // Update attempts
    const newAttempts = msg.attempts + 1;

    // Trigger API call
    const res = await sendWhatsAppMessage({
      to: msg.phone,
      message: msg.message,
      provider: org.whatsappProvider as any,
      phoneNumberId: org.whatsappPhoneNumberId,
      accessToken: org.whatsappAccessToken,
      businessId: org.whatsappBusinessId
    });

    // Update log entry
    await db.update(whatsappQueue)
      .set({
        attempts: newAttempts,
        status: res.status,
        errorMessage: res.success ? null : (res.errorMessage || 'Error en reenvío.'),
        sentAt: res.success ? new Date() : msg.sentAt
      })
      .where(eq(whatsappQueue.id, id));

    revalidatePath('/whatsapp');

    if (res.success) {
      return { success: true };
    } else {
      return { error: res.errorMessage || 'Error en reenvío de WhatsApp Cloud API.' };
    }
  } catch (err: any) {
    console.error("Error en resendWhatsAppMessage:", err);
    return { error: err.message || 'Error al reenviar el mensaje.' };
  }
}

export async function deleteQueueMessage(id: string) {
  try {
    const { profile } = await getProfileOrEnsure();
    const orgId = profile.organization_id;

    await db.delete(whatsappQueue)
      .where(
        and(
          eq(whatsappQueue.id, id),
          eq(whatsappQueue.organizationId, orgId)
        )
      );

    revalidatePath('/whatsapp');
    return { success: true };
  } catch (err: any) {
    console.error("Error en deleteQueueMessage:", err);
    return { error: err.message || 'Error al eliminar el registro.' };
  }
}

interface EnqueueParams {
  ownerName: string;
  phone: string;
  petName: string;
  date: string;
  time?: string;
  veterinarian?: string;
  detail?: string;
}

/**
 * Automates enqueuing and immediate sending of WhatsApp templates on key events.
 */
export async function enqueueWhatsAppAutomation(
  orgId: string,
  event: 'confirmation' | 'reminder' | 'vaccine' | 'followup' | 'deworming' | 'cancelled',
  params: EnqueueParams
) {
  try {
    // 1. Fetch clinic details & config
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    });

    if (!org) {
      console.warn(`[WhatsApp Automation] Clinic ${orgId} not found.`);
      return { error: 'Clínica no encontrada.' };
    }

    // Check toggle settings
    let isAutomationEnabled = false;
    let templateText = '';

    if (event === 'confirmation') {
      isAutomationEnabled = org.autoConfirmationEnabled;
      templateText = org.templateConfirmation || DEFAULT_TEMPLATES.confirmation;
    } else if (event === 'reminder') {
      isAutomationEnabled = org.autoReminderEnabled;
      templateText = org.templateReminder || DEFAULT_TEMPLATES.reminder;
    } else if (event === 'vaccine') {
      isAutomationEnabled = org.autoVaccineEnabled;
      templateText = org.templateVaccine || DEFAULT_TEMPLATES.vaccine;
    } else if (event === 'followup') {
      isAutomationEnabled = org.autoFollowupEnabled;
      templateText = org.templateFollowup || DEFAULT_TEMPLATES.followup;
    } else if (event === 'deworming') {
      isAutomationEnabled = org.autoDewormingEnabled;
      templateText = org.templateDeworming || DEFAULT_TEMPLATES.deworming;
    } else if (event === 'cancelled') {
      isAutomationEnabled = true; // cancellations are sent by default for safety
      templateText = org.templateCancelled || DEFAULT_TEMPLATES.cancelled;
    }

    if (!isAutomationEnabled) {
      console.log(`[WhatsApp Automation] Event "${event}" is disabled in clinic settings.`);
      return { success: false, reason: 'disabled' };
    }

    // 2. Parse template placeholders
    let parsedMessage = templateText
      .replace(/\{\{dueño\}\}/gi, params.ownerName)
      .replace(/\{\{mascota\}\}/gi, params.petName)
      .replace(/\{\{fecha\}\}/gi, params.date)
      .replace(/\{\{hora\}\}/gi, params.time || '')
      .replace(/\{\{veterinario\}\}/gi, params.veterinarian || '')
      .replace(/\{\{vacuna\}\}/gi, params.detail || '')
      .replace(/\{\{clínica\}\}/gi, org.name);

    console.log(`[WhatsApp Queue] Encolando mensaje para +${params.phone} (${event}): "${parsedMessage}"`);

    // 3. Insert pending log row
    const [log] = await db.insert(whatsappQueue)
      .values({
        organizationId: orgId,
        phone: params.phone,
        message: parsedMessage,
        status: 'pending',
        attempts: 0
      })
      .returning();

    // 4. Trigger immediate API delivery if global WhatsApp is active for this tenant
    if (org.whatsappEnabled) {
      const res = await sendWhatsAppMessage({
        to: params.phone,
        message: parsedMessage,
        provider: org.whatsappProvider as any,
        phoneNumberId: org.whatsappPhoneNumberId,
        accessToken: org.whatsappAccessToken,
        businessId: org.whatsappBusinessId
      });

      // Update status immediately
      await db.update(whatsappQueue)
        .set({
          status: res.status,
          errorMessage: res.success ? null : res.errorMessage,
          sentAt: res.success ? new Date() : null,
          attempts: 1
        })
        .where(eq(whatsappQueue.id, log.id));
    } else {
      console.log(`[WhatsApp Automation] Canal WhatsApp inactivo globalmente para la clínica ${org.name}. El mensaje permanece en cola 'pendiente'.`);
    }

    return { success: true, logId: log.id };
  } catch (err: any) {
    console.error("[WhatsApp Automation] Exception:", err);
    return { error: err.message || 'Error de procesamiento de automatización.' };
  }
}
