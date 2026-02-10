import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CapabilityItem } from "@/components/marketing/landing-data";

type CapabilityGridProps = {
  items: CapabilityItem[];
};

export function CapabilityGrid({ items }: CapabilityGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} className="marketing-card-hover">
            <CardHeader className="space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-accent/35 bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
