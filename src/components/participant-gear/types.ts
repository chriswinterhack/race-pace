import type { LucideIcon } from "lucide-react";

export interface ParticipantGear {
  id: string;
  userId: string;
  displayName: string;
  isPublic: boolean;
  bike: { brand: string; model: string; year?: number; imageUrl?: string } | null;
  frontTire: { brand: string; model: string; width?: string } | null;
  rearTire: { brand: string; model: string; width?: string } | null;
  shoes: { brand: string; model: string } | null;
  repairKit: { name: string; items: string[] } | null;
}

export interface GearAggregation {
  brand: string;
  model: string;
  width?: string;
  count: number;
  percentage: number;
}

export interface CommunityStats {
  totalWithGear: number;
  publicCount: number;
  bikes: GearAggregation[];
  tires: GearAggregation[];
  shoes: GearAggregation[];
  repairKitItems: { item: string; count: number }[];
}

export type ShowAllCategory = "bikes" | "tires" | "shoes" | null;

export type GearPickerType = "bike" | "front_tire" | "rear_tire" | "shoes" | "repair_kit" | null;

export interface GearSlotCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  isEmpty: boolean;
  popularity?: GearAggregation | null;
  onAdd: () => void;
  onRemove: () => void;
  multiSelect?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}

export interface SelectedGearDisplayProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  icon?: LucideIcon;
  popularity?: GearAggregation | null;
  compact?: boolean;
}
