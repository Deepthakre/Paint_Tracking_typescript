// ---------- MOCK DATA SERVICE ----------
// Every exported function here is async and returns plain data, deliberately
// shaped like what a REST call would return (`{ data }` / throws on error).
// This is the ONE file that should change when the Express backend exists —
// swap each function body for a `fetch('/api/...')` call and nothing in any
// page component needs to change. Keep this file's exported function
// signatures stable as the contract between frontend and backend.

import { nextProductId, nextCartonId, nextBatchId, signPayload } from './qr';
import { DEFAULT_PRODUCT_CATALOG, DEFAULT_ACCESSORY_CATALOG, GST_RATE, COMPANY_INFO } from './constants';
import type {
  User,
  RegisterPayload,
  DealerProfile,
  Product,
  Carton,
  ProductCatalogItem,
  AccessoryItem,
  Batch,
  StartBatchPayload,
  BatchLabels,
  ActivationResult,
  BatchActivationSummary,
  DispatchOverviewRow,
  DispatchScanResult,
  ConfirmReceiptResult,
  LedgerEntry,
  Order,
  OrderItemInput,
  DealerBalance,
  DealerPaymentStatusRow,
  DealerPurchaseHistory,
  Voucher,
  DashboardStats,
  Painter,
  PainterRegistrationInput,
  Reward,
  Withdrawal,
  PainterDashboardData,
  VerifyProductResult,
  ProductLookup,
  ReturnCondition,
  Role,
  PendingDeliveryRow,
} from '../types';

const LATENCY = 120; // simulated network delay, ms

// ---------- PERSISTENCE (localStorage) ----------
// This whole file is an in-memory mock DB — there's no real backend yet.
// Without this, every full page load (e.g. a phone camera opening the
// /verify?qr=... link) starts a fresh JS context, so `db` resets to seed
// data and anything created in Manufacturing/Warehouse "disappears" — that's
// what causes "This QR code was not found" for a product you just made.
// Persisting to localStorage keeps demo data alive across reloads on the
// SAME browser/device. Bump STORAGE_KEY's version suffix if you change the
// seed data shape and want everyone's saved copy to reset.
const STORAGE_KEY = 'acme-trackpaint-db-v1';

interface StoredUser extends User {
  password: string;
}

interface Counters {
  product: number;
  carton: number;
  batch: number;
  accSku: number;
  order: number;
  invoice: number;
  voucher: number;
}

interface Db {
  users: StoredUser[];
  batches: Batch[];
  products: Product[];
  cartons: Carton[];
  accessories: AccessoryItem[];
  productCatalog: ProductCatalogItem[];
  orders: Order[];
  ledger: LedgerEntry[];
  vouchers: Voucher[];
  painters: Painter[];
  rewards: Reward[];
  withdrawals: Withdrawal[];
  counters: Counters;
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Could not persist demo data to localStorage:', e);
  }
}

function loadPersisted(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    Object.assign(db, JSON.parse(raw));
    return true;
  } catch (e) {
    console.warn('Could not load persisted demo data:', e);
    return false;
  }
}

function delay<T>(v: T): Promise<T> {
  return new Promise((res) => {
    setTimeout(() => {
      persist();
      res(v);
    }, LATENCY);
  });
}

function now(): string {
  return new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function nowTs(): number {
  return Date.now();
}

// "3d 4h" / "4h 12m" / "12m" style duration, used for how long a unit sat
// in TRANSIT before someone (dealer scan or manual override) confirmed it.
function formatDuration(ms: number): string {
  if (ms <= 0) return '0m';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ---------- IN-MEMORY STORE ----------
const db: Db = {
  users: [
    { id: 'u1', username: 'admin', password: 'admin123', role: 'admin', name: 'Factory Admin' },
    { id: 'u2', username: 'warehouse', password: 'wh123', role: 'warehouse', name: 'Warehouse Staff' },
    { id: 'u3', username: 'amit', password: 'rep123', role: 'salesrep', name: 'Amit Kumar', target: 500, dealers: ['Sharma Paint Distributors'] },
    { id: 'u4', username: 'neha', password: 'rep123', role: 'salesrep', name: 'Neha Verma', target: 400, dealers: ['Nagpur Hardware Hub'] },
    { id: 'u5', username: 'sharma', password: 'dealer123', role: 'dealer', name: 'Sharma Paint Distributors', businessName: 'Sharma Paint Distributors', owner: 'Rajesh Sharma', mobile: '9822011111', address: 'MG Road, Nagpur' },
    { id: 'u6', username: 'nagpurhw', password: 'dealer123', role: 'dealer', name: 'Nagpur Hardware Hub', businessName: 'Nagpur Hardware Hub', owner: 'Vikas Nagpal', mobile: '9822022222', address: 'Sadar, Nagpur' },
    { id: 'u7', username: 'priya', password: 'cust123', role: 'customer', name: 'Priya Sharma', mobile: '9822033333' },
  ],
  batches: [],
  products: [],
  cartons: [],
  accessories: [],
  productCatalog: DEFAULT_PRODUCT_CATALOG.map((p) => ({ ...p, sizes: [...p.sizes] })),
  orders: [],
  ledger: [],
  vouchers: [],
  painters: [],
  rewards: [],
  withdrawals: [],
  counters: { product: 4521, carton: 0, batch: 45, accSku: 0, order: 100, invoice: 1000, voucher: 1 },
};

function seedAccessories(): void {
  // A handful of ready-to-sell items (kept from the original seed, now with
  // `sizes` so they render the same way as the full catalog below).
  const seed: Array<Omit<AccessoryItem, 'sku'>> = [
    { name: 'Brush 2-inch', category: 'Paint Brushes', sizes: ['2 inch'], price: 45, stock: 60, reorder: 20 },
    { name: 'Brush 4-inch', category: 'Paint Brushes', sizes: ['4 inch'], price: 75, stock: 35, reorder: 15 },
    { name: 'Roller 9-inch', category: 'Rollers & Textures', sizes: ['9 inch'], price: 120, stock: 8, reorder: 10 },
    { name: 'Thinner 1L', category: 'Thinner / Chemical', sizes: ['500ml', '1L', '5L'], price: 180, stock: 25, reorder: 10 },
    { name: 'Wall Putty 5kg', category: 'Putty / Primer', sizes: ['5KG', '20KG', '40KG'], price: 320, stock: 0, reorder: 5 },
  ];
  seed.forEach((s) => {
    db.counters.accSku += 1;
    db.accessories.push({ sku: `ACC-${String(db.counters.accSku).padStart(4, '0')}`, ...s });
  });

  // Full brush / roller / tools catalog — price & stock start at 0 since
  // they weren't supplied; use Stock In (and the inline price edit on the
  // Accessories page) to fill those in per item.
  DEFAULT_ACCESSORY_CATALOG.forEach((item) => {
    db.counters.accSku += 1;
    db.accessories.push({
      sku: `ACC-${String(db.counters.accSku).padStart(4, '0')}`,
      name: item.name,
      category: item.category,
      sizes: [...item.sizes],
      price: 0,
      stock: 0,
      reorder: 10,
    });
  });
}
// Only seed fresh demo data the first time this browser ever loads the app;
// after that, whatever is in localStorage (real state from your session) wins.
if (!loadPersisted()) {
  seedAccessories();
  persist();
} else {
  // Backward-compatible migration for demo data created before Painter Rewards.
  db.painters ||= [];
  db.rewards ||= [];
  db.withdrawals ||= [];
  persist();
}

// ---------- AUTH ----------
export async function login(username: string, password: string, role: Role): Promise<User> {
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password && u.role === role
  );
  if (!user) throw new Error('Invalid username/password, or this account does not match that role.');
  const { password: _pw, ...safeUser } = user;
  return delay(safeUser);
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { role, username, password, businessName, owner, fullName, mobile, address } = payload;
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('That username is already taken.');
  }
  const base = { id: `u${db.users.length + 1}`, username, password, role, mobile };
  const newUser: StoredUser =
    role === 'dealer'
      ? { ...base, name: businessName || '', businessName, owner, address }
      : role === 'salesrep'
      ? { ...base, name: fullName || '', target: 0, dealers: [] } // no dealers assigned yet — admin/team lead assigns them later
      : { ...base, name: fullName || '' };
  db.users.push(newUser);
  const { password: _pw, ...safeUser } = newUser;
  return delay(safeUser);
}

