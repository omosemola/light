import { OrderStatus } from "@prisma/client";

/**
 * Valid state transitions for Order Lifecycle.
 * Prevents invalid state jumps (e.g., DELIVERED -> PENDING) and guards database integrity.
 */
export const ORDER_TRANSITION_MATRIX: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ACCEPTED]: [
    OrderStatus.PREPARING,
    OrderStatus.READY_FOR_DELIVERY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_DELIVERY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_DELIVERY]: [
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [], // Terminal state
};

export interface OrderStatusMeta {
  status: OrderStatus;
  label: string;
  studentDescription: string;
  vendorDescription: string;
  stepIndex: number; // 1..4 (or 0 for CANCELLED)
  progressPercentage: number;
  isTerminal: boolean;
  colorClass: string;
  dotColor: string;
  badgeBg: string;
}

export const ORDER_STATUS_METADATA: Record<OrderStatus, OrderStatusMeta> = {
  [OrderStatus.PENDING]: {
    status: OrderStatus.PENDING,
    label: "Order Placed & Awaiting Confirmation",
    studentDescription: "Your order has been received by the merchant and is waiting to be accepted.",
    vendorDescription: "New incoming student order. Review items and accept to begin processing.",
    stepIndex: 1,
    progressPercentage: 25,
    isTerminal: false,
    colorClass: "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
    badgeBg: "bg-blue-500",
  },
  [OrderStatus.ACCEPTED]: {
    status: OrderStatus.ACCEPTED,
    label: "Order Accepted by Store",
    studentDescription: "The merchant has accepted your order and is queuing your items.",
    vendorDescription: "Order accepted. Prepare items for dispatch or collection.",
    stepIndex: 2,
    progressPercentage: 45,
    isTerminal: false,
    colorClass: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-500",
  },
  [OrderStatus.PREPARING]: {
    status: OrderStatus.PREPARING,
    label: "Store Preparing Your Order",
    studentDescription: "Your order is actively being prepared, packaged, or inspected by the store.",
    vendorDescription: "Items currently being packaged and prepared for dispatch.",
    stepIndex: 2,
    progressPercentage: 55,
    isTerminal: false,
    colorClass: "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-500",
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    status: OrderStatus.READY_FOR_DELIVERY,
    label: "Packaged & Ready for Dispatch",
    studentDescription: "Items are packaged and waiting for the hostel courier runner.",
    vendorDescription: "Package ready. Dispatching runner or handing over to campus delivery.",
    stepIndex: 3,
    progressPercentage: 70,
    isTerminal: false,
    colorClass: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
    badgeBg: "bg-indigo-500",
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    status: OrderStatus.OUT_FOR_DELIVERY,
    label: "Out for Delivery to Your Hostel",
    studentDescription: "Campus courier is on the way to your specified delivery address.",
    vendorDescription: "Courier is en route to student hostel address.",
    stepIndex: 3,
    progressPercentage: 85,
    isTerminal: false,
    colorClass: "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    dotColor: "bg-indigo-500",
    badgeBg: "bg-indigo-500",
  },
  [OrderStatus.DELIVERED]: {
    status: OrderStatus.DELIVERED,
    label: "Delivered Successfully",
    studentDescription: "Package handed over and order fulfilled. Enjoy your items!",
    vendorDescription: "Order successfully completed and verified by student.",
    stepIndex: 4,
    progressPercentage: 100,
    isTerminal: true,
    colorClass: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-500",
  },
  [OrderStatus.CANCELLED]: {
    status: OrderStatus.CANCELLED,
    label: "Order Cancelled",
    studentDescription: "This order was cancelled. If you were debited, settlement is auto-reversed.",
    vendorDescription: "This order was cancelled.",
    stepIndex: 0,
    progressPercentage: 0,
    isTerminal: true,
    colorClass: "bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dotColor: "bg-rose-500",
    badgeBg: "bg-rose-500",
  },
};

/**
 * Validates whether an order can transition from `currentStatus` to `targetStatus`.
 */
export function canTransitionOrder(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  if (currentStatus === targetStatus) return true; // Idempotent
  const allowed = ORDER_TRANSITION_MATRIX[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Returns all valid next statuses for a given order status.
 */
export function getNextOrderStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITION_MATRIX[currentStatus] || [];
}

/**
 * Checks if the order is in a terminal (immutable) state.
 */
export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_METADATA[status]?.isTerminal ?? false;
}

/**
 * Retrieves display metadata for an order status.
 */
export function getOrderStatusMeta(status: string | OrderStatus): OrderStatusMeta {
  const normalized = status as OrderStatus;
  return (
    ORDER_STATUS_METADATA[normalized] || {
      status: OrderStatus.PENDING,
      label: status || "Order Placed",
      studentDescription: "Order status update.",
      vendorDescription: "Order status update.",
      stepIndex: 1,
      progressPercentage: 25,
      isTerminal: false,
      colorClass: "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
      dotColor: "bg-slate-500",
      badgeBg: "bg-slate-500",
    }
  );
}

