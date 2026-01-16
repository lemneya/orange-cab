/**
 * OC-ADMIN-0: Billing Rate Cards Management
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Building2,
  CreditCard,
  Settings,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RateCardFormData {
  opcoId: number | null;
  brokerAccountId: number | null;
  name: string;
  effectiveDate: string;
  expirationDate: string;
  currency: string;
  notes: string;
  isActive: boolean;
}

interface RateRuleFormData {
  rateCardId: number;
  ruleType: string;
  mobilityType: string;
  baseAmount: string;
  ratePerMile: string;
  ratePerTrip: string;
  minCharge: string;
  maxCharge: string;
  priority: string;
  description: string;
  isActive: boolean;
}

const defaultCardFormData: RateCardFormData = {
  opcoId: null,
  brokerAccountId: null,
  name: "",
  effectiveDate: "",
  expirationDate: "",
  currency: "USD",
  notes: "",
  isActive: true,
};

const defaultRuleFormData: RateRuleFormData = {
  rateCardId: 0,
  ruleType: "PER_MILE",
  mobilityType: "STD",
  baseAmount: "",
  ratePerMile: "",
  ratePerTrip: "",
  minCharge: "",
  maxCharge: "",
  priority: "100",
  description: "",
  isActive: true,
};

const RULE_TYPES = [
  { value: "PER_MILE", label: "Per Mile" },
  { value: "PER_TRIP", label: "Per Trip" },
  { value: "BASE_PLUS_MILE", label: "Base + Per Mile" },
  { value: "ZONE", label: "Zone-Based" },
  { value: "TIME_BAND", label: "Time Band" },
  { value: "MOBILITY_DIFF", label: "Mobility Differential" },
];

const MOBILITY_TYPES = [
  { value: "STD", label: "Standard (Ambulatory)" },
  { value: "WCH", label: "Wheelchair" },
  { value: "STRETCHER", label: "Stretcher" },
];

export default function RateCardsPage() {
  const [, setLocation] = useLocation();
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [isRuleSheetOpen, setIsRuleSheetOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [cardFormData, setCardFormData] = useState<RateCardFormData>(defaultCardFormData);
  const [ruleFormData, setRuleFormData] = useState<RateRuleFormData>(defaultRuleFormData);

  const utils = trpc.useUtils();
  const { data: rateCards, isLoading } = trpc.admin.getRateCards.useQuery({ includeInactive: true });
  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery();
  const { data: selectedCardData } = trpc.admin.getRateCard.useQuery(
    { id: selectedCard! },
    { enabled: !!selectedCard }
  );

  const createCardMutation = trpc.admin.createRateCard.useMutation({
    onSuccess: () => {
      utils.admin.getRateCards.invalidate();
      closeCardDialog();
    },
  });
  const updateCardMutation = trpc.admin.updateRateCard.useMutation({
    onSuccess: () => {
      utils.admin.getRateCards.invalidate();
      closeCardDialog();
    },
  });
  const deleteCardMutation = trpc.admin.deleteRateCard.useMutation({
    onSuccess: () => {
      utils.admin.getRateCards.invalidate();
    },
  });

  const createRuleMutation = trpc.admin.createRateRule.useMutation({
    onSuccess: () => {
      utils.admin.getRateCard.invalidate({ id: selectedCard! });
      closeRuleSheet();
    },
  });
  const updateRuleMutation = trpc.admin.updateRateRule.useMutation({
    onSuccess: () => {
      utils.admin.getRateCard.invalidate({ id: selectedCard! });
      closeRuleSheet();
    },
  });
  const deleteRuleMutation = trpc.admin.deleteRateRule.useMutation({
    onSuccess: () => {
      utils.admin.getRateCard.invalidate({ id: selectedCard! });
    },
  });

  const openCreateCardDialog = () => {
    setCardFormData(defaultCardFormData);
    setEditingCardId(null);
    setIsCardDialogOpen(true);
  };

  const openEditCardDialog = (card: NonNullable<typeof rateCards>[number]) => {
    setCardFormData({
      opcoId: card.opcoId,
      brokerAccountId: card.brokerAccountId,
      name: card.name,
      effectiveDate: card.effectiveDate,
      expirationDate: card.expirationDate || "",
      currency: card.currency,
      notes: card.notes || "",
      isActive: card.isActive,
    });
    setEditingCardId(card.id);
    setIsCardDialogOpen(true);
  };

  const closeCardDialog = () => {
    setIsCardDialogOpen(false);
    setEditingCardId(null);
    setCardFormData(defaultCardFormData);
  };

  const handleCardSubmit = () => {
    if (!cardFormData.opcoId || !cardFormData.brokerAccountId) return;
    
    const data = {
      opcoId: cardFormData.opcoId,
      brokerAccountId: cardFormData.brokerAccountId,
      name: cardFormData.name,
      effectiveDate: cardFormData.effectiveDate,
      expirationDate: cardFormData.expirationDate || undefined,
      currency: cardFormData.currency,
      notes: cardFormData.notes || undefined,
      isActive: cardFormData.isActive,
    };
    
    if (editingCardId) {
      updateCardMutation.mutate({ id: editingCardId, data });
    } else {
      createCardMutation.mutate(data);
    }
  };

  const handleDeleteCard = (id: number) => {
    if (confirm("Are you sure you want to delete this rate card and all its rules?")) {
      deleteCardMutation.mutate({ id });
    }
  };

  const openCreateRuleSheet = () => {
    if (!selectedCard) return;
    setRuleFormData({ ...defaultRuleFormData, rateCardId: selectedCard });
    setEditingRuleId(null);
    setIsRuleSheetOpen(true);
  };

  const openEditRuleSheet = (rule: NonNullable<typeof selectedCardData>["rules"] extends (infer T)[] | undefined ? T : never) => {
    if (!rule || !selectedCard) return;
    setRuleFormData({
      rateCardId: selectedCard,
      ruleType: rule.ruleType,
      mobilityType: rule.mobilityType,
      baseAmount: rule.baseAmount?.toString() || "",
      ratePerMile: rule.ratePerMile?.toString() || "",
      ratePerTrip: rule.ratePerTrip?.toString() || "",
      minCharge: rule.minCharge?.toString() || "",
      maxCharge: rule.maxCharge?.toString() || "",
      priority: rule.priority.toString(),
      description: rule.description || "",
      isActive: rule.isActive,
    });
    setEditingRuleId(rule.id);
    setIsRuleSheetOpen(true);
  };

  const closeRuleSheet = () => {
    setIsRuleSheetOpen(false);
    setEditingRuleId(null);
    setRuleFormData(defaultRuleFormData);
  };

  const handleRuleSubmit = () => {
    const data = {
      rateCardId: ruleFormData.rateCardId,
      ruleType: ruleFormData.ruleType as "PER_MILE" | "PER_TRIP" | "BASE_PLUS_MILE" | "ZONE" | "TIME_BAND" | "MOBILITY_DIFF",
      mobilityType: ruleFormData.mobilityType as "STD" | "WCH" | "STRETCHER",
      baseAmount: ruleFormData.baseAmount ? parseFloat(ruleFormData.baseAmount) : undefined,
      ratePerMile: ruleFormData.ratePerMile ? parseFloat(ruleFormData.ratePerMile) : undefined,
      ratePerTrip: ruleFormData.ratePerTrip ? parseFloat(ruleFormData.ratePerTrip) : undefined,
      minCharge: ruleFormData.minCharge ? parseFloat(ruleFormData.minCharge) : undefined,
      maxCharge: ruleFormData.maxCharge ? parseFloat(ruleFormData.maxCharge) : undefined,
      priority: parseInt(ruleFormData.priority),
      description: ruleFormData.description || undefined,
      isActive: ruleFormData.isActive,
    };
    
    if (editingRuleId) {
      updateRuleMutation.mutate({ id: editingRuleId, data });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleDeleteRule = (id: number) => {
    if (confirm("Are you sure you want to delete this rate rule?")) {
      deleteRuleMutation.mutate({ id });
    }
  };

  // Filter broker accounts by selected OpCo
  const filteredBrokerAccounts = brokerAccounts?.filter(
    (a) => !cardFormData.opcoId || a.opcoId === cardFormData.opcoId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              Billing Rate Cards
            </h1>
            <p className="text-muted-foreground mt-1">
              Define what your company earns per trip type and mobility
            </p>
          </div>
        </div>
        <Button onClick={openCreateCardDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rate Card
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rate Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Cards</CardTitle>
            <CardDescription>{rateCards?.length || 0} rate cards configured</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : rateCards && rateCards.length > 0 ? (
              <div className="space-y-2">
                {rateCards.map((card) => (
                  <div
                    key={card.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCard === card.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedCard(card.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {card.name}
                          {!card.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {card.opcoName}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {card.brokerAccountName}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Effective: {card.effectiveDate}
                          {card.expirationDate && ` → ${card.expirationDate}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCardDialog(card);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No rate cards configured. Click "Add Rate Card" to create one.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Rules Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Rate Rules
                </CardTitle>
                <CardDescription>
                  {selectedCard
                    ? `Rules for ${selectedCardData?.name || "selected card"}`
                    : "Select a rate card to view rules"}
                </CardDescription>
              </div>
              {selectedCard && (
                <Button size="sm" onClick={openCreateRuleSheet}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCard ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a rate card from the left to view and edit its rules
              </div>
            ) : selectedCardData?.rules && selectedCardData.rules.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Mobility</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCardData.rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {RULE_TYPES.find((t) => t.value === rule.ruleType)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {MOBILITY_TYPES.find((t) => t.value === rule.mobilityType)?.label}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {rule.baseAmount && <div>Base: ${rule.baseAmount}</div>}
                          {rule.ratePerMile && <div>$/mi: ${rule.ratePerMile}</div>}
                          {rule.ratePerTrip && <div>$/trip: ${rule.ratePerTrip}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditRuleSheet(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No rules configured for this rate card. Click "Add Rule" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Rate Card Dialog */}
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCardId ? "Edit" : "Add"} Rate Card</DialogTitle>
            <DialogDescription>
              {editingCardId
                ? "Update the rate card details"
                : "Create a new billing rate card"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opco">Operating Company *</Label>
              <Select
                value={cardFormData.opcoId?.toString() || ""}
                onValueChange={(value) =>
                  setCardFormData({ ...cardFormData, opcoId: parseInt(value), brokerAccountId: null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OpCo" />
                </SelectTrigger>
                <SelectContent>
                  {opcos?.map((opco) => (
                    <SelectItem key={opco.id} value={opco.id.toString()}>
                      {opco.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerAccount">Broker Account *</Label>
              <Select
                value={cardFormData.brokerAccountId?.toString() || ""}
                onValueChange={(value) =>
                  setCardFormData({ ...cardFormData, brokerAccountId: parseInt(value) })
                }
                disabled={!cardFormData.opcoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select broker account" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBrokerAccounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Card Name *</Label>
              <Input
                id="name"
                value={cardFormData.name}
                onChange={(e) => setCardFormData({ ...cardFormData, name: e.target.value })}
                placeholder="Modivcare-Sahrawi 2026 Rates"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={cardFormData.effectiveDate}
                  onChange={(e) =>
                    setCardFormData({ ...cardFormData, effectiveDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={cardFormData.expirationDate}
                  onChange={(e) =>
                    setCardFormData({ ...cardFormData, expirationDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={cardFormData.currency}
                onValueChange={(value) => setCardFormData({ ...cardFormData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={cardFormData.notes}
                onChange={(e) => setCardFormData({ ...cardFormData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={cardFormData.isActive}
                onChange={(e) => setCardFormData({ ...cardFormData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCardDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleCardSubmit}
              disabled={
                !cardFormData.opcoId ||
                !cardFormData.brokerAccountId ||
                !cardFormData.name ||
                !cardFormData.effectiveDate ||
                createCardMutation.isPending ||
                updateCardMutation.isPending
              }
            >
              {createCardMutation.isPending || updateCardMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate Rule Sheet */}
      <Sheet open={isRuleSheetOpen} onOpenChange={setIsRuleSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingRuleId ? "Edit" : "Add"} Rate Rule</SheetTitle>
            <SheetDescription>
              Configure the billing rate for a specific trip type
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label>Rule Type *</Label>
              <Select
                value={ruleFormData.ruleType}
                onValueChange={(value) => setRuleFormData({ ...ruleFormData, ruleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobility Type *</Label>
              <Select
                value={ruleFormData.mobilityType}
                onValueChange={(value) => setRuleFormData({ ...ruleFormData, mobilityType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOBILITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Conditional rate fields based on rule type */}
            {(ruleFormData.ruleType === "BASE_PLUS_MILE" || ruleFormData.ruleType === "PER_TRIP") && (
              <div className="space-y-2">
                <Label>Base Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleFormData.baseAmount}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, baseAmount: e.target.value })}
                  placeholder="15.00"
                />
              </div>
            )}
            
            {(ruleFormData.ruleType === "PER_MILE" || ruleFormData.ruleType === "BASE_PLUS_MILE") && (
              <div className="space-y-2">
                <Label>Rate Per Mile ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleFormData.ratePerMile}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, ratePerMile: e.target.value })}
                  placeholder="1.50"
                />
              </div>
            )}
            
            {ruleFormData.ruleType === "PER_TRIP" && (
              <div className="space-y-2">
                <Label>Rate Per Trip ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleFormData.ratePerTrip}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, ratePerTrip: e.target.value })}
                  placeholder="25.00"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Charge ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleFormData.minCharge}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, minCharge: e.target.value })}
                  placeholder="10.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Charge ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={ruleFormData.maxCharge}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, maxCharge: e.target.value })}
                  placeholder="100.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input
                type="number"
                value={ruleFormData.priority}
                onChange={(e) => setRuleFormData({ ...ruleFormData, priority: e.target.value })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers = higher priority. Rules are evaluated in priority order.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={ruleFormData.description}
                onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                placeholder="Standard ambulatory rate..."
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ruleIsActive"
                checked={ruleFormData.isActive}
                onChange={(e) => setRuleFormData({ ...ruleFormData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="ruleIsActive">Active</Label>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={closeRuleSheet}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRuleSubmit}
                disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
              >
                {createRuleMutation.isPending || updateRuleMutation.isPending ? "Saving..." : "Save Rule"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
