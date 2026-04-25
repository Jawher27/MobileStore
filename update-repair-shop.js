const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "components", "repair-shop-view.tsx");
let content = fs.readFileSync(filePath, "utf8");

// 1. Add new icons to lucide-react import
content = content.replace(
  /Trash2,\n\s*Package,\n} from "lucide-react";/,
  `Trash2,
  Package,
  ListOrdered,
  FileText,
  History,
  LayoutGrid,
} from "lucide-react";`,
);

// 2. Add Checkbox import
content = content.replace(
  /import { Card } from "@\/components\/ui\/card";/,
  `import { Card } from "@/components/ui/card";\nimport { Checkbox } from "@/components/ui/checkbox";`,
);

// 3. Update state variables inside RepairShopView
const stateString = `  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");`;
const newStateString = `  const [currentTab, setCurrentTab] = useState<'articles' | 'commandes' | 'factures' | 'historique'>('articles');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);`;
content = content.replace(stateString, newStateString);

// 4. Update filteredProducts useMemo
const filteredProductsStr = `  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.compatibility
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);`;

const newFilteredProductsStr = `  const filteredProducts = useMemo(() => {
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
  }, [searchQuery, selectedCategories, products]);`;
content = content.replace(filteredProductsStr, newFilteredProductsStr);

// 5. Build Navbar and Tabs content
// We replace everything from '<div className="space-y-6 relative max-w-7xl mx-auto pb-16">'
// down to '{orders.length > 0 && <OrderStatus orders={formatOrders} />}' with our new layout

const oldLayoutStart =
  /<div className="space-y-6 relative max-w-7xl mx-auto pb-16">[\s\S]*?(?={orders\.length > 0 && <OrderStatus orders={formatOrders} \/>})/g;

const newLayoutChunk = `<div className="space-y-6 relative max-w-7xl mx-auto pb-16">
      {/* Header & Navbar */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-6 pb-0 border-b border-border/50">
          <h1 className="text-2xl font-bold">Espace Client</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Gérez vos commandes, factures et catalogue de pièces
          </p>

          <div className="flex overflow-x-auto space-x-1 pb-px hide-scrollbar">
            <button
              onClick={() => setCurrentTab('articles')}
              className={\`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap \${
                currentTab === 'articles'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }\`}
            >
              <LayoutGrid className="w-4 h-4" />
              Catalogue Articles
            </button>
            <button
              onClick={() => setCurrentTab('commandes')}
              className={\`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap \${
                currentTab === 'commandes'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }\`}
            >
              <ListOrdered className="w-4 h-4" />
              Mes Commandes
            </button>
            <button
              onClick={() => setCurrentTab('factures')}
              className={\`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap \${
                currentTab === 'factures'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }\`}
            >
              <FileText className="w-4 h-4" />
              Factures
            </button>
            <button
              onClick={() => setCurrentTab('historique')}
              className={\`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap \${
                currentTab === 'historique'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }\`}
            >
              <History className="w-4 h-4" />
              Historique
            </button>
          </div>
        </div>
      </div>

      {currentTab === 'articles' && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0 space-y-6">
            <Card className="p-4 border-border shadow-sm">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Catégories</h3>
              <div className="space-y-3">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={\`cat-\${category}\`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          if (category === "All") {
                            setSelectedCategories(["All"]);
                          } else {
                            setSelectedCategories(prev => [...prev.filter(c => c !== "All"), category]);
                          }
                        } else {
                          setSelectedCategories(prev => prev.filter(c => c !== category));
                        }
                      }}
                    />
                    <label 
                      htmlFor={\`cat-\${category}\`}
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
                            {totalStock > 0 ? \`\${totalStock} dispo\` : "Rupture"}
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
                                  selectedColors[product.id]?.name === color.name;
                                return (
                                  <button
                                    key={\`\${color.name}-\${idx}\`}
                                    onClick={() =>
                                      setSelectedColors((prev) => ({
                                        ...prev,
                                        [product.id]: color,
                                      }))
                                    }
                                    disabled={color.stock <= 0}
                                    className={\`w-6 h-6 rounded-full border-2 transition-all \${
                                      isSelected
                                        ? "scale-110 border-primary shadow-md"
                                        : "border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105"
                                    } \${color.stock <= 0 ? "opacity-30 cursor-not-allowed cross-pattern" : ""}\`}
                                    style={{ backgroundColor: color.hex }}
                                    title={\`\${color.name} (\${color.stock} unités)\`}
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

      {currentTab === 'commandes' && (
        <div className="space-y-6">
          <Card className="p-6 flex items-center justify-between bg-primary/5 border-primary/20">
            <div>
              <h2 className="text-xl font-semibold mb-1">Vos Commandes en cours</h2>
              <p className="text-sm text-muted-foreground">Voici la liste des commandes en cours de traitement.</p>
            </div>
            <ListOrdered className="w-12 h-12 opacity-50 text-primary" />
          </Card>
          
          {orders.length > 0 ? (
            <OrderStatus orders={formatOrders} />
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed">
              <ListOrdered className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Vous n'avez aucune commande en cours.</p>
            </div>
          )}
        </div>
      )}

      {currentTab === 'factures' && (
        <div className="space-y-6">
           <Card className="p-6 flex items-center justify-between text-muted-foreground border-dashed bg-transparent">
            <div>
              <h2 className="text-xl font-semibold mb-1 text-foreground">Factures</h2>
              <p className="text-sm">Cette section sera bientôt disponible.</p>
            </div>
            <FileText className="w-12 h-12 opacity-20" />
          </Card>
        </div>
      )}

      {currentTab === 'historique' && (
        <div className="space-y-6">
           <Card className="p-6 flex items-center justify-between text-muted-foreground border-dashed bg-transparent">
            <div>
              <h2 className="text-xl font-semibold mb-1 text-foreground">Historique d'Achats</h2>
              <p className="text-sm">Cette section sera bientôt disponible.</p>
            </div>
            <History className="w-12 h-12 opacity-20" />
          </Card>
        </div>
      )}

      {/* Cart Button only valid if articles open, wait no, kept separate! */}
      `;

content = content.replace(oldLayoutStart, newLayoutChunk);

// Remove the old `{orders.length > 0 && <OrderStatus orders={formatOrders} />}` lying around
content = content.replace(
  "{orders.length > 0 && <OrderStatus orders={formatOrders} />}\n\n      {/* Shopping Cart Sheet */}",
  "{/* Shopping Cart Sheet */}",
);

fs.writeFileSync(filePath, content);
console.log("repair-shop-view.tsx updated successfully.");
