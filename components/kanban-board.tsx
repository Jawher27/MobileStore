'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface Order {
  id: string;
  shopNumber: number;
  partName: string;
  quantity: number;
  status: 'new' | 'preparing' | 'with-delivery' | 'completed';
  timeOrdered: string;
}

interface KanbanBoardProps {
  orders: Order[];
  onMoveOrder: (orderId: string, newStatus: 'new' | 'preparing' | 'with-delivery' | 'completed') => void;
}

const COLUMNS = [
  { id: 'new', title: 'New Requests' },
  { id: 'preparing', title: 'Preparing' },
  { id: 'with-delivery', title: 'With Livreur' },
  { id: 'completed', title: 'Completed' },
];

const TRANSITIONS: Record<string, string> = {
  'new': 'preparing',
  'preparing': 'with-delivery',
  'with-delivery': 'completed',
  'completed': 'completed',
};

export function KanbanBoard({ orders, onMoveOrder }: KanbanBoardProps) {
  return (
    <div className="grid gap-4 overflow-x-auto pb-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((column) => (
        <div key={column.id} className="flex flex-col min-w-[300px] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{column.title}</h3>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {orders.filter(o => o.status === column.id).length}
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {orders
              .filter((order) => order.status === column.id)
              .map((order) => (
                <Card
                  key={order.id}
                  className="p-4 space-y-2 border-l-4 border-l-primary hover:shadow-lg transition-all duration-200 bg-card hover:bg-primary/5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{order.partName}</p>
                      <p className="text-xs text-muted-foreground">Shop #{order.shopNumber}</p>
                    </div>
                    <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary whitespace-nowrap group-hover:bg-primary/30 transition-colors">
                      Qty: {order.quantity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ordered: {order.timeOrdered}</p>

                  {column.id !== 'completed' && (
                    <Button
                      onClick={() => onMoveOrder(order.id, TRANSITIONS[column.id] as any)}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-primary/30"
                    >
                      <ChevronRight className="h-3.5 w-3.5 mr-1" />
                      Move Forward
                    </Button>
                  )}
                </Card>
              ))}

            {orders.filter(o => o.status === column.id).length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center py-8">
                <p className="text-xs text-muted-foreground">No orders</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
