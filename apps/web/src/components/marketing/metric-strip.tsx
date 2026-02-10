import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { TrustMetric } from "@/components/marketing/landing-data";

type MetricStripProps = {
  metrics: TrustMetric[];
};

export function MetricStrip({ metrics }: MetricStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="marketing-card-hover">
          <CardContent className="space-y-2 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">{metric.value}</p>
            <p className="text-base font-medium text-text">{metric.label}</p>
            <p className="text-sm text-muted">{metric.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
