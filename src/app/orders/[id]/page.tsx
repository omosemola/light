import type { Metadata } from "next";
import { getLiveOrderById } from "@/actions/orders";
import OrderTrackingClient from "./OrderTrackingClient";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const shortId = id.length > 10 ? id.slice(-6).toUpperCase() : id;

  return {
    title: `Order Receipt #${shortId} — Lightson Marketplace`,
    description: `Track live order status, receipt details, and vendor delivery for order #${shortId} on Lightson.`,
  };
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params;
  const res = await getLiveOrderById(id);

  return (
    <OrderTrackingClient
      initialOrder={res.success ? res.order : null}
      id={id}
    />
  );
}
