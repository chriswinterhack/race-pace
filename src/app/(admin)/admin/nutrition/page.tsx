"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Loader2,
  Coffee,
  Droplets,
  Zap,
  Filter,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  Input,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ProductCategory } from "@/components/nutrition-planner/types";
import { CATEGORY_CONFIG } from "@/components/nutrition-planner/types";

interface NutritionProduct {
  id: string;
  brand: string;
  name: string;
  category: ProductCategory;
  serving_size: string | null;
  calories: number;
  carbs_grams: number;
  sodium_mg: number;
  sugars_grams: number | null;
  glucose_grams: number | null;
  fructose_grams: number | null;
  maltodextrin_grams: number | null;
  glucose_fructose_ratio: string | null;
  caffeine_mg: number | null;
  protein_grams: number | null;
  fat_grams: number | null;
  fiber_grams: number | null;
  water_content_ml: number | null;
  image_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const CATEGORIES: ProductCategory[] = ["gel", "chew", "bar", "drink_mix", "real_food", "electrolyte", "other"];

export default function AdminNutritionPage() {
  const [products, setProducts] = useState<NutritionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<NutritionProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<NutritionProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const supabase = createClient();

  async function handleDeleteProduct() {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("nutrition_products")
        .delete()
        .eq("id", productToDelete.id);

      if (error) throw error;

      toast.success(`${productToDelete.brand} ${productToDelete.name} deleted`);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
    setDeleting(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("nutrition_products")
      .select("*")
      .order("brand")
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesVerified = !verifiedOnly || product.is_verified;
      return matchesSearch && matchesCategory && matchesVerified;
    });
  }, [products, searchQuery, selectedCategory, verifiedOnly]);

  const productsByCategory = useMemo(() => {
    const groups: Record<string, NutritionProduct[]> = {};
    filteredProducts.forEach((product) => {
      const category = product.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category]!.push(product);
    });
    return groups;
  }, [filteredProducts]);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
            Nutrition Products
          </h1>
          <p className="mt-1 text-brand-navy-600">
            {products.length} products · {products.filter(p => p.is_verified).length} verified
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-navy-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && "bg-brand-navy-100")}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {(selectedCategory || verifiedOnly) && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-brand-sky-500 text-white rounded-full">
              {(selectedCategory ? 1 : 0) + (verifiedOnly ? 1 : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium text-brand-navy-700 mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-lg border transition-colors",
                      !selectedCategory
                        ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                        : "border-brand-navy-200 hover:border-brand-navy-300"
                    )}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5",
                        selectedCategory === cat
                          ? "border-brand-sky-500 bg-brand-sky-50 text-brand-sky-700"
                          : "border-brand-navy-200 hover:border-brand-navy-300"
                      )}
                    >
                      <span>{CATEGORY_CONFIG[cat].icon}</span>
                      {CATEGORY_CONFIG[cat].label}
                      <span className="text-xs text-brand-navy-400">
                        ({productCounts[cat] || 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-navy-700 mb-2 block">
                  Status
                </label>
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1.5",
                    verifiedOnly
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-brand-navy-200 hover:border-brand-navy-300"
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                  Verified Only
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!loading && (
        <div className="space-y-8">
          {selectedCategory ? (
            <ProductsGrid
              products={productsByCategory[selectedCategory] || []}
              onEdit={setProductToEdit}
              onDelete={setProductToDelete}
            />
          ) : (
            Object.entries(productsByCategory)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([category, categoryProducts]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{CATEGORY_CONFIG[category as ProductCategory]?.icon}</span>
                    <h2 className="text-lg font-semibold text-brand-navy-900">
                      {CATEGORY_CONFIG[category as ProductCategory]?.label || category}
                    </h2>
                    <span className="text-sm text-brand-navy-500">
                      ({categoryProducts.length})
                    </span>
                  </div>
                  <ProductsGrid
                    products={categoryProducts}
                    onEdit={setProductToEdit}
                    onDelete={setProductToDelete}
                  />
                </div>
              ))
          )}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-navy-600">
            {searchQuery || selectedCategory
              ? "No products found matching your filters."
              : "No products yet. Add your first product!"}
          </p>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      {(showCreateModal || productToEdit) && (
        <ProductFormModal
          product={productToEdit}
          onClose={() => {
            setShowCreateModal(false);
            setProductToEdit(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setProductToEdit(null);
            fetchProducts();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
          </DialogHeader>
          <p className="text-brand-navy-600">
            Are you sure you want to delete{" "}
            <strong>{productToDelete?.brand} {productToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductsGrid({
  products,
  onEdit,
  onDelete,
}: {
  products: NutritionProduct[];
  onEdit: (product: NutritionProduct) => void;
  onDelete: (product: NutritionProduct) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product)}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: NutritionProduct;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[product.category];
  const hasCaffeine = (product.caffeine_mg || 0) > 0;
  const hasWater = (product.water_content_ml || 0) > 0;

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      !product.is_active && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-base",
              categoryConfig.color
            )}>
              {categoryConfig.icon}
            </span>
            <div>
              <p className="text-xs font-semibold text-brand-navy-400 uppercase tracking-wide">
                {product.brand}
              </p>
              <p className="font-semibold text-brand-navy-900 text-sm leading-tight">
                {product.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {product.is_verified && (
              <span className="p-1 rounded-full bg-green-100" title="Verified">
                <Check className="h-3 w-3 text-green-600" />
              </span>
            )}
            {!product.is_active && (
              <span className="p-1 rounded-full bg-amber-100" title="Inactive">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              </span>
            )}
          </div>
        </div>

        {/* Macro badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
            <Zap className="h-3 w-3" />
            {product.carbs_grams}g carbs
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-brand-navy-100 text-brand-navy-700">
            {product.calories} cal
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
            {product.sodium_mg}mg Na
          </span>
          {hasCaffeine && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
              <Coffee className="h-3 w-3" />
              {product.caffeine_mg}mg
            </span>
          )}
          {hasWater && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-100 text-sky-700">
              <Droplets className="h-3 w-3" />
              {product.water_content_ml}ml
            </span>
          )}
        </div>

        {/* Glucose:Fructose ratio */}
        {product.glucose_fructose_ratio && (
          <p className="text-xs text-brand-navy-500 mb-3">
            G:F Ratio: {product.glucose_fructose_ratio}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-brand-navy-100">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: NutritionProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = !!product;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    brand: product?.brand || "",
    name: product?.name || "",
    category: product?.category || ("gel" as ProductCategory),
    serving_size: product?.serving_size || "",
    calories: product?.calories || 0,
    carbs_grams: product?.carbs_grams || 0,
    sodium_mg: product?.sodium_mg || 0,
    sugars_grams: product?.sugars_grams || null,
    glucose_grams: product?.glucose_grams || null,
    fructose_grams: product?.fructose_grams || null,
    maltodextrin_grams: product?.maltodextrin_grams || null,
    glucose_fructose_ratio: product?.glucose_fructose_ratio || "",
    caffeine_mg: product?.caffeine_mg || null,
    protein_grams: product?.protein_grams || null,
    fat_grams: product?.fat_grams || null,
    fiber_grams: product?.fiber_grams || null,
    water_content_ml: product?.water_content_ml || null,
    is_verified: product?.is_verified ?? true,
    is_active: product?.is_active ?? true,
    notes: product?.notes || "",
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        brand: formData.brand.trim(),
        name: formData.name.trim(),
        category: formData.category,
        serving_size: formData.serving_size.trim() || null,
        calories: formData.calories,
        carbs_grams: formData.carbs_grams,
        sodium_mg: formData.sodium_mg,
        sugars_grams: formData.sugars_grams,
        glucose_grams: formData.glucose_grams,
        fructose_grams: formData.fructose_grams,
        maltodextrin_grams: formData.maltodextrin_grams,
        glucose_fructose_ratio: formData.glucose_fructose_ratio.trim() || null,
        caffeine_mg: formData.caffeine_mg,
        protein_grams: formData.protein_grams,
        fat_grams: formData.fat_grams,
        fiber_grams: formData.fiber_grams,
        water_content_ml: formData.water_content_ml,
        is_verified: formData.is_verified,
        is_active: formData.is_active,
        notes: formData.notes.trim() || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("nutrition_products")
          .update(dataToSave)
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Product updated successfully!");
      } else {
        const { error } = await supabase
          .from("nutrition_products")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Product created successfully!");
      }

      onSaved();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy-700">
                  Brand *
                </label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Maurten"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy-700">
                  Product Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gel 100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy-700">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  className="flex h-10 w-full rounded-md border border-brand-navy-200 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400 focus-visible:ring-offset-2"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-navy-700">
                  Serving Size
                </label>
                <Input
                  value={formData.serving_size}
                  onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })}
                  placeholder="e.g., 40g, 1 packet"
                />
              </div>
            </div>

            {/* Primary Macros */}
            <div>
              <h3 className="text-sm font-semibold text-brand-navy-700 mb-3">
                Primary Nutrition (per serving)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Calories *
                  </label>
                  <Input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) || 0 })}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Carbs (g) *
                  </label>
                  <Input
                    type="number"
                    value={formData.carbs_grams}
                    onChange={(e) => setFormData({ ...formData, carbs_grams: parseInt(e.target.value) || 0 })}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Sodium (mg) *
                  </label>
                  <Input
                    type="number"
                    value={formData.sodium_mg}
                    onChange={(e) => setFormData({ ...formData, sodium_mg: parseInt(e.target.value) || 0 })}
                    min={0}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Carb Composition */}
            <div>
              <h3 className="text-sm font-semibold text-brand-navy-700 mb-3">
                Carbohydrate Composition (optional)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Glucose (g)
                  </label>
                  <Input
                    type="number"
                    value={formData.glucose_grams ?? ""}
                    onChange={(e) => setFormData({ ...formData, glucose_grams: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Fructose (g)
                  </label>
                  <Input
                    type="number"
                    value={formData.fructose_grams ?? ""}
                    onChange={(e) => setFormData({ ...formData, fructose_grams: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Maltodextrin (g)
                  </label>
                  <Input
                    type="number"
                    value={formData.maltodextrin_grams ?? ""}
                    onChange={(e) => setFormData({ ...formData, maltodextrin_grams: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    G:F Ratio
                  </label>
                  <Input
                    value={formData.glucose_fructose_ratio}
                    onChange={(e) => setFormData({ ...formData, glucose_fructose_ratio: e.target.value })}
                    placeholder="e.g., 1:0.8, 2:1"
                  />
                </div>
              </div>
            </div>

            {/* Additional Nutrition */}
            <div>
              <h3 className="text-sm font-semibold text-brand-navy-700 mb-3">
                Additional Nutrition (optional)
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Caffeine (mg)
                  </label>
                  <Input
                    type="number"
                    value={formData.caffeine_mg ?? ""}
                    onChange={(e) => setFormData({ ...formData, caffeine_mg: e.target.value ? parseInt(e.target.value) : null })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    value={formData.protein_grams ?? ""}
                    onChange={(e) => setFormData({ ...formData, protein_grams: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Fat (g)
                  </label>
                  <Input
                    type="number"
                    value={formData.fat_grams ?? ""}
                    onChange={(e) => setFormData({ ...formData, fat_grams: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-navy-700">
                    Water (ml)
                  </label>
                  <Input
                    type="number"
                    value={formData.water_content_ml ?? ""}
                    onChange={(e) => setFormData({ ...formData, water_content_ml: e.target.value ? parseInt(e.target.value) : null })}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_verified}
                  onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                  className="rounded border-brand-navy-300 text-brand-sky-500 focus:ring-brand-sky-500"
                />
                <span className="text-sm text-brand-navy-700">Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-brand-navy-300 text-brand-sky-500 focus:ring-brand-sky-500"
                />
                <span className="text-sm text-brand-navy-700">Active</span>
              </label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-navy-700">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this product..."
                rows={2}
                className="flex w-full rounded-md border border-brand-navy-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-brand-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky-400 focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