export async function listKnownDealerNames(): Promise<string[]> {
  const names = new Set<string>();
  db.users.filter((u) => u.role === 'dealer').forEach((u) => u.businessName && names.add(u.businessName));
  db.orders.forEach((o) => names.add(o.dealer));
  return delay([...names]);
}

// Dealer's own profile details — used to fill the "Bill To" section on the
// invoice/bill (owner name, phone, shop address), same as a real GST invoice.
export async function getDealerProfile(name: string): Promise<DealerProfile | null> {
  const u = db.users.find((x) => x.role === 'dealer' && (x.businessName === name || x.name === name));
  if (!u) return null;
  return delay({ businessName: u.businessName || u.name, owner: u.owner, mobile: u.mobile, address: u.address });
}

export async function getSalesRep(name: string): Promise<User | null> {
  return delay(db.users.find((u) => u.role === 'salesrep' && u.name === name) || null);
}

// ---------- PRODUCT CATALOG (Product Master) ----------
export async function listProductCatalog(): Promise<ProductCatalogItem[]> {
  return delay([...db.productCatalog]);
}

export async function addProductCatalogItem(item: ProductCatalogItem): Promise<ProductCatalogItem> {
  if (db.productCatalog.some((p) => p.itemCode === item.itemCode)) {
    throw new Error(`Item code ${item.itemCode} already exists.`);
  }
  db.productCatalog.push(item);
  return delay(item);
}

export async function updateProductCatalogItem(itemCode: string, updates: Partial<ProductCatalogItem>): Promise<ProductCatalogItem> {
  const item = db.productCatalog.find((p) => p.itemCode === itemCode);
  if (!item) throw new Error('Product not found.');
  Object.assign(item, updates);
  return delay(item);
}

export async function deleteProductCatalogItem(itemCode: string): Promise<boolean> {
  db.productCatalog = db.productCatalog.filter((p) => p.itemCode !== itemCode);
  return delay(true);
}

export function getCatalogItemByName(name: string): ProductCatalogItem | null {
  return db.productCatalog.find((p) => p.name === name) || null;
}

// ---------- MANUFACTURING ----------
export async function listBatches(): Promise<Batch[]> {
  return delay([...db.batches]);
}

