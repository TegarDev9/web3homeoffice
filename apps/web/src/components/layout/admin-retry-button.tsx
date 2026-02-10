"use client";

import { useState } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AdminRetryButtonProps = {
  jobId: string;
};

export function AdminRetryButton({ jobId }: AdminRetryButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRetry = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/provision-jobs/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobId })
      });
      const payload = (await response.json()) as { retried?: boolean; error?: { message: string } };

      if (!response.ok || payload.error) {
        setError(payload.error?.message ?? "Retry request failed");
      } else {
        router.refresh();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Retry request failed");
    }

    setBusy(false);
  };

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={onRetry} disabled={busy}>
        {busy ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-2 h-3.5 w-3.5" />}
        Retry
      </Button>
      {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
