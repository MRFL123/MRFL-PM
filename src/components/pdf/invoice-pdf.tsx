/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */
import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDisplayDate } from "@/lib/dates";
import { formatCurrency, type Invoice } from "@/lib/invoices";
import { colors } from "@/components/pdf/styles";
import { isPdfSafeImage } from "@/lib/rich-text";

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
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 4,
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
    width: 72,
    height: 40,
    objectFit: "contain",
    marginBottom: 6,
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
  desc: { flex: 3 },
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

export function InvoicePDF({ invoice }: { invoice: Invoice }) {
  const taxId = invoice.companyTaxId || "233421";
  const website = invoice.companyWebsite || "www.themirrorful.com";
  const clientLogo =
    invoice.clientLogoUrl && isPdfSafeImage(invoice.clientLogoUrl)
      ? invoice.clientLogoUrl
      : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>شركة ميرورفل للرقمنة</Text>
        <Text style={styles.muted}>Tax ID: {taxId}</Text>
        <Text style={styles.muted}>{website}</Text>

        <Text style={styles.title}>Invoice {invoice.number}</Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill To</Text>
            {clientLogo ? <Image src={clientLogo} style={styles.clientLogo} /> : null}
            <Text style={styles.value}>{invoice.client || "—"}</Text>
            {invoice.projectName ? (
              <Text style={styles.muted}>Project: {invoice.projectName}</Text>
            ) : null}
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
          <Text style={styles.desc}>{invoice.description || "—"}</Text>
          <Text style={styles.amount}>
            {formatCurrency(invoice.amount, invoice.currency)}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(invoice.amount, invoice.currency)}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.muted}>شركة ميرورفل للرقمنة · Tax {taxId}</Text>
          <Text style={styles.muted}>{website}</Text>
        </View>
      </Page>
    </Document>
  );
}