export async function startBatch(payload: StartBatchPayload): Promise<Batch> {
  const { product, size, qty, qrMode, unitsPerCarton, manufacturingDate, mrp, batchNo, uspCode } = payload;
  if (!manufacturingDate) throw new Error('Manufacturing date is required.');
  if (mrp === undefined || mrp === '' || Number(mrp) <= 0) throw new Error('Enter the MRP for this size.');
  db.counters.batch += 1;
  const id = nextBatchId(db.counters.batch);
  const startId = db.counters.product + 1;
  const cartonRefs: string[] = [];

  if (qrMode === 'multi') {
    const cartonCount = Math.ceil(qty / unitsPerCarton);
    let remaining = qty;
    for (let c = 0; c < cartonCount; c++) {
      db.counters.carton += 1;
      const cartonId = nextCartonId(db.counters.carton);
      const unitsInThisCarton = Math.min(unitsPerCarton, remaining);
      const qrList: string[] = [];
      for (let i = 0; i < unitsInThisCarton; i++) {
        db.counters.product += 1;
        const qr = nextProductId(db.counters.product);
        const signed = await signPayload(qr);
        const product_: Product = {
          qr,
          qrString: signed.qrString,
          batchId: id,
          product,
          size,
          status: 'FACTORY',
          active: false, // must be scanned/activated before it can be dispatched — see activateScan()
          holder: COMPANY_INFO.manufacturedBy,
          cartonId,
          log: [{ event: 'PRODUCED (inactive — pending activation scan)', who: 'System', time: now() }],
        };
        db.products.push(product_);
        qrList.push(qr);
      }
      const cartonSigned = await signPayload(cartonId);
      db.cartons.push({ id: cartonId, qrString: cartonSigned.qrString, batchId: id, product, size, unitsCount: unitsInThisCarton, qrList });
      cartonRefs.push(cartonId);
      remaining -= unitsInThisCarton;
    }
  } else {
    for (let i = 0; i < qty; i++) {
      db.counters.product += 1;
      const qr = nextProductId(db.counters.product);
      const signed = await signPayload(qr);
      db.products.push({
        qr,
        qrString: signed.qrString,
        batchId: id,
        product,
        size,
        status: 'FACTORY',
        active: false, // must be scanned/activated before it can be dispatched — see activateScan()
        holder: COMPANY_INFO.manufacturedBy,
        cartonId: null,
        log: [{ event: 'PRODUCED (inactive — pending activation scan)', who: 'System', time: now() }],
      });
    }
  }

  const endId = db.counters.product;
  const catalogItem = db.productCatalog.find((p) => p.name === product);
  const accItem = !catalogItem && db.accessories.find((a) => a.name === product);
  const batch: Batch = {
    id,
    product,
    size,
    unit: catalogItem?.unit || (accItem ? 'Pcs' : 'L'),
    qty,
    qrMode,
    unitsPerCarton: qrMode === 'multi' ? unitsPerCarton : null,
    range: `${nextProductId(startId)} – ${nextProductId(endId)}`,
    date: now(),
    manufacturingDate,
    batchNo: batchNo || '',
    uspCode: uspCode || '',
    mrp: Number(mrp),
    cartonRefs,
  };
  db.batches.push(batch);
  return delay(batch);
}

export async function getBatchLabels(batchId: string): Promise<BatchLabels> {
  const batch = db.batches.find((b) => b.id === batchId);
  if (!batch) throw new Error('Batch not found');
  if (batch.qrMode === 'multi') {
    const cartons = db.cartons.filter((c) => c.batchId === batchId);
    return delay({ mode: 'multi' as const, batch, cartons });
  }
  const items = db.products.filter((p) => p.batchId === batchId);
  return delay({ mode: 'single' as const, batch, items });
}

// Individual unit QRs inside a carton — used by the "Show Individual QR"
// option so a carton's contents can still be printed/labelled one by one.
export async function getCartonUnits(cartonId: string): Promise<{ carton: Carton; items: Product[] }> {
  const carton = db.cartons.find((c) => c.id === cartonId);
  if (!carton) throw new Error('Carton not found.');
  const items = db.products.filter((p) => carton.qrList.includes(p.qr));
  return delay({ carton, items });
}

// ---------- WAREHOUSE: DISPATCH / RECEIVE ----------
export async function listProducts(): Promise<Product[]> {
  return delay([...db.products]);
}

// ---------- QR ACTIVATION ----------
// Every unit is produced INACTIVE. It cannot be dispatched until someone at
// the factory scans it here. This is the safety net the client asked for:
// if a printed QR is damaged or lost before it's ever scanned, it just sits
// inactive forever — it can never be dispatched, so it can never show up as
// "in transit" or "missing" stock. The system record for it still exists
// (for audit), but it can't pollute live inventory numbers.
export async function activateScan(qrOrCartonId: string): Promise<ActivationResult> {
  const isCartonRef = qrOrCartonId.startsWith('CTN-');
  if (isCartonRef) {
    const carton = db.cartons.find((c) => c.id === qrOrCartonId);
    if (!carton) throw new Error('Unknown carton QR.');
    const items = db.products.filter((p) => carton.qrList.includes(p.qr));
    const toActivate = items.filter((p) => !p.active);
    toActivate.forEach((p) => {
      p.active = true;
      p.log.push({ event: 'ACTIVATED — ready for dispatch', who: 'Manufacturer', time: now() });
    });
    return delay({ type: 'carton' as const, id: carton.id, activated: toActivate.map((p) => p.qr), alreadyActive: items.length - toActivate.length });
  }
  const product = db.products.find((p) => p.qr === qrOrCartonId);
  if (!product) throw new Error('QR not recognized.');
  if (product.active) return delay({ type: 'single' as const, activated: [], alreadyActive: 1 });
  product.active = true;
  product.log.push({ event: 'ACTIVATED — ready for dispatch', who: 'Manufacturer', time: now() });
  return delay({ type: 'single' as const, activated: [product.qr], alreadyActive: 0 });
}

// Per-batch activation progress — used by Batch History to show e.g. "120/500 activated".
export async function getBatchActivationSummary(): Promise<BatchActivationSummary> {
  const summary: BatchActivationSummary = {};
  db.products.forEach((p) => {
    if (!summary[p.batchId]) summary[p.batchId] = { total: 0, active: 0 };
    summary[p.batchId].total += 1;
    if (p.active) summary[p.batchId].active += 1;
  });
  return delay(summary);
}

// Per-batch dispatch overview for the Warehouse > Dispatch to Dealer screen.
// A unit counts as "dispatched" once it has left FACTORY status (TRANSIT / DEALER / SOLD / RETURNED).
export async function getDispatchOverview(): Promise<DispatchOverviewRow[]> {
  const overview: DispatchOverviewRow[] = db.batches.map((b) => {
    const units = db.products.filter((p) => p.batchId === b.id);
    const dispatched = units.filter((p) => p.status !== 'FACTORY').length;
    const undispatched = units.length - dispatched;
    let dispatchStatus: DispatchOverviewRow['dispatchStatus'] = 'NOT_DISPATCHED';
    if (dispatched > 0 && undispatched === 0) dispatchStatus = 'FULLY_DISPATCHED';
    else if (dispatched > 0) dispatchStatus = 'PARTIALLY_DISPATCHED';
    return {
      batchId: b.id,
      product: b.product,
      size: b.size,
      mrp: b.mrp,
      total: units.length,
      dispatched,
      undispatched,
      dispatchStatus,
    };
  });
  return delay(overview);
}

