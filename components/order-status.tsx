"use client";

import { CheckCircle2, Clock, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Order {
  id: string | number;
  partName: string;
  shopNumber: number;
  status: "pending" | "approved" | "rejected" | "completed" | string;
  timeOrdered: string;
  rawOrder?: any;
}

interface OrderStatusProps {
  orders: Order[];
  onOrderClick?: (order: any) => void;
}

const STATUS_CONFIG: Record<
  string,
  { icon: any; label: string; color: string }
> = {
  pending: {
    icon: Clock,
    label: "En attente",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  },
  approved: {
    icon: Clock,
    label: "En préparation / approuvée",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  rejected: {
    icon: Truck,
    label: "Rejetée",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  },
  completed: {
    icon: CheckCircle2,
    label: "Livrée",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  // Fallbacks for older dummy data if needed
  preparing: {
    icon: Clock,
    label: "Preparing",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  "with-delivery": {
    icon: Truck,
    label: "With Livreur",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
  delivered: {
    icon: CheckCircle2,
    label: "Delivered",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
};

export function OrderStatus({ orders, onOrderClick }: OrderStatusProps) {
  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 border-t border-border bg-gradient-to-t from-card to-card/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Vos commandes actives
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {orders.map((order, idx) => {
            const config = STATUS_CONFIG[order.status] || {
              icon: Clock,
              label: "Inconnu",
              color: "bg-gray-100 text-gray-800",
            };
            const Icon = config.icon;
            return (
              <div
                key={order.id}
                onClick={() => onOrderClick && onOrderClick(order)}
                className={`flex-shrink-0 rounded-lg border border-border/50 bg-muted/20 p-3 min-w-[280px] hover:shadow-md transition-all duration-200 snap-start backdrop-blur-xs hover:border-primary/50 ${onOrderClick ? "cursor-pointer" : ""}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {order.partName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      à {order.timeOrdered}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 whitespace-nowrap font-medium transition-all ${config.color}`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs">{config.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
