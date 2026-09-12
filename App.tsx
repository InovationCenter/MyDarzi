/**
 * MyDarzi app entry — local DB + auth gate + bilingual shell.
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDependencies, type AppDependencies } from './src/app/dependencies';
import { DependenciesProvider } from './src/app/DependenciesContext';
import { AuthProvider, useAuth } from './src/app/AuthContext';
import { I18nProvider, useI18n } from './src/i18n';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { LoginScreen } from './src/features/auth/LoginScreen';
import { colors, spacing } from './src/app/theme';
import { logger } from './src/shared/logger';

function AuthenticatedApp() {
  const { user, bootstrapping } = useAuth();
  const { t, isRTL } = useI18n();

  if (bootstrapping) {
    return (
      <View style={[styles.centered, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loading}>{t('boot.checkingSession')}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
        <LoginScreen />
      </View>
    );
  }

  return <RootNavigator />;
}

function BootstrappingShell({
  deps,
  bootError,
  isDarkMode,
}: {
  deps: AppDependencies | null;
  bootError: string | null;
  isDarkMode: boolean;
}) {
  const { t, ready } = useI18n();

  if (bootError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>{t('boot.startupProblem')}</Text>
        <Text style={styles.errorBody}>{t('boot.dbFailed')}</Text>
      </View>
    );
  }

  if (!deps || !ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loading}>{t('boot.preparing')}</Text>
      </View>
    );
  }

  return (
    <DependenciesProvider value={deps}>
      <AuthProvider authService={deps.authService} analytics={deps.analytics}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AuthenticatedApp />
      </AuthProvider>
    </DependenciesProvider>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [deps, setDeps] = useState<AppDependencies | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ready = await initializeDependencies();
        if (!cancelled) {
          setDeps(ready);
        }
      } catch (error) {
        logger.error('App bootstrap failed', error);
        if (!cancelled) {
          setBootError('db');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <BootstrappingShell deps={deps} bootError={bootError} isDarkMode={isDarkMode} />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loading: {
    marginTop: spacing.md,
    color: colors.textMuted,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  errorBody: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 22,
  },
});

export default App;
