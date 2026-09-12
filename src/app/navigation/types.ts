export type DashboardStackParamList = {
  DashboardHome: undefined;
  Search: undefined;
  NewOrder: { customerId?: string } | undefined;
  OrderDetail: { orderId: string };
  CustomerDetail: { customerId: string };
  CustomerForm: { customerId?: string } | undefined;
};

export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerDetail: { customerId: string };
  CustomerForm: { customerId?: string } | undefined;
  MeasurementForm: { customerId: string; copyFromProfileId?: string };
  NewOrder: { customerId?: string } | undefined;
  OrderDetail: { orderId: string };
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  NewOrder: { customerId?: string } | undefined;
  OrderDetail: { orderId: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  BusinessProfile: undefined;
  GarmentPrices: undefined;
  Reports: undefined;
  Templates: undefined;
  Inventory: undefined;
  Staff: undefined;
  Search: undefined;
  CustomerDetail: { customerId: string };
  OrderDetail: { orderId: string };
};

export type RootTabParamList = {
  Home: undefined;
  Customers: undefined;
  Orders: undefined;
  More: undefined;
};
