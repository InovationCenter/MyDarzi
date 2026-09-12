import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { colors, spacing } from '../../app/theme';
import type { Garment } from '../../domain/types/models';
import { useI18n } from '../../i18n';
import {
  Card,
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

function priceToInput(value: number): string {
  if (!value) {
    return '';
  }
  return Number.isInteger(value) ? String(value) : String(value);
}

export function GarmentPricesScreen() {
  const { t } = useI18n();
  const { catalogRepository, businessRepository } = useDependencies();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState('PKR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const load = useCallback(async () => {
    setError(null);
    setSavedNote(null);
    try {
      const [list, profile] = await Promise.all([
        catalogRepository.listGarments(),
        businessRepository.get(),
      ]);
      setGarments(list);
      setCurrency(profile?.currency || 'PKR');
      setPrices(
        Object.fromEntries(list.map(g => [g.id, priceToInput(g.defaultPrice)])),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('prices.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [businessRepository, catalogRepository, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    setSavedNote(null);
    try {
      await catalogRepository.updateDefaultPrices(
        garments.map(g => ({
          id: g.id,
          defaultPrice: Math.max(0, Number(prices[g.id]) || 0),
        })),
      );
      setSavedNote(t('prices.saved'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('prices.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const addCustom = async () => {
    const name = newName.trim();
    if (!name) {
      setError(t('prices.nameRequired'));
      return;
    }
    setAdding(true);
    setError(null);
    setSavedNote(null);
    try {
      await catalogRepository.createCustomGarment({
        name,
        defaultPrice: Math.max(0, Number(newPrice) || 0),
      });
      setNewName('');
      setNewPrice('');
      setSavedNote(t('prices.customAdded'));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('prices.addFailed'));
    } finally {
      setAdding(false);
    }
  };

  if (loading && garments.length === 0) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>{t('prices.title')}</Title>
        <Subtitle>{t('prices.subtitle', { currency })}</Subtitle>
        <ErrorText message={error} />
        {savedNote ? <Subtitle>{savedNote}</Subtitle> : null}

        <Card>
          <Text style={styles.section}>{t('prices.addCustom')}</Text>
          <Subtitle>{t('prices.addCustomSub')}</Subtitle>
          <Field
            label={t('prices.customName')}
            value={newName}
            onChangeText={setNewName}
            placeholder={t('prices.customNamePlaceholder')}
          />
          <Field
            label={`${t('prices.customPrice')} (${currency})`}
            value={newPrice}
            onChangeText={text => setNewPrice(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          <SecondaryButton
            label={adding ? t('common.saving') : t('prices.addCustomBtn')}
            onPress={() => void addCustom()}
            disabled={adding}
          />
        </Card>

        {garments.length === 0 ? (
          <EmptyState message={t('prices.empty')} />
        ) : (
          garments.map(g => (
            <Card key={g.id}>
              <View style={styles.labelRow}>
                <Text style={styles.garmentName}>{g.name}</Text>
                {g.isCustom ? (
                  <Text style={styles.customBadge}>{t('prices.customBadge')}</Text>
                ) : null}
              </View>
              <Field
                label={`${currency}`}
                value={prices[g.id] ?? ''}
                onChangeText={text =>
                  setPrices(prev => ({
                    ...prev,
                    [g.id]: text.replace(/[^0-9.]/g, ''),
                  }))
                }
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </Card>
          ))
        )}

        <PrimaryButton
          label={saving ? t('common.saving') : t('prices.save')}
          onPress={() => void save()}
          disabled={saving || garments.length === 0}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  garmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  customBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
