"use client";

import { useState, useEffect } from "react";
import { Plus, Bike, Circle, Droplets, Package, Wrench, Shirt } from "lucide-react";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { GearEmptyState } from "@/components/gear/shared";
import {
  BikeForm, BikeCard,
  TireForm, TireCard,
  ShoeForm, ShoeCard,
  BagForm, BagCard,
  HydrationPackForm, HydrationPackCard,
  RepairKitForm, RepairKitCard,
  ClothingForm, ClothingCard,
} from "@/components/gear/inventory";
import type {
  UserBike, UserTire, UserShoe, UserHydrationPack,
  UserBag, UserRepairKit, UserClothing,
} from "@/types/gear";
import { cn } from "@/lib/utils";

type Tab = "bikes" | "tires" | "shoes" | "hydration" | "bags" | "repair" | "clothing";

const tabs: { id: Tab; label: string; icon: typeof Bike }[] = [
  { id: "bikes", label: "Bikes", icon: Bike },
  { id: "tires", label: "Tires", icon: Circle },
  { id: "shoes", label: "Shoes", icon: Bike },
  { id: "hydration", label: "Hydration", icon: Droplets },
  { id: "bags", label: "On Bike Storage", icon: Package },
  { id: "repair", label: "Repair Kits", icon: Wrench },
  { id: "clothing", label: "Clothing", icon: Shirt },
];

