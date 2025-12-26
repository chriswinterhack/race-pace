"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  Car,
  Package,
  Calendar,
  Users,
  Backpack,
  AlertTriangle,
  Flag,
  Cloud,
  Info,
  GripVertical,
} from "lucide-react";
import { Button, Input, Label, RichTextEditor, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Input types (from database, without IDs)
interface PacketPickupInput {
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes?: string;
}

interface ScheduleItemInput {
  time: string;
  title: string;
  description?: string;
}

interface CrewLocationInput {
  name: string;
  mile_out: number;
  mile_in?: number;
  access_type: "unlimited" | "limited" | "reserved";
  parking_info?: string;
  setup_time?: string;
  shuttle_info?: string;
  notes?: string;
  restrictions?: string;
}

// Internal state types (with IDs for drag-and-drop)
interface PacketPickup extends PacketPickupInput {
  id: string;
}

interface ScheduleItem extends ScheduleItemInput {
  id: string;
}

interface CrewLocation extends CrewLocationInput {
  id: string;
}

interface RaceLogisticsInput {
  parking_info?: string;
  packet_pickup?: PacketPickupInput[];
  event_schedule?: ScheduleItemInput[];
  crew_info?: string;
  crew_locations?: CrewLocationInput[];
  drop_bag_info?: string;
  course_rules?: string;
  course_marking?: string;
  weather_notes?: string;
  additional_info?: string;
}

interface RaceLogisticsEditorProps {
  raceId: string;
  raceName: string;
  initialData: RaceLogisticsInput;
  onClose: () => void;
  onSaved: () => void;
}

// Sortable Schedule Item
function SortableScheduleItem({
  item,
  onUpdate,
  onRemove,
}: {
  item: ScheduleItem;
  onUpdate: (updates: Partial<ScheduleItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 bg-white rounded-lg border border-brand-navy-200",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-brand-navy-400 hover:text-brand-navy-600 cursor-grab"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 grid gap-2 sm:grid-cols-4">
          <Input
            type="time"
            value={item.time}
            onChange={(e) => onUpdate({ time: e.target.value })}
            className="h-8 text-sm"
          />
          <Input
            value={item.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Event title"
            className="h-8 text-sm sm:col-span-2"
          />
          <Input
            value={item.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Details (optional)"
            className="h-8 text-sm"
          />
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function RaceLogisticsEditor({
  raceId,
  raceName,
  initialData,
  onClose,
  onSaved,
}: RaceLogisticsEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("parking");
  const [saving, setSaving] = useState(false);

  // Form state
  const [parkingInfo, setParkingInfo] = useState(initialData.parking_info || "");
  const [packetPickups, setPacketPickups] = useState<PacketPickup[]>(
    (initialData.packet_pickup || []).map((p, i) => ({
      ...p,
      id: `pickup-${i}-${Date.now()}`,
    }))
  );
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    (initialData.event_schedule || []).map((s, i) => ({
      ...s,
      id: `schedule-${i}-${Date.now()}`,
    }))
  );
  const [crewInfo, setCrewInfo] = useState(initialData.crew_info || "");
  const [crewLocations, setCrewLocations] = useState<CrewLocation[]>(
    (initialData.crew_locations || []).map((c, i) => ({
      ...c,
      id: `crew-${i}-${Date.now()}`,
    }))
  );
  const [dropBagInfo, setDropBagInfo] = useState(initialData.drop_bag_info || "");
  const [courseRules, setCourseRules] = useState(initialData.course_rules || "");
  const [courseMarking, setCourseMarking] = useState(initialData.course_marking || "");
  const [weatherNotes, setWeatherNotes] = useState(initialData.weather_notes || "");
  const [additionalInfo, setAdditionalInfo] = useState(initialData.additional_info || "");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tabs = [
    { id: "parking", label: "Parking", icon: Car },
    { id: "packet", label: "Packet Pickup", icon: Package },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "crew", label: "Crew Info", icon: Users },
    { id: "dropbag", label: "Drop Bags", icon: Backpack },
    { id: "rules", label: "Rules", icon: AlertTriangle },
    { id: "course", label: "Course Marking", icon: Flag },
    { id: "weather", label: "Weather", icon: Cloud },
    { id: "other", label: "Other", icon: Info },
  ];

  const addPacketPickup = () => {
    setPacketPickups([
      ...packetPickups,
      { id: `pickup-new-${Date.now()}`, date: "", start_time: "", end_time: "", location: "" },
    ]);
  };

  const updatePacketPickup = (id: string, updates: Partial<PacketPickup>) => {
    setPacketPickups(packetPickups.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removePacketPickup = (id: string) => {
    setPacketPickups(packetPickups.filter((p) => p.id !== id));
  };

  const addScheduleItem = () => {
    setSchedule([
      ...schedule,
      { id: `schedule-new-${Date.now()}`, time: "", title: "" },
    ]);
  };

  const updateScheduleItem = (id: string, updates: Partial<ScheduleItem>) => {
    setSchedule(schedule.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeScheduleItem = (id: string) => {
    setSchedule(schedule.filter((s) => s.id !== id));
  };

  const addCrewLocation = () => {
    setCrewLocations([
      ...crewLocations,
      { id: `crew-new-${Date.now()}`, name: "", mile_out: 0, access_type: "unlimited" },
    ]);
  };

  const updateCrewLocation = (id: string, updates: Partial<CrewLocation>) => {
    setCrewLocations(crewLocations.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCrewLocation = (id: string) => {
    setCrewLocations(crewLocations.filter((c) => c.id !== id));
  };

  const handleScheduleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSchedule((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Clean data for API
    const cleanedPickups = packetPickups
      .filter((p) => p.date && p.location)
      .map(({ date, start_time, end_time, location, notes }) => ({
        date,
        start_time,
        end_time,
        location,
        notes: notes || null,
      }));

    const cleanedSchedule = schedule
      .filter((s) => s.time && s.title)
      .map(({ time, title, description }) => ({
        time,
        title,
        description: description || null,
      }));

    const cleanedCrewLocations = crewLocations
      .filter((c) => c.name && c.mile_out >= 0)
      .map(({ name, mile_out, mile_in, access_type, parking_info, setup_time, shuttle_info, notes, restrictions }) => ({
        name,
        mile_out,
        mile_in: mile_in || null,
        access_type,
        parking_info: parking_info || null,
        setup_time: setup_time || null,
        shuttle_info: shuttle_info || null,
        notes: notes || null,
        restrictions: restrictions || null,
      }));

    try {
      const response = await fetch("/api/admin/race-logistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raceId,
          logistics: {
            parking_info: parkingInfo || null,
            packet_pickup: cleanedPickups,
            event_schedule: cleanedSchedule,
            crew_info: crewInfo || null,
            crew_locations: cleanedCrewLocations,
            drop_bag_info: dropBagInfo || null,
            course_rules: courseRules || null,
            course_marking: courseMarking || null,
            weather_notes: weatherNotes || null,
            additional_info: additionalInfo || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast.error(result.error || "Failed to save");
        setSaving(false);
        return;
      }

      toast.success("Race logistics saved!");
      onSaved();
    } catch {
      toast.error("Failed to save logistics");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-brand-navy-100">
          <div>
            <h2 className="text-xl font-heading font-semibold text-brand-navy-900">
              Race Day Logistics
            </h2>
            <p className="mt-1 text-sm text-brand-navy-600">{raceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brand-navy-400 hover:text-brand-navy-600 hover:bg-brand-navy-50 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-brand-navy-50 border-b border-brand-navy-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-white text-brand-navy-900 shadow-sm"
                  : "text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-100"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "parking" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Parking Information</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  Include parking locations, fees, shuttle info, overnight rules
                </p>
                <RichTextEditor
                  value={parkingInfo}
                  onChange={setParkingInfo}
                  placeholder="All athletes and crews must park at Community Fields and High School parking lots. Complimentary shuttles run to the start line from 4:30am. No overnight camping or parking is allowed..."
                  minHeight="180px"
                />
              </div>
            </div>
          )}

          {activeTab === "packet" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Packet Pickup Times</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-3">
                  Add pickup dates, times, and locations. Include ID requirements.
                </p>
                <div className="space-y-3">
                  {packetPickups.map((pickup) => (
                    <div
                      key={pickup.id}
                      className="p-4 bg-brand-navy-50 rounded-lg border border-brand-navy-100"
                    >
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={pickup.date}
                            onChange={(e) => updatePacketPickup(pickup.id, { date: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={pickup.start_time}
                            onChange={(e) => updatePacketPickup(pickup.id, { start_time: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={pickup.end_time}
                            onChange={(e) => updatePacketPickup(pickup.id, { end_time: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => removePacketPickup(pickup.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Location</Label>
                          <Input
                            value={pickup.location}
                            onChange={(e) => updatePacketPickup(pickup.id, { location: e.target.value })}
                            placeholder="135 E 6th Street, Leadville CO"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Notes</Label>
                          <Input
                            value={pickup.notes || ""}
                            onChange={(e) => updatePacketPickup(pickup.id, { notes: e.target.value })}
                            placeholder="Photo ID required"
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addPacketPickup} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pickup Time
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Race Day Schedule</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-3">
                  Add key times for race day. Drag to reorder.
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleScheduleDragEnd}
                >
                  <SortableContext items={schedule.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {schedule.map((item) => (
                        <SortableScheduleItem
                          key={item.id}
                          item={item}
                          onUpdate={(updates) => updateScheduleItem(item.id, updates)}
                          onRemove={() => removeScheduleItem(item.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button variant="outline" onClick={addScheduleItem} className="w-full mt-3 border-dashed">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule Item
                </Button>
              </div>
            </div>
          )}

          {activeTab === "crew" && (
            <div className="space-y-6">
              {/* Crew Locations */}
              <div>
                <Label className="text-sm font-medium">Crew Access Locations</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-3">
                  Add specific locations where crews can access the course.
                </p>
                <div className="space-y-4">
                  {crewLocations.map((location) => (
                    <div
                      key={location.id}
                      className="p-4 bg-brand-navy-50 rounded-lg border border-brand-navy-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 grid gap-3 sm:grid-cols-4">
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Location Name</Label>
                            <Input
                              value={location.name}
                              onChange={(e) => updateCrewLocation(location.id, { name: e.target.value })}
                              placeholder="Twin Lakes Dam"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Mile (Out)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={location.mile_out || ""}
                              onChange={(e) => updateCrewLocation(location.id, { mile_out: parseFloat(e.target.value) || 0 })}
                              placeholder="40.8"
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Return Mile (if applicable)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={location.mile_in || ""}
                              onChange={(e) => updateCrewLocation(location.id, { mile_in: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="For out-and-back courses"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeCrewLocation(location.id)}
                          className="ml-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 mb-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Access Type</Label>
                          <select
                            value={location.access_type}
                            onChange={(e) => updateCrewLocation(location.id, { access_type: e.target.value as "unlimited" | "limited" | "reserved" })}
                            className="flex h-9 w-full rounded-md border border-brand-navy-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-sky-400"
                          >
                            <option value="unlimited">Unlimited Access</option>
                            <option value="limited">Limited Access</option>
                            <option value="reserved">Reserved (Registration Required)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Setup Time</Label>
                          <Input
                            value={location.setup_time || ""}
                            onChange={(e) => updateCrewLocation(location.id, { setup_time: e.target.value })}
                            placeholder="5:00am or 2hrs before"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Shuttle Info</Label>
                          <Input
                            value={location.shuttle_info || ""}
                            onChange={(e) => updateCrewLocation(location.id, { shuttle_info: e.target.value })}
                            placeholder="Shuttle from start line"
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 mb-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Parking Info</Label>
                          <Input
                            value={location.parking_info || ""}
                            onChange={(e) => updateCrewLocation(location.id, { parking_info: e.target.value })}
                            placeholder="Limited spots, arrive early"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Restrictions</Label>
                          <Input
                            value={location.restrictions || ""}
                            onChange={(e) => updateCrewLocation(location.id, { restrictions: e.target.value })}
                            placeholder="No glass containers, max 4 crew"
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Additional Notes</Label>
                        <Textarea
                          value={location.notes || ""}
                          onChange={(e) => updateCrewLocation(location.id, { notes: e.target.value })}
                          placeholder="Runners arrive here between 9:30-11:30am outbound, 4:00-7:00pm return. Portable toilets available. No fires or camping."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addCrewLocation} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Crew Location
                  </Button>
                </div>
              </div>

              {/* General Crew Info */}
              <div>
                <Label className="text-sm font-medium">General Crew Rules & Information</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  Overall crew policies, registration requirements, general rules
                </p>
                <RichTextEditor
                  value={crewInfo}
                  onChange={setCrewInfo}
                  placeholder="All crew must check in at registration and receive crew wristbands. Crews may only access designated crew areas. Athletes may not receive outside assistance at any other point on course. Reserved crew spots require advance registration ($50) at..."
                  minHeight="140px"
                />
              </div>
            </div>
          )}

          {activeTab === "dropbag" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Drop Bag Information</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  Locations, labeling requirements, what to include
                </p>
                <RichTextEditor
                  value={dropBagInfo}
                  onChange={setDropBagInfo}
                  placeholder="Drop bags available at Twin Lakes Dam (mile 40.8/63.2) and Outward Bound (mile 25/78.5). Use clear plastic bags labeled with bib number, name, and aid station..."
                  minHeight="180px"
                />
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Important Rules</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  DQ conditions, number placement, course rules
                </p>
                <RichTextEditor
                  value={courseRules}
                  onChange={setCourseRules}
                  placeholder="Starting outside assigned corral is grounds for DQ. Race numbers must be visible on handlebars - do not cut or fold. If you leave the course, you must re-enter at the same point..."
                  minHeight="180px"
                />
              </div>
            </div>
          )}

          {activeTab === "course" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Course Marking</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  How the course is marked, what to look for
                </p>
                <RichTextEditor
                  value={courseMarking}
                  onChange={setCourseMarking}
                  placeholder="Course marked with pink flags and pink/black tape. Major intersections have course marshals. Wrong Way signs mark closed trails..."
                  minHeight="150px"
                />
              </div>
            </div>
          )}

          {activeTab === "weather" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Weather Notes</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  Typical conditions, altitude effects, what to prepare for
                </p>
                <RichTextEditor
                  value={weatherNotes}
                  onChange={setWeatherNotes}
                  placeholder="Start elevation: 10,152 ft. Max elevation: 12,424 ft at Columbine Mine. Morning temps typically 40-50°F, afternoon highs 70-80°F. Afternoon thunderstorms common - prepare for rain and cold..."
                  minHeight="150px"
                />
              </div>
            </div>
          )}

          {activeTab === "other" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Additional Information</Label>
                <p className="text-xs text-brand-navy-500 mt-1 mb-2">
                  Any other important notes for athletes
                </p>
                <RichTextEditor
                  value={additionalInfo}
                  onChange={setAdditionalInfo}
                  placeholder="Post-race party at finish line from 12pm-8pm. Awards ceremony at 7pm. Finisher buckles available at awards..."
                  minHeight="150px"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-brand-navy-100 bg-brand-navy-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Logistics
          </Button>
        </div>
      </div>
    </div>
  );
}
