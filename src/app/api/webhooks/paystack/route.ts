import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendEmail, generateStudentOrderReceiptEmail, generateVendorNewOrderAlertEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const bodyText = await req.text();

    if (secret) {
      const signature = req.headers.get("x-paystack-signature");
      if (signature) {
        const hash = crypto
          .createHmac("sha512", secret)
          .update(bodyText)
          .digest("hex");

        if (hash !== signature) {
          console.warn("[PAYSTACK WEBHOOK] Invalid signature match");
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
      }
    }

    const event = JSON.parse(bodyText);
    console.log(`[PAYSTACK WEBHOOK] Received event: ${event.event}`);

    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata || {};
      const orderId = metadata.orderId || metadata.custom_fields?.find((f: any) => f.variable_name === "order_id")?.value;

      if (orderId) {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.ACCEPTED,
          },
          include: {
            user: true,
            store: true,
            items: {
              include: { product: true },
            },
          },
        });

        // Trigger Receipt Email to Student
        if (updatedOrder.user?.email) {
          const studentEmailHtml = generateStudentOrderReceiptEmail({
            customerName: updatedOrder.user.name || "Campus Student",
            orderId: updatedOrder.id.slice(-6).toUpperCase(),
            storeName: updatedOrder.store.name,
            deliveryLocation: updatedOrder.deliveryLocation,
            deliveryInstructions: updatedOrder.deliveryInstructions,
            totalAmount: updatedOrder.totalAmount,
            items: updatedOrder.items.map((it) => ({
              name: it.product?.name || "Campus Item",
              quantity: it.quantity,
              price: it.price,
            })),
          });

          await sendEmail({
            to: updatedOrder.user.email,
            subject: `Order Confirmed & Paid: #${updatedOrder.id.slice(-6).toUpperCase()} - ${updatedOrder.store.name}`,
            html: studentEmailHtml,
          });
        }

        // Trigger New Order Alert Email to Vendor
        const vendorUser = await prisma.user.findUnique({
          where: { id: updatedOrder.store.userId },
        });

        if (vendorUser?.email) {
          const vendorEmailHtml = generateVendorNewOrderAlertEmail({
            storeName: updatedOrder.store.name,
            orderId: updatedOrder.id.slice(-6).toUpperCase(),
            customerName: updatedOrder.user?.name || "Campus Student",
            customerPhone: updatedOrder.user?.phone || "Provided on delivery",
            deliveryLocation: updatedOrder.deliveryLocation,
            deliveryInstructions: updatedOrder.deliveryInstructions,
            totalAmount: updatedOrder.totalAmount,
            items: updatedOrder.items.map((it) => ({
              name: it.product?.name || "Campus Item",
              quantity: it.quantity,
              price: it.price,
            })),
          });

          await sendEmail({
            to: vendorUser.email,
            subject: `🚨 Paid Campus Order Received (#${updatedOrder.id.slice(-6).toUpperCase()}) - ₦${updatedOrder.totalAmount.toLocaleString()}`,
            html: vendorEmailHtml,
          });
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("[PAYSTACK WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: error.message || "Webhook processing error" }, { status: 500 });
  }
}
