/** Short code for writing on fabric so the tailor can match cloth to a customer. */
export function customerMarkCode(customerId: string): string {
  const compact = customerId.replace(/-/g, '').toUpperCase();
  return compact.slice(-6);
}
