import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FaqItem } from "@/components/marketing/landing-data";

type FaqProps = {
  items: FaqItem[];
};

export function Faq({ items }: FaqProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.question} className="marketing-card-hover">
          <CardHeader>
            <CardTitle className="text-lg">{item.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted">{item.answer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
