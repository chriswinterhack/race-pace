"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { WizardProgress } from "@/components/plan/WizardProgress";
import {
  PlanBuilderProvider,
  usePlanBuilder,
  STEP_TITLES,
} from "./context/PlanBuilderContext";
import { RaceSelection } from "./steps/RaceSelection";
import { GoalSetting } from "./steps/GoalSetting";
import { CheckpointReview } from "./steps/CheckpointReview";
import { SegmentEditor } from "./steps/SegmentEditor";
import { NutritionPlan } from "./steps/NutritionPlan";
import { ReviewSave } from "./steps/ReviewSave";

function WizardContent() {
  const searchParams = useSearchParams();
  const distanceId = searchParams.get("distanceId");
  const { state, nextStep, prevStep, goToStep, canProceed } = usePlanBuilder();

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <RaceSelection preselectedDistanceId={distanceId} />;
      case 2:
        return <GoalSetting />;
      case 3:
        return <CheckpointReview />;
      case 4:
        return <SegmentEditor />;
      case 5:
        return <NutritionPlan />;
      case 6:
        return <ReviewSave />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/plans"
          className="flex items-center gap-2 text-sm text-brand-navy-600 hover:text-brand-navy-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          Create Race Plan
        </h1>
        <p className="mt-1 text-brand-navy-600">
          Build your personalized race execution plan
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-6">
          <WizardProgress
            currentStep={state.step}
            steps={STEP_TITLES}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {state.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
            </div>
          ) : (
            renderStep()
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={state.step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {state.step < 6 ? (
          <Button onClick={nextStep} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button disabled={!canProceed()}>
            Save Plan
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NewPlanPage() {
  return (
    <PlanBuilderProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-sky-500" />
          </div>
        }
      >
        <WizardContent />
      </Suspense>
    </PlanBuilderProvider>
  );
}