export async function dispatchByQuantity({ batchId, qty, dealer }: { batchId: string; qty: number; dealer: string }): Promise<string[]> {
  const available = db.products.filter((p) => p.batchId === batchId && p.status === 'FACTORY' && p.active);
  if (available.length < qty) {
    const inactiveCount = db.products.filter((p) => p.batchId === batchId && p.status === 'FACTORY' && !p.active).length;
    throw new Error(
      `Only ${available.length} activated unit(s) available in that batch.` +
      (inactiveCount ? ` ${inactiveCount} more exist but haven't been activated yet.` : '')
    );
  }
  const moved = available.slice(0, qty);
  moved.forEach((p) => {
    p.status = 'TRANSIT';
    p.holder = dealer;
    p.log.push({ event: `DISPATCHED to ${dealer}`, who: 'Warehouse', time: now(), ts: nowTs() });
  });
  return delay(moved.map((p) => p.qr));
}

export async function addDispatchScan(qrOrCartonId: string): Promise<DispatchScanResult> {
  const isCartonRef = qrOrCartonId.startsWith('CTN-');
  if (isCartonRef) {
    const carton = db.cartons.find((c) => c.id === qrOrCartonId);
    if (!carton) throw new Error('Unknown carton QR.');
    const items = db.products.filter((p) => carton.qrList.includes(p.qr));
    const notInFactory = items.filter((p) => p.status !== 'FACTORY');
    if (notInFactory.length) throw new Error(`Carton has ${notInFactory.length} unit(s) not in factory stock.`);
    const notActive = items.filter((p) => !p.active);
    if (notActive.length) throw new Error(`Carton has ${notActive.length} unit(s) not yet activated — activate the batch first.`);
    return delay({ type: 'carton' as const, id: carton.id, qrs: carton.qrList });
  }
  const product = db.products.find((p) => p.qr === qrOrCartonId);
  if (!product) throw new Error('QR not recognized.');
  if (product.status !== 'FACTORY') throw new Error(`This unit is already ${product.status.toLowerCase()}, not in factory stock.`);
  if (!product.active) throw new Error('This unit has not been activated yet — activate it first.');
  return delay({ type: 'single' as const, qrs: [product.qr] });
}

export async function confirmScanDispatch({ qrs, dealer }: { qrs: string[]; dealer: string }): Promise<string[]> {
  const moved: string[] = [];
  qrs.forEach((qr) => {
    const p = db.products.find((x) => x.qr === qr);
    if (p && p.status === 'FACTORY') {
      p.status = 'TRANSIT';
      p.holder = dealer;
      p.log.push({ event: `DISPATCHED to ${dealer} (scanned)`, who: 'Warehouse', time: now(), ts: nowTs() });
      moved.push(p.qr);
    }
  });
  return delay(moved);
}

export async function confirmReceipt({ dealer, qrs }: { dealer: string; qrs: string[] }): Promise<ConfirmReceiptResult> {
  const expected = db.products.filter((p) => p.status === 'TRANSIT' && p.holder === dealer);
  const receivedSet = new Set(qrs);
  const received = expected.filter((p) => receivedSet.has(p.qr));
  const shortage = expected.filter((p) => !receivedSet.has(p.qr));

  received.forEach((p) => {
    p.status = 'DEALER';
    p.log.push({ event: `RECEIVED at ${dealer}`, who: dealer, time: now(), ts: nowTs() });
  });
  // Shortage items intentionally stay in TRANSIT — they surface on the
  // Shortage Report rather than silently disappearing.
  shortage.forEach((p) => {
    p.log.push({ event: 'NOT SCANNED AT RECEIPT — possible shortage', who: dealer, time: now(), ts: nowTs() });
  });

  // Auto-generate the GST bill for whatever was just received — grouped by
  // product + size + the MRP its batch was produced at, so a mixed scan
  // (several products/sizes in one delivery) still becomes one clean
  // invoice, same as an approved order does. This is what makes every
  // physical stock receipt show up as a real invoice in the dealer's and
  // the manufacturer's purchase history, not just a QR status change.
  const invoice = await generateInvoiceForUnits({ dealer, units: received, note: `Invoice for stock receipt (${received.length} unit(s))` });
  // Tag each received unit with the invoice that covers it, so "My Dealer
  // Stock" can show a per-item "View Invoice" button straight from the QR.
  if (invoice) {
    received.forEach((p) => {
      p.invoiceId = invoice.invoiceId;
    });
  }

  return delay({
    received: received.map((p) => ({ qr: p.qr, product: p.product, size: p.size })),
    shortage: shortage.map((p) => ({ qr: p.qr, product: p.product, size: p.size })),
    invoice,
  });
}

// Shared by confirmReceipt (QR-scan stock receipt) and decideOrder (order
// approval) so both paths produce the exact same invoice shape — grouped
// line items, subtotal, 18% GST, total — and both post to the same ledger
// the dealer, sales rep, and manufacturer all read from.
async function generateInvoiceForUnits({ dealer, units, note }: { dealer: string; units: Product[]; note: string }): Promise<LedgerEntry | null> {
  if (!units.length) return null;
  const groups = new Map<string, { product: string; size: string; mrp: number; qty: number }>();
  units.forEach((p) => {
    const batch = db.batches.find((b) => b.id === p.batchId);
    const mrp = batch?.mrp || 0;
    const key = `${p.product}|${p.size}|${mrp}`;
    if (!groups.has(key)) groups.set(key, { product: p.product, size: p.size, mrp, qty: 0 });
    groups.get(key)!.qty += 1;
  });
  const items = [...groups.values()];
  const subtotal = items.reduce((s, it) => s + it.mrp * it.qty, 0);
  if (subtotal <= 0) return null; // nothing had a priced batch — no bill to raise
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;
  db.counters.invoice += 1;
  const invoiceId = `INV-${db.counters.invoice}`;
  const entry: LedgerEntry = {
    dealer,
    type: 'CHARGE',
    amount: total,
    note,
    subtotal,
    gst,
    gstRate: GST_RATE,
    items,
    invoiceId,
    date: now(),
  };
  db.ledger.push(entry);
  return entry;
}

