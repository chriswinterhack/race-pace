import { Users, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-brand-navy-900">
          Community
        </h1>
        <p className="mt-1 text-brand-navy-600">
          Connect with fellow racers and share knowledge
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-brand-sky-50">
                <MessageSquare className="h-6 w-6 text-brand-sky-500" />
              </div>
              <div>
                <h2 className="font-semibold text-brand-navy-900">
                  Race Forums
                </h2>
                <p className="mt-1 text-sm text-brand-navy-600">
                  Discuss race strategies, conditions, and tips
                  with others who&apos;ve done the event.
                </p>
                <p className="mt-3 text-sm text-brand-sky-500 font-medium">
                  Coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elevated transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-emerald-50">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="font-semibold text-brand-navy-900">
                  Gear Sharing
                </h2>
                <p className="mt-1 text-sm text-brand-navy-600">
                  See what bikes, tires, and setups others
                  are running for each race.
                </p>
                <p className="mt-3 text-sm text-brand-sky-500 font-medium">
                  Coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-brand-navy-100 mb-4">
          <Users className="h-8 w-8 text-brand-navy-400" />
        </div>
        <h2 className="text-lg font-medium text-brand-navy-900">
          Community features launching soon
        </h2>
        <p className="mt-1 text-brand-navy-600 max-w-md">
          We&apos;re building race-specific forums and gear sharing
          features. Check back after you&apos;ve created your first
          race plan!
        </p>
      </div>
    </div>
  );
}
