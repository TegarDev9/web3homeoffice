import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowStep } from "@/components/marketing/landing-data";

type WorkflowStepsProps = {
  steps: WorkflowStep[];
};

export function WorkflowSteps({ steps }: WorkflowStepsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {steps.map((step, index) => (
        <Card key={step.title} className="marketing-card-hover">
          <CardHeader className="space-y-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/35 bg-accent/10 text-sm font-semibold text-accent">
              {index + 1}
            </span>
            <CardTitle className="text-xl">{step.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-muted">{step.description}</p>
            <ul className="space-y-1.5 text-sm text-text">
              {step.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
