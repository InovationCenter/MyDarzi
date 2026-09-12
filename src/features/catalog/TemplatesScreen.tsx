import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { spacing } from '../../app/theme';
import type { MeasurementTemplate } from '../../domain/types/models';
import {
  Card,
  EmptyState,
  ErrorText,
  LoadingState,
  Screen,
  Subtitle,
  Title,
} from '../../shared/ui';

export function TemplatesScreen() {
  const { catalogRepository } = useDependencies();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTemplates(await catalogRepository.listTemplates());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [catalogRepository]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading && templates.length === 0) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Measurement templates</Title>
        <Subtitle>Read-only catalog seeded for Phase 1</Subtitle>
        <ErrorText message={error} />

        {templates.length === 0 ? (
          <EmptyState message="No templates seeded." />
        ) : (
          templates.map(t => (
            <Card key={t.id}>
              <Text style={styles.name}>{t.name}</Text>
              <Subtitle>
                Default unit: {t.unitDefault}
                {t.isSystem ? ' · system' : ''}
              </Subtitle>
              {t.fields.map(f => (
                <Text key={f.id} style={styles.field}>
                  · {f.label} ({f.key})
                </Text>
              ))}
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  field: { marginTop: 4, fontSize: 14 },
});
