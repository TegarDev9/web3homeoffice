import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Checkout received</CardTitle>
          <CardDescription>
            We are waiting for the latest webhook sync. Refresh in a few seconds if status has not updated yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/billing">Back to billing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


