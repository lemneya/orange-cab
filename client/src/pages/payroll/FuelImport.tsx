import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Fuel,
  ArrowRight,
  Download,
  RefreshCw
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ParsedTransaction {
  vendorTxnId: string;
  transactionDate: string;
  amount: number;
  gallons?: number;
  pricePerGallon?: number;
  cardId?: string;
  cardLastFour?: string;
  licensePlate?: string;
  unitNumber?: string;
  stationName?: string;
  stationAddress?: string;
  stationCity?: string;
  stationState?: string;
  productType?: string;
  rawPayload?: string;
  isValid: boolean;
  errors: string[];
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export default function FuelImport() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [vendor, setVendor] = useState<string>("shell");
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    batchId: string;
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    duplicateRows: number;
    autoMatchedCount: number;
    unmatchedCount: number;
  } | null>(null);

  const importMutation = trpc.fuelImport.importFuel.useMutation();

  // Parse Shell CSV format
  const parseShellCSV = (csvText: string): ParsedTransaction[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const errors: string[] = [];
      
      // Map Shell CSV columns to our schema
      const txnId = row['transaction id'] || row['txn id'] || row['id'] || `SHELL-${Date.now()}-${i}`;
      const dateStr = row['date'] || row['transaction date'] || row['trans date'];
      const amountStr = row['amount'] || row['total'] || row['transaction amount'];
      const gallonsStr = row['gallons'] || row['quantity'] || row['volume'];
      const ppgStr = row['price per gallon'] || row['ppg'] || row['unit price'];
      const cardId = row['card number'] || row['card id'] || row['card'];
      const plate = row['license plate'] || row['plate'] || row['tag'];
      const unit = row['unit'] || row['unit number'] || row['vehicle'];
      const station = row['station'] || row['location'] || row['merchant'];
      const city = row['city'];
      const state = row['state'];
      const product = row['product'] || row['fuel type'] || row['grade'];

      // Validate required fields
      if (!dateStr) errors.push('Missing date');
      if (!amountStr) errors.push('Missing amount');

      // Parse amount (convert dollars to cents)
      let amount = 0;
      if (amountStr) {
        const parsed = parseFloat(amountStr.replace(/[$,]/g, ''));
        if (isNaN(parsed)) {
          errors.push('Invalid amount');
        } else {
          amount = Math.round(parsed * 100);
        }
      }

      // Parse gallons
      let gallons: number | undefined;
      if (gallonsStr) {
        const parsed = parseFloat(gallonsStr);
        if (!isNaN(parsed)) gallons = parsed;
      }

      // Parse price per gallon
      let ppg: number | undefined;
      if (ppgStr) {
        const parsed = parseFloat(ppgStr.replace(/[$,]/g, ''));
        if (!isNaN(parsed)) ppg = Math.round(parsed * 100);
      }

      transactions.push({
        vendorTxnId: txnId,
        transactionDate: dateStr,
        amount,
        gallons,
        pricePerGallon: ppg,
        cardId: cardId || undefined,
        cardLastFour: cardId ? cardId.slice(-4) : undefined,
        licensePlate: plate || undefined,
        unitNumber: unit || undefined,
        stationName: station || undefined,
        stationCity: city || undefined,
        stationState: state || undefined,
        productType: product || undefined,
        rawPayload: JSON.stringify(row),
        isValid: errors.length === 0,
        errors,
      });
    }

    return transactions;
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseShellCSV(text);
      setParsedData(parsed);
      setStep("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);

    const validTransactions = parsedData.filter(t => t.isValid);
    
    try {
      const result = await importMutation.mutateAsync({
        vendor: vendor as any,
        fileName,
        transactions: validTransactions.map(t => ({
          vendorTxnId: t.vendorTxnId,
          transactionDate: t.transactionDate,
          amount: t.amount,
          gallons: t.gallons,
          pricePerGallon: t.pricePerGallon,
          cardId: t.cardId,
          cardLastFour: t.cardLastFour,
          licensePlate: t.licensePlate,
          unitNumber: t.unitNumber,
          stationName: t.stationName,
          stationCity: t.stationCity,
          stationState: t.stationState,
          productType: t.productType,
          rawPayload: t.rawPayload,
        })),
      });

      setImportResult(result);
      setImportProgress(100);
      setStep("complete");
    } catch (error) {
      console.error("Import failed:", error);
      setStep("preview");
    }
  };

  const resetImport = () => {
    setStep("upload");
    setFileName("");
    setParsedData([]);
    setImportResult(null);
    setImportProgress(0);
  };

  const validCount = parsedData.filter(t => t.isValid).length;
  const invalidCount = parsedData.filter(t => !t.isValid).length;
  const totalAmount = parsedData.filter(t => t.isValid).reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Fuel className="h-8 w-8 text-orange-500" />
            Fuel Import
          </h1>
          <p className="text-muted-foreground">
            Import fuel transactions from vendor CSV files
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "upload" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            1
          </div>
          <span>Upload</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === "preview" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "preview" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            2
          </div>
          <span>Preview</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === "importing" || step === "complete" ? "text-primary" : "text-muted-foreground"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "importing" || step === "complete" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            3
          </div>
          <span>Import</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Fuel CSV</CardTitle>
            <CardDescription>
              Select your fuel vendor and upload the CSV export file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Fuel Vendor</Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shell">Shell</SelectItem>
                  <SelectItem value="exxon">Exxon</SelectItem>
                  <SelectItem value="bp">BP</SelectItem>
                  <SelectItem value="chevron">Chevron</SelectItem>
                  <SelectItem value="wawa">Wawa</SelectItem>
                  <SelectItem value="sheetz">Sheetz</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Input
                type="file"
                accept=".csv"
                className="mt-4 max-w-xs mx-auto"
                onChange={handleFileUpload}
              />
            </div>

            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>Expected CSV Format</AlertTitle>
              <AlertDescription>
                The CSV should include columns for: Transaction ID, Date, Amount, Gallons, Card Number, License Plate, Unit Number, Station, City, State
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{parsedData.length}</div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{validCount}</div>
                <p className="text-sm text-muted-foreground">Valid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                <p className="text-sm text-muted-foreground">Invalid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">${(totalAmount / 100).toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preview: {fileName}</CardTitle>
              <CardDescription>
                Review the parsed transactions before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Gallons</TableHead>
                      <TableHead>Card ID</TableHead>
                      <TableHead>Unit #</TableHead>
                      <TableHead>Plate</TableHead>
                      <TableHead>Station</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((txn, idx) => (
                      <TableRow key={idx} className={!txn.isValid ? "bg-red-50" : ""}>
                        <TableCell>
                          {txn.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-600">{txn.errors.join(", ")}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{txn.transactionDate}</TableCell>
                        <TableCell>${(txn.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>{txn.gallons?.toFixed(2) || "-"}</TableCell>
                        <TableCell>{txn.cardLastFour ? `****${txn.cardLastFour}` : "-"}</TableCell>
                        <TableCell>{txn.unitNumber || "-"}</TableCell>
                        <TableCell>{txn.licensePlate || "-"}</TableCell>
                        <TableCell>{txn.stationName || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing first 50 of {parsedData.length} rows
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={resetImport}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={validCount === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Import {validCount} Transactions
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 mx-auto animate-spin text-orange-500" />
              <h3 className="text-xl font-semibold">Importing Transactions...</h3>
              <Progress value={importProgress} className="max-w-md mx-auto" />
              <p className="text-muted-foreground">
                Processing {validCount} fuel transactions
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <h3 className="text-2xl font-semibold">Import Complete!</h3>
              
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.successfulRows}</div>
                  <p className="text-sm text-green-700">Imported</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResult.autoMatchedCount}</div>
                  <p className="text-sm text-blue-700">Auto-Matched</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{importResult.unmatchedCount}</div>
                  <p className="text-sm text-amber-700">Unmatched</p>
                </div>
              </div>

              {importResult.duplicateRows > 0 && (
                <Alert className="max-w-lg mx-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Duplicates Skipped</AlertTitle>
                  <AlertDescription>
                    {importResult.duplicateRows} duplicate transactions were skipped
                  </AlertDescription>
                </Alert>
              )}

              {importResult.unmatchedCount > 0 && (
                <Alert className="max-w-lg mx-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Unmatched Transactions</AlertTitle>
                  <AlertDescription>
                    {importResult.unmatchedCount} transactions need manual assignment in the Reconciliation Queue
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={resetImport}>
                  Import More
                </Button>
                <Button asChild>
                  <a href="/payroll/reconciliation">View Reconciliation Queue</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
