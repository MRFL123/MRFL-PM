/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */
import {
  Circle,
  Defs,
  Document,
  G,
  Image,
  Line,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { formatDisplayDate } from "@/lib/dates";
import {
  COMPANY_TAX_ID,
  COMPANY_WEBSITE,
  DEFAULT_CURRENCY,
  formatCurrency,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/invoices";
import type { ResolvedInvoice } from "@/lib/invoice-resolve";
import { fitPdfImage, type PdfImage } from "@/lib/pdf";
import { isPdfSafeImage } from "@/lib/rich-text";

/** Max box for the Mirrorful logo (top-left). */
const BRAND_LOGO_BOX = { width: 160, height: 36 };
/** Max box for the client logo (top-right). */
const CLIENT_LOGO_BOX = { width: 120, height: 48 };

/** A4 in PDF points. */
const PAGE = { width: 595.28, height: 841.89 };
/** Inset of the decorative page frame from the paper edge. */
const FRAME_INSET = 18;
const FRAME = {
  width: PAGE.width - FRAME_INSET * 2,
  height: PAGE.height - FRAME_INSET * 2,
};
const ACCENT_BAR_HEIGHT = 6;
const FOOTER_HEIGHT = 46;

/** Mirrorful brand palette (sampled from the wordmark gradient). */
const brand = {
  blue: "#00ADF1",
  cyan: "#00D2D7",
  mint: "#52EBB5",
  ink: "#0F172A",
  teal: "#0E7490",
  tealDark: "#155E75",
  tint: "#F0FBFB",
  tintStrong: "#E0F7F8",
  frame: "#A8E6E9",
  text: "#18181B",
  muted: "#71717A",
  line: "#E4E4E7",
  rowLine: "#EDEEF0",
};

const STATUS_COLORS: Record<InvoiceStatus, { bg: string; fg: string; border: string }> = {
  Draft: { bg: "#F4F4F5", fg: "#52525B", border: "#E4E4E7" },
  Issued: { bg: "#E0F2FE", fg: "#0369A1", border: "#BAE6FD" },
  Paid: { bg: "#DCFCE7", fg: "#15803D", border: "#BBF7D0" },
  Overdue: { bg: "#FEE2E2", fg: "#B91C1C", border: "#FECACA" },
  Cancelled: { bg: "#F4F4F5", fg: "#71717A", border: "#E4E4E7" },
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: brand.text,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: FRAME_INSET + ACCENT_BAR_HEIGHT + 26,
    paddingBottom: FRAME_INSET + FOOTER_HEIGHT + 24,
    paddingHorizontal: 46,
  },
  frame: {
    position: "absolute",
    top: FRAME_INSET,
    left: FRAME_INSET,
    width: FRAME.width,
    height: FRAME.height,
    borderWidth: 0.75,
    borderColor: brand.frame,
    borderRadius: 4,
  },
  accentBar: {
    position: "absolute",
    top: FRAME_INSET,
    left: FRAME_INSET,
  },
  cornerTopRight: {
    position: "absolute",
    top: FRAME_INSET + ACCENT_BAR_HEIGHT,
    right: FRAME_INSET,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: FRAME_INSET + FOOTER_HEIGHT,
    left: FRAME_INSET,
  },
  watermark: {
    position: "absolute",
    opacity: 0.045,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  clientLogo: {
    objectFit: "contain",
  },
  brandFallback: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    color: brand.ink,
    marginBottom: 8,
  },
  muted: {
    fontSize: 9,
    color: brand.muted,
    marginBottom: 2,
  },
  divider: {
    marginTop: 18,
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 5,
    color: brand.ink,
  },
  titleNumber: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.teal,
    letterSpacing: 0.6,
  },
  amountDue: {
    alignItems: "flex-end",
  },
  amountDueLabel: {
    fontSize: 8,
    color: brand.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  amountDueValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: brand.tealDark,
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 22,
  },
  billTo: {
    flex: 1.15,
    backgroundColor: brand.tint,
    borderLeftWidth: 3,
    borderLeftColor: brand.cyan,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  meta: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: brand.line,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 7.5,
    color: brand.teal,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  billToName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: brand.ink,
    marginBottom: 3,
  },
  billToLine: {
    fontSize: 9.5,
    color: "#3F3F46",
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  metaRowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: brand.rowLine,
  },
  metaLabel: {
    fontSize: 8.5,
    color: brand.muted,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: brand.ink,
    textAlign: "right",
  },
  pill: {
    borderWidth: 0.75,
    borderRadius: 8,
    paddingVertical: 1.5,
    paddingHorizontal: 7,
  },
  pillText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    borderWidth: 0.75,
    borderColor: brand.line,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: brand.tintStrong,
    borderBottomWidth: 0.75,
    borderBottomColor: brand.frame,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  th: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.tealDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  desc: { flex: 3, paddingRight: 16 },
  amount: { flex: 1, textAlign: "right" },
  descTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: brand.ink },
  descDetail: { fontSize: 9, color: brand.muted, marginTop: 3, lineHeight: 1.4 },
  amountCell: { fontSize: 10.5, color: brand.ink },
  totals: {
    marginTop: 14,
    alignSelf: "flex-end",
    width: 230,
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  subtotalLabel: { fontSize: 9, color: brand.muted },
  subtotalValue: { fontSize: 9.5, color: brand.ink },
  totalBox: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: brand.tintStrong,
    borderWidth: 0.75,
    borderColor: brand.frame,
    borderLeftWidth: 3,
    borderLeftColor: brand.cyan,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: brand.tealDark,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: brand.ink,
  },
  footer: {
    position: "absolute",
    left: FRAME_INSET + 0.75,
    right: FRAME_INSET + 0.75,
    bottom: FRAME_INSET + 0.75,
    height: FOOTER_HEIGHT,
    backgroundColor: brand.tint,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    paddingHorizontal: 27,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLine: {
    position: "absolute",
    left: FRAME_INSET + 0.75,
    bottom: FRAME_INSET + 0.75 + FOOTER_HEIGHT,
  },
  footerText: { fontSize: 8, color: brand.muted },
  footerBrand: { fontSize: 8, fontFamily: "Helvetica-Bold", color: brand.ink },
  footerThanks: {
    fontSize: 9,
    fontFamily: "Helvetica-Oblique",
    color: brand.tealDark,
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

/** Horizontal Mirrorful gradient strip (blue → cyan → mint). */
function GradientStrip({ id, width, height }: { id: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={brand.blue} />
          <Stop offset="0.55" stopColor={brand.cyan} />
          <Stop offset="1" stopColor={brand.mint} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Faint dot triangle tucked into a frame corner. */
function CornerDots({ size, corner }: { size: number; corner: "top-right" | "bottom-left" }) {
  const step = 8;
  const dots: Array<{ x: number; y: number; r: number }> = [];
  for (let x = step / 2; x < size; x += step) {
    for (let y = step / 2; y < size; y += step) {
      // Distance from the anchored corner, measured along both axes.
      const dx = corner === "top-right" ? size - x : x;
      const dy = corner === "top-right" ? y : size - y;
      const reach = dx + dy;
      if (reach <= size) dots.push({ x, y, r: 1.25 - (reach / size) * 0.6 });
    }
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G fill={brand.cyan} opacity={0.5}>
        {dots.map((dot) => (
          <Circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={dot.r} />
        ))}
      </G>
    </Svg>
  );
}

/** Thin divider with a short brand-gradient lead-in. */
function HeaderDivider({ width }: { width: number }) {
  return (
    <Svg width={width} height={2} viewBox={`0 0 ${width} 2`}>
      <Defs>
        <LinearGradient id="divider" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={brand.blue} />
          <Stop offset="1" stopColor={brand.mint} />
        </LinearGradient>
      </Defs>
      <Line x1="0" y1="1" x2={width} y2="1" stroke={brand.line} strokeWidth={0.75} />
      <Rect x="0" y="0" width={64} height={2} fill="url(#divider)" />
    </Svg>
  );
}

/** Resolved invoice (preferred) or a plain stored invoice. */
export type InvoicePdfData = Invoice &
  Partial<Pick<ResolvedInvoice, "descriptionTitle" | "descriptionDetail">>;

export function InvoicePDF({
  invoice,
  brandLogo,
  clientLogo: clientLogoInput,
  watermark,
}: {
  invoice: InvoicePdfData;
  /** Mirrorful logo, rendered top-left. */
  brandLogo?: LogoInput;
  /** Client logo, rendered top-right. Defaults to invoice.clientLogoUrl. */
  clientLogo?: LogoInput;
  /** Optional Mirrorful mark drawn as a very faint watermark. */
  watermark?: LogoInput;
}) {
  // Company details come from the invoice record (configured company data).
  const taxId = invoice.companyTaxId || COMPANY_TAX_ID;
  const website = invoice.companyWebsite || COMPANY_WEBSITE;
  const currency = invoice.currency || DEFAULT_CURRENCY;
  const total = formatCurrency(invoice.amount, currency);
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
  const mark = normalizeLogo(watermark, { width: 250, height: 275 });
  const statusColors = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.Draft;
  const contentWidth = PAGE.width - 46 * 2;

  const metaRows: Array<{ label: string; value: ReactNode }> = [
    { label: "Invoice No.", value: <Text style={styles.metaValue}>{invoice.number}</Text> },
    {
      label: "Invoice Date",
      value: <Text style={styles.metaValue}>{formatDisplayDate(invoice.invoiceDate)}</Text>,
    },
    {
      label: "Status",
      value: (
        <View
          style={[
            styles.pill,
            { backgroundColor: statusColors.bg, borderColor: statusColors.border },
          ]}
        >
          <Text style={[styles.pillText, { color: statusColors.fg }]}>{invoice.status}</Text>
        </View>
      ),
    },
    {
      label: "Source",
      value: (
        <Text style={styles.metaValue}>
          {invoice.source === "automatic" ? "Automatic" : "Manual"}
        </Text>
      ),
    },
  ];
  if (invoice.paymentNumber) {
    metaRows.push({
      label: "Payment #",
      value: <Text style={styles.metaValue}>{invoice.paymentNumber}</Text>,
    });
  }

  return (
    <Document title={`Invoice ${invoice.number}`} author="Mirrorful" creator="Mirrorful">
      <Page size="A4" style={styles.page}>
        {/* Decorative layers (repeat on every page). */}
        {mark ? (
          <View
            fixed
            style={[
              styles.watermark,
              {
                width: mark.width,
                height: mark.height,
                left: (PAGE.width - mark.width) / 2,
                top: PAGE.height - FRAME_INSET - FOOTER_HEIGHT - mark.height - 40,
              },
            ]}
          >
            <Image src={mark.src} style={{ width: mark.width, height: mark.height }} />
          </View>
        ) : null}
        <View style={styles.frame} fixed />
        <View style={styles.cornerTopRight} fixed>
          <CornerDots size={56} corner="top-right" />
        </View>
        <View style={styles.cornerBottomLeft} fixed>
          <CornerDots size={72} corner="bottom-left" />
        </View>
        <View style={styles.accentBar} fixed>
          <GradientStrip id="accent" width={FRAME.width} height={ACCENT_BAR_HEIGHT} />
        </View>

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

        <View style={styles.divider}>
          <HeaderDivider width={contentWidth} />
        </View>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.titleNumber}>No. {invoice.number}</Text>
          </View>
          <View style={styles.amountDue}>
            <Text style={styles.amountDueLabel}>Amount due</Text>
            <Text style={styles.amountDueValue}>{total}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.billTo}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.billToName}>{billToName || "—"}</Text>
            {billToClient ? <Text style={styles.billToLine}>{billToClient}</Text> : null}
            {invoice.milestoneName ? (
              <Text style={styles.billToLine}>Milestone: {invoice.milestoneName}</Text>
            ) : null}
          </View>
          <View style={styles.meta}>
            <Text style={[styles.label, { marginBottom: 2 }]}>Invoice Details</Text>
            {metaRows.map((row, index) => (
              <View
                key={row.label}
                style={index > 0 ? [styles.metaRow, styles.metaRowDivider] : styles.metaRow}
              >
                <Text style={styles.metaLabel}>{row.label}</Text>
                {row.value}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.desc]}>Description</Text>
            <Text style={[styles.th, styles.amount]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.desc}>
              <Text style={styles.descTitle}>{descriptionTitle || "—"}</Text>
              {descriptionDetail ? (
                <Text style={styles.descDetail}>{descriptionDetail}</Text>
              ) : null}
            </View>
            <Text style={[styles.amount, styles.amountCell]}>{total}</Text>
          </View>
        </View>

        <View style={styles.totals} wrap={false}>
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>{total}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total}</Text>
          </View>
        </View>

        <View style={styles.footerLine} fixed>
          <GradientStrip id="footer-line" width={FRAME.width - 1.5} height={1.5} />
        </View>
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerBrand}>Mirrorful</Text>
            <Text style={styles.footerText}>Tax ID: {taxId}</Text>
          </View>
          <Text style={styles.footerThanks}>Thank you for your business.</Text>
          <Text style={styles.footerText}>{website}</Text>
        </View>
      </Page>
    </Document>
  );
}
