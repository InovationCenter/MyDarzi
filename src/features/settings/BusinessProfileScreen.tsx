import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDependencies } from '../../app/DependenciesContext';
import { spacing } from '../../app/theme';
import { useI18n } from '../../i18n';
import type { MeasurementUnit } from '../../domain/constants';
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

export function BusinessProfileScreen() {
  const { businessRepository } = useDependencies();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [unit, setUnit] = useState<MeasurementUnit>('in');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const profile = await businessRepository.get();
      if (profile) {
        setName(profile.name);
        setOwnerName(profile.ownerName ?? '');
        setPhone(profile.phone ?? '');
        setWhatsapp(profile.whatsapp ?? '');
        setAddress(profile.address ?? '');
        setCurrency(profile.currency);
        setUnit(profile.defaultMeasurementUnit);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('business.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [businessRepository]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await businessRepository.upsert({
        name,
        ownerName: ownerName.trim() || null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        address: address.trim() || null,
        currency: currency.trim() || 'PKR',
        defaultMeasurementUnit: unit,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('business.saveFailed'));
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
        <Title>{t('business.title')}</Title>
        <ErrorText message={error} />
        {saved ? <Subtitle>{t('business.saved')}</Subtitle> : null}
        <Field label={t('business.shopName')} value={name} onChangeText={setName} />
        <Field label={t('business.ownerName')} value={ownerName} onChangeText={setOwnerName} />
        <Field label={t('common.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field
          label={t('common.whatsapp')}
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />
        <Field label={t('common.address')} value={address} onChangeText={setAddress} multiline />
        <Field label={t('business.currency')} value={currency} onChangeText={setCurrency} autoCapitalize="characters" />
        <Text style={styles.label}>{t('business.defaultUnit')}</Text>
        <View style={styles.chips}>
          <Chip label="in" active={unit === 'in'} onPress={() => setUnit('in')} />
          <Chip label="cm" active={unit === 'cm'} onPress={() => setUnit('cm')} />
        </View>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save'}
          onPress={() => void save()}
          disabled={saving}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  label: { fontWeight: '600', marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
});