export default function GearPage() {
  const [activeTab, setActiveTab] = useState<Tab>("bikes");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<unknown>(null);

  // Inventory state
  const [bikes, setBikes] = useState<UserBike[]>([]);
  const [tires, setTires] = useState<UserTire[]>([]);
  const [shoes, setShoes] = useState<UserShoe[]>([]);
  const [hydrationPacks, setHydrationPacks] = useState<UserHydrationPack[]>([]);
  const [bags, setBags] = useState<UserBag[]>([]);
  const [repairKits, setRepairKits] = useState<UserRepairKit[]>([]);
  const [clothing, setClothing] = useState<UserClothing[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    const [bikesRes, tiresRes, shoesRes, hydrationRes, bagsRes, repairRes, clothingRes] =
      await Promise.all([
        supabase.from("user_bikes").select("*").order("created_at", { ascending: false }),
        supabase.from("user_tires").select("*").order("created_at", { ascending: false }),
        supabase.from("user_shoes").select("*").order("created_at", { ascending: false }),
        supabase.from("user_hydration_packs").select("*").order("created_at", { ascending: false }),
        supabase.from("user_bags").select("*").order("created_at", { ascending: false }),
        supabase.from("user_repair_kits").select("*").order("created_at", { ascending: false }),
        supabase.from("user_clothing").select("*").order("created_at", { ascending: false }),
      ]);

    setBikes(bikesRes.data || []);
    setTires(tiresRes.data || []);
    setShoes(shoesRes.data || []);
    setHydrationPacks(hydrationRes.data || []);
    setBags(bagsRes.data || []);
    setRepairKits(repairRes.data || []);
    setClothing(clothingRes.data || []);
    setLoading(false);
  }

  const handleSave = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchInventory();
  };

  const handleDelete = async (table: string, id: string, itemName: string) => {
    if (!confirm(`Delete ${itemName}?`)) return;

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      fetchInventory();
    }
  };

  const getTabContent = () => {
    if (loading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case "bikes":
        return bikes.length === 0 ? (
          <GearEmptyState
            title="No bikes yet"
            description="Add your bikes to your gear inventory"
            actionLabel="Add Bike"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {bikes.map((bike) => (
              <BikeCard
                key={bike.id}
                bike={bike}
                onEdit={() => { setEditingItem(bike); setShowForm(true); }}
                onDelete={() => handleDelete("user_bikes", bike.id, `${bike.brand} ${bike.model}`)}
              />
            ))}
          </div>
        );

      case "tires":
        return tires.length === 0 ? (
          <GearEmptyState
            title="No tires yet"
            description="Add your tires to your gear inventory"
            actionLabel="Add Tire"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tires.map((tire) => (
              <TireCard
                key={tire.id}
                tire={tire}
                onEdit={() => { setEditingItem(tire); setShowForm(true); }}
                onDelete={() => handleDelete("user_tires", tire.id, `${tire.brand} ${tire.model}`)}
              />
            ))}
          </div>
        );

      case "shoes":
        return shoes.length === 0 ? (
          <GearEmptyState
            title="No cycling shoes yet"
            description="Add your cycling shoes to your gear inventory"
            actionLabel="Add Shoe"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {shoes.map((shoe) => (
              <ShoeCard
                key={shoe.id}
                shoe={shoe}
                onEdit={() => { setEditingItem(shoe); setShowForm(true); }}
                onDelete={() => handleDelete("user_shoes", shoe.id, `${shoe.brand} ${shoe.model}`)}
              />
            ))}
          </div>
        );

      case "hydration":
        return hydrationPacks.length === 0 ? (
          <GearEmptyState
            title="No hydration packs yet"
            description="Add your hydration packs and vests"
            actionLabel="Add Pack"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {hydrationPacks.map((pack) => (
              <HydrationPackCard
                key={pack.id}
                pack={pack}
                onEdit={() => { setEditingItem(pack); setShowForm(true); }}
                onDelete={() => handleDelete("user_hydration_packs", pack.id, `${pack.brand} ${pack.model}`)}
              />
            ))}
          </div>
        );

      case "bags":
        return bags.length === 0 ? (
          <GearEmptyState
            title="No storage bags yet"
            description="Add your on-bike storage (saddle bags, frame bags, etc.)"
            actionLabel="Add Bag"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {bags.map((bag) => (
              <BagCard
                key={bag.id}
                bag={bag}
                onEdit={() => { setEditingItem(bag); setShowForm(true); }}
                onDelete={() => handleDelete("user_bags", bag.id, `${bag.brand} ${bag.model}`)}
              />
            ))}
          </div>
        );

      case "repair":
        return repairKits.length === 0 ? (
          <GearEmptyState
            title="No repair kits yet"
            description="Create repair kit templates for your races"
            actionLabel="Add Kit"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {repairKits.map((kit) => (
              <RepairKitCard
                key={kit.id}
                kit={kit}
                onEdit={() => { setEditingItem(kit); setShowForm(true); }}
                onDelete={() => handleDelete("user_repair_kits", kit.id, kit.name)}
              />
            ))}
          </div>
        );

      case "clothing":
        return clothing.length === 0 ? (
          <GearEmptyState
            title="No clothing yet"
            description="Add your race clothing and layers"
            actionLabel="Add Item"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clothing.map((item) => (
              <ClothingCard
                key={item.id}
                clothing={item}
                onEdit={() => { setEditingItem(item); setShowForm(true); }}
                onDelete={() => handleDelete("user_clothing", item.id, item.name)}
              />
            ))}
          </div>
        );
    }
  };

  const getFormContent = () => {
    switch (activeTab) {
      case "bikes":
        return (
          <BikeForm
            bike={editingItem as UserBike | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      case "tires":
        return (
          <TireForm
            tire={editingItem as UserTire | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      case "shoes":
        return (
          <ShoeForm
            shoe={editingItem as UserShoe | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      case "hydration":
        return (
          <HydrationPackForm
            pack={editingItem as UserHydrationPack | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      case "bags":
        return (
          <BagForm
            bag={editingItem as UserBag | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      case "repair":
        return (
          <RepairKitForm
            kit={editingItem as UserRepairKit | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
      case "clothing":
        return (
          <ClothingForm
            clothing={editingItem as UserClothing | undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        );
    }
  };

  const getFormTitle = () => {
    const prefix = editingItem ? "Edit" : "Add";
    switch (activeTab) {
      case "bikes": return `${prefix} Bike`;
      case "tires": return `${prefix} Tire`;
      case "shoes": return `${prefix} Shoe`;
      case "hydration": return `${prefix} Hydration Pack`;
      case "bags": return `${prefix} Bag`;
      case "repair": return `${prefix} Repair Kit`;
      case "clothing": return `${prefix} Clothing`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">
            Gear Inventory
          </h1>
          <p className="mt-2 text-brand-navy-600">
            Manage your gear to select for races
          </p>
        </div>
        <Button onClick={() => { setEditingItem(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add {tabs.find((t) => t.id === activeTab)?.label.replace(/s$/, "")}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-brand-navy-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-600 hover:text-brand-navy-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {getTabContent()}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{getFormTitle()}</DialogTitle>
          </DialogHeader>
          {getFormContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