// Quick lookup used by the dealer's "Receive Stock" screen so a scanned QR
// shows its product + size straight away, before the receipt is confirmed.
export async function getProductByQr(qr: string): Promise<ProductLookup | null> {
  const p = db.products.find((x) => x.qr === qr);
  return delay(p ? { qr: p.qr, product: p.product, size: p.size, status: p.status, holder: p.holder } : null);
}

export async function getShortages(): Promise<Product[]> {
  const flagged = db.products.filter(
    (p) => p.status === 'TRANSIT' && p.log.some((l) => l.event.includes('possible shortage'))
  );
  return delay(flagged);
}

// Everything currently in TRANSIT — dispatched to a dealer but not yet
// confirmed received. Unlike getShortages() (only units already flagged by
// a *partial* Receive-Stock scan), this also surfaces units where the
// dealer never opened Receive Stock at all, so nothing was ever scanned or
// flagged for them. Sorted oldest-dispatched first, so the stock that's
// been sitting longest surfaces at the top.
export async function getPendingDeliveries(): Promise<PendingDeliveryRow[]> {
  const pending = [...db.products]
    .filter((p) => p.status === 'TRANSIT')
    .sort((a, b) => {
      const ta = [...a.log].reverse().find((l) => l.event.startsWith('DISPATCHED'))?.ts || 0;
      const tb = [...b.log].reverse().find((l) => l.event.startsWith('DISPATCHED'))?.ts || 0;
      return ta - tb;
    });

  const rows: PendingDeliveryRow[] = pending.map((p) => {
    const dispatchLog = [...p.log].reverse().find((l) => l.event.startsWith('DISPATCHED'));
    return {
      qr: p.qr,
      product: p.product,
      size: p.size,
      batchId: p.batchId,
      dealer: p.holder,
      dispatchedAt: dispatchLog?.time || '—',
      duration: dispatchLog?.ts ? formatDuration(Date.now() - dispatchLog.ts) : '—',
      flaggedShortage: p.log.some((l) => l.event.includes('possible shortage')),
    };
  });
  return delay(rows);
}

// Manual override for when a dealer dispatch never gets scanned at
// Receive Stock — lets the manufacturer/warehouse mark it delivered from
// their own side instead of leaving it stuck in TRANSIT forever. Same
// downstream effect as confirmReceipt (status -> DEALER, GST invoice
// raised), but logged distinctly as a manual override — including who did
// it and how long the unit sat in transit before being confirmed — so
// it's clearly distinguishable from a real dealer-side scan later.
export async function forceConfirmDelivery({ qrs, confirmedBy }: { qrs: string[]; confirmedBy: string }): Promise<ConfirmReceiptResult> {
  const targets = db.products.filter((p) => qrs.includes(p.qr) && p.status === 'TRANSIT');
  if (!targets.length) throw new Error('None of the selected units are still awaiting delivery confirmation.');

  // Group by dealer so a mixed-dealer selection still raises one clean
  // invoice per dealer, same as confirmReceipt does for a single dealer.
  const byDealer = new Map<string, Product[]>();
  targets.forEach((p) => {
    if (!byDealer.has(p.holder)) byDealer.set(p.holder, []);
    byDealer.get(p.holder)!.push(p);
  });

  let firstInvoice: LedgerEntry | null = null;
  for (const [dealer, units] of byDealer) {
    units.forEach((p) => {
      const dispatchLog = [...p.log].reverse().find((l) => l.event.startsWith('DISPATCHED'));
      const duration = dispatchLog?.ts ? formatDuration(Date.now() - dispatchLog.ts) : 'unknown duration';
      p.status = 'DEALER';
      p.log.push({
        event: `MARKED DELIVERED by manufacturer (dealer never scanned) — was in transit ${duration}`,
        who: confirmedBy,
        time: now(),
        ts: nowTs(),
      });
    });
    const invoice = await generateInvoiceForUnits({
      dealer,
      units,
      note: `Invoice for manufacturer-confirmed delivery (${units.length} unit(s))`,
    });
    if (invoice) {
      units.forEach((p) => {
        p.invoiceId = invoice.invoiceId;
      });
      if (!firstInvoice) firstInvoice = invoice;
    }
  }

  return delay({
    received: targets.map((p) => ({ qr: p.qr, product: p.product, size: p.size })),
    shortage: [],
    invoice: firstInvoice,
  });
}

// ---------- DEALER SALE (CRM) / RETURNS ----------
export async function getDealerStock(dealer: string): Promise<Product[]> {
  return delay(db.products.filter((p) => p.status === 'DEALER' && p.holder === dealer));
}

// Looks up the full invoice (with its item breakdown) that a given unit was
// billed under — used by "My Dealer Stock" so each row can open its own
// invoice with one click, without the dealer needing to hunt through the
// Purchase History tab.
export async function getInvoiceById(invoiceId: string): Promise<LedgerEntry | null> {
  return delay(db.ledger.find((l) => l.invoiceId === invoiceId) || null);
}

export async function sellToCustomer({ qr, dealer, customerName }: { qr: string; dealer: string; customerName?: string }): Promise<Product> {
  const p = db.products.find((x) => x.qr === qr);
  if (!p) throw new Error('QR not found.');
  if (p.status !== 'DEALER' || p.holder !== dealer) throw new Error('This unit is not in your dealer stock.');
  p.status = 'SOLD';
  p.log.push({ event: `SOLD to ${customerName || 'Walk-in Customer'}`, who: dealer, time: now() });
  p.holder = customerName || 'Walk-in Customer';
  return delay(p);
}

