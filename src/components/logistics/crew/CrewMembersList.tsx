"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  GripVertical,
  Phone,
  Mail,
  Edit2,
  Check,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useLogisticsPlannerStore } from "../stores/logisticsPlannerStore";
import type { CrewMemberRole } from "@/types/logistics";

const ROLE_OPTIONS: { value: CrewMemberRole; label: string; color: string }[] = [
  { value: "driver", label: "Driver", color: "bg-blue-100 text-blue-700" },
  { value: "pacer", label: "Pacer", color: "bg-purple-100 text-purple-700" },
  { value: "support", label: "Support", color: "bg-emerald-100 text-emerald-700" },
  { value: "photographer", label: "Photographer", color: "bg-amber-100 text-amber-700" },
];

interface EditingMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: CrewMemberRole;
  notes: string;
}

export function CrewMembersList() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<EditingMember>({
    id: "",
    name: "",
    phone: "",
    email: "",
    role: "support" as CrewMemberRole,
    notes: "",
  });

  const {
    crewMembers,
    addCrewMember,
    updateCrewMember,
    removeCrewMember,
  } = useLogisticsPlannerStore();

  const handleAddMember = () => {
    if (!newMember.name.trim()) return;

    addCrewMember({
      name: newMember.name.trim(),
      phone: newMember.phone.trim() || undefined,
      email: newMember.email.trim() || undefined,
      role: newMember.role || undefined,
      notes: newMember.notes.trim() || undefined,
    });

    setNewMember({
      id: "",
      name: "",
      phone: "",
      email: "",
      role: "support" as CrewMemberRole,
      notes: "",
    });
    setIsAdding(false);
  };

  const getRoleColor = (role?: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role)?.color || "bg-gray-100 text-gray-700";
  };

  const getRoleLabel = (role?: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role)?.label || role || "Support";
  };

  return (
    <div className="bg-white border border-brand-navy-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-brand-navy-900 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-navy-400" />
          Crew Members
          {crewMembers.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
              {crewMembers.length}
            </span>
          )}
        </h4>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Member
          </Button>
        )}
      </div>

      {/* Add New Member Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-brand-navy-50 rounded-lg border border-brand-navy-200">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-brand-navy-700">Name *</label>
              <Input
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Enter name"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-brand-navy-700">Phone</label>
                <Input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-navy-700">Email</label>
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-navy-700">Role</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setNewMember({ ...newMember, role: role.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      newMember.role === role.value
                        ? `${role.color} ring-2 ring-offset-1 ring-brand-sky-400`
                        : "bg-white text-brand-navy-600 border-brand-navy-200 hover:border-brand-navy-300"
                    )}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-navy-700">Notes</label>
              <Input
                value={newMember.notes}
                onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                placeholder="Optional notes about this crew member"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewMember({ id: "", name: "", phone: "", email: "", role: "support", notes: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddMember}
                disabled={!newMember.name.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      {crewMembers.length === 0 && !isAdding ? (
        <div className="py-8 text-center border border-dashed border-brand-navy-200 rounded-lg">
          <Users className="h-8 w-8 text-brand-navy-300 mx-auto mb-2" />
          <p className="text-sm text-brand-navy-600">No crew members added yet</p>
          <p className="text-xs text-brand-navy-400 mt-1">
            Add your crew members to coordinate logistics
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {crewMembers.map((member) => (
            <div
              key={member.id}
              className={cn(
                "flex items-center gap-3 p-3 bg-white border border-brand-navy-100 rounded-lg transition-all",
                editingId === member.id && "ring-2 ring-brand-sky-400"
              )}
            >
              {editingId === member.id ? (
                // Editing mode
                <div className="flex-1 space-y-2">
                  <Input
                    value={member.name}
                    onChange={(e) => updateCrewMember(member.id, { name: e.target.value })}
                    placeholder="Name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="tel"
                      value={member.phone || ""}
                      onChange={(e) => updateCrewMember(member.id, { phone: e.target.value })}
                      placeholder="Phone"
                    />
                    <Input
                      type="email"
                      value={member.email || ""}
                      onChange={(e) => updateCrewMember(member.id, { email: e.target.value })}
                      placeholder="Email"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => updateCrewMember(member.id, { role: role.value })}
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium border transition-all",
                          member.role === role.value
                            ? `${role.color} ring-1 ring-brand-sky-400`
                            : "bg-white text-brand-navy-600 border-brand-navy-200"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className="cursor-grab text-brand-navy-300 hover:text-brand-navy-400">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-brand-sky-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-sky-700 font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-brand-navy-900 truncate">{member.name}</p>
                      <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", getRoleColor(member.role))}>
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-brand-navy-500">
                      {member.phone && (
                        <a
                          href={`tel:${member.phone.replace(/\D/g, "")}`}
                          className="flex items-center gap-1 hover:text-brand-sky-600 transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </a>
                      )}
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 truncate hover:text-brand-sky-600 transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(member.id)}
                      className="p-2 text-brand-navy-400 hover:text-brand-navy-600 hover:bg-brand-navy-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeCrewMember(member.id)}
                      className="p-2 text-brand-navy-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
