"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AddPartModal } from "./add-part-modal";
import { ProductDetailsModal } from "./product-details-modal";
import { Card } from "@/components/ui/card";
import {
  Package,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  FileText,
  History,
  CheckCircle,
  Check,
  Printer,
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoiceTicket } from "./invoice-ticket";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  min_threshold?: number;
}

export function SupplierAdminView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<
    "dashboard" | "produits" | "commandes" | "factures" | "historique"
  >("dashboard");
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isFacturesExpanded, setIsFacturesExpanded] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<any>(null);

  const supabase = createClient();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data: oData } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(name, sku))")
      .order("created_at", { ascending: false });

    const { data: pData } = await supabase
      .from("profiles")
      .select("id, email, company_name");

    if (oData && pData) {
      const enriched = oData.map((o) => ({
        ...o,
        client: pData.find((p) => p.id === o.client_id) || {
          company_name: "Client Inconnu",
          email: "N/A",
        },
      }));
      setOrders(enriched);
    }
  };

  const handleApproveOrder = async (order: any) => {
    // Déduction des stocks
    for (const item of order.order_items) {
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .single();

      if (prod) {
        if (item.color_name && prod.colors) {
          const newColors = prod.colors.map((c: any) =>
            c.name === item.color_name
              ? { ...c, stock: Math.max(0, c.stock - item.quantity) }
              : c,
          );
          await supabase
            .from("products")
            .update({
              colors: newColors,
              stock: Math.max(0, prod.stock - item.quantity),
            })
            .eq("id", prod.id);
        } else {
          await supabase
            .from("products")
            .update({ stock: Math.max(0, prod.stock - item.quantity) })
            .eq("id", prod.id);
        }
      }
    }

    await supabase
      .from("orders")
      .update({ status: "approved" })
      .eq("id", order.id);

    toast({
      title: "Commande en livraison !",
      description: "Le stock a été déduit et la facture est prête.",
    });

    fetchOrders();
    fetchProducts(); // refresh products stock
    setIsOrderModalOpen(false);
  };

  const handleMarkPaid = async (orderId: string) => {
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);
    toast({
      title: "Commande soldée",
      description: "Mise à jour réussie. Classée dans l'historique.",
    });
    fetchOrders();
    setIsOrderModalOpen(false);
  };

  const handlePrint = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleAddProduct = async (partData: any, file: File | null) => {
    try {
      const sku = `PROD-${Math.floor(Date.now() / 1000)}`;
      let image_url = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("parts")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from("parts")
          .getPublicUrl(filePath);
        image_url = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          name: partData.name,
          sku: sku,
          category: partData.category,
          price: partData.price,
          stock: partData.quantity,
          compatibility: partData.compatibility || null,
          image_url: image_url,
          colors: partData.colors || null,
          min_threshold: partData.min_threshold || 10,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      toast({ title: "Success", description: "Produit ajoute avec succes !" });
      setProducts([data, ...products]);
      return true;
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category)),
  ).filter(Boolean) as string[];

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const deliveringOrders = orders.filter((o) => o.status === "approved");
  const completedOrders = orders.filter((o) => o.status === "completed");

  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );

  const lowStockProducts = products.filter((p) => {
    if (p.colors && p.colors.length > 0) {
      return p.colors.some((c) => c.stock <= (p.min_threshold ?? 10));
    }
    return p.stock <= (p.min_threshold ?? 10);
  });

  const topProductsData = (() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      o.order_items?.forEach((item: any) => {
        const name = item.product?.name || "Inconnu";
        counts[name] = (counts[name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  })();

  const topClientsData = (() => {
    const clients: Record<string, number> = {};
    orders.forEach((o) => {
      const cName = o.client?.company_name || "Inconnu";
      clients[cName] = (clients[cName] || 0) + (o.total_amount || 0);
    });
    return Object.entries(clients)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sum]) => ({ name, sum }));
  })();

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const renderOrderList = (orderList: any[], emptyMessage: string) => {
    if (orderList.length === 0) {
      return (
        <div className="bg-slate-50 dark:bg-zinc-900 border border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center">
          <FileText size={48} className="text-slate-300 mb-4" />
          <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {orderList.map((order) => (
          <Card
            key={order.id}
            className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-primary transition-colors hover:shadow-sm"
            onClick={() => {
              setSelectedOrder(order);
              setIsOrderModalOpen(true);
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">
                  {order.client.company_name}
                </h3>
                <Badge
                  variant={
                    order.status === "pending"
                      ? "secondary"
                      : order.status === "approved"
                        ? "default"
                        : "outline"
                  }
                >
                  {order.status === "pending"
                    ? "En attente"
                    : order.status === "approved"
                      ? "En livraison"
                      : "Payée"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleString("fr-FR")} •{" "}
                {order.order_items.length} articles
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono font-extrabold text-xl text-primary">
                {order.total_amount.toFixed(2)} DT
              </div>
              <ChevronRight className="opacity-50" />
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden text-black dark:text-white bg-slate-50 dark:bg-zinc-950 relative">
      {/* 
        ========================================
        LA FENÊTRE D'IMPRESSION (cachée par défaut)
        ========================================
      */}
      <div className="hidden print:block absolute top-0 left-0 w-full min-h-full bg-white z-[9999] text-black">
        {printOrder && <InvoiceTicket ref={invoiceRef} order={printOrder} />}
      </div>

      {/* 
        ========================================
        LE CONTENU NORMAL DE LA PAGE (caché à l'impression)
        ========================================
      */}
      <div className="flex w-full h-full print:hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white dark:bg-zinc-900 flex flex-col z-10 shadow-sm relative">
          <div className="p-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
            <h2 className="font-bold text-xl text-primary tracking-tight">
              Fournisseur
            </h2>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto space-y-1">              {/* DASHBOARD */}
              <div className="mb-2">
                <button
                  onClick={() => {
                    setCurrentTab("dashboard");
                    setIsProductsExpanded(false);
                    setIsFacturesExpanded(false);
                  }}
                  className={`flex items-center w-full p-2.5 rounded-lg transition-colors font-medium text-sm ${
                    currentTab === "dashboard"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard size={18} />
                    <span>Tableau de Bord</span>
                  </div>
                </button>
              </div>
            {/* PRODUITS */}
            <div className="mb-2">
              <button
                onClick={() => {
                  setCurrentTab("produits");
                  if (currentTab !== "produits") setIsProductsExpanded(true);
                  else setIsProductsExpanded(!isProductsExpanded);
                }}
                className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors font-medium text-sm ${
                  currentTab === "produits"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package size={18} />
                  <span>Catalogue / Stock</span>
                </div>
                {isProductsExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

              {isProductsExpanded && currentTab === "produits" && (
                <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l-2 border-slate-100 dark:border-zinc-800 pl-4 py-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedCategory === null
                        ? "bg-slate-100 dark:bg-zinc-800 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600"
                    }`}
                  >
                    Tous les produits
                  </button>
                  {categories.map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                        selectedCategory === cat
                          ? "bg-slate-100 dark:bg-zinc-800 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-slate-100 dark:bg-zinc-800 my-4" />

            {/* COMMANDES */}
            <button
              onClick={() => setCurrentTab("commandes")}
              className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors font-medium text-sm mb-2 ${
                currentTab === "commandes"
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={18} />
                <span>Commandes</span>
              </div>
              {pendingOrders.length > 0 && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded-md px-1.5 py-0 min-w-[20px] justify-center">
                  {pendingOrders.length}
                </Badge>
              )}
            </button>

            {/* FACTURES & HISTORIQUE */}
            <div>
              <button
                onClick={() => {
                  if (
                    currentTab !== "factures" &&
                    currentTab !== "historique"
                  ) {
                    setCurrentTab("factures");
                    setIsFacturesExpanded(true);
                  } else {
                    setIsFacturesExpanded(!isFacturesExpanded);
                  }
                }}
                className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors font-medium text-sm ${
                  currentTab === "factures" || currentTab === "historique"
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={18} />
                  <span>Facturation / CA</span>
                </div>
                {isFacturesExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

              {isFacturesExpanded &&
                (currentTab === "factures" || currentTab === "historique") && (
                  <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l-2 border-slate-100 dark:border-zinc-800 pl-4 py-1">
                    <button
                      onClick={() => setCurrentTab("factures")}
                      className={`flex items-center justify-between px-3 py-1.5 text-sm rounded-md transition-colors ${
                        currentTab === "factures"
                          ? "bg-slate-100 dark:bg-zinc-800 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600"
                      }`}
                    >
                      <span>À facturer / Livrées</span>
                      {deliveringOrders.length > 0 && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-1.5 rounded">
                          {deliveringOrders.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setCurrentTab("historique")}
                      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                        currentTab === "historique"
                          ? "bg-slate-100 dark:bg-zinc-800 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-slate-600"
                      }`}
                    >
                      <History size={14} className="opacity-70" />
                      <span>Historique Payé</span>
                    </button>
                  </div>
                )}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-transparent">            {/* TAB: DASHBOARD */}
            {currentTab === "dashboard" && (
              <div className="w-full max-w-7xl mx-auto space-y-8">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight mb-2">Tableau de Bord</h1>
                  <p className="text-muted-foreground">Vue d'ensemble de vos statistiques et alertes d'inventaire.</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-6 border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-muted-foreground">Commandes en attente</h3>
                      <ShoppingCart className="text-amber-500" size={20} />
                    </div>
                    <p className="text-3xl font-black">{pendingOrders.length}</p>
                  </Card>
                  
                  <Card className="p-6 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-muted-foreground">Commandes payées/livrées</h3>
                      <CheckCircle className="text-green-500" size={20} />
                    </div>
                    <p className="text-3xl font-black">{completedOrders.length}</p>
                  </Card>

                  <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-muted-foreground">Chiffre d'Affaires</h3>
                      <TrendingUp className="text-blue-500" size={20} />
                    </div>
                    <p className="text-3xl font-black">{totalRevenue.toFixed(2)} DT</p>
                  </Card>

                  <Card className={`p-6 border-l-4 ${lowStockProducts.length > 0 ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20" : "border-l-slate-300"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-semibold ${lowStockProducts.length > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                        Alertes Stock ({lowStockProducts.length})
                      </h3>
                      <AlertTriangle className={lowStockProducts.length > 0 ? "text-red-500" : "text-slate-300"} size={20} />
                    </div>
                    <p className={`text-3xl font-black ${lowStockProducts.length > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                      {lowStockProducts.length > 0 ? `${lowStockProducts.length} critiques` : "Aucune alerte"}
                    </p>
                  </Card>
                </div>

                {/* GRAPHICS & ALERTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Popular Products Chart */}
                  <Card className="p-6 lg:col-span-1 border-slate-200">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                       Produits les plus demandés
                    </h3>
                    <div className="h-64 w-full">
                      {topProductsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={topProductsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {topProductsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value) => [`${value} unités`, "Vendus"]} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                         <div className="h-full flex items-center justify-center text-muted-foreground">Pas de données</div>
                      )}
                    </div>
                  </Card>

                  {/* Top Clients Chart */}
                  <Card className="p-6 lg:col-span-1 border-slate-200">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Users size={18} className="text-primary" /> Top 5 Clients
                    </h3>
                    <div className="h-64 w-full">
                      {topClientsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topClientsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                            <RechartsTooltip formatter={(value) => [`${parseFloat(value as string).toFixed(2)} DT`, "C.A"]} />
                            <Bar dataKey="sum" fill="#0088FE" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                         <div className="h-full flex items-center justify-center text-muted-foreground">Pas de données</div>
                      )}
                    </div>
                  </Card>

                  {/* Critical Stock List */}
                  <Card className={`p-6 lg:col-span-1 overflow-hidden flex flex-col ${lowStockProducts.length > 0 ? "border-red-200" : "border-slate-200"}`}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-600">
                      <AlertTriangle size={18} /> Risque de Rupture
                    </h3>
                    <div className="flex-1 overflow-y-auto">
                      {lowStockProducts.length > 0 ? (
                        <div className="space-y-3">
                          {lowStockProducts.map(p => (
                            <div key={p.id} className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate pr-2 max-w-[150px]">{p.name}</p>
                                <p className="text-xs text-red-600/80 font-medium">Seuil: {p.min_threshold ?? 10}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="destructive" className="font-mono text-xs px-2 py-0.5">
                                  {p.colors && p.colors.length > 0 ? "Multi" : `Stock: ${p.stock}`}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                          <CheckCircle className="text-green-400 mb-2" size={32} />
                          <p>Aucun produit sous le seuil critique.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          {/* TAB: PRODUITS */}
          {currentTab === "produits" && (
            <div className="w-full max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    Gestion du Stock
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm font-medium">
                    {selectedCategory
                      ? `Catégorie : ${selectedCategory}`
                      : "Tous les produits"}{" "}
                    ({filteredProducts.length})
                  </p>
                </div>
                <AddPartModal onAddPart={handleAddProduct} />
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  Chargement...
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer border-slate-100 dark:border-zinc-800"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsProductModalOpen(true);
                      }}
                    >
                      {/* Product Card Content existing ... */}
                      {product.image_url ? (
                        <div className="w-full h-48 bg-slate-50 dark:bg-zinc-800/50 border-b">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-50 dark:bg-zinc-800/50 border-b flex items-center justify-center">
                          <Package
                            size={48}
                            className="text-slate-300 transition-transform group-hover:scale-110 duration-300"
                          />
                        </div>
                      )}

                      <div className="p-5 flex flex-col gap-3 flex-1 bg-white dark:bg-zinc-900">
                        <h3
                          className="font-bold text-lg truncate leading-tight group-hover:text-primary transition-colors"
                          title={product.name}
                        >
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-md font-medium text-xs">
                            {product.category}
                          </span>
                        </div>
                        {product.compatibility && (
                          <p className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded w-fit mt-1 border border-blue-100 dark:border-blue-800/30">
                            {product.compatibility}
                          </p>
                        )}
                        {product.colors && product.colors.length > 0 && (
                          <div className="mt-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                              Variantes :
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {product.colors.map((color, idx) => (
                                <div
                                  key={idx}
                                  title={`${color.name}: ${color.stock} restants`}
                                  className="w-5 h-5 rounded-full border shadow-sm transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: color.hex,
                                    borderColor: "rgba(0,0,0,0.1)",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-auto pt-4 flex flex-col gap-1">
                          <p className="text-2xl font-black font-mono text-primary">
                            {product.price.toFixed(2)} DT
                          </p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-md ${product.stock > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                            >
                              {product.stock > 0
                                ? `${product.stock} dispo`
                                : "Rupture"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                              {product.sku}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border rounded-xl p-16 text-center flex flex-col items-center justify-center shadow-sm">
                  <Package size={56} className="text-slate-200 mb-5" />
                  <p className="text-muted-foreground text-lg font-medium">
                    Aucun produit trouvé dans cette catégorie.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB: COMMANDES */}
          {currentTab === "commandes" && (
            <div className="w-full max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Nouvelles Commandes
                  </h1>
                  <p className="text-sm text-slate-500">
                    Commandes client en attente de préparation
                  </p>
                </div>
              </div>
              {renderOrderList(
                pendingOrders,
                "Aucune commande en attente actuellement.",
              )}
            </div>
          )}

          {/* TAB: FACTURES */}
          {currentTab === "factures" && (
            <div className="w-full max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Commandes en Livraison / Factures
                  </h1>
                  <p className="text-sm text-slate-500">
                    Imprimez la facture ou encaissez le paiement
                  </p>
                </div>
              </div>
              {renderOrderList(
                deliveringOrders,
                "Aucune commande en livraison.",
              )}
            </div>
          )}

          {/* TAB: HISTORIQUE */}
          {currentTab === "historique" && (
            <div className="w-full max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <History size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Historique des Ventes
                  </h1>
                  <p className="text-sm text-slate-500">
                    Toutes les commandes finalisées et payées
                  </p>
                </div>
              </div>
              {renderOrderList(
                completedOrders,
                "Aucune commande dans l'historique.",
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ProductDetailsModal
        product={selectedProduct}
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
      />

      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden border-0 shadow-2xl">
          {selectedOrder && (
            <div className="flex flex-col">
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 dark:bg-zinc-900 border-b flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Commande Client
                  </p>
                  <DialogTitle className="text-2xl">
                    {selectedOrder.client.company_name}
                  </DialogTitle>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {selectedOrder.client.email}
                  </p>
                </div>
                <Badge className="px-4 py-1.5 text-sm uppercase tracking-wide">
                  {selectedOrder.status === "pending"
                    ? "EN ATTENTE"
                    : selectedOrder.status === "approved"
                      ? "EN LIVRAISON"
                      : "PAYÉE"}
                </Badge>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Package size={16} /> Lignes de produits
                </h4>
                <div className="space-y-4">
                  {selectedOrder.order_items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-3 border-b border-dashed border-slate-200 dark:border-zinc-800 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                          {item.product?.name || "Article Inconnu"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 font-mono">
                          SKU: {item.product?.sku}
                          {item.color_name ? (
                            <span className="ml-3 px-2 py-1 bg-slate-200 dark:bg-zinc-800 rounded font-sans font-bold text-xs tracking-wider uppercase text-slate-700 dark:text-slate-300">
                              ❖ {item.color_name}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-black text-2xl text-slate-800 bg-slate-100 px-4 py-1.5 border-2 border-slate-200 rounded-lg">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-slate-50 dark:bg-zinc-900 border-t flex justify-end gap-3 rounded-b-xl">
                {selectedOrder.status === "pending" && (
                  <Button
                    onClick={() => handleApproveOrder(selectedOrder)}
                    className="gap-2 px-6 py-6 text-base w-full sm:w-auto shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle size={20} /> Valider la Commande (Déduire le
                    Stock)
                  </Button>
                )}
                {selectedOrder.status === "approved" && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => handlePrint(selectedOrder)}
                      className="gap-2 px-6 py-6 text-base font-semibold border-2 bg-white hover:bg-slate-50 dark:bg-zinc-950 dark:hover:bg-zinc-800"
                    >
                      <Printer size={20} /> Imprimer Facture (A4)
                    </Button>
                    <Button
                      onClick={() => handleMarkPaid(selectedOrder.id)}
                      className="gap-2 px-6 py-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-600/20"
                    >
                      <Check size={20} /> Marquer comme Payée
                    </Button>
                  </div>
                )}
                {selectedOrder.status === "completed" && (
                  <div className="w-full flex justify-between items-center">
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded flex items-center gap-2">
                      <CheckCircle size={16} /> Soldée et archivée
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePrint(selectedOrder)}
                      size="sm"
                      className="gap-2"
                    >
                      <Printer size={14} /> Imprimer Copie Facture
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
