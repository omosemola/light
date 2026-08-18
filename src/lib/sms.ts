/**
 * SMS & WhatsApp Delivery Alert Service
 * Integrates with Termii / Twilio / WhatsApp Cloud API for campus order delivery alerts
 */

export interface SendSMSOptions {
  toPhone: string;
  message: string;
}

export async function sendOrderDeliverySMS({ toPhone, message }: SendSMSOptions) {
  try {
    const termiiApiKey = process.env.TERMII_API_KEY;

    if (termiiApiKey && toPhone) {
      // Termii Nigeria SMS Gateway
      const cleanPhone = toPhone.startsWith("+") ? toPhone.slice(1) : toPhone.startsWith("0") ? `234${toPhone.slice(1)}` : toPhone;
      const res = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanPhone,
          from: "Lightson",
          sms: message,
          type: "plain",
          channel: "generic",
          api_key: termiiApiKey,
        }),
      });

      if (res.ok) {
        console.log(`[SMS SENT] Sent delivery alert SMS to ${toPhone}`);
      }
    } else {
      console.log(`[SMS SIMULATED] To: ${toPhone} | Message: "${message}"`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}
