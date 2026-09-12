import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDependencies } from '../../app/DependenciesContext';
import type { CustomersStackParamList } from '../../app/navigation/types';
import { spacing } from '../../app/theme';
import type { MeasurementUnit } from '../../domain/constants';
import type { MeasurementTemplate } from '../../domain/types/models';
import {
  Chip,
  ErrorText,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../shared/ui';

type Nav = NativeStackNavigationProp<CustomersStackParamList, 'MeasurementForm'>;
type Route = RouteProp<CustomersStackParamList, 'MeasurementForm'>;

export function MeasurementFormScreen() {
  const { catalogRepository, measurementRepository } = useDependencies();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { customerId, copyFromProfileId } = route.params;

  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [unit, setUnit] = useState<MeasurementUnit>('in');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = templates.find(t => t.id === templateId) ?? null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await catalogRepository.listTemplates();
      setTemplates(list);

      if (copyFromProfileId) {
        const source = await measurementRepository.getProfile(copyFromProfileId);
        if (source) {
          setTemplateId(source.templateId);
          setUnit(source.unit);
          setName(`${source.name} (copy)`);
          setNotes(source.notes ?? '');
          const map: Record<string, string> = {};
          for (const v of source.values) {
            map[v.fieldKey] = v.value != null ? String(v.value) : '';
          }
          setValues(map);
        }
      } else if (list[0]) {
        setTemplateId(list[0].id);
        setUnit(list[0].unitDefault);
        setName(list[0].name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [catalogRepository, copyFromProfileId, measurementRepository]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickTemplate = (id: string) => {
    const t = templates.find(x => x.id === id);
    setTemplateId(id);
    if (t) {
      setUnit(t.unitDefault);
      if (!name.trim()) setName(t.name);
    }
  };

  const save = async () => {
    if (!selected) {
      setError('Pick a measurement template.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await measurementRepository.createProfile({
        customerId,
        templateId: selected.id,
        name: name.trim() || selected.name,
        unit,
        notes: notes.trim() || null,
        values: selected.fields.map(f => ({
          fieldKey: f.key,
          fieldLabel: f.label,
          value: values[f.key]?.trim() ? Number(values[f.key]) : null,
          unit,
        })),
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>Measurement profile</Title>
        <ErrorText message={error} />

        <Text style={styles.label}>Template</Text>
        <View style={styles.chips}>
          {templates.map(t => (
            <Chip
              key={t.id}
              label={t.name}
              active={t.id === templateId}
              onPress={() => pickTemplate(t.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Unit</Text>
        <View style={styles.chips}>
          <Chip label="in" active={unit === 'in'} onPress={() => setUnit('in')} />
          <Chip label="cm" active={unit === 'cm'} onPress={() => setUnit('cm')} />
        </View>

        <Field label="Profile name" value={name} onChangeText={setName} />
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

        {selected ? (
          <>
            <Subtitle>Enter values ({unit})</Subtitle>
            {selected.fields.map(f => (
              <Field
                key={f.key}
                label={f.label}
                value={values[f.key] ?? ''}
                onChangeText={text => setValues(prev => ({ ...prev, [f.key]: text }))}
                keyboardType="decimal-pad"
              />
            ))}
          </>
        ) : null}

        <PrimaryButton
          label={saving ? 'Saving…' : 'Save profile'}
          onPress={() => void save()}
          disabled={saving}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  label: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
});
