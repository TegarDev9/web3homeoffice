import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  title: string;
  description: string;
  statusLabel?: string;
};

export function PageHeader({ title, description, statusLabel }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {statusLabel ? <Badge variant="secondary">{statusLabel}</Badge> : null}
    </div>
  );
}


