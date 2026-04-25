"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Package, Hash, Tag, MonitorSmartphone } from "lucide-react";

interface ProductColor {
  name: string;
  hex: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  compatibility?: string;
  image_url?: string;
  colors?: ProductColor[];
  created_at: string;
}

interface ProductDetailsModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsModal({
  product,
  open,
  onOpenChange,
}: ProductDetailsModalProps) {
  if (!product) return null;

  // Calcul du stock total depuis les couleurs si existantes
  const hasColors = product.colors && product.colors.length > 0;
  const totalStock = hasColors
    ? product.colors!.reduce((acc, c) => acc + c.stock, 0)
    : product.stock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
          <DialogDescription>
            Détails et informations de stock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Image */}
          {product.image_url ? (
            <div className="w-full h-48 bg-slate-100 dark:bg-zinc-800 rounded-md overflow-hidden relative">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-slate-100 dark:bg-zinc-800 rounded-md flex items-center justify-center">
              <Package size={64} className="text-slate-300" />
            </div>
          )}

          {/* Infos générales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Tag size={16} />
                <span>Catégorie</span>
              </div>
              <p className="font-medium">{product.category}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Hash size={16} />
                <span>SKU (Référence)</span>
              </div>
              <p className="font-medium">{product.sku}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Package size={16} />
                <span>Prix</span>
              </div>
              <p className="font-semibold text-lg text-primary">
                {product.price.toFixed(2)} DT
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MonitorSmartphone size={16} />
                <span>Appareil</span>
              </div>
              <p className="font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit">
                {product.compatibility || "Standard"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">État du Stock</h4>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  totalStock > 10
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                    : totalStock > 0
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30"
                }`}
              >
                Total: {totalStock}
              </span>
            </div>

            {hasColors ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {product.colors!.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded border bg-slate-50 flex items-center justify-between dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="font-medium">
                        {color.name || "Standard"}
                      </span>
                    </div>
                    <span
                      className={`font-mono ${color.stock === 0 ? "text-red-500 font-bold" : ""}`}
                    >
                      {color.stock} {color.stock > 1 ? "unités" : "unité"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded border bg-slate-50 dark:bg-zinc-800/50 flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Ce produit n'a pas de variantes de couleurs.
                </span>
                <span className="font-bold">
                  {totalStock} unités disponibles
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
