"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Package,
  ListOrdered,
  FileText,
  History,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderStatus } from "./order-status";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "All",
  "Ecrans",
  "Batteries",
  "Nappes/Flex",
  "Ports de charge",
  "Cameras",
  "Etuis et coques",
  "Outils",
];

interface ProductColor {
  name: string;
  hex: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  compatibility?: string;
  stock: number;
  image_url?: string;
  colors?: ProductColor[];
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: ProductColor;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export function RepairShopView() {
  const [currentTab, setCurrentTab] = useState<
    "articles" | "commandes" | "factures" | "historique"
  >("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});
  const [selectedColors, setSelectedColors] = useState<
    Record<string, ProductColor>
  >({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, product:product_id(*))")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.compatibility
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes("All") ||
        selectedCategories.includes(product.category);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories, products]);

  const addToCart = (product: Product) => {
    const hasColors = product.colors && product.colors.length > 0;
    const color = selectedColors[product.id];
    const quantityToAdd = selectedQuantities[product.id] || 1;

    if (hasColors && !color) {
      toast({
        title: "Couleur requise",
        description:
          "Veuillez sélectionner une couleur avant d'ajouter au panier.",
        variant: "destructive",
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor?.name === color?.name,
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          item.selectedColor?.name === color?.name
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item,
        );
      }
      return [
        ...prev,
        { product, quantity: quantityToAdd, selectedColor: color },
      ];
    });

    toast({
      title: "Ajouté au panier",
      description: `${product.name} ${color ? `(${color.name})` : ""} a été ajouté.`,
    });

    // Clear selection after adding
    if (color) {
      setSelectedColors((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  const removeFromCart = (product: Product, colorName?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === product.id &&
            item.selectedColor?.name === colorName
          ),
      ),
    );
  };

  const updateQuantity = (
    product: Product,
    colorName: string | undefined,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      removeFromCart(product, colorName);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id &&
          item.selectedColor?.name === colorName
            ? { ...item, quantity }
            : item,
        ),
      );
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description:
          "Veuillez ajouter des articles avant de valider la commande.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour passer commande.",
          variant: "destructive",
        });
        return;
      }

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          client_id: user.id,
          status: "pending",
          total_amount: cartTotal,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        color_name: item.selectedColor?.name || null,
        color_hex: item.selectedColor?.hex || null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Commande validée !",
        description: `Votre commande a été envoyée au fournisseur avec succès.`,
      });

      setCart([]);
      setIsCartOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la validation de la commande.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatOrders = orders.map((o: any) => {
    const isMultiple = o.order_items && o.order_items.length > 1;
    const name =
      o.order_items && o.order_items.length > 0
        ? isMultiple
          ? `${o.order_items.length} articles`
          : o.order_items[0].product?.name || "Article sans nom"
        : "Commande vide";
    const shortId =
      typeof o.id === "string" ? o.id.slice(0, 8).toUpperCase() : o.id;
    return {
      id: o.id,
      partName: `CMD #${shortId} - ${name}`,
      shopNumber: 0,
      status: o.status,
      timeOrdered: new Date(o.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      rawOrder: o,
    };
  });

  const getProductStock = (product: Product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors.reduce((sum, c) => sum + c.stock, 0);
    }
    return product.stock || 0; // Fallback
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto pb-16">
      {/* Header & Navbar */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-6 pb-0 border-b border-border/50">
          <h1 className="text-2xl font-bold">Espace Client</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Gérez vos commandes, factures et catalogue de pièces
          </p>

          <div className="flex overflow-x-auto space-x-1 pb-px hide-scrollbar">
            <button
              onClick={() => setCurrentTab("articles")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                currentTab === "articles"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Catalogue Articles
            </button>
            <button
              onClick={() => setCurrentTab("commandes")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                currentTab === "commandes"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Mes Commandes
            </button>
            <button
              onClick={() => setCurrentTab("factures")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                currentTab === "factures"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <FileText className="w-4 h-4" />
              Factures
            </button>
            <button
              onClick={() => setCurrentTab("historique")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                currentTab === "historique"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <History className="w-4 h-4" />
              Historique
            </button>
          </div>
        </div>
      </div>

      {currentTab === "articles" && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <Card className="p-4 border-border shadow-sm">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Catégories
              </h3>
              <div className="space-y-3">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (category === "All") {
                            setSelectedCategories(["All"]);
                          } else {
                            setSelectedCategories((prev) => [
                              ...prev.filter((c) => c !== "All"),
                              category,
                            ]);
                          }
                        } else {
                          setSelectedCategories((prev) =>
                            prev.filter((c) => c !== category),
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`cat-${category}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6 min-w-0">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher des pièces (ex: iPhone 13, Batterie...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            {/* Products Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const totalStock = getProductStock(product);
                const hasColors = product.colors && product.colors.length > 0;

                return (
                  <Card
                    key={product.id}
                    className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-200 group border-border"
                  >
                    {product.image_url ? (
                      <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-slate-100 dark:bg-zinc-800 border-b flex items-center justify-center">
                        <Package size={48} className="text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-balance">
                            {product.name}
                          </h3>
                          <Badge
                            variant={totalStock > 0 ? "default" : "secondary"}
                            className={
                              totalStock > 0
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 flex-shrink-0"
                            }
                          >
                            {totalStock > 0 ? `${totalStock} dispo` : "Rupture"}
                          </Badge>
                        </div>

                        {product.compatibility && (
                          <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded w-fit border border-blue-100 dark:border-blue-800/50">
                            Appareil: {product.compatibility}
                          </div>
                        )}

                        {hasColors && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">
                              Sélectionnez une couleur :
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                              {product.colors!.map((color, idx) => {
                                const isSelected =
                                  selectedColors[product.id]?.name ===
                                  color.name;
                                return (
                                  <button
                                    key={`${color.name}-${idx}`}
                                    onClick={() =>
                                      setSelectedColors((prev) => ({
                                        ...prev,
                                        [product.id]: color,
                                      }))
                                    }
                                    disabled={color.stock <= 0}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                                      isSelected
                                        ? "scale-110 border-primary shadow-md"
                                        : "border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105"
                                    } ${color.stock <= 0 ? "opacity-30 cursor-not-allowed cross-pattern" : ""}`}
                                    style={{ backgroundColor: color.hex }}
                                    title={`${color.name} (${color.stock} unités)`}
                                  />
                                );
                              })}
                            </div>
                            {selectedColors[product.id] && (
                              <p className="text-xs font-semibold mt-1">
                                {selectedColors[product.id].name} (
                                {selectedColors[product.id].stock} dispo)
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xl font-bold font-mono">
                          {product.price.toFixed(2)} DT
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
                            <button
                              onClick={() =>
                                setSelectedQuantities((prev) => ({
                                  ...prev,
                                  [product.id]: Math.max(
                                    1,
                                    (prev[product.id] || 1) - 1,
                                  ),
                                }))
                              }
                              className="h-7 w-7 rounded-md bg-background shadow-sm hover:bg-muted flex items-center justify-center transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {selectedQuantities[product.id] || 1}
                            </span>
                            <button
                              onClick={() =>
                                setSelectedQuantities((prev) => ({
                                  ...prev,
                                  [product.id]: (prev[product.id] || 1) + 1,
                                }))
                              }
                              className="h-7 w-7 rounded-md bg-background shadow-sm hover:bg-muted flex items-center justify-center transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <Button
                            onClick={() => addToCart(product)}
                            disabled={
                              totalStock === 0 ||
                              (hasColors && !selectedColors[product.id])
                            }
                            size="sm"
                            className="flex items-center gap-1.5 px-3"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Ajouter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucun produit ne correspond à ces critères.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === "commandes" && (
        <div className="space-y-6">
          <Card className="p-6 flex items-center justify-between bg-primary/5 border-primary/20">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                Vos Commandes en cours
              </h2>
              <p className="text-sm text-muted-foreground">
                Voici la liste des commandes en cours de traitement.
              </p>
            </div>
            <ListOrdered className="w-12 h-12 opacity-50 text-primary" />
          </Card>

          {orders.length > 0 ? (
            <OrderStatus
              orders={formatOrders}
              onOrderClick={(o) => {
                setSelectedOrder(o.rawOrder);
                setIsOrderModalOpen(true);
              }}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
              <ListOrdered className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Vous n'avez aucune commande en cours.</p>
            </div>
          )}
        </div>
      )}

      {currentTab === "factures" && (
        <div className="space-y-6">
          <Card className="p-6 flex items-center justify-between text-muted-foreground border-dashed bg-transparent">
            <div>
              <h2 className="text-xl font-semibold mb-1 text-foreground">
                Factures
              </h2>
              <p className="text-sm">Cette section sera bientôt disponible.</p>
            </div>
            <FileText className="w-12 h-12 opacity-20" />
          </Card>
        </div>
      )}

      {currentTab === "historique" && (
        <div className="space-y-6">
          <Card className="p-6 flex items-center justify-between text-muted-foreground border-dashed bg-transparent">
            <div>
              <h2 className="text-xl font-semibold mb-1 text-foreground">
                Historique d'Achats
              </h2>
              <p className="text-sm">Cette section sera bientôt disponible.</p>
            </div>
            <History className="w-12 h-12 opacity-20" />
          </Card>
        </div>
      )}

      {/* Cart Button only valid if articles open, wait no, kept separate! */}
      {/* Shopping Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <button className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </SheetTrigger>

        <SheetContent className="flex flex-col w-full sm:max-w-md bg-background border-l p-0 sm:p-6 overflow-hidden">
          <SheetHeader className="px-6 py-4 sm:px-0 sm:py-0 border-b sm:border-0">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Panier
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 flex-1">
              <div className="rounded-full bg-muted p-6">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">
                Votre panier est vide
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 sm:px-0 py-4 space-y-3">
                {cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor?.name || "def"}-${idx}`}
                    className="border rounded-lg p-3 space-y-3 bg-card shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-4">
                      {item.product.image_url ? (
                        <div className="w-12 h-12 rounded bg-slate-100 flex-shrink-0">
                          <img
                            src={item.product.image_url}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package size={20} className="text-slate-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {item.product.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-medium text-primary">
                            {item.product.price.toFixed(2)} DT/u
                          </span>

                          {item.selectedColor && (
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                              <div
                                className="w-3 h-3 rounded-full border shadow-sm"
                                style={{
                                  backgroundColor: item.selectedColor.hex,
                                }}
                              />
                              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {item.selectedColor.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          removeFromCart(item.product, item.selectedColor?.name)
                        }
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product,
                              item.selectedColor?.name,
                              item.quantity - 1,
                            )
                          }
                          className="h-7 w-7 rounded-md bg-background shadow-sm hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product,
                              item.selectedColor?.name,
                              item.quantity + 1,
                            )
                          }
                          className="h-7 w-7 rounded-md bg-background shadow-sm hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-bold font-mono">
                        {(item.quantity * item.product.price).toFixed(2)} DT
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t bg-card p-6 sm:px-0 pb-6 space-y-4 mt-auto">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="font-mono text-primary">
                    {cartTotal.toFixed(2)} DT
                  </span>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isLoading
                      ? "Traitement en cours..."
                      : "Valider la Commande"}
                  </Button>
                  <Button
                    onClick={() => setIsCartOpen(false)}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Continuer mes achats
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden border-0 shadow-2xl">
          {selectedOrder && (
            <div className="flex flex-col">
              <div className="p-6 bg-slate-50 dark:bg-zinc-900 border-b flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Détail de la commande
                  </p>
                  <DialogTitle className="text-2xl">
                    CMD #
                    {typeof selectedOrder.id === "string"
                      ? selectedOrder.id.slice(0, 8).toUpperCase()
                      : selectedOrder.id}
                  </DialogTitle>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Passée le{" "}
                    {new Date(selectedOrder.created_at).toLocaleDateString(
                      "fr-FR",
                    )}{" "}
                    à{" "}
                    {new Date(selectedOrder.created_at).toLocaleTimeString(
                      "fr-FR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </p>
                </div>
                <Badge className="px-4 py-1.5 text-sm uppercase tracking-wide">
                  {selectedOrder.status === "pending"
                    ? "EN ATTENTE"
                    : selectedOrder.status === "approved"
                      ? "EN LIVRAISON"
                      : selectedOrder.status === "rejected"
                        ? "REJETÉE"
                        : selectedOrder.status === "completed"
                          ? "LIVRÉE"
                          : selectedOrder.status}
                </Badge>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <h4 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Package size={16} /> Lignes de produits
                </h4>
                <div className="space-y-4">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-3 border-b border-dashed border-slate-200 dark:border-zinc-800 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {item.product?.name || "Article Inconnu"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          {item.product?.sku}
                          {item.color_name ? (
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-sans font-medium text-[10px] tracking-wider uppercase text-slate-600 dark:text-slate-400">
                              ❖ {item.color_name}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-slate-500 font-medium">
                          {item.quantity} x {item.unit_price.toFixed(2)}
                        </span>
                        <span className="font-black font-mono w-24 text-right">
                          {(item.quantity * item.unit_price).toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-slate-800 dark:border-slate-200 font-black text-2xl">
                    <span>Total Net</span>
                    <span className="font-mono text-primary">
                      {selectedOrder.total_amount?.toFixed(2) || "0.00"} DT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
