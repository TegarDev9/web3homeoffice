import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left"
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl space-y-3",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <Badge variant="secondary" className="w-fit border-accent/35 text-accent">
        {eyebrow}
      </Badge>
      <h2 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">{title}</h2>
      <p className="text-sm leading-relaxed text-muted sm:text-base">{description}</p>
    </div>
  );
}
