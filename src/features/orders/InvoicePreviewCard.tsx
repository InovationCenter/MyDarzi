import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { InvoiceData } from '../../services/invoice/buildInvoice';
import { colors, spacing } from '../../app/theme';
import { PAYMENT_METHOD_LABELS } from '../../domain/constants';
import { customerMarkCode } from '../../shared/customerMark';

function money(amount: number, currency: string): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${currency} ${formatted}`;
}

/** Visual invoice layout captured as PNG for WhatsApp / share. */
export function InvoicePreviewCard({ data }: { data: InvoiceData }) {
  const { business, customer, order, payments, currency } = data;
  const shop = business?.name?.trim() || 'MyDarzi';

  return (
    <View style={styles.card} collapsable={false}>
      <Text style={styles.shop}>{shop}</Text>
      {business?.phone ? <Text style={styles.muted}>{business.phone}</Text> : null}
      {business?.address ? <Text style={styles.muted}>{business.address}</Text> : null}

      <View style={styles.divider} />

      <Text style={styles.line}>
        Invoice / Order: <Text style={styles.bold}>{order.orderNumber}</Text>
      </Text>
      {customer ? (
        <Text style={styles.mark}>Fabric mark #{customerMarkCode(customer.id)}</Text>
      ) : null}
      {order.dueDate ? <Text style={styles.line}>Due: {order.dueDate}</Text> : null}
      {customer ? <Text style={styles.line}>Customer: {customer.name}</Text> : null}
      {customer?.whatsapp || customer?.phone ? (
        <Text style={styles.line}>Phone: {customer.whatsapp || customer.phone}</Text>
      ) : null}

      <Text style={styles.section}>Items</Text>
      {order.items.map(item => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.itemName}>
            {item.garmentName} × {item.quantity}
          </Text>
          <Text style={styles.itemPrice}>{money(item.lineTotal, currency)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      {order.discount > 0 ? (
        <>
          <View style={styles.row}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{money(order.subtotal, currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Discount</Text>
            <Text>{money(order.discount, currency)}</Text>
          </View>
        </>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.bold}>Total</Text>
        <Text style={styles.bold}>{money(order.total, currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.muted}>Paid</Text>
        <Text>{money(order.amountPaid ?? 0, currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.bold}>Balance</Text>
        <Text style={styles.bold}>{money(order.balance ?? 0, currency)}</Text>
      </View>

      {order.fabricInfo ? <Text style={styles.line}>Fabric: {order.fabricInfo}</Text> : null}
      {order.color ? <Text style={styles.line}>Color: {order.color}</Text> : null}

      {payments.length > 0 ? (
        <>
          <Text style={styles.section}>Payments</Text>
          {payments.map(p => (
            <Text key={p.id} style={styles.muted}>
              {money(p.amount, currency)} — {PAYMENT_METHOD_LABELS[p.method]} (
              {p.paidAt.slice(0, 10)})
            </Text>
          ))}
        </>
      ) : null}

      <Text style={styles.thanks}>Thank you for your order.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    borderRadius: 8,
  },
  shop: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  muted: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: spacing.md,
  },
  line: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  bold: { fontWeight: '700' },
  mark: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 6,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  itemName: { flex: 1, fontSize: 14, color: colors.text },
  itemPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
  thanks: {
    marginTop: spacing.lg,
    color: '#64748b',
    fontSize: 12,
  },
});
