import { DEFAULT_CURRENCY, type Invoice, type InvoiceInput } from "@/lib/invoices";
import type { Milestone, Project } from "@/lib/types";

/**
 * Invoices are rendered from live dashboard data (the linked project and
 * milestone). Values stored on the invoice row are used only when:
 *  - the user explicitly edited them in Edit Invoice (stored value differs
 *    from the live dashboard value) → "edited", or
 *  - there is no live value (project/milestone unlinked or deleted, or the
 *    dashboard field is empty) → "invoice".
 * Otherwise the live value wins → "dashboard".
 *
 * Linked invoices are kept in sync when dashboard data changes (see
 * invoiceSyncPatchForProject / invoiceSyncPatchForMilestone), so a later
 * rename or price change is never mistaken for an explicit edit.
 */
export type InvoiceFieldSource = "dashboard" | "edited" | "invoice";

export type InvoiceFieldSources = {
  projectName: InvoiceFieldSource;
  client: InvoiceFieldSource;
  clientLogoUrl: InvoiceFieldSource;
  milestoneName: InvoiceFieldSource;
  description: InvoiceFieldSource;
  amount: InvoiceFieldSource;
};

export interface ResolvedInvoice extends Invoice {
  /** First line of the description row (milestone name when live). */
  descriptionTitle: string;
  /** Secondary description text (milestone description when live). */
  descriptionDetail: string;
  /** Live project logo, used if an edited client logo cannot be loaded. */
  clientLogoFallbackUrl: string | null;
  fieldSources: InvoiceFieldSources;
}

export type InvoiceLinks = {
  project: Project | null;
  milestone: Milestone | null;
};

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function normalize(value: string | null | undefined): string {
  return clean(value).replace(/\s+/g, " ").toLowerCase();
}

/** Locate the live project and milestone an invoice is linked to. */
export function findInvoiceLinks(
  invoice: Pick<Invoice, "projectId" | "milestoneId">,
  projects: readonly Project[],
): InvoiceLinks {
  let project = invoice.projectId
    ? (projects.find((row) => row.id === invoice.projectId) ?? null)
    : null;
  let milestone: Milestone | null = null;
  if (invoice.milestoneId) {
    milestone = project?.milestones.find((row) => row.id === invoice.milestoneId) ?? null;
    if (!milestone) {
      for (const row of projects) {
        const match = row.milestones.find((item) => item.id === invoice.milestoneId);
        if (match) {
          milestone = match;
          project = project ?? row;
          break;
        }
      }
    }
  }
  return { project, milestone };
}

/** Canonical stored description for a milestone: name, then description. */
export function milestoneDescriptionText(
  milestone: Pick<Milestone, "name" | "description">,
): string {
  const name = clean(milestone.name);
  const detail = clean(milestone.description);
  if (!detail || normalize(detail) === normalize(name)) return name;
  return name ? `${name}\n${detail}` : detail;
}

/** True when a stored description is just a (past) default for the milestone. */
function isDefaultDescription(
  stored: string,
  milestone: Pick<Milestone, "name" | "description">,
): boolean {
  const value = normalize(stored);
  if (!value) return true;
  const name = clean(milestone.name);
  const detail = clean(milestone.description);
  const candidates = [
    name,
    detail,
    milestoneDescriptionText(milestone),
    `${name} — ${detail}`,
    `${name} - ${detail}`,
    `${name}: ${detail}`,
  ];
  return candidates.some((candidate) => candidate.trim() && normalize(candidate) === value);
}

function pickText(
  stored: string | null | undefined,
  live: string | null | undefined,
  hasLiveSource: boolean,
): { value: string; source: InvoiceFieldSource } {
  const storedValue = clean(stored);
  const liveValue = clean(live);
  if (!hasLiveSource || !liveValue) {
    return { value: storedValue, source: "invoice" };
  }
  if (storedValue && storedValue !== liveValue) {
    return { value: storedValue, source: "edited" };
  }
  return { value: liveValue, source: "dashboard" };
}

