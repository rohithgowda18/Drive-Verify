import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Trash2, RefreshCw, Eye, Replace, History, MoreVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { vehicleCreateSchema } from "@/lib/validation";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { auth } from "@/lib/auth";

const Vehicles = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Admin authentication required");
      navigate("/admin/login");
    }
  }, [navigate]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [filterState, setFilterState] = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStolen, setFilterStolen] = useState<boolean | null>(null);
  const [filterSuspicious, setFilterSuspicious] = useState<boolean | null>(null);
  interface Rc extends NewRc { id?: string; createdAt?: string; updatedAt?: string }
  const [items, setItems] = useState<Rc[]>([]);
  const adminKey = localStorage.getItem("adminKey") || "";
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const getStatusBadge = (stolen?: boolean, suspicious?: boolean) => {
    if (stolen) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          🚨 Stolen
        </span>
      );
    }
    if (suspicious) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          ⚠️ Suspicious
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        🟢 Clean
      </span>
    );
  };

  const getInsuranceBadge = (insurance?: any) => {
    if (!insurance || !insurance.validTill) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          No Insurance
        </span>
      );
    }
    const isPast = new Date(insurance.validTill).getTime() < Date.now();
    if (isPast) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Expired ({insurance.provider || "Unknown"})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        Active ({insurance.provider || "Unknown"})
      </span>
    );
  };
  type Owner = { name: string; email?: string; phone?: string; address?: string; aadhaarLast4?: string };
  type VehicleInfo = { make: string; model: string; manufactureYear: string | number; color?: string; fuelType?: string; type?: string; variant?: string };
  type Insurance = { provider?: string; policyNumber?: string; validTill?: string };
  type Puc = { certificateNumber?: string; validTill?: string };
  type RegistrationInfo = { active: boolean; registrationDate?: string; validTill?: string };
  type NewRc = {
    rcNumber: string;
    owner: Owner;
    ownersCount?: number;
    previousOwners: string[];
    vehicleInfo: VehicleInfo;
    registrationState: string;
    chassisNumber: string;
    engineNumber: string;
    insurance: Insurance;
    puc: Puc;
    registrationInfo: RegistrationInfo;
    stolen: boolean;
    suspicious: boolean;
  };

  const [showCreate, setShowCreate] = useState(false);
  const [newRc, setNewRc] = useState<NewRc>({
    rcNumber: "",
    owner: { name: "", email: "", phone: "", address: "", aadhaarLast4: "" },
    ownersCount: 1,
    previousOwners: [],
    vehicleInfo: { make: "", model: "", manufactureYear: "", color: "", fuelType: "", type: "", variant: "" },
    registrationState: "",
    chassisNumber: "",
    engineNumber: "",
    insurance: { provider: "", policyNumber: "", validTill: "" },
    puc: { certificateNumber: "", validTill: "" },
    registrationInfo: { active: true, registrationDate: "", validTill: "" },
    stolen: false,
    suspicious: false,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const loadPage = async (targetPage = page) => {
    try {
      setLoading(true);
      const data = await apiClient.rc.getPage({
        page: targetPage,
        size,
        registrationState: filterState || undefined,
        make: filterMake || undefined,
        ownerName: filterOwner || undefined,
        stolen: filterStolen === null ? undefined : filterStolen,
        suspicious: filterSuspicious === null ? undefined : filterSuspicious,
      });
      const itemsData = Array.isArray(data.items) ? data.items : [];
      setItems(itemsData);
      setPage(data.page ?? targetPage);
      setTotalPages(data.totalPages ?? 0);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to fetch vehicles";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      setLoading(true);
      await apiClient.rc.remove(id);
      toast.success("Vehicle deleted");
      setItems(prev => prev.filter(v => v.id !== id));
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Delete failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Please start an Admin Session first.");
      navigate("/auth");
      return;
    }
    loadPage(0);
  }, [filterState, filterMake, filterOwner, filterStolen, filterSuspicious, navigate]); // loadPage stable enough; suppress lint via comment

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Vehicle Database</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Vehicle Management</CardTitle>
            <CardDescription>
              Manage and view all registered vehicles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => loadPage(0)} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate("/admin/add-vehicle")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Vehicle
              </Button>
            </div>

            <div className="mb-4 grid md:grid-cols-3 gap-3">
              <Input placeholder="Filter State" value={filterState} onChange={(e) => setFilterState(e.target.value)} />
              <Input placeholder="Filter Make" value={filterMake} onChange={(e) => setFilterMake(e.target.value)} />
              <Input placeholder="Filter Owner" value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} />
              <div className="flex items-center gap-2 text-sm">
                <label>Stolen</label>
                <select className="border rounded px-2 py-1 bg-background" value={filterStolen === null ? "" : filterStolen ? "true" : "false"} onChange={(e) => {
                  const v = e.target.value; setFilterStolen(v === "" ? null : v === "true");
                }}>
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label>Suspicious</label>
                <select className="border rounded px-2 py-1 bg-background" value={filterSuspicious === null ? "" : filterSuspicious ? "true" : "false"} onChange={(e) => {
                  const v = e.target.value; setFilterSuspicious(v === "" ? null : v === "true");
                }}>
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground">No vehicles found.</p>
            ) : (
              <div className="grid gap-4">
                {items.map((v) => (
                  <Card key={v.id} className="border">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-bold">{v.rcNumber}</CardTitle>
                            {getStatusBadge(v.stolen, v.suspicious)}
                            {getInsuranceBadge(v.insurance)}
                          </div>
                          <CardDescription className="text-sm">
                            {v.vehicleInfo?.make} {v.vehicleInfo?.model} • Owner: <span className="font-medium text-foreground">{v.owner?.name}</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => v?.id && navigate(`/rc/${v.id}`)}
                            disabled={!v?.id}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => v?.id && navigate(`/rc/${v.id}/history`)}
                            disabled={!v?.id}
                          >
                            <History className="h-4 w-4 mr-1" /> History
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => v?.rcNumber && navigate(`/transfer?rc=${encodeURIComponent(v.rcNumber)}`)}
                                disabled={!v?.rcNumber}
                              >
                                <Replace className="h-4 w-4 mr-2" /> Transfer Ownership
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (v?.id) {
                                    setVehicleToDelete(v.id);
                                    setDeleteConfirmOpen(true);
                                  }
                                }}
                                disabled={!v?.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Vehicle
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                Generate Report (Coming Soon)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <div>Owners Count: {v.ownersCount || (1 + (v.previousOwners?.length || 0))}</div>
                          <div>Previous Owners: {Array.isArray(v.previousOwners) && v.previousOwners.length > 0 ? v.previousOwners.join(", ") : "None"}</div>
                        </div>
                        <div>
                          <div>Chassis: {v.chassisNumber || v.vehicleInfo?.chassisNumber || "—"}</div>
                          <div>Engine: {v.engineNumber || v.vehicleInfo?.engineNumber || "—"}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={loading || page <= 0} onClick={() => loadPage(page - 1)}>Prev</Button>
              <p className="text-xs text-muted-foreground">Page {page + 1} / {totalPages || 1}</p>
              <Button variant="outline" size="sm" disabled={loading || page + 1 >= totalPages} onClick={() => loadPage(page + 1)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle registration certificate (RC) from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteConfirmOpen(false);
              setVehicleToDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (vehicleToDelete) {
                  await removeItem(vehicleToDelete);
                }
                setDeleteConfirmOpen(false);
                setVehicleToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;