"use client";

import { Card, CardContent, RichTextDisplay } from "@/components/ui";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  content: string;
}

export function InfoCard({ icon, title, content }: InfoCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-brand-sky-600 mb-3">
          {icon}
          <h3 className="font-semibold text-brand-navy-900">{title}</h3>
        </div>
        <RichTextDisplay
          content={content}
          className="text-sm text-brand-navy-600 leading-relaxed"
        />
      </CardContent>
    </Card>
  );
}
