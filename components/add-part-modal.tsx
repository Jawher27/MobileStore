"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Plus as PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  stock: string;
}

interface AddPartModalProps {
  onAddPart: (part: any, file: File | null) => Promise<boolean>;
}

const DEFAULT_CATEGORIES = [
  "Ecrans",
  "Batteries",
  "Nappes/Flex",
  "Ports de charge",
  "Cameras",
  "Etuis et coques",
  "Outils",
];

const PREDEFINED_COLORS = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Gris", hex: "#808080" },
  { name: "Rouge", hex: "#FF0000" },
  { name: "Bleu", hex: "#0080FF" },
  { name: "Vert", hex: "#00AA00" },
  { name: "Jaune", hex: "#FFFF00" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Violet", hex: "#800080" },
  { name: "Rose", hex: "#FFC0CB" },
];

export function AddPartModal({ onAddPart }: AddPartModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useColorVariants, setUseColorVariants] = useState(false);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    compatibility: "",
    min_threshold: "10",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setFormData((prev) => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
      setIsAddingCategory(false);
    }
  };

  const addColorVariant = () => {
    setColorVariants([
      ...colorVariants,
      {
        id: Date.now().toString(),
        name: "",
        hex: "#000000",
        stock: "",
      },
    ]);
  };

  const removeColorVariant = (id: string) => {
    setColorVariants(colorVariants.filter((v) => v.id !== id));
  };

  const updateColorVariant = (
    id: string,
    field: keyof ColorVariant,
    value: string | number,
  ) => {
    setColorVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const calculateTotalQuantity = (): number => {
    if (useColorVariants) {
      return colorVariants.reduce((sum, color) => {
        return sum + (parseInt(color.stock) || 0);
      }, 0);
    }
    return parseInt(formData.quantity) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    if (useColorVariants) {
      if (colorVariants.length === 0) {
        toast({
          title: "Couleurs manquantes",
          description: "Veuillez ajouter au moins une variante de couleur.",
          variant: "destructive",
        });
        return;
      }

      const validColors = colorVariants.every(
        (c) => c.name.trim() && c.hex && c.stock.trim(),
      );
      if (!validColors) {
        toast({
          title: "Donnees invalides",
          description: "Veuillez remplir tous les champs des couleurs.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!formData.quantity) {
        toast({
          title: "Champs manquants",
          description: "Veuillez remplir la quantite.",
          variant: "destructive",
        });
        return;
      }
    }

    const price = parseFloat(formData.price);
    const quantity = calculateTotalQuantity();
    const min_threshold = parseInt(formData.min_threshold) || 0;

    if (price < 0 || quantity < 0 || min_threshold < 0) {
      toast({
        title: "Valeurs invalides",
        description: "Le prix, la quantite et le seuil doivent etre positifs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const part = {
      name: formData.name,
      category: formData.category,
      price,
      quantity,
      min_threshold,
      compatibility: formData.compatibility || null,
      ...(useColorVariants && {
        colors: colorVariants.map((c) => ({
          name: c.name,
          hex: c.hex,
          stock: parseInt(c.stock),
        })),
      }),
    };

    const success = await onAddPart(part, selectedFile);
    setIsLoading(false);

    if (success) {
      setFormData({
        name: "",
        category: "",
        price: "",
        quantity: "",
        compatibility: "",
        min_threshold: "10",
      });
      setColorVariants([]);
      setUseColorVariants(false);
      setSelectedFile(null);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un produit</DialogTitle>
          <DialogDescription>
            Renseignez les details pour l'inventaire.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categorie *</Label>
              {!isAddingCategory ? (
                <Select
                  value={formData.category}
                  onValueChange={(val) => {
                    if (val === "add_new") setIsAddingCategory(true);
                    else handleInputChange("category", val);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="add_new"
                      className="text-blue-600 font-semibold cursor-pointer"
                    >
                      + Nouvelle Categorie
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nom categorie"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddCategory}>
                      OK
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingCategory(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix (DT) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useColors"
                checked={useColorVariants}
                onChange={(e) => setUseColorVariants(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 cursor-pointer"
              />
              <Label htmlFor="useColors" className="cursor-pointer">
                Ce produit a plusieurs couleurs
              </Label>
            </div>
          </div>

          {useColorVariants && (
            <div className="space-y-3 border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between items-center">
                <Label>Variantes de couleur</Label>
                <span className="text-sm font-bold text-primary">
                  Stock total: {calculateTotalQuantity()}
                </span>
              </div>

              {colorVariants.map((color, idx) => (
                <div
                  key={color.id}
                  className="space-y-2 p-3 bg-white dark:bg-slate-800 rounded border"
                >
                  <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-end">
                    <div className="space-y-1">
                      <Label htmlFor={`color-name-${idx}`} className="text-xs">
                        Nom (ex: Noir)
                      </Label>
                      <Input
                        id={`color-name-${idx}`}
                        value={color.name}
                        onChange={(e) =>
                          updateColorVariant(color.id, "name", e.target.value)
                        }
                        disabled={isLoading}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`color-hex-${idx}`} className="text-xs">
                        Couleur
                      </Label>
                      <Input
                        id={`color-hex-${idx}`}
                        type="color"
                        value={color.hex}
                        onChange={(e) =>
                          updateColorVariant(color.id, "hex", e.target.value)
                        }
                        disabled={isLoading}
                        className="h-8 w-full p-0 border-0 cursor-pointer"
                        title={color.name || "Choisir une couleur"}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`color-stock-${idx}`} className="text-xs">
                        Stock
                      </Label>
                      <Input
                        id={`color-stock-${idx}`}
                        type="number"
                        min="0"
                        value={color.stock}
                        onChange={(e) =>
                          updateColorVariant(color.id, "stock", e.target.value)
                        }
                        disabled={isLoading}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Predefined Colors Row */}
                    <div className="col-span-full flex gap-1.5 flex-wrap items-center mt-1">
                      {PREDEFINED_COLORS.map((pc) => (
                        <button
                          key={pc.name}
                          type="button"
                          title={pc.name}
                          onClick={() => {
                            updateColorVariant(color.id, "hex", pc.hex);
                            updateColorVariant(color.id, "name", pc.name);
                          }}
                          className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform"
                          style={{ backgroundColor: pc.hex }}
                        />
                      ))}

                      <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentName = color.name || "";
                          const newName = currentName.includes(" Transparent")
                            ? currentName.replace(" Transparent", "")
                            : currentName
                              ? currentName + " Transparent"
                              : "Transparent";
                          updateColorVariant(color.id, "name", newName);
                        }}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      >
                        + Transparent
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removeColorVariant(color.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addColorVariant}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter une couleur
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {useColorVariants ? (
              <div /> 
            ) : (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité globale *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="min_threshold">Alerte seuil min</Label>
                <Input
                  id="min_threshold"
                  type="number"
                  min="0"
                  value={formData.min_threshold}
                  onChange={(e) => handleInputChange("min_threshold", e.target.value)}
                  disabled={isLoading}
                  placeholder="10"
                />
              </div>
            </div>

          <div className="space-y-2">
            <Label htmlFor="compatibility">
              Appareil (Optionnel - ex: iPhone 15)
            </Label>
            <Input
              id="compatibility"
              value={formData.compatibility}
              onChange={(e) =>
                handleInputChange("compatibility", e.target.value)
              }
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image (Optionnel)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0])
                  setSelectedFile(e.target.files[0]);
              }}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ajout..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
