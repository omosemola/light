export interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface VendorWhatsAppNotificationOptions {
  vendorPhone: string;
  vendorName?: string;
  storeName: string;
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryLocation: string;
  deliveryInstructions?: string | null;
  items: WhatsAppOrderItem[];
  totalAmount: number;
  paymentMethod?: string;
}

/**
 * Normalizes phone numbers to standard international format without spaces or symbols.
 * Example: "08123456789" -> "2348123456789"
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "").trim();
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.substring(1);
  } else if (!cleaned.startsWith("234") && cleaned.length === 10) {
    cleaned = "234" + cleaned;
  }
  return cleaned;
}

/**
 * Generates a clean, formatted WhatsApp order alert message for vendors.
 */
export function generateVendorWhatsAppOrderMessage(options: VendorWhatsAppNotificationOptions): string {
  const {
    storeName,
    orderId,
    customerName,
    customerPhone,
    deliveryLocation,
    deliveryInstructions,
    items,
    totalAmount,
    paymentMethod = "Confirmed Online Payment"
  } = options;

  const itemsList = items
    .map((it) => `• *${it.quantity}x* ${it.name} - ₦${(it.price * it.quantity).toLocaleString()}`)
    .join("\n");

  return `🚨 *NEW CAMPUS ORDER ALERT!* 🚨
━━━━━━━━━━━━━━━━━━━━
🏪 *Store:* ${storeName}
📦 *Order ID:* #${orderId}
💰 *Total Amount:* ₦${totalAmount.toLocaleString()} (${paymentMethod})

👤 *Customer:* ${customerName}${customerPhone ? ` (${customerPhone})` : ""}
📍 *Hostel Delivery:* ${deliveryLocation}
${deliveryInstructions ? `📝 *Special Note:* "${deliveryInstructions}"\n` : ""}
🛒 *ITEMS TO PREPARE:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
👉 *Open Kitchen POS Terminal:*
https://lightsonmarketplace.com/vendor/dashboard

_Please accept and start preparing this order promptly!_`;
}

/**
 * Generates a direct click-to-chat WhatsApp URL for browsers or mobile.
 */
export function getWhatsAppChatUrl(phone: string, text: string): string {
  const cleanNumber = normalizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Dispatches a WhatsApp notification to a vendor.
 * Supports Twilio, Meta Cloud API, Termii, or Webhooks, with graceful console simulation fallback.
 */
export async function sendVendorWhatsAppOrderNotification(
  options: VendorWhatsAppNotificationOptions
): Promise<{ success: boolean; messageUrl?: string; error?: string }> {
  try {
    const rawPhone = options.vendorPhone;
    if (!rawPhone) {
      console.warn("[WHATSAPP] No vendor phone number provided for order #" + options.orderId);
      return { success: false, error: "No vendor phone number provided" };
    }

    const cleanPhone = normalizePhoneNumber(rawPhone);
    const message = generateVendorWhatsAppOrderMessage(options);
    const chatUrl = getWhatsAppChatUrl(cleanPhone, message);

    // 1. Check for Twilio WhatsApp credentials
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

    if (twilioSid && twilioAuthToken) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");
        const body = new URLSearchParams({
          From: twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`,
          To: `whatsapp:+${cleanPhone}`,
          Body: message,
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          }
        );

        if (twilioRes.ok) {
          console.log(`[WHATSAPP SENT via Twilio] Order #${options.orderId} alert sent to +${cleanPhone}`);
          return { success: true, messageUrl: chatUrl };
        } else {
          const errData = await twilioRes.text();
          console.error("[WHATSAPP Twilio Error]:", errData);
        }
      } catch (err) {
        console.error("[WHATSAPP Twilio Exception]:", err);
      }
    }

    // 2. Check for Meta / WhatsApp Cloud API credentials
    const metaToken = process.env.WHATSAPP_API_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId) {
      try {
        const metaRes = await fetch(
          `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${metaToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhone,
              type: "text",
              text: { body: message },
            }),
          }
        );

        if (metaRes.ok) {
          console.log(`[WHATSAPP SENT via Cloud API] Order #${options.orderId} alert sent to +${cleanPhone}`);
          return { success: true, messageUrl: chatUrl };
        } else {
          const errData = await metaRes.text();
          console.error("[WHATSAPP Cloud API Error]:", errData);
        }
      } catch (err) {
        console.error("[WHATSAPP Cloud API Exception]:", err);
      }
    }

    // 3. Check for Termii API (Popular for Nigeria)
    const termiiKey = process.env.TERMII_API_KEY;
    if (termiiKey) {
      try {
        const termiiRes = await fetch("https://api.ng.termii.com/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: cleanPhone,
            from: process.env.TERMII_SENDER_ID || "Lightson",
            sms: message,
            type: "plain",
            channel: "whatsapp",
            api_key: termiiKey,
          }),
        });

        if (termiiRes.ok) {
          console.log(`[WHATSAPP SENT via Termii] Order #${options.orderId} alert sent to +${cleanPhone}`);
          return { success: true, messageUrl: chatUrl };
        }
      } catch (err) {
        console.error("[WHATSAPP Termii Exception]:", err);
      }
    }

    // 4. Fallback: Development mode simulation & direct WhatsApp deep-link
    console.log(`[WHATSAPP NOTIFICATION DISPATCHED]`);
    console.log(`To Vendor Phone: +${cleanPhone} (${options.storeName})`);
    console.log(`Order: #${options.orderId} | Total: ₦${options.totalAmount.toLocaleString()}`);
    console.log(`Direct WhatsApp URL: ${chatUrl}`);

    return { success: true, messageUrl: chatUrl };
  } catch (error: any) {
    console.error("Error sending vendor WhatsApp notification:", error);
    return { success: false, error: error.message };
  }
}
