'use client';

import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InventoryPart {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

interface InventoryTableProps {
  inventory: InventoryPart[];
  onUpdate: (partId: string, quantity: number, price: number) => void;
}

export function InventoryTable({ inventory, onUpdate }: InventoryTableProps) {
  const isMobile = useIsMobile();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);

  const startEdit = (part: InventoryPart) => {
    setEditingId(part.id);
    setEditQuantity(part.quantity);
    setEditPrice(part.price);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (partId: string) => {
    onUpdate(partId, editQuantity, editPrice);
    setEditingId(null);
  };

  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-4 pb-4">
        {inventory.map((part, idx) => (
          <motion.div
            key={part.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <Card className="overflow-hidden touch-manipulation hover:shadow-md transition-all active:scale-[0.98]">
              <CardContent className="p-4 flex gap-4 items-start">
                {part.image ? (
                  <img
                    src={part.image}
                    alt={part.name}
                    className="h-20 w-20 rounded-md object-cover border border-border/50 shrink-0"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-muted-foreground text-center px-1">Aucune image</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-foreground truncate">{part.name}</h3>
                    <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-0">
                      {part.category}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Prix</p>
                      {editingId === part.id ? (
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                          step="0.01"
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p className="font-medium text-accent">{part.price.toFixed(2)} د.ت</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Quantité</p>
                      {editingId === part.id ? (
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p className={`font-medium ${part.quantity < 5 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                          {part.quantity} unités
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-border/50">
                    {editingId === part.id ? (
                      <>
                        <Button
                          onClick={() => saveEdit(part.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300"
                        >
                          <Check className="h-4 w-4 mr-1.5" /> Enregistrer
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => startEdit(part)}
                        size="sm"
                        variant="secondary"
                        className="h-8 w-full"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Modifier
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Image</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Part Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Quantity</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((part, idx) => (
              <motion.tr
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                key={part.id}
                className={`border-b border-border transition-all duration-150 group ${
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                } hover:bg-primary/5 hover:shadow-sm`}
              >
                <td className="px-6 py-4">
                  {part.image ? (
                    <img
                      src={part.image}
                      alt={part.name}
                      className="h-12 w-12 rounded object-cover border border-border/50 hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-foreground">{part.name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {part.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingId === part.id ? (
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      step="0.01"
                      className="w-24 focus-visible:ring-accent"
                    />
                  ) : (
                    <p className="font-semibold text-accent">{part.price.toFixed(2)} د.ت</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === part.id ? (
                    <Input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                      className="w-24 focus-visible:ring-accent"
                    />
                  ) : (
                    <p className={`font-semibold ${part.quantity < 5 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                      {part.quantity} units
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {editingId === part.id ? (
                      <>
                        <Button
                          onClick={() => saveEdit(part.id)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 transition-colors duration-150 active:scale-90"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors duration-150 active:scale-90"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => startEdit(part)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary transition-all duration-150 active:scale-90"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary/70" />
                      </Button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
