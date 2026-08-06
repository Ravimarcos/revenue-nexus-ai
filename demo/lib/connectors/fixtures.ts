/**
 * The only ConnectorRegistry implementation in this build.
 *
 * Reads committed JSON. No network, no credentials, nothing that can expire.
 * Swapping this for real CRM / provisioning / ERP connectors is the
 * extension path — and because the interface already carries `syncedAt` and
 * `anomalies`, nothing downstream changes when it happens.
 */
import { loadContract, loadCustomer, loadMilestones, loadUsage } from "../data";
import type {
  ConnectorRegistry, ContractConnector, CrmConnector,
  CustomerRecord, ActivityConnector, Mirrored, UsageConnector,
} from "./types";
import type { Contract, MilestoneEvidence, UsageDay } from "../engine/types";

const CRM_SYNC = "2026-08-05T23:04:11+05:30";
const ACTIVITY_SYNC = "2026-08-06T02:10:44+05:30";
const USAGE_SYNC = "2026-08-06T01:00:00+05:30";

const crm: CrmConnector = {
  system: "HubSpot CRM",
  async fetchCustomer(): Promise<Mirrored<CustomerRecord>> {
    const c = loadCustomer();
    return {
      source: "HubSpot CRM",
      syncedAt: CRM_SYNC,
      data: {
        id: c.company.id,
        name: c.company.name,
        billingEntities: c.billingEntities.map((b) => ({
          id: b.id, gstin: b.gstin, state: b.state, primary: b.primary,
        })),
      },
      anomalies: [
        "Opportunity records a total of ₹1.40 Cr with no pricing decomposition — the amount is mirrored, the structure is not available from this source.",
      ],
    };
  },
};

const contracts: ContractConnector = {
  system: "Contract repository",
  async fetchContract(): Promise<Mirrored<Contract>> {
    return { source: "Signed contract PDF", syncedAt: "2026-07-14T18:00:00+05:30", data: loadContract() };
  },
};

const activities: ActivityConnector = {
  system: "CRM — activity timeline",
  async fetchMilestoneEvidence(): Promise<Mirrored<MilestoneEvidence[]>> {
    return { source: "CRM activity timeline", syncedAt: ACTIVITY_SYNC, data: loadMilestones() };
  },
};

const usage: UsageConnector = {
  system: "Channel Rewards telemetry",
  granularity: "DAILY",
  async fetchUsage(): Promise<Mirrored<UsageDay[]>> {
    return { source: "Channel Rewards telemetry", syncedAt: USAGE_SYNC, data: loadUsage() };
  },
};

export const fixtureRegistry: ConnectorRegistry = { crm, contracts, activities, usage };

export const SYNC_TIMES = { crm: CRM_SYNC, activity: ACTIVITY_SYNC, usage: USAGE_SYNC };
