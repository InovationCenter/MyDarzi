import React, { createContext, useContext } from 'react';
import type { AppDependencies } from './dependencies';

const DependenciesContext = createContext<AppDependencies | null>(null);

export function DependenciesProvider({
  value,
  children,
}: {
  value: AppDependencies;
  children: React.ReactNode;
}) {
  return (
    <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>
  );
}

export function useDependencies(): AppDependencies {
  const value = useContext(DependenciesContext);
  if (!value) {
    throw new Error('useDependencies must be used within DependenciesProvider');
  }
  return value;
}
