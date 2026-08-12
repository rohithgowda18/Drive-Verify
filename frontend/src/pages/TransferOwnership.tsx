import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Replace, UserPlus, AlertTriangle } from "lucide-react";
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

const TransferOwnership = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Admin authentication required");
      navigate("/admin/login");
    }
  }, [navigate]);
  const adminKey = localStorage.getItem("adminKey") || "";
  const [rcNumber, setRcNumber] = useState("");
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
  const [previousOwners, setPreviousOwners] = useState<string[]>([]);
  const [ownersCount, setOwnersCount] = useState<number>(1);

  const [newOwner, setNewOwner] = useState<Owner>({ name: "", email: "", phone: "", address: "", aadhaarLast4: "" });
  const [loading, setLoading] = useState(false);
  const [stolen, setStolen] = useState<boolean>(false);
  const [suspicious, setSuspicious] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchRc = useCallback(async () => {
    if (!rcNumber.trim()) { toast.error("Enter RC Number"); return; }
    try {
      setLoading(true);
      const rc = await apiClient.rc.search(rcNumber.trim());
      if (!rc || rc.error) { throw new Error(rc?.error || "RC not found"); }
      setCurrentOwner(rc.owner || null);
      setPreviousOwners(Array.isArray(rc.previousOwners) ? rc.previousOwners : []);
      setOwnersCount(typeof rc.ownersCount === "number" && rc.ownersCount > 0 ? rc.ownersCount : (1 + (rc.previousOwners?.length || 0)));
      setStolen(!!rc.stolen);
      setSuspicious(!!rc.suspicious);
      toast.success("RC loaded");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to load RC";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [rcNumber]);

  // Prefill RC from query param and auto-load + Session check
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Please start an Admin Session first.");
      navigate("/auth");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const rc = params.get("rc");
    if (rc) {
      setRcNumber(rc.toUpperCase());
      // Defer fetch to next tick after state updates
      setTimeout(() => fetchRc(), 0);
    }
  }, [fetchRc, navigate]);

  // Transfer algorithm:
  // 1) Append current owner's name to previousOwners (if present)
  // 2) ownersCount = ownersCount + 1
  // 3) Replace owner with newOwner
  // 4) Persist via PUT /api/rc/{id} (requires admin key)
  const handleTransfer = async () => {
    const input = { rcNumber: rcNumber.trim(), newOwner, adminKey };
    const validation = transferSchema.safeParse(input);
    if (!validation.success) {
      const issues = validation.error.issues.map(i => i.message);
      setFormErrors(issues);
      toast.error(issues[0]);
      return;
    }
    setFormErrors([]);
    try {
      setLoading(true);
      const rc = await apiClient.rc.search(rcNumber.trim());
      if (!rc || rc.error) { throw new Error(rc?.error || "RC not found"); }
      const prev = Array.isArray(rc.previousOwners) ? rc.previousOwners.slice() : [];
      if (rc.owner?.name) prev.push(rc.owner.name);
      const updated = {
        ...rc,
        previousOwners: prev,
        ownersCount: 1 + prev.length,
        owner: {
          name: newOwner.name.trim(),
          email: newOwner.email?.trim() || rc.owner?.email,
          phone: newOwner.phone?.trim() || rc.owner?.phone,
          address: newOwner.address?.trim() || rc.owner?.address,
          aadhaarLast4: newOwner.aadhaarLast4?.trim() || rc.owner?.aadhaarLast4,
        },
        updatedAt: new Date().toISOString(),
      };
      await apiClient.rc.update(rc.id, updated);
      toast.success("Ownership transferred");
      setNewOwner({ name: "", email: "", phone: "", address: "", aadhaarLast4: "" });
      setPreviousOwners(updated.previousOwners);
      setOwnersCount(updated.ownersCount);
      setCurrentOwner(updated.owner);
      setConfirmOpen(false);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Transfer failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Ownership Transfer</CardTitle>
            <CardDescription>Increment owners count and set new owner; admin key required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>RC Number</Label>
                <div className="flex gap-2">
                  <Input value={rcNumber} onChange={(e) => setRcNumber(e.target.value.toUpperCase())} placeholder="e.g., KA06QQ5623" />
                  <Button variant="outline" size="sm" onClick={fetchRc} disabled={loading}>Load</Button>
                </div>
              </div>
            </div>

            {(stolen || suspicious) && (
              <div className={`p-3 rounded-lg border ${stolen ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 ${stolen ? "text-destructive" : "text-warning"}`} />
                  <div>
                    <p className="font-semibold text-sm">Fraud Warning</p>
                    <p className="text-sm text-muted-foreground">
                      {stolen ? "This RC is marked as stolen." : "This RC is marked as suspicious."} Ownership transfer should be reviewed by an admin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentOwner && (
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Owner</p>
                  <p className="font-semibold">{currentOwner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owners Count</p>
                  <p className="font-semibold">{ownersCount}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Previous Owners</p>
                  <p className="font-semibold">{previousOwners.join(", ") || "None"}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>New Owner Name</Label>
                <Input value={newOwner.name} onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>New Owner Email</Label>
                <Input value={newOwner.email} onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>New Owner Phone</Label>
                <Input value={newOwner.phone} onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })} placeholder="10-digit phone" />
              </div>
              <div className="space-y-2">
                <Label>New Owner Address</Label>
                <Input value={newOwner.address} onChange={(e) => setNewOwner({ ...newOwner, address: e.target.value })} placeholder="Address" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>New Owner Aadhaar Last 4</Label>
                <Input value={newOwner.aadhaarLast4} onChange={(e) => setNewOwner({ ...newOwner, aadhaarLast4: e.target.value })} placeholder="1234" />
              </div>
            </div>

            {formErrors.length > 0 && (
              <div className="space-y-1">
                {formErrors.slice(0,5).map((e,i) => (
                  <p key={i} className="text-xs text-destructive">• {e}</p>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                disabled={loading}
                onClick={() => {
                  if (stolen || suspicious) {
                    // Validate basic fields before opening dialog
                    const basic = transferSchema.shape.rcNumber.safeParse(rcNumber.trim());
                    if (!basic.success) { toast.error("Enter valid RC number first"); return; }
                    setConfirmOpen(true);
                  } else {
                    handleTransfer();
                  }
                }}
              >
                <Replace className="h-4 w-4 mr-2" /> Transfer Ownership
              </Button>
            </div>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Fraud Risk Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    This RC is {stolen ? "marked as stolen" : ""}{stolen && suspicious ? " and " : ""}{suspicious ? "marked as suspicious" : ""}. Transferring ownership should be reviewed. Proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={loading} onClick={handleTransfer}>Proceed</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TransferOwnership;
