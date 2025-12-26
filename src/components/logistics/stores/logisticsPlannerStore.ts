import { create } from "zustand";
import type {
  DropBagItem,
  DropBagLocation,
  CrewMember,
  CrewLocationItem,
  CrewLocationInstructions,
  LogisticsTab,
  ItemSourceType,
  GearItemType,
  CustomItemCategory,
} from "@/types/logistics";
import type { UserGearInventory } from "@/types/gear";

interface LogisticsPlannerState {
  // ============================================
  // Drop Bag State
  // ============================================
  dropBagPlanId: string | null;
  dropBagLocations: DropBagLocation[];
  selectedDropBagLocationIndex: number | null;

  // ============================================
  // Crew State
  // ============================================
  crewPlanId: string | null;
  crewMembers: CrewMember[];
  crewLocationItems: Map<number, CrewLocationItem[]>; // keyed by location mile
  crewLocationInstructions: Map<number, CrewLocationInstructions>; // keyed by location mile
  selectedCrewLocationMile: number | null;
  crewContactInfo: {
    leadName?: string;
    leadPhone?: string;
    leadEmail?: string;
    generalInstructions?: string;
  };

  // ============================================
  // UI State
  // ============================================
  activeTab: LogisticsTab;
  isDragging: boolean;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // Available gear (from inventory)
  gearInventory: UserGearInventory | null;

  // ============================================
  // Drop Bag Actions
  // ============================================
  setDropBagPlanId: (id: string | null) => void;
  setDropBagLocations: (locations: DropBagLocation[]) => void;
  selectDropBagLocation: (index: number | null) => void;

  addItemToDropBag: (locationIndex: number, item: Omit<DropBagItem, "id" | "drop_bag_plan_id" | "sort_order">) => void;
  removeItemFromDropBag: (locationIndex: number, itemId: string) => void;
  updateDropBagItem: (locationIndex: number, itemId: string, updates: Partial<DropBagItem>) => void;
  reorderDropBagItems: (locationIndex: number, fromIndex: number, toIndex: number) => void;
  moveItemBetweenDropBagLocations: (fromLocationIndex: number, toLocationIndex: number, itemId: string) => void;

  // Quick add for drop bags
  quickAddToDropBag: (
    locationIndex: number,
    name: string,
    category: CustomItemCategory,
    quantity?: number
  ) => void;

  addGearToDropBag: (
    locationIndex: number,
    gearType: GearItemType,
    gearId: string,
    gearName: string,
    quantity?: number
  ) => void;

  // ============================================
  // Crew Actions
  // ============================================
  setCrewPlanId: (id: string | null) => void;
  setCrewMembers: (members: CrewMember[]) => void;
  setCrewContactInfo: (info: Partial<LogisticsPlannerState["crewContactInfo"]>) => void;

  addCrewMember: (member: Omit<CrewMember, "id" | "crew_plan_id" | "sort_order">) => void;
  updateCrewMember: (memberId: string, updates: Partial<CrewMember>) => void;
  removeCrewMember: (memberId: string) => void;
  reorderCrewMembers: (fromIndex: number, toIndex: number) => void;

  setCrewLocationItems: (mile: number, items: CrewLocationItem[]) => void;
  addItemToCrewLocation: (mile: number, locationName: string, item: Omit<CrewLocationItem, "id" | "crew_plan_id" | "sort_order" | "location_mile" | "location_name">) => void;
  removeItemFromCrewLocation: (mile: number, itemId: string) => void;

  setCrewLocationInstructions: (mile: number, instructions: CrewLocationInstructions) => void;
  updateCrewLocationInstructions: (mile: number, updates: Partial<CrewLocationInstructions>) => void;

  selectCrewLocation: (mile: number | null) => void;

