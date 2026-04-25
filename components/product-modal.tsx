'use client';

import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProductModalProps {
  part: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  shopNumber: string;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

export function ProductModal({ part, shopNumber, onConfirm, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, Math.min(50, quantity + delta)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">Request Part</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Part Image */}
        {part.image && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={part.image}
              alt={part.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Part Details */}
        <div className="space-y-3 bg-muted/30 rounded-lg p-4">
          <h3 className="font-semibold text-foreground text-balance">{part.name}</h3>
          <p className="text-2xl font-bold text-primary">{part.price.toFixed(2)} د.ت</p>
        </div>

        {/* Shop Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Shop Number</label>
          <div className="rounded-lg bg-muted/50 px-4 py-3 font-mono font-medium text-foreground">
            #{shopNumber}
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Quantity</label>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="rounded p-1 hover:bg-muted transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4 text-muted-foreground" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="w-16 bg-transparent text-center font-semibold text-foreground outline-none"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              className="rounded p-1 hover:bg-muted transition-colors"
              disabled={quantity >= 50}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Order Total */}
        <div className="rounded-lg bg-accent/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Cost</span>
            <span className="text-xl font-bold text-accent">{(part.price * quantity).toFixed(2)} د.ت</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(quantity);
            }}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Send Request
          </Button>
        </div>
      </Card>
    </div>
  );
}
