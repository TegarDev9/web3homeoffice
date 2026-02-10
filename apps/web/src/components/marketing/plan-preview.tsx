import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlanSnapshot } from "@/components/marketing/landing-data";
import { cn } from "@/lib/utils";

type PlanPreviewProps = {
  plans: PlanSnapshot[];
};

export function PlanPreview({ plans }: PlanPreviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn("marketing-card-hover", plan.highlight ? "border-accent/50 shadow-neon" : "")}
        >
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border/60 bg-black/20 p-3">
              <p className="text-sm uppercase tracking-[0.1em] text-muted">Included capacity</p>
              <p className="mt-1 text-lg font-semibold text-text">
                {plan.instances} {plan.instances > 1 ? "instances" : "instance"}
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/billing">
                Choose {plan.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
