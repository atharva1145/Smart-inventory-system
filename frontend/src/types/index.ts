export type Role = 'ADMIN' | 'INVENTORY_MANAGER' | 'SALES_STAFF' | 'VIEWER';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  unitOfMeasure: string;
  active: boolean;
  onHandQuantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryOverview {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  categoryName?: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  onHandQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  totalValueAtCost: number;
  lowStock: boolean;
  outOfStock: boolean;
}

export type MovementType =
  | 'INITIAL_STOCK'
  | 'PURCHASE_RECEIPT'
  | 'ORDER_RESERVED'
  | 'ORDER_RELEASED'
  | 'ORDER_FULFILLED'
  | 'MANUAL_ADJUSTMENT_ADD'
  | 'MANUAL_ADJUSTMENT_DEDUCT';

export interface StockMovement {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  movementType: MovementType;
  quantityChange: number;
  referenceType?: string;
  referenceId?: string;
  actorUsername: string;
  reason?: string;
  createdAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface OrderItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  id: number;
  previousStatus?: OrderStatus;
  newStatus: OrderStatus;
  actorUsername: string;
  comment?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  idempotencyKey?: string;
  notes?: string;
  createdBy: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  outstandingQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  totalCost: number;
  notes?: string;
  createdBy: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantityReceived: number;
}

export interface GoodsReceipt {
  id: number;
  receiptNumber: string;
  purchaseOrderId: number;
  poNumber: string;
  warehouseId: number;
  warehouseName: string;
  receivedBy: string;
  notes?: string;
  items: GoodsReceiptItem[];
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ORDER_CREATED' | 'ORDER_PENDING' | 'PO_DELIVERY_DUE';
  title: string;
  message: string;
  referenceId?: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalActiveProducts: number;
  totalInventoryUnits: number;
  inventoryValuationAtCost: number;
  lowStockCount: number;
  outOfStockCount: number;
  ordersToday: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalOrderValue: number;
  topSellingProducts: {
    productId: number;
    sku: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }[];
  salesTrend: {
    date: string;
    orderCount: number;
    amount: number;
  }[];
  recentOrders: Order[];
  recentMovements: StockMovement[];
}

export interface ValuationItem {
  productId: number;
  sku: string;
  productName: string;
  categoryName?: string;
  onHand: number;
  unitCost: number;
  totalCost: number;
}

export interface ValuationReportDTO {
  totalProducts: number;
  totalOnHandUnits: number;
  totalValuationAtCost: number;
  items: ValuationItem[];
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export type StockTransferStatus = 'REQUESTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface StockTransferItem {
  id?: number;
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
}

export interface StockTransfer {
  id: number;
  transferNumber: string;
  sourceWarehouseId: number;
  sourceWarehouseName: string;
  sourceWarehouseCode: string;
  destinationWarehouseId: number;
  destinationWarehouseName: string;
  destinationWarehouseCode: string;
  status: StockTransferStatus;
  notes?: string;
  createdBy: string;
  dispatchedBy?: string;
  receivedBy?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: StockTransferItem[];
}

export interface CreateStockTransferRequest {
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  notes?: string;
  items: {
    productId: number;
    quantity: number;
  }[];
}
