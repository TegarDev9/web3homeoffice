import { getEnv } from "../env";
import type { ProvisionJob } from "../supabase";
import { tencentJsonRequest } from "./tencent-auth";
import type { ProvisionProvider, ProvisionResult } from "./types";

type CreateInstancesResponse = {
  Response: {
    InstanceIdSet?: string[];
    RequestId: string;
  };
};

type DescribeInstancesResponse = {
  Response: {
    InstanceSet?: Array<{
      InstanceId: string;
      PublicAddresses?: string[];
    }>;
  };
};

type CreateCommandResponse = {
  Response: {
    CommandId: string;
  };
};

export class LighthouseProvisionProvider implements ProvisionProvider {
  private readonly env = getEnv();

  private blueprintIdForOs(os: ProvisionJob["os"]) {
    if (os === "debian") return this.env.LIGHTHOUSE_BLUEPRINT_ID_DEBIAN;
    if (os === "kali") return this.env.LIGHTHOUSE_BLUEPRINT_ID_KALI;
    return this.env.LIGHTHOUSE_BLUEPRINT_ID_UBUNTU;
  }

  async createInstance(job: ProvisionJob): Promise<ProvisionResult> {
    const createResponse = await tencentJsonRequest<CreateInstancesResponse>({
      service: "lighthouse",
      endpoint: "lighthouse.tencentcloudapi.com",
      action: "CreateInstances",
      version: "2020-03-24",
      region: job.region,
      payload: {
        BundleId: this.env.LIGHTHOUSE_BUNDLE_ID,
        BlueprintId: this.blueprintIdForOs(job.os),
        InstanceChargeType: "POSTPAID_BY_HOUR",
        InstanceCount: 1,
        Zone: this.env.LIGHTHOUSE_ZONE,
        InstanceName: `web3ho-${job.id.slice(0, 8)}`
      }
    });

    const instanceId = createResponse.Response.InstanceIdSet?.[0];
    if (!instanceId) {
      throw new Error(`CreateInstances returned no instance ID for job ${job.id}`);
    }

    // Best effort immediate lookup. IP may not be ready in early lifecycle.
    const describeResponse = await tencentJsonRequest<DescribeInstancesResponse>({
      service: "lighthouse",
      endpoint: "lighthouse.tencentcloudapi.com",
      action: "DescribeInstances",
      version: "2020-03-24",
      region: job.region,
      payload: {
        InstanceIds: [instanceId]
      }
    });

    const instance = describeResponse.Response.InstanceSet?.find((item) => item.InstanceId === instanceId);

    return {
      instanceId,
      publicIp: instance?.PublicAddresses?.[0] ?? null,
      metadata: {
        requestId: createResponse.Response.RequestId
      }
    };
  }

  async bootstrapInstance(job: ProvisionJob, instanceId: string, script: string): Promise<void> {
    const contentBase64 = Buffer.from(script, "utf-8").toString("base64");

    const commandResponse = await tencentJsonRequest<CreateCommandResponse>({
      service: "tat",
      endpoint: "tat.tencentcloudapi.com",
      action: "CreateCommand",
      version: "2020-10-28",
      region: job.region,
      payload: {
        CommandName: `web3ho-bootstrap-${job.id.slice(0, 8)}`,
        CommandType: "SHELL",
        Content: contentBase64,
        Description: "Web3 Home Office bootstrap command"
      }
    });

    const commandId = commandResponse.Response.CommandId;

    await tencentJsonRequest({
      service: "tat",
      endpoint: "tat.tencentcloudapi.com",
      action: "InvokeCommand",
      version: "2020-10-28",
      region: job.region,
      payload: {
        CommandId: commandId,
        InstanceIds: [instanceId],
        Parameters: []
      }
    });
  }
}


