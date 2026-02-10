"use client";

import { useState } from "react";
import { LoaderCircle, Rocket } from "lucide-react";

import {
  DEFAULT_PROVISION_OS,
  DEFAULT_PROVISION_TEMPLATE,
  type ProvisionOs,
  type ProvisionTemplate
} from "@web3homeoffice/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProvisionRequestFormProps = {
  defaultRegion: string;
};

export function ProvisionRequestForm({ defaultRegion }: ProvisionRequestFormProps) {
  const [template, setTemplate] = useState<ProvisionTemplate>(DEFAULT_PROVISION_TEMPLATE);
  const [os, setOs] = useState<ProvisionOs>(DEFAULT_PROVISION_OS);
  const [region, setRegion] = useState(defaultRegion);
  const [sshPublicKey, setSshPublicKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/provision/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planTemplate: template,
          os,
          region,
          sshPublicKey: sshPublicKey.trim() || undefined
        })
      });

      const payload = (await response.json()) as
        | { jobId: string; status: string }
        | { error: { message: string } };

      if (!response.ok || "error" in payload) {
        setMessage("error" in payload ? payload.error.message : "Failed to create provision job.");
      } else {
        setMessage(`Job ${payload.jobId} queued with status ${payload.status}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create provision job.");
    }

    setBusy(false);
  };

  return (
    <Card id="provision">
      <CardHeader>
        <CardTitle>Provision VPS</CardTitle>
        <CardDescription>Create a provisioning job processed by the Tencent worker.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="template">Template</Label>
          <Select value={template} onValueChange={(value) => setTemplate(value as ProvisionTemplate)}>
            <SelectTrigger id="template">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vps-base">VPS Base</SelectItem>
              <SelectItem value="rpc-placeholder">RPC Placeholder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="os">OS</Label>
          <Select value={os} onValueChange={(value) => setOs(value as ProvisionOs)}>
            <SelectTrigger id="os">
              <SelectValue placeholder="Select OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ubuntu">Ubuntu</SelectItem>
              <SelectItem value="debian">Debian</SelectItem>
              <SelectItem value="kali">Kali Linux</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="region">Region</Label>
          <Input id="region" value={region} onChange={(event) => setRegion(event.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="ssh">SSH Public Key (optional)</Label>
          <Input
            id="ssh"
            value={sshPublicKey}
            onChange={(event) => setSshPublicKey(event.target.value)}
            placeholder="ssh-ed25519 AAAA..."
          />
        </div>

        <Button onClick={onSubmit} disabled={busy}>
          {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Request provisioning
        </Button>

        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </CardContent>
    </Card>
  );
}


