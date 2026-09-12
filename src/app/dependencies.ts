import { initializeDatabase } from '../data/database/client';
import {
  SqliteBusinessRepository,
  SqliteCatalogRepository,
  SqliteCustomerRepository,
} from '../data/repositories/core_repositories';
import {
  SqliteAlterationRepository,
  SqliteDashboardRepository,
  SqliteDesignRepository,
  SqliteExpenseRepository,
  SqliteInventoryRepository,
  SqliteMeasurementRepository,
  SqliteOrderRepository,
  SqlitePaymentRepository,
  SqliteReportRepository,
  SqliteSearchRepository,
  SqliteStaffRepository,
} from '../data/repositories/feature_repositories';
import { createAuthService, type AuthService } from '../services/auth';
import { createAnalyticsService, type AnalyticsService } from '../services/analytics';

export type AppDependencies = {
  authService: AuthService;
  analytics: AnalyticsService;
  businessRepository: SqliteBusinessRepository;
  customerRepository: SqliteCustomerRepository;
  catalogRepository: SqliteCatalogRepository;
  measurementRepository: SqliteMeasurementRepository;
  orderRepository: SqliteOrderRepository;
  paymentRepository: SqlitePaymentRepository;
  designRepository: SqliteDesignRepository;
  alterationRepository: SqliteAlterationRepository;
  inventoryRepository: SqliteInventoryRepository;
  staffRepository: SqliteStaffRepository;
  searchRepository: SqliteSearchRepository;
  dashboardRepository: SqliteDashboardRepository;
  expenseRepository: SqliteExpenseRepository;
  reportRepository: SqliteReportRepository;
};

let deps: AppDependencies | null = null;

export async function initializeDependencies(): Promise<AppDependencies> {
  if (deps) {
    return deps;
  }

  const db = await initializeDatabase();
  const catalogRepository = new SqliteCatalogRepository(db);
  await catalogRepository.ensureSeeded();

  const expenseRepository = new SqliteExpenseRepository(db);

  deps = {
    authService: createAuthService(),
    analytics: createAnalyticsService(),
    businessRepository: new SqliteBusinessRepository(db),
    customerRepository: new SqliteCustomerRepository(db),
    catalogRepository,
    measurementRepository: new SqliteMeasurementRepository(db),
    orderRepository: new SqliteOrderRepository(db),
    paymentRepository: new SqlitePaymentRepository(db),
    designRepository: new SqliteDesignRepository(db),
    alterationRepository: new SqliteAlterationRepository(db),
    inventoryRepository: new SqliteInventoryRepository(db),
    staffRepository: new SqliteStaffRepository(db),
    searchRepository: new SqliteSearchRepository(db),
    dashboardRepository: new SqliteDashboardRepository(db),
    expenseRepository,
    reportRepository: new SqliteReportRepository(db, expenseRepository),
  };
  return deps;
}

export function getDependencies(): AppDependencies {
  if (!deps) {
    throw new Error('Dependencies not initialized.');
  }
  return deps;
}
