import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Replace, UserPlus, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { transferSchema } from "@/lib/validation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { auth } from "@/lib/auth";

type Owner = { name: string; email?: string; phone?: string; address?: string; aadhaarLast4?: string };

interface VehicleData {
  id: string;
  rcNumber: string;
  version: number;
  owner?: Owner;
  previousOwners?: string[];
  ownersCount?: number;
  stolen?: boolean;
  suspicious?: boolean;
  vehicleInfo?: { make?: string; model?: string };
}

const TransferOwnership = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Please start an Admin Session first.");
      navigate("/auth");
    }
  }, [navigate]);

  const [rcNumber, setRcNumber] = useState("");
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [historyTimeline, setHistoryTimeline] = useState<any[]>([]);

  const [newOwner, setNewOwner] = useState<Owner>({ name: "", email: "", phone: "", address: "", aadhaarLast4: "" });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  const fetchRc = useCallback(async () => {
    if (!rcNumber.trim()) { toast.error("Enter RC Number"); return; }
    try {
      setLoading(true);
      setTransferSuccessMsg(null);
      const rc = await apiClient.rc.search(rcNumber.trim());
      if (!rc || rc.error) { throw new Error(rc?.error || "RC not found"); }
      setVehicle(rc);

      // Fetch history timeline
      if (rc.id) {
        const history = await apiClient.rc.getHistory(rc.id);
        setHistoryTimeline(history || []);
      }
      toast.success("RC loaded");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to load RC";
      toast.error(message);
      setVehicle(null);
      setHistoryTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [rcNumber]);

  useEffect(() => {
    if (!auth.isAuthenticated()) return;
    const params = new URLSearchParams(window.location.search);
    const rc = params.get("rc");
    if (rc) {
      setRcNumber(rc.toUpperCase());
      setTimeout(() => fetchRc(), 0);
    }
  }, [fetchRc]);

  const handleInitiateTransfer = () => {
    if (!vehicle) {
      toast.error("Please load a vehicle first.");
      return;
    }
    const adminKey = localStorage.getItem("adminKey") || "";
    const input = { rcNumber: rcNumber.trim(), newOwner, adminKey };
    const validation = transferSchema.safeParse(input);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => i.message);
      setFormErrors(issues);
      toast.error(issues[0]);
      return;
    }
    if (vehicle.owner?.name && vehicle.owner.name.trim().toLowerCase() === newOwner.name.trim().toLowerCase()) {
      toast.error("New owner cannot be the same as current owner");
      return;
    }
    setFormErrors([]);
    setConfirmOpen(true);
  };

  const executeTransfer = async () => {
    if (!vehicle) return;
    try {
      setLoading(true);
      const transferPayload = {
        newOwner: {
          name: newOwner.name.trim(),
          email: newOwner.email?.trim() || undefined,
          phone: newOwner.phone?.trim() || undefined,
          address: newOwner.address?.trim() || undefined,
          aadhaarLast4: newOwner.aadhaarLast4?.trim() || undefined,
        },
      };

      const updatedResponse = await apiClient.rc.transferOwnership(vehicle.id, transferPayload);
      
      toast.success("Ownership transferred successfully!");
      setTransferSuccessMsg(`Ownership successfully transferred to ${updatedResponse.owner?.name}`);
      setNewOwner({ name: "", email: "", phone: "", address: "", aadhaarLast4: "" });

      // Refresh vehicle & history timeline
      if (updatedResponse) {
        setVehicle(updatedResponse);
        if (updatedResponse.id) {
          const freshHistory = await apiClient.rc.getHistory(updatedResponse.id);
          setHistoryTimeline(freshHistory || []);
        }
      }
      setConfirmOpen(false);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Transfer failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }

  };

  const projectedOwnerCount = (vehicle?.ownersCount ?? 1) + 1;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}> 
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Transfer Ownership</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Vehicle Ownership Transfer</CardTitle>
            <CardDescription>Execute official domain ownership transfer with optimistic concurrency protection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Step 1: Vehicle Lookup */}
            <div className="space-y-2">
              <Label htmlFor="rcNumberInput" className="font-semibold">Step 1: Enter Vehicle RC Number</Label>
              <div className="flex gap-2">
                <Input
                  id="rcNumberInput"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., KA01AB1234"
                />
                <Button variant="outline" onClick={fetchRc} disabled={loading}>Load</Button>
              </div>
            </div>

            {/* Warning Banners */}
            {vehicle && (vehicle.stolen || vehicle.suspicious) && (
              <div className={`p-3 rounded-lg border ${vehicle.stolen ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 ${vehicle.stolen ? "text-destructive" : "text-warning"}`} />
                  <div>
                    <p className="font-semibold text-sm">Security Flag Warning</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.stolen ? "This vehicle is flagged as stolen." : "This vehicle is flagged as suspicious."} Flags will be snapshotted in transfer history.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Show current vehicle and current owner */}
            {vehicle && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <h3 className="font-semibold text-base border-b pb-2">Step 2: Current Vehicle Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Vehicle RC</p>
                    <p className="font-bold text-lg">{vehicle.rcNumber}</p>
                    {vehicle.vehicleInfo?.make && (
                      <p className="text-xs text-muted-foreground">{vehicle.vehicleInfo.make} {vehicle.vehicleInfo.model || ''}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Owner</p>
                    <p className="font-bold text-lg text-primary">Current owner: {vehicle.owner?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Owners Count</p>
                    <p className="font-semibold">Owner #{vehicle.ownersCount ?? 1}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Previous Owners</p>
                    <p className="font-semibold">{vehicle.previousOwners?.join(", ") || "None"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Collect new owner details */}
            {vehicle && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-base">Step 3: Collect New Owner Details</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="newOwnerName">New Owner Name *</Label>
                    <Input id="newOwnerName" value={newOwner.name} onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })} placeholder="e.g. Rohit" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newOwnerEmail">New Owner Email</Label>
                    <Input id="newOwnerEmail" value={newOwner.email} onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newOwnerPhone">New Owner Phone</Label>
                    <Input id="newOwnerPhone" value={newOwner.phone} onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })} placeholder="10-digit phone" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="newOwnerAddress">New Owner Address</Label>
                    <Input id="newOwnerAddress" value={newOwner.address} onChange={(e) => setNewOwner({ ...newOwner, address: e.target.value })} placeholder="Address" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="newOwnerAadhaar">New Owner Aadhaar Last 4</Label>
                    <Input id="newOwnerAadhaar" value={newOwner.aadhaarLast4} onChange={(e) => setNewOwner({ ...newOwner, aadhaarLast4: e.target.value })} placeholder="1234" />
                  </div>
                </div>

                {formErrors.length > 0 && (
                  <div className="space-y-1">
                    {formErrors.map((e, i) => (
                      <p key={i} className="text-xs text-destructive">• {e}</p>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button disabled={loading || !newOwner.name.trim()} onClick={handleInitiateTransfer}>
                    <Replace className="h-4 w-4 mr-2" /> Review Transfer
                  </Button>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {transferSuccessMsg && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Transfer Successful!</p>
                  <p className="text-sm text-green-600 dark:text-green-300">{transferSuccessMsg}</p>
                </div>
              </div>
            )}

            {/* Step 4 & 5: Confirmation Modal */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Ownership Transfer</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm text-foreground pt-2">
                      <div className="p-3 bg-muted rounded-md space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Current owner:</p>
                          <p className="font-bold text-base">{vehicle?.owner?.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">New owner:</p>
                          <p className="font-bold text-base text-primary">{newOwner.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Vehicle:</p>
                          <p className="font-mono font-bold">{vehicle?.rcNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">After transfer:</p>
                          <p className="font-bold">Owner #{projectedOwnerCount}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Are you sure you want to transfer ownership of vehicle {vehicle?.rcNumber}? This operation cannot be undone automatically.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={loading} onClick={executeTransfer}>Confirm Transfer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Refreshed Ownership Timeline */}
            {historyTimeline.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold text-base">Ownership History Timeline</h3>
                <div className="space-y-2">
                  {historyTimeline.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-3 border rounded-md text-xs flex justify-between items-center bg-card">
                      <div>
                        <span className="font-semibold text-muted-foreground">{item.previousOwnerName || "Initial"}</span>
                        <span className="mx-2">➔</span>
                        <span className="font-bold text-primary">{item.newOwnerName}</span>
                      </div>
                      <div className="text-right text-muted-foreground">
                        <p>{item.transferredAt ? new Date(item.transferredAt).toLocaleString() : ''}</p>
                        {(item.stolenAtTransfer || item.suspiciousAtTransfer) && (
                          <span className="text-destructive font-semibold">
                            {item.stolenAtTransfer ? "[Stolen] " : ""}{item.suspiciousAtTransfer ? "[Suspicious]" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TransferOwnership;
