import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useDependencies } from '../../app/DependenciesContext';
import type { CustomersStackParamList } from '../../app/navigation/types';
import { colors, spacing } from '../../app/theme';
import { useI18n } from '../../i18n';
import {
  ErrorText,
  Field,
  LoadingState,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '../../shared/ui';

type Nav = NativeStackNavigationProp<CustomersStackParamList, 'CustomerForm'>;
type Route = RouteProp<CustomersStackParamList, 'CustomerForm'>;

export function CustomerFormScreen() {
  const { t } = useI18n();
  const { customerRepository } = useDependencies();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const customerId = route.params?.customerId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!customerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!customerId) return;
    setError(null);
    try {
      const customer = await customerRepository.getById(customerId);
      if (!customer) {
        setError(t('customers.notFound'));
        return;
      }
      const nextPhone = customer.phone ?? '';
      const nextWhatsapp = customer.whatsapp ?? '';
      setName(customer.name);
      setPhone(nextPhone);
      setWhatsapp(nextWhatsapp);
      setSameAsPhone(!!nextPhone && nextPhone === nextWhatsapp);
      setAddress(customer.address ?? '');
      setNotes(customer.notes ?? '');
      setPhotoKey(customer.photoKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('customers.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [customerId, customerRepository, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPhoneChange = (value: string) => {
    setPhone(value);
    if (sameAsPhone) {
      setWhatsapp(value);
    }
  };

  const toggleSameAsPhone = () => {
    const next = !sameAsPhone;
    setSameAsPhone(next);
    if (next) {
      setWhatsapp(phone);
    }
  };

  const pickPhoto = async (fromCamera: boolean) => {
    setError(null);
    try {
      const result = fromCamera
        ? await launchCamera({
            mediaType: 'photo',
            quality: 0.8,
            saveToPhotos: false,
            cameraType: 'front',
          })
        : await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      const uri = result.assets?.[0]?.uri;
      if (result.didCancel || !uri) {
        return;
      }
      setPhotoKey(uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('customers.photoCaptureFailed'));
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const whatsappValue = sameAsPhone ? phone.trim() : whatsapp.trim();
      const payload = {
        name,
        phone: phone.trim() || null,
        whatsapp: whatsappValue || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        photoKey,
      };
      if (customerId) {
        await customerRepository.update(customerId, payload);
        navigation.goBack();
      } else {
        const created = await customerRepository.create(payload);
        navigation.replace('CustomerDetail', { customerId: created.id });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('customers.saveFailed'));
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
        <Title>{customerId ? t('customers.edit') : t('customers.new')}</Title>
        <ErrorText message={error} />
        <Field
          label={t('customers.nameRequired')}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Field
          label={t('common.phone')}
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
        />
        <Pressable
          onPress={toggleSameAsPhone}
          style={styles.checkRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: sameAsPhone }}>
          <View style={[styles.checkbox, sameAsPhone && styles.checkboxChecked]}>
            {sameAsPhone ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>{t('customers.sameAsPhone')}</Text>
        </Pressable>
        <Field
          label={t('common.whatsapp')}
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
          editable={!sameAsPhone}
        />
        <Field
          label={t('common.address')}
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <Field
          label={t('common.notes')}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Text style={styles.section}>{t('customers.photoOptional')}</Text>
        <Subtitle>{t('customers.photoHint')}</Subtitle>
        {photoKey ? (
          <Image source={{ uri: photoKey }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Subtitle>{t('customers.noPhoto')}</Subtitle>
          </View>
        )}
        <SecondaryButton
          label={t('customers.takePhoto')}
          onPress={() => void pickPhoto(true)}
        />
        <SecondaryButton
          label={t('customers.choosePhoto')}
          onPress={() => void pickPhoto(false)}
        />
        {photoKey ? (
          <SecondaryButton
            label={t('customers.removePhoto')}
            danger
            onPress={() => setPhotoKey(null)}
          />
        ) : null}

        <PrimaryButton
          label={saving ? t('common.saving') : t('customers.save')}
          onPress={() => void save()}
          disabled={saving}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginVertical: spacing.sm,
    alignSelf: 'center',
    backgroundColor: '#E7E5E4',
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginVertical: spacing.sm,
    alignSelf: 'center',
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
});
