/**
 * Helper to clean and format phone numbers for WhatsApp.
 * Automatically appends Peru's +51 prefix if the number has 9 digits.
 */
export function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9) {
    return '51' + digits; // Default to Peru prefix (+51)
  }
  return digits;
}

interface SendWhatsAppParams {
  to: string;
  message: string;
  provider: 'cloud_api' | 'twilio' | 'mock';
  // Meta Cloud API details
  phoneNumberId?: string | null;
  accessToken?: string | null;
  businessId?: string | null;
  // Twilio credentials (if provider is twilio, loaded from config or environment)
  twilioSid?: string | null;
  twilioToken?: string | null;
  twilioFrom?: string | null;
}

interface SendWhatsAppResult {
  success: boolean;
  status: 'sent' | 'delivered' | 'error';
  errorMessage?: string;
  providerUsed: string;
}

/**
 * Sends a WhatsApp message using Meta Cloud API, Twilio, or Mock Simulation Mode.
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const { to, message, provider, phoneNumberId, accessToken, twilioSid, twilioToken, twilioFrom } = params;
  const cleanedPhone = cleanPhone(to);

  if (!cleanedPhone) {
    return {
      success: false,
      status: 'error',
      errorMessage: 'Número de teléfono no válido.',
      providerUsed: provider
    };
  }

  // 1. SIMULATION MODE (MOCK)
  if (provider === 'mock' || !provider) {
    console.log(`[SIMULACIÓN WHATSAPP] Enviando a +${cleanedPhone}: "${message}"`);
    // Simulate minor delay to look real
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      status: 'delivered',
      providerUsed: 'mock'
    };
  }

  // 2. META WHATSAPP CLOUD API
  if (provider === 'cloud_api') {
    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        status: 'error',
        errorMessage: 'Configuración incompleta: se requiere ID de número de teléfono y Token de acceso de Meta.',
        providerUsed: 'cloud_api'
      };
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      };

      console.log(`[Meta Cloud API] POST a ${url} para +${cleanedPhone}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Meta Cloud API] Error de respuesta:", data);
        return {
          success: false,
          status: 'error',
          errorMessage: data.error?.message || `Error HTTP ${response.status} de Meta.`,
          providerUsed: 'cloud_api'
        };
      }

      console.log("[Meta Cloud API] Mensaje enviado exitosamente:", data);
      return {
        success: true,
        status: 'sent', // Meta sent status (webhook is needed for delivered confirmation)
        providerUsed: 'cloud_api'
      };
    } catch (err: any) {
      console.error("[Meta Cloud API] Excepción al enviar:", err);
      return {
        success: false,
        status: 'error',
        errorMessage: err.message || 'Error de conexión con Meta Cloud API.',
        providerUsed: 'cloud_api'
      };
    }
  }

  // 3. TWILIO WHATSAPP API
  if (provider === 'twilio') {
    const sid = twilioSid || process.env.TWILIO_ACCOUNT_SID;
    const token = twilioToken || process.env.TWILIO_AUTH_TOKEN;
    const from = twilioFrom || process.env.TWILIO_FROM_NUMBER || '+14155238886'; // Sandbox fallback

    if (!sid || !token) {
      return {
        success: false,
        status: 'error',
        errorMessage: 'Configuración de Twilio incompleta: se requiere Account SID y Auth Token.',
        providerUsed: 'twilio'
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      
      // Clean from number
      const cleanFrom = from.replace(/[^\d+]/g, '');
      const fromParam = cleanFrom.startsWith('+') ? `whatsapp:${cleanFrom}` : `whatsapp:+${cleanFrom}`;
      const toParam = `whatsapp:+${cleanedPhone}`;

      const paramsList = new URLSearchParams();
      paramsList.append('From', fromParam);
      paramsList.append('To', toParam);
      paramsList.append('Body', message);

      console.log(`[Twilio API] POST a ${url}. Remitente: ${fromParam}, Destinatario: ${toParam}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: paramsList.toString()
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Twilio API] Error de respuesta:", data);
        return {
          success: false,
          status: 'error',
          errorMessage: data.message || `Error HTTP ${response.status} de Twilio.`,
          providerUsed: 'twilio'
        };
      }

      console.log("[Twilio API] Mensaje encolado exitosamente en Twilio:", data.sid);
      return {
        success: true,
        status: 'sent',
        providerUsed: 'twilio'
      };
    } catch (err: any) {
      console.error("[Twilio API] Excepción al enviar:", err);
      return {
        success: false,
        status: 'error',
        errorMessage: err.message || 'Error de conexión con Twilio API.',
        providerUsed: 'twilio'
      };
    }
  }

  return {
    success: false,
    status: 'error',
    errorMessage: `Proveedor "${provider}" no reconocido.`,
    providerUsed: provider
  };
}
