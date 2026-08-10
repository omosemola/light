export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

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
          from: "Lightson Marketplace <orders@campuslightson.com>",
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Resend Email error:", err);
      } else {
        console.log(`[EMAIL SENT] Successfully sent email to ${to}: "${subject}"`);
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

export function generateOrderEmailHTML({
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
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAFAF7; color: #18181B; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
          .header { background-color: #1E1B4B; color: #ffffff; padding: 30px 24px; text-align: center; }
          .brand-title { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
          .brand-accent { color: #F59E0B; }
          .body-content { padding: 32px 24px; }
          .status-badge { display: inline-block; background-color: #F4F3FF; color: #312E81; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 50px; border: 1px solid #c7d2fe; margin-bottom: 16px; }
          .heading { font-size: 20px; font-weight: 800; color: #1E1B4B; margin-top: 0; margin-bottom: 8px; }
          .desc { font-size: 14px; color: #71717A; line-height: 1.6; margin-bottom: 24px; }
          .card { background-color: #FAFAF7; border-radius: 16px; padding: 20px; border: 1px solid #e4e4e7; margin-bottom: 24px; }
          .card-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
          .card-row:last-child { margin-bottom: 0; }
          .card-label { color: #71717A; }
          .card-val { font-weight: 700; color: #18181B; }
          .footer { text-align: center; padding: 20px 24px; font-size: 12px; color: #a1a1aa; border-t: 1px solid #f4f4f5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand-title">Lights<span class="brand-accent">on</span> Marketplace</h1>
          </div>
          <div class="body-content">
            <div class="status-badge">${statusTitle.toUpperCase()}</div>
            <h2 class="heading">Hi ${customerName || "Student"},</h2>
            <p class="desc">${statusDesc}</p>
            
            <div class="card">
              <div class="card-row">
                <span class="card-label">Order Reference</span>
                <span class="card-val">#${orderId}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Vendor Store</span>
                <span class="card-val">${storeName}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Hostel Location</span>
                <span class="card-val">${deliveryLocation}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Total Paid (with ₦500 Delivery)</span>
                <span class="card-val">₦${totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <p style="font-size: 13px; color: #71717A;">Need help with your meal? Open the Lightson app to live chat directly with ${storeName}.</p>
          </div>
          <div class="footer">
            Lightson Marketplace • Fast Campus Hostel Delivery
          </div>
        </div>
      </body>
    </html>
  `;
}
