import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../app/AuthContext';
import { useDependencies } from '../../app/DependenciesContext';
import { colors, spacing } from '../../app/theme';
import { appConfig } from '../../config/appConfig';
import { useI18n } from '../../i18n';
import { ErrorText, Field, PrimaryButton, SecondaryButton } from '../../shared/ui';
import { BrandLogo } from '../../shared/BrandLogo';
import { FadeInUpView, ScreenFade } from '../../shared/motion';

export function LoginScreen() {
  const { signIn, signUp, authError, clearError } = useAuth();
  const { businessRepository } = useDependencies();
  const { t, language, setLanguage } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [shopName, setShopName] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLocalError(null);
    clearError();
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn({ email, password });
      } else {
        const brand = shopName.trim();
        if (!brand) {
          throw new Error(t('auth.shopRequiredError'));
        }
        await signUp({ email, password, displayName });
        await businessRepository.upsert({
          name: brand,
          ownerName: displayName.trim() || null,
        });
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : t('auth.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenFade style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FadeInUpView delay={40}>
            <BrandLogo size={96} style={styles.logo} />
            <Text style={styles.brand}>{t('app.name')}</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </FadeInUpView>

          <FadeInUpView delay={120} style={styles.card}>
            <Text style={styles.heading}>
              {mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
            </Text>
            <Text style={styles.hint}>
              {appConfig.authProvider === 'local' ? t('auth.localHint') : t('auth.firebaseHint')}
            </Text>

            <View style={styles.langRow}>
              <SecondaryButton
                label={t('language.english')}
                onPress={() => {
                  void setLanguage('en');
                }}
              />
              <SecondaryButton
                label={t('language.urdu')}
                onPress={() => {
                  void setLanguage('ur');
                }}
              />
            </View>
            <Text style={styles.langHint}>
              {language === 'ur' ? t('language.urdu') : t('language.english')}
            </Text>

            {mode === 'signup' ? (
              <>
                <Field
                  label={t('auth.shopBrandRequired')}
                  value={shopName}
                  onChangeText={setShopName}
                  autoCapitalize="words"
                  placeholder={t('auth.shopBrandPlaceholder')}
                />
                <Field
                  label={t('auth.yourName')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  placeholder={t('auth.ownerName')}
                />
              </>
            ) : null}

            <Field
              label={t('common.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              placeholder="you@shop.com"
            />
            <Field
              label={t('common.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <ErrorText message={localError || authError} />

            <PrimaryButton
              label={
                busy
                  ? t('common.pleaseWait')
                  : mode === 'signin'
                    ? t('auth.signIn')
                    : t('auth.createAccount')
              }
              onPress={onSubmit}
              disabled={busy}
            />
            <SecondaryButton
              label={mode === 'signin' ? t('auth.needAccount') : t('auth.haveAccount')}
              onPress={() => {
                clearError();
                setLocalError(null);
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
            />
          </FadeInUpView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.analyticsLater')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  logo: {
    marginBottom: spacing.md,
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  langHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  footer: { marginTop: spacing.lg, alignItems: 'center' },
  footerText: { color: colors.textMuted, fontSize: 12 },
});