export async function processReturn({ qr, reason, condition, dealer }: { qr: string; reason: string; condition: ReturnCondition; dealer: string }): Promise<Product> {
  const p = db.products.find((x) => x.qr === qr);
  if (!p) throw new Error('QR not found.');
  p.status = condition === 'resellable' ? 'DEALER' : 'RETURNED';
  p.holder = dealer;
  p.log.push({ event: `RETURNED (${reason}, ${condition})`, who: dealer, time: now() });
  return delay(p);
}

// ---------- CUSTOMER VERIFY ----------
export async function verifyProduct(qrString: string): Promise<VerifyProductResult> {
  const id = String(qrString).split('.')[0];
  const p = db.products.find((x) => x.qr === id || x.qrString === qrString);
  if (!p) return delay({ found: false as const });
  const acc = db.accessories.find((a) => a.name === p.product);
  const master: ProductCatalogItem = getCatalogItemByName(p.product) || {
    itemCode: acc?.sku || '—',
    name: p.product,
    unit: 'Pcs',
    sizes: acc?.sizes || [],
    usp: acc ? `Genuine ${acc.category} from Acme Paints.` : 'General purpose paint product.',
    manufacturedBy: COMPANY_INFO.manufacturedBy,
    address: COMPANY_INFO.address,
    email: COMPANY_INFO.email,
    website: COMPANY_INFO.website,
    helpline: COMPANY_INFO.helpline,
  };
  const batch = db.batches.find((b) => b.id === p.batchId);
  const claimed = db.rewards.find((r) => r.productId === p.qr && r.status === 'CREDITED');
  // Painter reward is available for every genuine, manufacturer-activated bucket.
  // Dealer scanning/sale is optional and never blocks the painter reward.
  const rewardEligible = p.active === true && !claimed;
  return delay({
    found: true as const,
    product: p,
    master,
    manufacturingDate: batch?.manufacturingDate || null,
    mrp: batch?.mrp || null,
    reward: {
      amount: 50,
      eligible: rewardEligible,
      claimed: Boolean(claimed),
      claimedAt: claimed?.createdAt || null,
      mode: 'dealer_optional' as const,
      reason: claimed ? 'Reward already claimed for this bucket.' :
        !p.active ? 'This product has not been activated by the manufacturer yet.' :
        null,
    },
  });
}

// ---------- PAINTER REWARDS ----------
function normalizeUpi(value: string | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function getPainterById(painterId: string): Painter | null {
  return db.painters.find((p) => p.id === painterId) || null;
}

export async function registerPainter({ name, mobile, upiId, city, state, experience, painterType }: PainterRegistrationInput): Promise<{ painter: Painter; existing: boolean }> {
  const cleanName = String(name || '').trim();
  const cleanMobile = String(mobile || '').replace(/\D/g, '');
  const cleanUpi = normalizeUpi(upiId);
  if (cleanName.length < 2) throw new Error('Enter the painter name.');
  if (!/^\d{10}$/.test(cleanMobile)) throw new Error('Enter a valid 10-digit mobile number.');
  if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/.test(cleanUpi)) throw new Error('Enter a valid UPI ID, e.g. name@upi.');
  if (!String(city || '').trim()) throw new Error('City is required.');
  const existing = db.painters.find((p) => p.mobile === cleanMobile);
  if (existing) return delay({ painter: existing, existing: true });

  const painter: Painter = {
    id: `PT-${new Date().getFullYear()}-${String(db.painters.length + 1).padStart(6, '0')}`,
    name: cleanName,
    mobile: cleanMobile,
    upiId: cleanUpi,
    city: String(city).trim(),
    state: String(state || '').trim(),
    experience: String(experience || '').trim(),
    painterType: String(painterType || 'Painter'),
    status: 'VERIFIED',
    walletBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    createdAt: now(),
  };
  db.painters.push(painter);
  return delay({ painter, existing: false });
}

export async function getPainterDashboard(painterId: string): Promise<PainterDashboardData> {
  const painter = getPainterById(painterId);
  if (!painter) throw new Error('Painter account not found.');
  const rewards = db.rewards.filter((r) => r.painterId === painterId).sort((a, b) => b.id.localeCompare(a.id));
  const withdrawals = db.withdrawals.filter((w) => w.painterId === painterId).sort((a, b) => b.id.localeCompare(a.id));
  return delay({ painter, rewards, withdrawals });
}

export async function claimPainterReward({ painterId, qrString }: { painterId: string; qrString: string }): Promise<{ reward: Reward; painter: Painter }> {
  const painter = getPainterById(painterId);
  if (!painter || painter.status !== 'VERIFIED') throw new Error('Painter account is not verified.');
  const id = String(qrString || '').trim().split('.')[0];
  const product = db.products.find((p) => p.qr === id || p.qrString === String(qrString || '').trim());
  if (!product) throw new Error('Product QR is invalid.');
  if (!product.active) throw new Error('This bucket has not been activated by the manufacturer yet.');
  if (db.rewards.some((r) => r.productId === product.qr && r.status === 'CREDITED')) {
    throw new Error('Reward already claimed for this bucket.');
  }
  const reward: Reward = {
    id: `RW-${new Date().getFullYear()}-${String(db.rewards.length + 1).padStart(7, '0')}`,
    painterId,
    productId: product.qr,
    qrString: product.qrString,
    amount: 50,
    type: 'BUCKET_REWARD',
    status: 'CREDITED',
    createdAt: now(),
  };
  db.rewards.push(reward);
  painter.walletBalance += reward.amount;
  painter.totalEarned += reward.amount;
  product.rewardClaimed = true;
  product.rewardClaimedBy = painter.id;
  product.rewardClaimedAt = reward.createdAt;
  product.log ||= [];
  product.log.push({ event: `PAINTER REWARD ₹${reward.amount} claimed by ${painter.name}`, who: painter.id, time: reward.createdAt });
  return delay({ reward, painter });
}

