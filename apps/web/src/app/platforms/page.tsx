import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-text">Platform Adapters</h1>
        <p className="mt-1 text-sm text-muted">
          Test and deploy guidance for Telegram Mini Apps, Farcaster Mini Apps, and Base Mini Apps.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Telegram Mini App</CardTitle>
            <CardDescription>Verify `tgWebAppData` server-side and map users into `platform_accounts`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>1. Configure `TELEGRAM_BOT_TOKEN`.</p>
            <p>2. Launch with `tgWebAppData` query param.</p>
            <p>3. POST payload to `/api/platform/telegram/verify`.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Farcaster Mini App</CardTitle>
            <CardDescription>Expose metadata endpoint for mini app entry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Manifest endpoint: `/api/platform/farcaster/manifest`.</p>
            <p>Set valid app URLs and account association fields before publishing.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Base Mini App</CardTitle>
            <CardDescription>Use MiniKit provider wrapper with browser-safe fallback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Manifest endpoint: `/api/platform/base/manifest`.</p>
            <p>Safe-area handling is enabled by default for embedded mobile contexts.</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted">See repository README for environment setup and publishing checklist.</p>
    </div>
  );
}


