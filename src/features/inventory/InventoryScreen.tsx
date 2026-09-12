import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { spacing } from '../../app/theme';
import {
  INVENTORY_CATEGORIES,
  type InventoryCategory,
} from '../../domain/constants';
import type { InventoryItem } from '../../domain/types/models';
import {
  Card,
  Chip,
  EmptyState,
  ErrorText,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '../../shared/ui';

export function InventoryScreen() {
  const { inventoryRepository } = useDependencies();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('fabric');
  const [quantity, setQuantity] = useState('0');
  const [unit, setUnit] = useState('pcs');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await inventoryRepository.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [inventoryRepository]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const addItem = async () => {
    setBusy(true);
    setError(null);
    try {
      await inventoryRepository.create({
        name,
        category,
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'pcs',
        notes: notes.trim() || null,
      });
      setName('');
      setQuantity('0');
      setNotes('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add item');
    } finally {
      setBusy(false);
    }
  };

  const adjust = async (id: string, delta: number) => {
    setBusy(true);
    setError(null);
    try {
      await inventoryRepository.adjust(id, delta, delta > 0 ? 'Stock in' : 'Stock out');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Adjust failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>Inventory</Title>
        <ErrorText message={error} />

        <Text style={styles.section}>Add item</Text>
        <Field label="Name" value={name} onChangeText={setName} />
        <View style={styles.chips}>
          {INVENTORY_CATEGORIES.map(c => (
            <Chip
              key={c}
              label={c}
              active={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>
        <Field
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="decimal-pad"
        />
        <Field label="Unit" value={unit} onChangeText={setUnit} />
        <Field label="Notes" value={notes} onChangeText={setNotes} />
        <PrimaryButton
          label={busy ? 'Working…' : 'Add item'}
          onPress={() => void addItem()}
          disabled={busy}
        />

        <Text style={styles.section}>Stock</Text>
        {items.length === 0 ? <EmptyState message="No inventory items." /> : null}
        {items.map(item => (
          <Card key={item.id}>
            <Text style={styles.rowTitle}>{item.name}</Text>
            <Subtitle>
              {item.quantity} {item.unit} · {item.category}
            </Subtitle>
            <View style={styles.rowActions}>
              <SecondaryButton label="−1" onPress={() => void adjust(item.id, -1)} />
              <SecondaryButton label="+1" onPress={() => void adjust(item.id, 1)} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  rowActions: { flexDirection: 'row', gap: spacing.sm },
});
