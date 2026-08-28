export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface EmailOrderItem {
  name: string;
  quantity: number;
  price: number;
}

const BRAND_NAVY = "#1E1B4B";
const BRAND_AMBER = "#F59E0B";
const BRAND_INDIGO = "#312E81";
const BRAND_LOGO_URL = "https://lightsonmarketplace.com/logo.png";

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const senderFrom = process.env.EMAIL_FROM || "Lightson Marketplace <notifications@lightsonmarketplace.com>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: senderFrom,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Resend Email error:", err);

        // If domain is not verified yet on Resend, retry via onboarding@resend.dev sandbox sender
        if (err.includes("domain is not verified") || response.status === 403) {
          console.warn("[RESEND] Domain not verified on Resend yet. Retrying via sandbox sender (onboarding@resend.dev)...");
          const fallbackRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Lightson Marketplace <onboarding@resend.dev>",
              to: [to],
              subject,
              html,
            }),
          });

          if (fallbackRes.ok) {
            console.log(`[EMAIL SENT via sandbox] Successfully sent email to ${to}: "${subject}"`);
            return { success: true };
          } else {
            const fallbackErr = await fallbackRes.text();
            console.error("Resend Sandbox Fallback error:", fallbackErr);
          }
        }
      } else {
        console.log(`[EMAIL SENT] Successfully sent email to ${to}: "${subject}"`);
      }
    } else {
      console.log(`[EMAIL SIMULATION] To: ${to} | Subject: "${subject}"`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// 1. STUDENT EMAILS
// -------------------------------------------------------------

export function generateStudentOrderReceiptEmail({
  customerName,
  orderId,
  storeName,
  deliveryLocation,
  deliveryInstructions,
  items,
  totalAmount,
}: {
  customerName: string;
  orderId: string;
  storeName: string;
  deliveryLocation: string;
  deliveryInstructions?: string | null;
  items?: EmailOrderItem[];
  totalAmount: number;
}) {
  const itemsHtml = items && items.length > 0 ? items.map((i) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 0; font-size: 13px; color: #18181b; font-weight: 600;">
        ${i.quantity}x ${i.name}
      </td>
      <td style="padding: 10px 0; font-size: 13px; color: #18181b; font-weight: 700; text-align: right;">
        ₦${(i.price * i.quantity).toLocaleString()}
      </td>
    </tr>
  `).join("") : `
    <tr>
      <td colspan="2" style="padding: 10px 0; font-size: 13px; color: #71717a;">Campus items from ${storeName}</td>
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }
          .header { background-color: ${BRAND_NAVY}; color: #ffffff; padding: 36px 24px; text-align: center; }
          .brand-title { font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
          .brand-accent { color: ${BRAND_AMBER}; }
          .body-content { padding: 32px 24px; }
          .badge { display: inline-block; background-color: #ECFDF5; color: #047857; font-weight: 800; font-size: 12px; padding: 6px 14px; border-radius: 50px; border: 1px solid #a7f3d0; margin-bottom: 16px; }
          .heading { font-size: 22px; font-weight: 800; color: ${BRAND_NAVY}; margin-top: 0; margin-bottom: 8px; }
          .desc { font-size: 14px; color: #52525b; line-height: 1.6; margin-bottom: 24px; }
          .card { background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          .btn { display: inline-block; background-color: ${BRAND_INDIGO}; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 50px; text-align: center; box-shadow: 0 4px 14px rgba(49, 46, 129, 0.3); }
          .footer { text-align: center; padding: 24px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 12px;">
              <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="56" height="56" style="border-radius: 14px; display: inline-block; vertical-align: middle; background: #ffffff; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
            </div>
            <h1 class="brand-title">Lights<span class="brand-accent">on</span> Marketplace</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">University Campus Multi-Vendor Marketplace</p>
          </div>
          <div class="body-content">
            <div class="badge">PAYMENT CONFIRMED 💳</div>
            <h2 class="heading">Thank you, ${customerName || "Student"}!</h2>
            <p class="desc">Your order from <strong>${storeName}</strong> has been received and sent directly to the vendor's terminal.</p>
            
            <div class="card">
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                <span style="color: #64748b; font-weight: 600;">Order Reference</span>
                <span style="font-weight: 800; color: ${BRAND_NAVY};">#${orderId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                <span style="color: #64748b; font-weight: 600;">Delivery Hostel</span>
                <span style="font-weight: 700; color: #0f172a;">${deliveryLocation}</span>
              </div>
              ${deliveryInstructions ? `
                <div style="font-size: 12px; color: #b45309; background: #fef3c7; padding: 8px 12px; border-radius: 8px; margin-bottom: 12px;">
                  <strong>Delivery Instructions:</strong> "${deliveryInstructions}"
                </div>
              ` : ""}

              <h4 style="margin: 12px 0 8px 0; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Ordered Items</h4>
              <table class="table">
                ${itemsHtml}
              </table>

              <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #0f172a; padding-top: 10px; border-top: 2px dashed #cbd5e1;">
                <span>Total Paid</span>
                <span style="color: #059669;">₦${totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="https://campuslightson.com/orders" class="btn">View Order Receipt & Details ➔</a>
            </div>

            <p style="font-size: 12px; color: #71717a; text-align: center; line-height: 1.5; margin: 0;">
              Have questions about your order? You can chat with ${storeName} directly inside the Lightson app.
            </p>
          </div>
          <div class="footer">
            Lightson Campus Delivery • Delivering food, tech, stationery & lifestyle to your dorm room.
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateStudentStatusUpdateEmail({
  customerName,
  orderId,
  statusTitle,
  statusDesc,
  storeName,
  deliveryLocation,
  totalAmount,
}: {
  customerName: string;
  orderId: string;
  statusTitle: string;
  statusDesc: string;
  storeName: string;
  deliveryLocation: string;
  totalAmount: number;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }
          .header { background-color: ${BRAND_NAVY}; color: #ffffff; padding: 32px 24px; text-align: center; }
          .brand-title { font-size: 24px; font-weight: 900; margin: 0; }
          .brand-accent { color: ${BRAND_AMBER}; }
          .body-content { padding: 32px 24px; }
          .badge { display: inline-block; background-color: #F4F3FF; color: ${BRAND_INDIGO}; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 50px; border: 1px solid #c7d2fe; margin-bottom: 16px; }
          .heading { font-size: 20px; font-weight: 800; color: ${BRAND_NAVY}; margin-top: 0; margin-bottom: 8px; }
          .desc { font-size: 14px; color: #52525b; line-height: 1.6; margin-bottom: 24px; }
          .card { background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: ${BRAND_INDIGO}; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 50px; text-align: center; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="48" height="48" style="border-radius: 12px; display: inline-block; vertical-align: middle; background: #ffffff; padding: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />
            </div>
            <h1 class="brand-title">Lights<span class="brand-accent">on</span> Marketplace</h1>
          </div>
          <div class="body-content">
            <div class="badge">${statusTitle.toUpperCase()}</div>
            <h2 class="heading">Hi ${customerName || "Student"},</h2>
            <p class="desc">${statusDesc}</p>
            
            <div class="card">
              <div style="font-size: 13px; margin-bottom: 8px;"><strong style="color: #64748b;">Order:</strong> #${orderId}</div>
              <div style="font-size: 13px; margin-bottom: 8px;"><strong style="color: #64748b;">Vendor:</strong> ${storeName}</div>
              <div style="font-size: 13px; margin-bottom: 8px;"><strong style="color: #64748b;">Delivery To:</strong> ${deliveryLocation}</div>
              <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 10px;">Total: ₦${totalAmount.toLocaleString()}</div>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="https://campuslightson.com/orders" class="btn">View Live Status ➔</a>
            </div>
          </div>
          <div class="footer">
            Lightson Marketplace • Fast Campus Hostel Delivery
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateStudentWelcomeEmail({
  studentName,
}: {
  studentName: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; }
          .header { background-color: ${BRAND_NAVY}; color: #ffffff; padding: 36px 24px; text-align: center; }
          .body-content { padding: 32px 24px; }
          .btn { display: inline-block; background-color: ${BRAND_INDIGO}; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 50px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 12px;">
              <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="56" height="56" style="border-radius: 14px; display: inline-block; vertical-align: middle; background: #ffffff; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
            </div>
            <h1 style="font-size: 26px; font-weight: 900; margin: 0;">Welcome to Lights<span style="color: ${BRAND_AMBER};">on</span> 🎉</h1>
          </div>
          <div class="body-content">
            <h2 style="font-size: 20px; font-weight: 800; color: ${BRAND_NAVY};">Welcome aboard, ${studentName}!</h2>
            <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
              Your Lightson student account is ready. Order hot food, dorm groceries, tech gadgets, stationery, and fashion straight to your campus hostel with ultra-fast room delivery.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://campuslightson.com" class="btn">Start Exploring Stores ➔</a>
            </div>
          </div>
          <div class="footer">Lightson Marketplace • University Multi-Vendor Platform</div>
        </div>
      </body>
    </html>
  `;
}

// -------------------------------------------------------------
// 2. VENDOR (CAMPUS MERCHANT) EMAILS
// -------------------------------------------------------------

export function generateVendorNewOrderAlertEmail({
  storeName,
  orderId,
  customerName,
  customerPhone,
  deliveryLocation,
  deliveryInstructions,
  items,
  totalAmount,
}: {
  storeName: string;
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryLocation: string;
  deliveryInstructions?: string | null;
  items?: EmailOrderItem[];
  totalAmount: number;
}) {
  const itemsHtml = items && items.length > 0 ? items.map((i) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 0; font-size: 14px; font-weight: 800; color: #0f172a;">
        ${i.quantity}x ${i.name}
      </td>
      <td style="padding: 10px 0; font-size: 14px; font-weight: 700; text-align: right; color: #0f172a;">
        ₦${(i.price * i.quantity).toLocaleString()}
      </td>
    </tr>
  `).join("") : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 2px solid #fbbf24; box-shadow: 0 10px 35px rgba(245, 158, 11, 0.15); }
          .header { background: #1E1B4B; color: #ffffff; padding: 32px 24px; text-align: center; }
          .badge { display: inline-block; background-color: #FEF3C7; color: #B45309; font-weight: 900; font-size: 12px; padding: 6px 14px; border-radius: 50px; border: 1px solid #fcd34d; margin-bottom: 12px; }
          .body-content { padding: 32px 24px; }
          .card { background-color: #fffbeb; border-radius: 16px; padding: 20px; border: 1px solid #fde68a; margin-bottom: 24px; }
          .btn { display: inline-block; background-color: #d97706; color: #ffffff !important; font-weight: 900; font-size: 15px; text-decoration: none; padding: 16px 32px; border-radius: 50px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35); text-align: center; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="52" height="52" style="border-radius: 12px; display: inline-block; vertical-align: middle; background: #ffffff; padding: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900;">🚨 NEW ORDER RECEIVED!</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Lightson Merchant Store POS</p>
          </div>
          <div class="body-content">
            <div class="badge">ACTION REQUIRED • FULFILL ORDER</div>
            <h2 style="font-size: 20px; font-weight: 900; color: ${BRAND_NAVY}; margin-top: 0; margin-bottom: 6px;">
              ${storeName}, you have a new order!
            </h2>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 20px;">
              A campus student just placed an order and payment has been confirmed.
            </p>

            <div class="card">
              <div style="font-size: 14px; margin-bottom: 8px;"><strong>Order ID:</strong> #${orderId}</div>
              <div style="font-size: 14px; margin-bottom: 8px;"><strong>Customer:</strong> ${customerName} ${customerPhone ? `(${customerPhone})` : ""}</div>
              <div style="font-size: 14px; margin-bottom: 8px;"><strong>Hostel Address:</strong> ${deliveryLocation}</div>
              ${deliveryInstructions ? `<div style="font-size: 13px; color: #b45309; background: #ffffff; padding: 8px 12px; border-radius: 8px; margin-top: 8px;"><strong>Special Note:</strong> "${deliveryInstructions}"</div>` : ""}

              <h4 style="margin: 16px 0 8px 0; font-size: 13px; color: #78350f; text-transform: uppercase;">Items to Prepare:</h4>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
              </table>

              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #18181b; margin-top: 14px; padding-top: 10px; border-top: 2px dashed #fcd34d;">
                <span>Order Total:</span>
                <span style="color: #b45309;">₦${totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="https://campuslightson.com/vendor/dashboard" class="btn">Open Merchant POS Terminal ➔</a>
            </div>

            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
              Please accept and prepare the order promptly to maintain your store rating.
            </p>
          </div>
          <div class="footer">Lightson Vendor Partner Portal • Instant Order Notification</div>
        </div>
      </body>
    </html>
  `;
}

export function generateVendorWelcomeEmail({
  ownerName,
  storeName,
  category,
}: {
  ownerName: string;
  storeName: string;
  category: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; }
          .header { background-color: ${BRAND_NAVY}; color: #ffffff; padding: 36px 24px; text-align: center; }
          .body-content { padding: 32px 24px; }
          .btn { display: inline-block; background-color: ${BRAND_INDIGO}; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 50px; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 12px;">
              <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="56" height="56" style="border-radius: 14px; display: inline-block; vertical-align: middle; background: #ffffff; padding: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
            </div>
            <h1 style="font-size: 24px; font-weight: 900; margin: 0;">Welcome, ${storeName}! 🏪</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">Lightson Vendor Partner Network</p>
          </div>
          <div class="body-content">
            <h2 style="font-size: 20px; font-weight: 800; color: ${BRAND_NAVY};">Congratulations, ${ownerName}!</h2>
            <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
              Your store <strong>${storeName}</strong> has been registered under <strong>${category}</strong>. You can now log into your merchant dashboard, manage your menu items, view live orders, and toggle your store open/closed.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://campuslightson.com/vendor/dashboard" class="btn">Launch Merchant Dashboard ➔</a>
            </div>
          </div>
          <div class="footer">Lightson Marketplace Merchant Operations</div>
        </div>
      </body>
    </html>
  `;
}

// -------------------------------------------------------------
// 3. ADMIN (SUPERVISOR) EMAILS
// -------------------------------------------------------------

export function generateAdminNewVendorEmail({
  storeName,
  ownerName,
  email,
  phone,
  category,
  location,
}: {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  location: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7; padding: 24px; }
          .heading { font-size: 18px; font-weight: 900; color: ${BRAND_NAVY}; margin-top: 0; }
          .btn { display: inline-block; background-color: ${BRAND_NAVY}; color: #ffffff !important; font-weight: 800; font-size: 13px; text-decoration: none; padding: 10px 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="text-align: center; margin-bottom: 12px;">
            <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="48" height="48" style="border-radius: 12px; display: inline-block; vertical-align: middle;" />
          </div>
          <h2 class="heading">🛡️ New Campus Vendor Registered</h2>
          <p style="font-size: 13px; color: #52525b;">A new store has registered on Lightson Marketplace:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 12px; font-size: 13px; margin: 16px 0; border: 1px solid #e2e8f0;">
            <div><strong>Store:</strong> ${storeName}</div>
            <div><strong>Owner:</strong> ${ownerName}</div>
            <div><strong>Email:</strong> ${email}</div>
            <div><strong>Phone:</strong> ${phone}</div>
            <div><strong>Category:</strong> ${category}</div>
            <div><strong>Campus Hub:</strong> ${location}</div>
          </div>
          <a href="https://campuslightson.com/admin/dashboard" class="btn">Open Admin Dashboard ➔</a>
        </div>
      </body>
    </html>
  `;
}

export function generateAdminPlatformOrderAlertEmail({
  orderId,
  storeName,
  customerName,
  customerEmail,
  customerPhone,
  totalAmount,
  deliveryLocation,
  deliveryInstructions,
  items,
  paymentMethod,
}: {
  orderId: string;
  storeName: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  deliveryLocation: string;
  deliveryInstructions?: string | null;
  items?: EmailOrderItem[];
  paymentMethod?: string;
}) {
  const itemsHtml = (items || [])
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; font-size: 13px; color: #1e293b;">
          <strong>${it.quantity}x</strong> ${it.name}
        </td>
        <td style="padding: 10px 0; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">
          ₦${(it.price * it.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 20px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background: #1E1B4B; color: #ffffff; padding: 28px 24px; text-align: center; }
          .badge { display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px; }
          .content { padding: 24px; }
          .card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px; margin: 16px 0; font-size: 13px; line-height: 1.6; }
          .btn { display: block; width: 100%; box-sizing: border-box; background-color: #1E1B4B; color: #ffffff !important; text-align: center; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; padding: 18px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="${BRAND_LOGO_URL}" alt="Lightson Marketplace" width="48" height="48" style="border-radius: 12px; display: inline-block; vertical-align: middle; background: #ffffff; padding: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);" />
            </div>
            <span class="badge">⚡ Platform Admin Order Monitor</span>
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff;">New Marketplace Order #${orderId}</h1>
            <p style="margin: 6px 0 0; color: #FBBF24; font-size: 13px; font-weight: 700;">Lightson Campus Marketplace</p>
          </div>

          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Store / Merchant</span>
                <strong style="font-size: 16px; color: #1e1b4b;">${storeName}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block;">Total Amount</span>
                <strong style="font-size: 18px; color: #059669;">₦${totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            <div class="card">
              <div><strong>Customer:</strong> ${customerName} ${customerPhone ? `(${customerPhone})` : ""}</div>
              ${customerEmail ? `<div><strong>Email:</strong> ${customerEmail}</div>` : ""}
              <div><strong>Delivery Location:</strong> ${deliveryLocation}</div>
              ${deliveryInstructions ? `<div><strong>Delivery Notes:</strong> ${deliveryInstructions}</div>` : ""}
              ${paymentMethod ? `<div><strong>Payment Method:</strong> ${paymentMethod}</div>` : ""}
            </div>

            ${items && items.length > 0 ? `
              <h4 style="margin: 20px 0 10px; font-size: 13px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">Ordered Items</h4>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
              </table>
            ` : ""}

            <a href="https://campuslightson.com/admin/dashboard" class="btn">View in Admin Command Center ➔</a>
          </div>

          <div class="footer">
            Lightson Campus Marketplace • Live Platform Transaction Monitor
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateChatMessageEmailForVendor({
  studentName,
  studentEmail,
  storeName,
  messageText,
  storeId,
}: {
  studentName: string;
  studentEmail?: string;
  storeName: string;
  messageText: string;
  storeId: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }
          .header { background-color: #0F172A; color: #ffffff; padding: 32px 24px; text-align: center; }
          .brand-title { font-size: 24px; font-weight: 900; margin: 0; }
          .brand-accent { color: #F59E0B; }
          .content { padding: 32px 24px; }
          .badge { display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
          .chat-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #F59E0B; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 15px; color: #1E293B; line-height: 1.5; }
          .btn { display: block; width: 100%; box-sizing: border-box; background-color: #F59E0B; color: #0F172A; text-align: center; padding: 15px 24px; border-radius: 14px; text-decoration: none; font-weight: 900; font-size: 14px; margin-top: 24px; }
          .footer { text-align: center; padding: 20px; font-size: 11px; color: #71717a; border-top: 1px solid #f4f4f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">Lights<span class="brand-accent">on</span> Merchant Services</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #94A3B8;">Customer Inquiry • ${storeName}</p>
          </div>
          <div class="content">
            <span class="badge">💬 New Student Message</span>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 10px; color: #0F172A;">
              ${studentName} sent a message to your store
            </h2>
            <p style="font-size: 13px; color: #64748B; margin: 0;">
              ${studentEmail ? `Student Contact: ${studentEmail}` : "Campus Student Customer"}
            </p>
            
            <div class="chat-box">
              "${messageText}"
            </div>

            <a href="https://campuslightson.com/vendor/dashboard" class="btn">
              Open Vendor Dashboard to Reply ➔
            </a>
          </div>
          <div class="footer">
            Lightson Campus Marketplace • Instant Vendor Messaging
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateChatMessageEmailForStudent({
  storeName,
  studentName,
  messageText,
  storeId,
}: {
  storeName: string;
  studentName: string;
  messageText: string;
  storeId: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 24px 12px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 8px 30px rgba(0,0,0,0.04); }
          .header { background-color: #1E1B4B; color: #ffffff; padding: 32px 24px; text-align: center; }
          .brand-title { font-size: 24px; font-weight: 900; margin: 0; }
          .brand-accent { color: #F59E0B; }
          .content { padding: 32px 24px; }
          .badge { display: inline-block; background-color: #EEF2FF; color: #3730A3; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
          .chat-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #312E81; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 15px; color: #1E293B; line-height: 1.5; }
          .btn { display: block; width: 100%; box-sizing: border-box; background-color: #312E81; color: #ffffff; text-align: center; padding: 15px 24px; border-radius: 14px; text-decoration: none; font-weight: 900; font-size: 14px; margin-top: 24px; }
          .footer { text-align: center; padding: 20px; font-size: 11px; color: #71717a; border-top: 1px solid #f4f4f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">Lights<span class="brand-accent">on</span> Campus Marketplace</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #C7D2FE;">Merchant Response • ${storeName}</p>
          </div>
          <div class="content">
            <span class="badge">💬 Store Response</span>
            <h2 style="font-size: 20px; font-weight: 800; margin: 0 0 10px; color: #1E1B4B;">
              ${storeName} replied to your message
            </h2>
            <p style="font-size: 13px; color: #64748B; margin: 0;">
              Hello ${studentName || "there"}, you have a new response from the vendor!
            </p>
            
            <div class="chat-box">
              "${messageText}"
            </div>

            <a href="https://campuslightson.com/vendor/${storeId}" class="btn">
              View Store & Chat on Lightson ➔
            </a>
          </div>
          <div class="footer">
            Lightson Campus Marketplace • Safe & Swift Campus Ordering
          </div>
        </div>
      </body>
    </html>
  `;
}

// Backward compatibility alias
export const generateOrderEmailHTML = generateStudentStatusUpdateEmail;


