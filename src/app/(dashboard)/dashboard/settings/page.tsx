"use client";

import { useState, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSettingsData } from "@/hooks";
import {
  ProfileSection,
  AthleteSection,
  NutritionSection,
  PreferencesSection,
  BillingSection,
  NotificationsSection,
  IntegrationsSection,
  AccountSection,
  SettingsNav,
  NAV_ITEMS,
} from "@/components/settings";
import type { SettingsSection } from "@/types/settings";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("section") as SettingsSection) || "profile";
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const {
    loading,
    saving,
    billingLoading,
    uploadingAvatar,
    setUploadingAvatar,
    user,
    subscription,
    isLocked,
    formState,
    updateFormField,
    getDisplayWeight,
    handleWeightChange,
    getDisplayGearWeight,
    handleGearWeightChange,
    powerTargets,
    saveProfile,
    savePowerSettings,
    saveNutrition,
    savePreferences,
    openBillingPortal,
    handleUpgrade,
    handleLogout,
    supabase,
  } = useSettingsData();

  // Update active section when URL param changes
  useEffect(() => {
    const section = searchParams.get("section") as SettingsSection;
    if (section && NAV_ITEMS.some((item) => item.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
          <p className="text-sm text-brand-navy-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-brand-navy-600">
          Manage your profile, preferences, and integrations
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          {activeSection === "profile" && (
            <ProfileSection
              user={user}
              formState={formState}
              updateFormField={updateFormField}
              saving={saving}
              uploadingAvatar={uploadingAvatar}
              setUploadingAvatar={setUploadingAvatar}
              saveProfile={saveProfile}
              supabase={supabase}
            />
          )}

          {activeSection === "athlete" && (
            <AthleteSection
              formState={formState}
              updateFormField={updateFormField}
              saving={saving}
              isLocked={isLocked}
              powerTargets={powerTargets}
              getDisplayWeight={getDisplayWeight}
              handleWeightChange={handleWeightChange}
              getDisplayGearWeight={getDisplayGearWeight}
              handleGearWeightChange={handleGearWeightChange}
              savePowerSettings={savePowerSettings}
            />
          )}

          {activeSection === "nutrition" && (
            <NutritionSection
              formState={formState}
              updateFormField={updateFormField}
              saving={saving}
              saveNutrition={saveNutrition}
            />
          )}

          {activeSection === "preferences" && (
            <PreferencesSection
              formState={formState}
              updateFormField={updateFormField}
              saving={saving}
              savePreferences={savePreferences}
            />
          )}

          {activeSection === "billing" && (
            <BillingSection
              subscription={subscription}
              billingLoading={billingLoading}
              openBillingPortal={openBillingPortal}
              handleUpgrade={handleUpgrade}
            />
          )}

          {activeSection === "notifications" && <NotificationsSection />}

          {activeSection === "integrations" && <IntegrationsSection />}

          {activeSection === "account" && (
            <AccountSection handleLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
