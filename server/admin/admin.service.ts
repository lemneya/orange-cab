/**
 * OC-ADMIN-0: Admin Service Layer
 * 
 * CRUD operations for OpCos, Brokers, Broker Accounts, Rate Cards, Driver Pay
 * with audit logging and RBAC enforcement
 */

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 
  | "ADMIN" 
  | "PAYROLL" 
  | "DISPATCH" 
  | "BILLING" 
  | "RECEPTION" 
  | "MECHANIC" 
  | "OPS_DIRECTOR";

export type RateRuleType = 
  | "PER_MILE" 
  | "PER_TRIP" 
  | "BASE_PLUS_MILE" 
  | "ZONE" 
  | "TIME_BAND" 
  | "MOBILITY_DIFF";

export type MobilityType = "STD" | "WCH" | "STRETCHER";

export type PayScheme = 
  | "HOURLY" 
  | "PER_TRIP" 
  | "PER_MILE" 
  | "DAILY_RATE" 
  | "COMMISSION" 
  | "HYBRID";

export type ContractType = "W2" | "1099" | "OWNER_OPERATOR";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE" | "RESTORE";

// ============================================================================
// ENTITY INTERFACES
// ============================================================================

export interface Opco {
  id: number;
  name: string;
  code: string;
  timezone: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Broker {
  id: number;
  name: string;
  code: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerAccount {
  id: number;
  brokerId: number;
  opcoId?: number;
  name: string;
  code: string;
  accountNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  brokerName?: string;
  opcoName?: string;
}

export interface BillingRateCard {
  id: number;
  opcoId: number;
  brokerAccountId: number;
  name: string;
  effectiveDate: string;
  expirationDate?: string;
  currency: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  opcoName?: string;
  brokerAccountName?: string;
  rules?: BillingRateRule[];
}

export interface BillingRateRule {
  id: number;
  rateCardId: number;
  ruleType: RateRuleType;
  mobilityType: MobilityType;
  baseAmount?: number;
  ratePerMile?: number;
  ratePerTrip?: number;
  minCharge?: number;
  maxCharge?: number;
  zoneId?: string;
  timeBandStart?: string;
  timeBandEnd?: string;
  priority: number;
  conditionsJson?: Record<string, unknown>;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverPayDefault {
  id: number;
  opcoId: number;
  brokerAccountId?: number;
  name: string;
  contractType: ContractType;
  payScheme: PayScheme;
  hourlyRate?: number;
  perTripRate?: number;
  perMileRate?: number;
  dailyRate?: number;
  commissionPercent?: number;
  minDailyGuarantee?: number;
  maxDailyPay?: number;
  effectiveDate: string;
  expirationDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  opcoName?: string;
  brokerAccountName?: string;
}

export interface DriverPayContract {
  id: number;
  driverId: number;
  opcoId: number;
  brokerAccountId?: number;
  contractType: ContractType;
  payScheme: PayScheme;
  hourlyRate?: number;
  perTripRate?: number;
  perMileRate?: number;
  dailyRate?: number;
  commissionPercent?: number;
  minDailyGuarantee?: number;
  maxDailyPay?: number;
  effectiveDate: string;
  expirationDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  driverName?: string;
  opcoName?: string;
  brokerAccountName?: string;
}

export interface AuditLogEntry {
  id: number;
  actor: string;
  actorRole?: UserRole;
  action: AuditAction;
  entity: string;
  entityId?: number;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ============================================================================
// IN-MEMORY STORAGE (will be replaced with DB)
// ============================================================================

let opcoCounter = 0;
let brokerCounter = 0;
let brokerAccountCounter = 0;
let rateCardCounter = 0;
let rateRuleCounter = 0;
let payDefaultCounter = 0;
let payContractCounter = 0;
let auditCounter = 0;

const opcoStorage: Map<number, Opco> = new Map();
const brokerStorage: Map<number, Broker> = new Map();
const brokerAccountStorage: Map<number, BrokerAccount> = new Map();
const rateCardStorage: Map<number, BillingRateCard> = new Map();
const rateRuleStorage: Map<number, BillingRateRule> = new Map();
const payDefaultStorage: Map<number, DriverPayDefault> = new Map();
const payContractStorage: Map<number, DriverPayContract> = new Map();
const auditStorage: Map<number, AuditLogEntry> = new Map();

// ============================================================================
// AUDIT LOGGING
// ============================================================================

function logAudit(
  actor: string,
  action: AuditAction,
  entity: string,
  entityId?: number,
  beforeJson?: Record<string, unknown>,
  afterJson?: Record<string, unknown>,
  actorRole?: UserRole
): void {
  const id = ++auditCounter;
  const entry: AuditLogEntry = {
    id,
    actor,
    actorRole,
    action,
    entity,
    entityId,
    beforeJson,
    afterJson,
    timestamp: new Date().toISOString(),
  };
  auditStorage.set(id, entry);
  console.log(`[AUDIT] ${action} ${entity}${entityId ? `#${entityId}` : ""} by ${actor}`);
}

// ============================================================================
// ADMIN SERVICE CLASS
// ============================================================================

class AdminService {
  // ==========================================================================
  // OPCO OPERATIONS
  // ==========================================================================

  async createOpco(data: Omit<Opco, "id" | "createdAt" | "updatedAt">, actor: string): Promise<Opco> {
    const id = ++opcoCounter;
    const now = new Date().toISOString();
    const opco: Opco = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    opcoStorage.set(id, opco);
    logAudit(actor, "CREATE", "opcos", id, undefined, opco as unknown as Record<string, unknown>);
    return opco;
  }

  async updateOpco(id: number, data: Partial<Opco>, actor: string): Promise<Opco | null> {
    const existing = opcoStorage.get(id);
    if (!existing) return null;
    
    const updated: Opco = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    opcoStorage.set(id, updated);
    logAudit(actor, "UPDATE", "opcos", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deleteOpco(id: number, actor: string): Promise<boolean> {
    const existing = opcoStorage.get(id);
    if (!existing) return false;
    
    opcoStorage.delete(id);
    logAudit(actor, "DELETE", "opcos", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getOpco(id: number): Promise<Opco | null> {
    return opcoStorage.get(id) || null;
  }

  async getOpcos(includeInactive = false): Promise<Opco[]> {
    const opcos = Array.from(opcoStorage.values());
    return includeInactive ? opcos : opcos.filter(o => o.isActive);
  }

  async getOpcoByCode(code: string): Promise<Opco | null> {
    return Array.from(opcoStorage.values()).find(o => o.code === code) || null;
  }

  // ==========================================================================
  // BROKER OPERATIONS
  // ==========================================================================

  async createBroker(data: Omit<Broker, "id" | "createdAt" | "updatedAt">, actor: string): Promise<Broker> {
    const id = ++brokerCounter;
    const now = new Date().toISOString();
    const broker: Broker = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    brokerStorage.set(id, broker);
    logAudit(actor, "CREATE", "brokers", id, undefined, broker as unknown as Record<string, unknown>);
    return broker;
  }

  async updateBroker(id: number, data: Partial<Broker>, actor: string): Promise<Broker | null> {
    const existing = brokerStorage.get(id);
    if (!existing) return null;
    
    const updated: Broker = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    brokerStorage.set(id, updated);
    logAudit(actor, "UPDATE", "brokers", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deleteBroker(id: number, actor: string): Promise<boolean> {
    const existing = brokerStorage.get(id);
    if (!existing) return false;
    
    brokerStorage.delete(id);
    logAudit(actor, "DELETE", "brokers", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getBroker(id: number): Promise<Broker | null> {
    return brokerStorage.get(id) || null;
  }

  async getBrokers(includeInactive = false): Promise<Broker[]> {
    const brokers = Array.from(brokerStorage.values());
    return includeInactive ? brokers : brokers.filter(b => b.isActive);
  }

  async getBrokerByCode(code: string): Promise<Broker | null> {
    return Array.from(brokerStorage.values()).find(b => b.code === code) || null;
  }

  // ==========================================================================
  // BROKER ACCOUNT OPERATIONS
  // ==========================================================================

  async createBrokerAccount(
    data: Omit<BrokerAccount, "id" | "createdAt" | "updatedAt" | "brokerName" | "opcoName">,
    actor: string
  ): Promise<BrokerAccount> {
    const id = ++brokerAccountCounter;
    const now = new Date().toISOString();
    
    // Get joined names
    const broker = brokerStorage.get(data.brokerId);
    const opco = data.opcoId ? opcoStorage.get(data.opcoId) : null;
    
    const account: BrokerAccount = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      brokerName: broker?.name,
      opcoName: opco?.name,
    };
    brokerAccountStorage.set(id, account);
    logAudit(actor, "CREATE", "broker_accounts", id, undefined, account as unknown as Record<string, unknown>);
    return account;
  }

  async updateBrokerAccount(id: number, data: Partial<BrokerAccount>, actor: string): Promise<BrokerAccount | null> {
    const existing = brokerAccountStorage.get(id);
    if (!existing) return null;
    
    const updated: BrokerAccount = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    // Update joined names if IDs changed
    if (data.brokerId) {
      const broker = brokerStorage.get(data.brokerId);
      updated.brokerName = broker?.name;
    }
    if (data.opcoId !== undefined) {
      const opco = data.opcoId ? opcoStorage.get(data.opcoId) : null;
      updated.opcoName = opco?.name;
    }
    
    brokerAccountStorage.set(id, updated);
    logAudit(actor, "UPDATE", "broker_accounts", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deleteBrokerAccount(id: number, actor: string): Promise<boolean> {
    const existing = brokerAccountStorage.get(id);
    if (!existing) return false;
    
    brokerAccountStorage.delete(id);
    logAudit(actor, "DELETE", "broker_accounts", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getBrokerAccount(id: number): Promise<BrokerAccount | null> {
    return brokerAccountStorage.get(id) || null;
  }

  async getBrokerAccounts(filter?: {
    brokerId?: number;
    opcoId?: number;
    includeInactive?: boolean;
  }): Promise<BrokerAccount[]> {
    let accounts = Array.from(brokerAccountStorage.values());
    
    if (filter?.brokerId) {
      accounts = accounts.filter(a => a.brokerId === filter.brokerId);
    }
    if (filter?.opcoId) {
      accounts = accounts.filter(a => a.opcoId === filter.opcoId);
    }
    if (!filter?.includeInactive) {
      accounts = accounts.filter(a => a.isActive);
    }
    
    return accounts;
  }

  async getBrokerAccountByCode(code: string): Promise<BrokerAccount | null> {
    return Array.from(brokerAccountStorage.values()).find(a => a.code === code) || null;
  }

  // ==========================================================================
  // BILLING RATE CARD OPERATIONS
  // ==========================================================================

  async createRateCard(
    data: Omit<BillingRateCard, "id" | "createdAt" | "updatedAt" | "opcoName" | "brokerAccountName" | "rules">,
    actor: string
  ): Promise<BillingRateCard> {
    const id = ++rateCardCounter;
    const now = new Date().toISOString();
    
    const opco = opcoStorage.get(data.opcoId);
    const account = brokerAccountStorage.get(data.brokerAccountId);
    
    const card: BillingRateCard = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      opcoName: opco?.name,
      brokerAccountName: account?.name,
      rules: [],
    };
    rateCardStorage.set(id, card);
    logAudit(actor, "CREATE", "billing_rate_cards", id, undefined, card as unknown as Record<string, unknown>);
    return card;
  }

  async updateRateCard(id: number, data: Partial<BillingRateCard>, actor: string): Promise<BillingRateCard | null> {
    const existing = rateCardStorage.get(id);
    if (!existing) return null;
    
    const updated: BillingRateCard = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    rateCardStorage.set(id, updated);
    logAudit(actor, "UPDATE", "billing_rate_cards", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deleteRateCard(id: number, actor: string): Promise<boolean> {
    const existing = rateCardStorage.get(id);
    if (!existing) return false;
    
    // Also delete associated rules
    for (const [ruleId, rule] of Array.from(rateRuleStorage.entries())) {
      if (rule.rateCardId === id) {
        rateRuleStorage.delete(ruleId);
      }
    }
    
    rateCardStorage.delete(id);
    logAudit(actor, "DELETE", "billing_rate_cards", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getRateCard(id: number): Promise<BillingRateCard | null> {
    const card = rateCardStorage.get(id);
    if (!card) return null;
    
    // Attach rules
    const rules = Array.from(rateRuleStorage.values())
      .filter(r => r.rateCardId === id)
      .sort((a, b) => a.priority - b.priority);
    
    return { ...card, rules };
  }

  async getRateCards(filter?: {
    opcoId?: number;
    brokerAccountId?: number;
    effectiveDate?: string;
    includeInactive?: boolean;
  }): Promise<BillingRateCard[]> {
    let cards = Array.from(rateCardStorage.values());
    
    if (filter?.opcoId) {
      cards = cards.filter(c => c.opcoId === filter.opcoId);
    }
    if (filter?.brokerAccountId) {
      cards = cards.filter(c => c.brokerAccountId === filter.brokerAccountId);
    }
    if (filter?.effectiveDate) {
      cards = cards.filter(c => 
        c.effectiveDate <= filter.effectiveDate! &&
        (!c.expirationDate || c.expirationDate >= filter.effectiveDate!)
      );
    }
    if (!filter?.includeInactive) {
      cards = cards.filter(c => c.isActive);
    }
    
    return cards.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }

  // ==========================================================================
  // BILLING RATE RULE OPERATIONS
  // ==========================================================================

  async createRateRule(
    data: Omit<BillingRateRule, "id" | "createdAt" | "updatedAt">,
    actor: string
  ): Promise<BillingRateRule> {
    const id = ++rateRuleCounter;
    const now = new Date().toISOString();
    
    const rule: BillingRateRule = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    rateRuleStorage.set(id, rule);
    logAudit(actor, "CREATE", "billing_rate_rules", id, undefined, rule as unknown as Record<string, unknown>);
    return rule;
  }

  async updateRateRule(id: number, data: Partial<BillingRateRule>, actor: string): Promise<BillingRateRule | null> {
    const existing = rateRuleStorage.get(id);
    if (!existing) return null;
    
    const updated: BillingRateRule = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    rateRuleStorage.set(id, updated);
    logAudit(actor, "UPDATE", "billing_rate_rules", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deleteRateRule(id: number, actor: string): Promise<boolean> {
    const existing = rateRuleStorage.get(id);
    if (!existing) return false;
    
    rateRuleStorage.delete(id);
    logAudit(actor, "DELETE", "billing_rate_rules", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getRateRulesByCard(rateCardId: number): Promise<BillingRateRule[]> {
    return Array.from(rateRuleStorage.values())
      .filter(r => r.rateCardId === rateCardId)
      .sort((a, b) => a.priority - b.priority);
  }

  // ==========================================================================
  // DRIVER PAY DEFAULT OPERATIONS
  // ==========================================================================

  async createPayDefault(
    data: Omit<DriverPayDefault, "id" | "createdAt" | "updatedAt" | "opcoName" | "brokerAccountName">,
    actor: string
  ): Promise<DriverPayDefault> {
    const id = ++payDefaultCounter;
    const now = new Date().toISOString();
    
    const opco = opcoStorage.get(data.opcoId);
    const account = data.brokerAccountId ? brokerAccountStorage.get(data.brokerAccountId) : null;
    
    const payDefault: DriverPayDefault = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      opcoName: opco?.name,
      brokerAccountName: account?.name,
    };
    payDefaultStorage.set(id, payDefault);
    logAudit(actor, "CREATE", "driver_pay_defaults", id, undefined, payDefault as unknown as Record<string, unknown>);
    return payDefault;
  }

  async updatePayDefault(id: number, data: Partial<DriverPayDefault>, actor: string): Promise<DriverPayDefault | null> {
    const existing = payDefaultStorage.get(id);
    if (!existing) return null;
    
    const updated: DriverPayDefault = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    payDefaultStorage.set(id, updated);
    logAudit(actor, "UPDATE", "driver_pay_defaults", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deletePayDefault(id: number, actor: string): Promise<boolean> {
    const existing = payDefaultStorage.get(id);
    if (!existing) return false;
    
    payDefaultStorage.delete(id);
    logAudit(actor, "DELETE", "driver_pay_defaults", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getPayDefault(id: number): Promise<DriverPayDefault | null> {
    return payDefaultStorage.get(id) || null;
  }

  async getPayDefaults(filter?: {
    opcoId?: number;
    brokerAccountId?: number;
    effectiveDate?: string;
    includeInactive?: boolean;
  }): Promise<DriverPayDefault[]> {
    let defaults = Array.from(payDefaultStorage.values());
    
    if (filter?.opcoId) {
      defaults = defaults.filter(d => d.opcoId === filter.opcoId);
    }
    if (filter?.brokerAccountId) {
      defaults = defaults.filter(d => d.brokerAccountId === filter.brokerAccountId);
    }
    if (filter?.effectiveDate) {
      defaults = defaults.filter(d => 
        d.effectiveDate <= filter.effectiveDate! &&
        (!d.expirationDate || d.expirationDate >= filter.effectiveDate!)
      );
    }
    if (!filter?.includeInactive) {
      defaults = defaults.filter(d => d.isActive);
    }
    
    return defaults.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }

  // ==========================================================================
  // DRIVER PAY CONTRACT OPERATIONS
  // ==========================================================================

  async createPayContract(
    data: Omit<DriverPayContract, "id" | "createdAt" | "updatedAt" | "driverName" | "opcoName" | "brokerAccountName">,
    actor: string
  ): Promise<DriverPayContract> {
    const id = ++payContractCounter;
    const now = new Date().toISOString();
    
    const opco = opcoStorage.get(data.opcoId);
    const account = data.brokerAccountId ? brokerAccountStorage.get(data.brokerAccountId) : null;
    
    const contract: DriverPayContract = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      opcoName: opco?.name,
      brokerAccountName: account?.name,
    };
    payContractStorage.set(id, contract);
    logAudit(actor, "CREATE", "driver_pay_contracts", id, undefined, contract as unknown as Record<string, unknown>);
    return contract;
  }

  async updatePayContract(id: number, data: Partial<DriverPayContract>, actor: string): Promise<DriverPayContract | null> {
    const existing = payContractStorage.get(id);
    if (!existing) return null;
    
    const updated: DriverPayContract = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    payContractStorage.set(id, updated);
    logAudit(actor, "UPDATE", "driver_pay_contracts", id, existing as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>);
    return updated;
  }

  async deletePayContract(id: number, actor: string): Promise<boolean> {
    const existing = payContractStorage.get(id);
    if (!existing) return false;
    
    payContractStorage.delete(id);
    logAudit(actor, "DELETE", "driver_pay_contracts", id, existing as unknown as Record<string, unknown>);
    return true;
  }

  async getPayContract(id: number): Promise<DriverPayContract | null> {
    return payContractStorage.get(id) || null;
  }

  async getPayContracts(filter?: {
    driverId?: number;
    opcoId?: number;
    brokerAccountId?: number;
    effectiveDate?: string;
    includeInactive?: boolean;
  }): Promise<DriverPayContract[]> {
    let contracts = Array.from(payContractStorage.values());
    
    if (filter?.driverId) {
      contracts = contracts.filter(c => c.driverId === filter.driverId);
    }
    if (filter?.opcoId) {
      contracts = contracts.filter(c => c.opcoId === filter.opcoId);
    }
    if (filter?.brokerAccountId) {
      contracts = contracts.filter(c => c.brokerAccountId === filter.brokerAccountId);
    }
    if (filter?.effectiveDate) {
      contracts = contracts.filter(c => 
        c.effectiveDate <= filter.effectiveDate! &&
        (!c.expirationDate || c.expirationDate >= filter.effectiveDate!)
      );
    }
    if (!filter?.includeInactive) {
      contracts = contracts.filter(c => c.isActive);
    }
    
    return contracts.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }

  /**
   * Get effective pay rate for a driver on a given date
   * Falls back to defaults if no specific contract exists
   */
  async getEffectivePayRate(
    driverId: number,
    opcoId: number,
    brokerAccountId: number | null,
    date: string
  ): Promise<DriverPayContract | DriverPayDefault | null> {
    // First, try to find a specific contract for this driver
    const contracts = await this.getPayContracts({
      driverId,
      opcoId,
      effectiveDate: date,
    });
    
    // Find most specific match
    const specificContract = contracts.find(c => 
      c.brokerAccountId === brokerAccountId
    );
    if (specificContract) return specificContract;
    
    // Fall back to opco-wide contract
    const opcoContract = contracts.find(c => !c.brokerAccountId);
    if (opcoContract) return opcoContract;
    
    // Fall back to defaults
    const defaults = await this.getPayDefaults({
      opcoId,
      effectiveDate: date,
    });
    
    const specificDefault = defaults.find(d => 
      d.brokerAccountId === brokerAccountId
    );
    if (specificDefault) return specificDefault;
    
    const opcoDefault = defaults.find(d => !d.brokerAccountId);
    return opcoDefault || null;
  }

  // ==========================================================================
  // AUDIT LOG OPERATIONS
  // ==========================================================================

  async getAuditLog(filter?: {
    entity?: string;
    entityId?: number;
    actor?: string;
    action?: AuditAction;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let entries = Array.from(auditStorage.values());
    
    if (filter?.entity) {
      entries = entries.filter(e => e.entity === filter.entity);
    }
    if (filter?.entityId) {
      entries = entries.filter(e => e.entityId === filter.entityId);
    }
    if (filter?.actor) {
      entries = entries.filter(e => e.actor === filter.actor);
    }
    if (filter?.action) {
      entries = entries.filter(e => e.action === filter.action);
    }
    if (filter?.fromDate) {
      entries = entries.filter(e => e.timestamp >= filter.fromDate!);
    }
    if (filter?.toDate) {
      entries = entries.filter(e => e.timestamp <= filter.toDate!);
    }
    
    entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    if (filter?.limit) {
      entries = entries.slice(0, filter.limit);
    }
    
    return entries;
  }

  // ==========================================================================
  // SEED DATA
  // ==========================================================================

  async seedDefaultData(actor: string): Promise<void> {
    // Check if already seeded
    if (opcoStorage.size > 0) {
      console.log("[Admin] Data already seeded, skipping...");
      return;
    }

    console.log("[Admin] Seeding default data...");

    // Create OpCos
    const sahrawi = await this.createOpco({
      name: "Sahrawi Transportation",
      code: "SAHRAWI",
      timezone: "America/New_York",
      isActive: true,
    }, actor);

    const metrix = await this.createOpco({
      name: "Metrix Medical Transport",
      code: "METRIX",
      timezone: "America/New_York",
      isActive: true,
    }, actor);

    // Create Brokers
    const modivcare = await this.createBroker({
      name: "Modivcare",
      code: "MODIVCARE",
      isActive: true,
    }, actor);

    const mtm = await this.createBroker({
      name: "MTM",
      code: "MTM",
      isActive: true,
    }, actor);

    const a2c = await this.createBroker({
      name: "Access2Care",
      code: "ACCESS2CARE",
      isActive: true,
    }, actor);

    // Create Broker Accounts
    await this.createBrokerAccount({
      brokerId: modivcare.id,
      opcoId: sahrawi.id,
      name: "Modivcare – Sahrawi",
      code: "MODIVCARE_SAHRAWI",
      isActive: true,
    }, actor);

    await this.createBrokerAccount({
      brokerId: modivcare.id,
      opcoId: metrix.id,
      name: "Modivcare – Metrix",
      code: "MODIVCARE_METRIX",
      isActive: true,
    }, actor);

    await this.createBrokerAccount({
      brokerId: mtm.id,
      opcoId: sahrawi.id,
      name: "MTM Main",
      code: "MTM_MAIN",
      isActive: true,
    }, actor);

    const a2cMain = await this.createBrokerAccount({
      brokerId: a2c.id,
      opcoId: sahrawi.id,
      name: "Access2Care Main",
      code: "A2C_MAIN",
      isActive: true,
    }, actor);

    // Get broker accounts for rate cards
    const modivcareS = await this.getBrokerAccounts({ opcoId: sahrawi.id });
    const modivcareM = await this.getBrokerAccounts({ opcoId: metrix.id });
    const modivcareSahrawiAccount = modivcareS.find(a => a.code === "MODIVCARE_SAHRAWI");
    const modivcareMetrixAccount = modivcareM.find(a => a.code === "MODIVCARE_METRIX");

    // Create Billing Rate Cards
    if (modivcareSahrawiAccount) {
      const sahrawiCard = await this.createRateCard({
        opcoId: sahrawi.id,
        brokerAccountId: modivcareSahrawiAccount.id,
        name: "Sahrawi/Modivcare Standard Rates",
        effectiveDate: "2026-01-01",
        currency: "USD",
        notes: "Standard rates for Modivcare trips",
        isActive: true,
      }, actor);

      // Add rate rules
      await this.createRateRule({
        rateCardId: sahrawiCard.id,
        ruleType: "BASE_PLUS_MILE",
        mobilityType: "STD",
        baseAmount: 8.00,
        ratePerMile: 1.25,
        minCharge: 12.00,
        priority: 1,
        isActive: true,
      }, actor);

      await this.createRateRule({
        rateCardId: sahrawiCard.id,
        ruleType: "BASE_PLUS_MILE",
        mobilityType: "WCH",
        baseAmount: 15.00,
        ratePerMile: 1.50,
        minCharge: 20.00,
        priority: 2,
        isActive: true,
      }, actor);
    }

    if (modivcareMetrixAccount) {
      const metrixCard = await this.createRateCard({
        opcoId: metrix.id,
        brokerAccountId: modivcareMetrixAccount.id,
        name: "Metrix/Modivcare Standard Rates",
        effectiveDate: "2026-01-01",
        currency: "USD",
        notes: "Standard rates for Modivcare trips",
        isActive: true,
      }, actor);

      await this.createRateRule({
        rateCardId: metrixCard.id,
        ruleType: "BASE_PLUS_MILE",
        mobilityType: "STD",
        baseAmount: 7.50,
        ratePerMile: 1.20,
        minCharge: 11.00,
        priority: 1,
        isActive: true,
      }, actor);
    }

    // Create Driver Pay Defaults
    await this.createPayDefault({
      opcoId: sahrawi.id,
      name: "Sahrawi W2 Hourly Default",
      contractType: "W2",
      payScheme: "HOURLY",
      hourlyRate: 16.00,
      minDailyGuarantee: 100.00,
      effectiveDate: "2026-01-01",
      notes: "Default pay for new W2 hires at Sahrawi",
      isActive: true,
    }, actor);

    await this.createPayDefault({
      opcoId: metrix.id,
      name: "Metrix W2 Hourly Default",
      contractType: "W2",
      payScheme: "HOURLY",
      hourlyRate: 15.50,
      minDailyGuarantee: 95.00,
      effectiveDate: "2026-01-01",
      notes: "Default pay for new W2 hires at Metrix",
      isActive: true,
    }, actor);

    await this.createPayDefault({
      opcoId: sahrawi.id,
      name: "Sahrawi 1099 Per Trip Default",
      contractType: "1099",
      payScheme: "PER_TRIP",
      perTripRate: 10.00,
      perMileRate: 0.45,
      effectiveDate: "2026-01-01",
      notes: "Default pay for 1099 contractors at Sahrawi",
      isActive: true,
    }, actor);

    console.log("[Admin] Seed data created successfully with rate cards and pay defaults");
  }
}

// Singleton instance
let adminServiceInstance: AdminService | null = null;

export function getAdminService(): AdminService {
  if (!adminServiceInstance) {
    adminServiceInstance = new AdminService();
  }
  return adminServiceInstance;
}

export { AdminService };