export async function requestPainterWithdrawal({ painterId, amount }: { painterId: string; amount: number }): Promise<{ withdrawal: Withdrawal; painter: Painter }> {
  const painter = getPainterById(painterId);
  if (!painter) throw new Error('Painter account not found.');
  const requested = Number(amount);
  if (requested < 500) throw new Error('Minimum withdrawal amount is ₹500.');
  if (requested > painter.walletBalance) throw new Error('Insufficient reward balance.');
  const withdrawal: Withdrawal = {
    id: `WD-${new Date().getFullYear()}-${String(db.withdrawals.length + 1).padStart(6, '0')}`,
    painterId,
    amount: requested,
    upiId: painter.upiId,
    status: 'PENDING',
    transactionId: null,
    utr: null,
    requestedAt: now(),
    paidAt: null,
  };
  // Reserve the balance immediately so a painter cannot create two requests for the same money.
  painter.walletBalance -= requested;
  db.withdrawals.push(withdrawal);
  return delay({ withdrawal, painter });
}

export async function getPainterByMobile(mobile: string): Promise<Painter | null> {
  const clean = String(mobile || '').replace(/\D/g, '');
  return delay(db.painters.find((p) => p.mobile === clean) || null);
}

// ---------- ACCESSORIES ----------
export async function listAccessories(): Promise<AccessoryItem[]> {
  return delay([...db.accessories]);
}

export async function addAccessoryItem({ name, category, sizes, price, stock, reorder }: Omit<AccessoryItem, 'sku'>): Promise<AccessoryItem> {
  db.counters.accSku += 1;
  const item: AccessoryItem = {
    sku: `ACC-${String(db.counters.accSku).padStart(4, '0')}`,
    name,
    category,
    sizes: sizes || [],
    price,
    stock,
    reorder,
  };
  db.accessories.push(item);
  return delay(item);
}

// Used for the inline "edit price / reorder level" controls on the
// Accessories page — the initial bulk-imported catalog seeds price at 0,
// so this is how an admin fills that in per item.
export async function updateAccessoryItem({ sku, updates }: { sku: string; updates: Partial<AccessoryItem> }): Promise<AccessoryItem> {
  const item = db.accessories.find((a) => a.sku === sku);
  if (!item) throw new Error('Item not found.');
  Object.assign(item, updates);
  return delay(item);
}

export async function stockInAccessory({ sku, qty }: { sku: string; qty: number; source?: string }): Promise<AccessoryItem> {
  const item = db.accessories.find((a) => a.sku === sku);
  if (!item) throw new Error('Item not found.');
  item.stock += qty;
  return delay(item);
}

export async function sellAccessory({ sku, qty }: { sku: string; qty: number; customer?: string }): Promise<AccessoryItem> {
  const item = db.accessories.find((a) => a.sku === sku);
  if (!item) throw new Error('Item not found.');
  if (qty > item.stock) throw new Error(`Only ${item.stock} units in stock.`);
  item.stock -= qty;
  return delay(item);
}

// ---------- ORDERS ----------
// An order now holds MULTIPLE line items (product/size/qty/mrp) instead of
// one product per order, so a dealer or sales rep can book a mixed basket
// in a single order. MRP per line is OPTIONAL — if provided, the order
// carries a computed subtotal/GST/total; if omitted, those stay null and
// no invoice is auto-generated on approval (admin can still bill manually
// via the ledger).
export async function listOrders(): Promise<Order[]> {
  return delay([...db.orders]);
}

function computeOrderTotals(items: OrderItemInput[]): { subtotal: number | null; gst: number | null; total: number | null } {
  const priced = items.filter((it) => it.mrp !== undefined && it.mrp !== null && it.mrp !== '' && Number(it.mrp) > 0);
  if (priced.length === 0) return { subtotal: null, gst: null, total: null };
  const subtotal = priced.reduce((s, it) => s + Number(it.mrp) * Number(it.qty), 0);
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;
  return { subtotal, gst, total };
}

export async function placeOrder({ dealer, items, bookedBy }: { dealer: string; items: OrderItemInput[]; bookedBy?: string | null }): Promise<Order> {
  if (!items || items.length === 0) throw new Error('Add at least one item to the order.');
  db.counters.order += 1;
  const { subtotal, gst, total } = computeOrderTotals(items);
  const order: Order = {
    id: `ORD-${db.counters.order}`,
    dealer,
    items: items.map((it) => ({
      product: it.product,
      size: it.size,
      qty: Number(it.qty),
      mrp: it.mrp !== undefined && it.mrp !== null && it.mrp !== '' ? Number(it.mrp) : null,
    })),
    subtotal,
    gst,
    total,
    status: 'PENDING',
    bookedBy: bookedBy || null,
    invoiceId: null,
    date: now(),
  };
  db.orders.push(order);
  return delay(order);
}

export async function decideOrder({ orderId, decision }: { orderId: string; decision: 'approve' | 'reject' }): Promise<Order> {
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) throw new Error('Order not found.');
  order.status = decision === 'approve' ? 'DISPATCHED' : 'REJECTED';
  if (decision === 'approve' && order.total) {
    // Auto-generate the GST invoice on approval — only when every line had
    // an MRP entered, since that's what the total was computed from.
    db.counters.invoice += 1;
    const invoiceId = `INV-${db.counters.invoice}`;
    const entry: LedgerEntry = {
      dealer: order.dealer,
      type: 'CHARGE',
      amount: order.total,
      note: `Invoice for order ${order.id}`,
      subtotal: order.subtotal,
      gst: order.gst,
      gstRate: GST_RATE,
      // order.total is only non-null when computeOrderTotals found every
      // line priced (see the `decision === 'approve' && order.total` guard
      // above), so every item here genuinely has an mrp — the `?? 0`
      // fallback exists purely to satisfy InvoiceLineItem's non-nullable
      // mrp and should never actually be hit.
      items: order.items.map((it) => ({ ...it, mrp: it.mrp ?? 0 })),
      invoiceId,
      orderId: order.id,
      date: now(),
    };
    db.ledger.push(entry);
    order.invoiceId = invoiceId;
  }
  return delay(order);
}

