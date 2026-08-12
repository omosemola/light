import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendEmail, generateOrderEmailHTML } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "sk_test_your_secret_key";
    
    // Read raw body text for signature validation
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify Paystack HMAC SHA512 Signature
    if (signature) {
      const hash = crypto
        .createHmac("sha512", paystackSecretKey)
        .update(rawBody)
        .digest("hex");

      if (hash !== signature) {
        console.error("Invalid Paystack Webhook Signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`[PAYSTACK WEBHOOK EVENT]: ${event}`);

    // Handle Successful Payment Event
    if (event === "charge.success") {
      const reference = data.reference;
      const orderId = data.metadata?.orderId;
      const customerEmail = data.customer?.email;

      // Locate Order in Database
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { paymentReference: reference },
            { id: orderId || "" },
          ],
        },
        include: {
          user: true,
          store: true,
          items: {
            include: { product: true },
          },
        },
      });

      if (order) {
        // Update Order Status to ACCEPTED upon successful card payment
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.ACCEPTED,
            paymentReference: reference,
          },
          include: {
            user: true,
            store: true,
          },
        });

        // Trigger Real-time Revalidations for Vendor & Admin Dashboards
        revalidatePath("/vendor/dashboard");
        revalidatePath("/admin/dashboard");
        revalidatePath(`/orders/${order.id}`);

        // Send Payment Verified & Order Confirmed Email to Student
        const recipientEmail = updatedOrder.user?.email || customerEmail;
        if (recipientEmail) {
          const emailHtml = generateOrderEmailHTML({
            customerName: updatedOrder.user?.name || "Campus Student",
            orderId: updatedOrder.id.slice(-6).toUpperCase(),
            statusTitle: "Payment Verified & Order Accepted 🎉",
            statusDesc: `Your payment of ₦${updatedOrder.totalAmount.toLocaleString()} for ${updatedOrder.store.name} was successfully verified via Paystack. Your meal is being prepared now!`,
            storeName: updatedOrder.store.name,
            deliveryLocation: updatedOrder.deliveryLocation,
            totalAmount: updatedOrder.totalAmount,
          });

          await sendEmail({
            to: recipientEmail,
            subject: `Payment Confirmed (#${updatedOrder.id.slice(-6).toUpperCase()}) - Lightson Marketplace`,
            html: emailHtml,
          });
        }

        return NextResponse.json({
          status: true,
          message: "Order payment verified and updated to ACCEPTED",
          orderId: order.id,
        });
      } else {
        console.warn(`[PAYSTACK WEBHOOK] Order not found for reference: ${reference}`);
        return NextResponse.json({ status: true, message: "Order not found, logged" });
      }
    }

    return NextResponse.json({ status: true, message: `Event ${event} acknowledged` });
  } catch (error: any) {
    console.error("Paystack Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