  // ============================================
  // UI Actions
  // ============================================
  setActiveTab: (tab: LogisticsTab) => void;
  setDragging: (isDragging: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setGearInventory: (inventory: UserGearInventory | null) => void;
  markSaved: () => void;

  // ============================================
  // Reset
  // ============================================
  reset: () => void;
}

// Generate a temporary ID for new items (will be replaced by DB on save)
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const initialState = {
  // Drop bag
  dropBagPlanId: null,
  dropBagLocations: [],
  selectedDropBagLocationIndex: null,

  // Crew
  crewPlanId: null,
  crewMembers: [],
  crewLocationItems: new Map<number, CrewLocationItem[]>(),
  crewLocationInstructions: new Map<number, CrewLocationInstructions>(),
  selectedCrewLocationMile: null,
  crewContactInfo: {},

  // UI
  activeTab: "dropbag" as LogisticsTab,
  isDragging: false,
  isLoading: false,
  isSaving: false,
  hasUnsavedChanges: false,
  gearInventory: null,
};

export const useLogisticsPlannerStore = create<LogisticsPlannerState>((set, get) => ({
  ...initialState,

  // ============================================
  // Drop Bag Actions
  // ============================================
  setDropBagPlanId: (id) => set({ dropBagPlanId: id }),

  setDropBagLocations: (locations) => set({ dropBagLocations: locations }),

  selectDropBagLocation: (index) => set({ selectedDropBagLocationIndex: index }),

  addItemToDropBag: (locationIndex, item) => {
    const { dropBagLocations } = get();
    const location = dropBagLocations[locationIndex];
    if (!location) return;

    const newItem: DropBagItem = {
      ...item,
      id: generateTempId(),
      drop_bag_plan_id: get().dropBagPlanId || "",
      sort_order: location.items.length,
    };

    const updatedLocations = [...dropBagLocations];
    updatedLocations[locationIndex] = {
      ...location,
      items: [...location.items, newItem],
    };

    set({ dropBagLocations: updatedLocations, hasUnsavedChanges: true });
  },

  removeItemFromDropBag: (locationIndex, itemId) => {
    const { dropBagLocations } = get();
    const location = dropBagLocations[locationIndex];
    if (!location) return;

    const updatedLocations = [...dropBagLocations];
    updatedLocations[locationIndex] = {
      ...location,
      items: location.items.filter((item) => item.id !== itemId),
    };

    set({ dropBagLocations: updatedLocations, hasUnsavedChanges: true });
  },

  updateDropBagItem: (locationIndex, itemId, updates) => {
    const { dropBagLocations } = get();
    const location = dropBagLocations[locationIndex];
    if (!location) return;

    const updatedLocations = [...dropBagLocations];
    updatedLocations[locationIndex] = {
      ...location,
      items: location.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    };

    set({ dropBagLocations: updatedLocations, hasUnsavedChanges: true });
  },

  reorderDropBagItems: (locationIndex, fromIndex, toIndex) => {
    const { dropBagLocations } = get();
    const location = dropBagLocations[locationIndex];
    if (!location) return;

    const items = [...location.items];
    const removed = items.splice(fromIndex, 1);
    const movedItem = removed[0];
    if (!movedItem) return;
    items.splice(toIndex, 0, movedItem);

    // Update sort_order
    const reorderedItems = items.map((item, idx) => ({
      ...item,
      sort_order: idx,
    }));

    const updatedLocations = [...dropBagLocations];
    updatedLocations[locationIndex] = {
      ...location,
      items: reorderedItems,
    };

    set({ dropBagLocations: updatedLocations, hasUnsavedChanges: true });
  },

  moveItemBetweenDropBagLocations: (fromLocationIndex, toLocationIndex, itemId) => {
    const { dropBagLocations } = get();
    const fromLocation = dropBagLocations[fromLocationIndex];
    const toLocation = dropBagLocations[toLocationIndex];
    if (!fromLocation || !toLocation) return;

    const item = fromLocation.items.find((i) => i.id === itemId);
    if (!item) return;

    const updatedLocations = [...dropBagLocations];

    // Remove from source
    updatedLocations[fromLocationIndex] = {
      ...fromLocation,
      items: fromLocation.items.filter((i) => i.id !== itemId),
    };

    // Add to destination with updated location info
    // Use drop_bag_name and first pass's mile for the new structure
    const movedItem: DropBagItem = {
      ...item,
      location_mile: toLocation.passes?.[0]?.mile ?? toLocation.mile,
      location_name: toLocation.drop_bag_name || toLocation.name,
      sort_order: toLocation.items.length,
    };

    updatedLocations[toLocationIndex] = {
      ...toLocation,
      items: [...toLocation.items, movedItem],
    };

    set({ dropBagLocations: updatedLocations, hasUnsavedChanges: true });
  },

  quickAddToDropBag: (locationIndex, name, category, quantity = 1) => {
    const location = get().dropBagLocations[locationIndex];
    if (!location) return;

    get().addItemToDropBag(locationIndex, {
      location_mile: location.passes?.[0]?.mile ?? location.mile,
      location_name: location.drop_bag_name || location.name,
      source_type: "custom" as ItemSourceType,
      custom_name: name,
      custom_category: category,
      quantity,
      is_critical: false,
    });
  },

  addGearToDropBag: (locationIndex, gearType, gearId, gearName, quantity = 1) => {
    const location = get().dropBagLocations[locationIndex];
    if (!location) return;

    get().addItemToDropBag(locationIndex, {
      location_mile: location.passes?.[0]?.mile ?? location.mile,
      location_name: location.drop_bag_name || location.name,
      source_type: "gear_inventory" as ItemSourceType,
      gear_type: gearType,
      gear_id: gearId,
      quantity,
      is_critical: false,
      gear_item: {
        id: gearId,
        name: gearName,
        type: gearType,
      },
    });
  },

  // ============================================
  // Crew Actions
  // ============================================
  setCrewPlanId: (id) => set({ crewPlanId: id }),

  setCrewMembers: (members) => set({ crewMembers: members }),

  setCrewContactInfo: (info) =>
    set((state) => ({
      crewContactInfo: { ...state.crewContactInfo, ...info },
      hasUnsavedChanges: true,
    })),

  addCrewMember: (member) => {
    const newMember: CrewMember = {
      ...member,
      id: generateTempId(),
      crew_plan_id: get().crewPlanId || "",
      sort_order: get().crewMembers.length,
    };
    set((state) => ({
      crewMembers: [...state.crewMembers, newMember],
      hasUnsavedChanges: true,
    }));
  },

  updateCrewMember: (memberId, updates) => {
    set((state) => ({
      crewMembers: state.crewMembers.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      ),
      hasUnsavedChanges: true,
    }));
  },

  removeCrewMember: (memberId) => {
    set((state) => ({
      crewMembers: state.crewMembers.filter((m) => m.id !== memberId),
      hasUnsavedChanges: true,
    }));
  },

  reorderCrewMembers: (fromIndex, toIndex) => {
    const members = [...get().crewMembers];
    const removed = members.splice(fromIndex, 1);
    const movedMember = removed[0];
    if (!movedMember) return;
    members.splice(toIndex, 0, movedMember);

    const reorderedMembers = members.map((m, idx) => ({
      ...m,
      sort_order: idx,
    }));

    set({ crewMembers: reorderedMembers, hasUnsavedChanges: true });
  },

  setCrewLocationItems: (mile, items) => {
    const newMap = new Map(get().crewLocationItems);
    newMap.set(mile, items);
    set({ crewLocationItems: newMap });
  },

  addItemToCrewLocation: (mile, locationName, item) => {
    const existingItems = get().crewLocationItems.get(mile) || [];
    const newItem: CrewLocationItem = {
      ...item,
      id: generateTempId(),
      crew_plan_id: get().crewPlanId || "",
      location_mile: mile,
      location_name: locationName,
      sort_order: existingItems.length,
    };

    const newMap = new Map(get().crewLocationItems);
    newMap.set(mile, [...existingItems, newItem]);
    set({ crewLocationItems: newMap, hasUnsavedChanges: true });
  },

  removeItemFromCrewLocation: (mile, itemId) => {
    const existingItems = get().crewLocationItems.get(mile) || [];
    const newMap = new Map(get().crewLocationItems);
    newMap.set(mile, existingItems.filter((i) => i.id !== itemId));
    set({ crewLocationItems: newMap, hasUnsavedChanges: true });
  },

  setCrewLocationInstructions: (mile, instructions) => {
    const newMap = new Map(get().crewLocationInstructions);
    newMap.set(mile, instructions);
    set({ crewLocationInstructions: newMap });
  },

  updateCrewLocationInstructions: (mile, updates) => {
    const existing = get().crewLocationInstructions.get(mile);
    if (!existing) return;

    const newMap = new Map(get().crewLocationInstructions);
    newMap.set(mile, { ...existing, ...updates });
    set({ crewLocationInstructions: newMap, hasUnsavedChanges: true });
  },

  selectCrewLocation: (mile) => set({ selectedCrewLocationMile: mile }),

  // ============================================
  // UI Actions
  // ============================================
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDragging: (isDragging) => set({ isDragging }),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  setGearInventory: (inventory) => set({ gearInventory: inventory }),
  markSaved: () => set({ hasUnsavedChanges: false }),

  // ============================================
  // Reset
  // ============================================
  reset: () => set(initialState),
}));
