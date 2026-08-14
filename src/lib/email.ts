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

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Lightson Marketplace <notifications@campuslightson.com>",
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Resend Email error:", err);
      } else {
        console.log(`[EMAIL DISPATCHED] Successfully sent email to ${to}: "${subject}"`);
      }
    } else {
      console.log(`[EMAIL DISPATCH SIMULATION] To: ${to} | Subject: "${subject}"`);
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
                  <strong>Note to Rider:</strong> "${deliveryInstructions}"
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
              <a href="https://campuslightson.com/orders" class="btn">Live Track Order Status ➔</a>
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
          .header { background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
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
            <h1 style="margin: 0; font-size: 24px; font-weight: 900;">🚨 NEW ORDER RECEIVED!</h1>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">Lightson Merchant Kitchen & Store POS</p>
          </div>
          <div class="body-content">
            <div class="badge">ACTION REQUIRED • PREPARE ORDER</div>
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
              <a href="https://campuslightson.com/vendor/dashboard" class="btn">Open Kitchen POS Terminal ➔</a>
            </div>

            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 0;">
              Please accept and start preparing the order promptly to maintain your store rating.
            </p>
          </div>
          <div class="footer">Lightson Vendor Partner Portal • Automatic Dispatch</div>
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
  totalAmount,
  deliveryLocation,
}: {
  orderId: string;
  storeName: string;
  customerName: string;
  totalAmount: number;
  deliveryLocation: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7; padding: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h3 style="margin-top: 0; color: ${BRAND_NAVY};">📦 New Campus Marketplace Order (#${orderId})</h3>
          <p style="font-size: 13px; color: #52525b;">
            Order placed at <strong>${storeName}</strong> by <strong>${customerName}</strong> for <strong>${deliveryLocation}</strong>.
          </p>
          <p style="font-size: 15px; font-weight: 800; color: #059669;">Amount: ₦${totalAmount.toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
}

// Backward compatibility alias
export const generateOrderEmailHTML = generateStudentStatusUpdateEmail;

