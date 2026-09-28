/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */
import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDisplayDate } from "@/lib/dates";
import {
  COMPANY_TAX_ID,
  COMPANY_WEBSITE,
  DEFAULT_CURRENCY,
  formatCurrency,
  type Invoice,
} from "@/lib/invoices";
import type { ResolvedInvoice } from "@/lib/invoice-resolve";
import { colors } from "@/components/pdf/styles";
import { fitPdfImage, type PdfImage } from "@/lib/pdf";
import { isPdfSafeImage } from "@/lib/rich-text";

/** Max box for the Mirrorful logo (top-left). */
const BRAND_LOGO_BOX = { width: 160, height: 36 };
/** Max box for the client logo (top-right). */
const CLIENT_LOGO_BOX = { width: 120, height: 48 };

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: colors.text,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 24,
  },
  brandCol: {
    flexDirection: "column",
    alignItems: "flex-start",
    maxWidth: "55%",
  },
  clientLogoCol: {
    alignItems: "flex-end",
    maxWidth: "40%",
  },
  brandLogo: {
    objectFit: "contain",
    marginBottom: 8,
  },
  brandFallback: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: colors.brand,
    marginBottom: 8,
  },
  muted: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 2,
  },
  title: {
    marginTop: 24,
    marginBottom: 16,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 24,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  clientLogo: {
    objectFit: "contain",
  },
  box: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 6,
    marginTop: 20,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  desc: { flex: 3, paddingRight: 16 },
  descTitle: { fontSize: 10 },
  descDetail: { fontSize: 9, color: colors.muted, marginTop: 3, lineHeight: 1.4 },
  amount: { flex: 1, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 24,
  },
  totalLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

type LogoInput = PdfImage | string | null | undefined;

/** Accept a pre-decoded PdfImage (preferred) or a PDF-safe URL string. */
function normalizeLogo(logo: LogoInput, box: { width: number; height: number }) {
  if (!logo) return null;
  if (typeof logo === "string") {
    return isPdfSafeImage(logo) ? { src: logo, ...box } : null;
  }
  if (!logo.src || !isPdfSafeImage(logo.src) || !logo.width || !logo.height) return null;
  return { src: logo.src, ...fitPdfImage(logo, box.width, box.height) };
}

/** Resolved invoice (preferred) or a plain stored invoice. */
export type InvoicePdfData = Invoice &
  Partial<Pick<ResolvedInvoice, "descriptionTitle" | "descriptionDetail">>;

export function InvoicePDF({
  invoice,
  brandLogo,
  clientLogo: clientLogoInput,
}: {
  invoice: InvoicePdfData;
  /** Mirrorful logo, rendered top-left. */
  brandLogo?: LogoInput;
  /** Client logo, rendered top-right. Defaults to invoice.clientLogoUrl. */
  clientLogo?: LogoInput;
}) {
  // Company details come from the invoice record (configured company data).
  const taxId = invoice.companyTaxId || COMPANY_TAX_ID;
  const website = invoice.companyWebsite || COMPANY_WEBSITE;
  const currency = invoice.currency || DEFAULT_CURRENCY;
  const billToName = invoice.projectName || invoice.client;
  const billToClient = invoice.projectName ? invoice.client : "";
  const descriptionTitle =
    invoice.descriptionTitle ?? invoice.description.split(/\r?\n/)[0]?.trim() ?? "";
  const descriptionDetail =
    invoice.descriptionDetail ??
    invoice.description.split(/\r?\n/).slice(1).join("\n").trim();
  const companyLogo = normalizeLogo(brandLogo, BRAND_LOGO_BOX);
  const clientLogo = normalizeLogo(
    clientLogoInput === undefined ? invoice.clientLogoUrl : clientLogoInput,
    CLIENT_LOGO_BOX,
  );

  return (
    <Document title={`Invoice ${invoice.number}`} author="Mirrorful" creator="Mirrorful">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandCol}>
            {companyLogo ? (
              <Image
                src={companyLogo.src}
                style={[
                  styles.brandLogo,
                  { width: companyLogo.width, height: companyLogo.height },
                ]}
              />
            ) : (
              <Text style={styles.brandFallback}>MIRRORFUL</Text>
            )}
            <Text style={styles.muted}>Tax ID: {taxId}</Text>
            <Text style={styles.muted}>{website}</Text>
          </View>
          {clientLogo ? (
            <View style={styles.clientLogoCol}>
              <Image
                src={clientLogo.src}
                style={[
                  styles.clientLogo,
                  { width: clientLogo.width, height: clientLogo.height },
                ]}
              />
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>Invoice {invoice.number}</Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{billToName || "—"}</Text>
            {billToClient ? <Text style={styles.muted}>{billToClient}</Text> : null}
            {invoice.milestoneName ? (
              <Text style={styles.muted}>Milestone: {invoice.milestoneName}</Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Invoice Date</Text>
            <Text style={styles.value}>{formatDisplayDate(invoice.invoiceDate)}</Text>
            <Text style={[styles.muted, { marginTop: 8 }]}>Status: {invoice.status}</Text>
            <Text style={styles.muted}>Source: {invoice.source}</Text>
            {invoice.paymentNumber ? (
              <Text style={styles.muted}>Payment #: {invoice.paymentNumber}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.desc, { fontFamily: "Helvetica-Bold" }]}>Description</Text>
          <Text style={[styles.amount, { fontFamily: "Helvetica-Bold" }]}>Amount</Text>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.desc}>
            <Text style={styles.descTitle}>{descriptionTitle || "—"}</Text>
            {descriptionDetail ? (
              <Text style={styles.descDetail}>{descriptionDetail}</Text>
            ) : null}
          </View>
          <Text style={styles.amount}>{formatCurrency(invoice.amount, currency)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.amount, currency)}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.muted}>Mirrorful · Tax {taxId}</Text>
          <Text style={styles.muted}>{website}</Text>
        </View>
      </Page>
    </Document>
  );
}