// Everything needed to show a dealer's full history to the dealer, their
// sales rep, and the manufacturer: every order they've ever had (any
// status), every invoice raised against them (whether from an approved
// order or a QR stock receipt), every payment, and simple duration/rate
// summaries so the picture reads like a real account statement rather
// than a raw data dump.
export async function getDealerPurchaseHistory(dealer: string): Promise<DealerPurchaseHistory> {
  const orders = db.orders.filter((o) => o.dealer === dealer).slice().reverse();
  const ledger = db.ledger.filter((l) => l.dealer === dealer).slice().reverse();
  const invoices = ledger.filter((l) => l.type === 'CHARGE');
  const payments = ledger.filter((l) => l.type === 'PAYMENT');
  const balance = await getDealerBalance(dealer);

  // Duration: span between this dealer's very first and most recent invoice.
  const invoiceDatesAsc = invoices.map((i) => i.date).slice().reverse();
  const duration = invoiceDatesAsc.length
    ? { firstInvoiceDate: invoiceDatesAsc[0], lastInvoiceDate: invoiceDatesAsc[invoiceDatesAsc.length - 1], invoiceCount: invoices.length }
    : null;

  // Rate history: every product/size this dealer has ever been billed for,
  // and at what rate, most recent first — useful for spotting a price change.
  const rateHistory: DealerPurchaseHistory['rateHistory'] = [];
  invoices.forEach((inv) => {
    (inv.items || []).forEach((it) => {
      rateHistory.push({ product: it.product, size: it.size, qty: it.qty, mrp: it.mrp, invoiceId: inv.invoiceId, date: inv.date });
    });
  });

  return delay({ orders, ledger, invoices, payments, balance, duration, rateHistory });
}

// All dealers' billed/paid/outstanding — for the admin "Payment Status" view.
export async function getAllDealersPaymentStatus(): Promise<DealerPaymentStatusRow[]> {
  const dealerNames = [...new Set(db.users.filter((u) => u.role === 'dealer').map((u) => u.businessName!).filter(Boolean))];
  const rows = await Promise.all(
    dealerNames.map(async (dealer) => ({ dealer, ...(await getDealerBalance(dealer)) }))
  );
  return delay(rows);
}

// ---------- LEDGER / INVOICES / PAYMENTS ----------
export async function getLedger(dealer: string): Promise<LedgerEntry[]> {
  return delay(db.ledger.filter((l) => l.dealer === dealer));
}

// Every ledger entry, across every dealer — used for the admin's full
// export (Invoices & Payments sheet), so the manufacturer has one place
// with every charge and payment ever recorded, not just one dealer at a time.
export async function getFullLedger(): Promise<LedgerEntry[]> {
  return delay([...db.ledger].reverse());
}

export async function recordCharge({ dealer, amount, note, subtotal, gst }: { dealer: string; amount: number; note: string; subtotal?: number; gst?: number }): Promise<LedgerEntry> {
  db.counters.invoice += 1;
  const entry: LedgerEntry = { dealer, type: 'CHARGE', amount, note, subtotal, gst, invoiceId: `INV-${db.counters.invoice}`, date: now() };
  db.ledger.push(entry);
  return delay(entry);
}

export async function recordPayment({ dealer, amount, note }: { dealer: string; amount: number; note?: string }): Promise<LedgerEntry> {
  const entry: LedgerEntry = { dealer, type: 'PAYMENT', amount, note: note || 'Payment', date: now() };
  db.ledger.push(entry);
  return delay(entry);
}

export async function getDealerBalance(dealer: string): Promise<DealerBalance> {
  const entries = db.ledger.filter((l) => l.dealer === dealer);
  const billed = entries.filter((l) => l.type === 'CHARGE').reduce((s, l) => s + l.amount, 0);
  const paid = entries.filter((l) => l.type === 'PAYMENT').reduce((s, l) => s + l.amount, 0);
  return delay({ billed, paid, outstanding: billed - paid });
}

// ---------- VOUCHERS ----------
export async function sendVoucherOtp({ mobile }: { mobile: string }): Promise<{ mobile: string; otp: string }> {
  // Simulated OTP — a real backend sends this via SMS gateway and never
  // returns the code to the client.
  const otp = String(Math.floor(1000 + Math.random() * 9000));
  return delay({ mobile, otp });
}

export async function redeemVoucher({ dealer, mobile, code, discount }: { dealer: string; mobile: string; code: string; discount: number }): Promise<Voucher> {
  db.counters.voucher += 1;
  const voucher: Voucher = { id: `VCH-${db.counters.voucher}`, dealer, mobile, code, discount, status: 'REDEEMED', date: now() };
  db.vouchers.push(voucher);
  return delay(voucher);
}

export async function listVouchers(dealer: string): Promise<Voucher[]> {
  return delay(db.vouchers.filter((v) => v.dealer === dealer));
}

// ---------- DASHBOARD AGGREGATES ----------
export async function getDashboardStats(): Promise<DashboardStats> {
  const p = db.products;
  return delay({
    totalProduced: p.length,
    factory: p.filter((x) => x.status === 'FACTORY').length,
    transit: p.filter((x) => x.status === 'TRANSIT').length,
    dealerStock: p.filter((x) => x.status === 'DEALER').length,
    sold: p.filter((x) => x.status === 'SOLD').length,
    totalBatches: db.batches.length,
  });
}

export async function getFullProductLog(): Promise<Product[]> {
  return delay([...db.products]);
}

// Manual reversal of a single already-activated unit (e.g. it was scanned
// by mistake, or needs to be pulled before dispatch). Only ever targets one
// QR at a time — there's no "deactivate the whole carton" shortcut, since
// this is meant to be a deliberate, one-at-a-time correction rather than a
// bulk action. Mirrors activateScan()'s single-unit branch in reverse.
export async function deactivateProduct(qr: string): Promise<Product> {
  const product = db.products.find((p) => p.qr === qr);
  if (!product) throw new Error('QR not recognized.');
  if (!product.active) return delay(product);
  product.active = false;
  product.log.push({ event: 'DEACTIVATED — reverted to inactive', who: 'Manufacturer', time: now() });
  return delay(product);
}