function sameAmount(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

function sameCurrency(a: string | null | undefined, b: string | null | undefined): boolean {
  return (clean(a) || DEFAULT_CURRENCY).toUpperCase() === (clean(b) || DEFAULT_CURRENCY).toUpperCase();
}

function amountIsEdited(invoice: Pick<Invoice, "amount" | "currency">, milestone: Milestone) {
  const stored = Number(invoice.amount);
  const livePrice = Number(milestone.price) || 0;
  // A stored 0 is the "not filled in" default, never a deliberate edit.
  const amountEdited = Number.isFinite(stored) && stored !== 0 && !sameAmount(stored, livePrice);
  const currencyEdited =
    Boolean(clean(invoice.currency)) && !sameCurrency(invoice.currency, milestone.currency);
  return amountEdited || currencyEdited;
}

/** Merge live dashboard data into an invoice for display and PDF output. */
export function resolveInvoice(invoice: Invoice, links: InvoiceLinks): ResolvedInvoice {
  const { project, milestone } = links;

  const projectName = pickText(invoice.projectName, project?.name, Boolean(project));
  const client = pickText(invoice.client, project?.client, Boolean(project));
  const milestoneName = pickText(invoice.milestoneName, milestone?.name, Boolean(milestone));

  // Client logo: always the project logo unless a different one was set in Edit Invoice.
  const liveLogo = clean(project?.logo) || null;
  const storedLogo = clean(invoice.clientLogoUrl) || null;
  let clientLogoUrl: string | null;
  let clientLogoSource: InvoiceFieldSource;
  if (liveLogo) {
    clientLogoUrl = storedLogo && storedLogo !== liveLogo ? storedLogo : liveLogo;
    clientLogoSource = clientLogoUrl === liveLogo ? "dashboard" : "edited";
  } else {
    clientLogoUrl = storedLogo;
    clientLogoSource = "invoice";
  }

  let description = clean(invoice.description);
  let descriptionTitle = description;
  let descriptionDetail = "";
  let descriptionSource: InvoiceFieldSource = "invoice";
  if (milestone) {
    if (isDefaultDescription(invoice.description, milestone)) {
      description = milestoneDescriptionText(milestone);
      descriptionTitle = clean(milestone.name) || clean(milestone.description);
      descriptionDetail =
        clean(milestone.name) && normalize(milestone.description) !== normalize(milestone.name)
          ? clean(milestone.description)
          : "";
      descriptionSource = "dashboard";
    } else {
      descriptionSource = "edited";
    }
  }
  if (descriptionSource !== "dashboard") {
    const [first = "", ...rest] = description.split(/\r?\n/);
    descriptionTitle = first.trim();
    descriptionDetail = rest.join("\n").trim();
  }

  let amount = Number.isFinite(invoice.amount) ? invoice.amount : 0;
  let currency = clean(invoice.currency) || DEFAULT_CURRENCY;
  let amountSource: InvoiceFieldSource = "invoice";
  if (milestone) {
    if (amountIsEdited(invoice, milestone)) {
      amountSource = "edited";
    } else {
      amount = Number(milestone.price) || 0;
      currency = clean(milestone.currency) || currency;
      amountSource = "dashboard";
    }
  }

  return {
    ...invoice,
    projectName: projectName.value,
    client: client.value,
    clientLogoUrl,
    milestoneName: milestoneName.value,
    description,
    amount,
    currency,
    descriptionTitle,
    descriptionDetail,
    clientLogoFallbackUrl: liveLogo,
    fieldSources: {
      projectName: projectName.source,
      client: client.source,
      clientLogoUrl: clientLogoSource,
      milestoneName: milestoneName.source,
      description: descriptionSource,
      amount: amountSource,
    },
  };
}

export function resolveInvoices(
  invoices: readonly Invoice[],
  projects: readonly Project[],
): ResolvedInvoice[] {
  return invoices.map((invoice) => resolveInvoice(invoice, findInvoiceLinks(invoice, projects)));
}

function textFollows(stored: string | null | undefined, previousLive: string | null | undefined) {
  const value = clean(stored);
  return !value || value === clean(previousLive);
}

/**
 * Stored-field patch that keeps a linked invoice in step with a project edit.
 * Fields the user explicitly edited on the invoice are left untouched.
 */
export function invoiceSyncPatchForProject(
  invoice: Invoice,
  previous: Pick<Project, "name" | "client" | "logo">,
  next: Pick<Project, "name" | "client" | "logo">,
): Partial<InvoiceInput> | null {
  const patch: Partial<InvoiceInput> = {};
  if (clean(previous.name) !== clean(next.name) && textFollows(invoice.projectName, previous.name)) {
    patch.projectName = clean(next.name);
  }
  if (
    clean(previous.client) !== clean(next.client) &&
    clean(next.client) &&
    textFollows(invoice.client, previous.client)
  ) {
    patch.client = clean(next.client);
  }
  const previousLogo = clean(previous.logo) || null;
  const nextLogo = clean(next.logo) || null;
  const storedLogo = clean(invoice.clientLogoUrl) || null;
  if (previousLogo !== nextLogo && (!storedLogo || storedLogo === previousLogo)) {
    patch.clientLogoUrl = nextLogo;
  }
  return Object.keys(patch).length ? patch : null;
}

/**
 * Stored-field patch that keeps a linked invoice in step with a milestone edit.
 * Fields the user explicitly edited on the invoice are left untouched.
 */
export function invoiceSyncPatchForMilestone(
  invoice: Invoice,
  previous: Milestone,
  next: Milestone,
): Partial<InvoiceInput> | null {
  const patch: Partial<InvoiceInput> = {};
  if (
    clean(previous.name) !== clean(next.name) &&
    textFollows(invoice.milestoneName, previous.name)
  ) {
    patch.milestoneName = clean(next.name);
  }
  const nextDescription = milestoneDescriptionText(next);
  if (
    nextDescription !== milestoneDescriptionText(previous) &&
    isDefaultDescription(invoice.description, previous)
  ) {
    patch.description = nextDescription;
  }
  const priceChanged = !sameAmount(Number(previous.price) || 0, Number(next.price) || 0);
  const currencyChanged = !sameCurrency(previous.currency, next.currency);
  if ((priceChanged || currencyChanged) && !amountIsEdited(invoice, previous)) {
    patch.amount = Number(next.price) || 0;
    patch.currency = clean(next.currency) || DEFAULT_CURRENCY;
  }
  return Object.keys(patch).length ? patch : null;
}
