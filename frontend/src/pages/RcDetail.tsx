import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Car, User, FileText, ShieldAlert, Award, Info, Key } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const RcDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [rc, setRc] = useState<any>(null);

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await apiClient.rc.getById(id);
      setRc(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load RC");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const getStatusBadge = (stolen?: boolean, suspicious?: boolean) => {
    if (stolen) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200">
          🚨 Stolen
        </span>
      );
    }
    if (suspicious) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200">
          ⚠️ Suspicious
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200">
        🟢 Clean
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">RC Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !rc ? (
          <Card className="shadow-elevated p-8 text-center space-y-4">
            <p className="text-muted-foreground text-lg">No registration details found.</p>
            <Button variant="outline" size="sm" onClick={load}>Retry</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Top overview card */}
            <Card className="shadow-elevated border-l-4 border-l-primary">
              <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{rc.rcNumber}</h2>
                  <p className="text-muted-foreground">
                    {rc.vehicleInfo?.make} {rc.vehicleInfo?.model} • {rc.owner?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vehicle Status</span>
                    {getStatusBadge(rc.stolen, rc.suspicious)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Vehicle Information */}
              <Card className="shadow-card border">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">RC Number</span><span className="font-semibold">{rc.rcNumber || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Make</span><span className="font-medium">{rc.vehicleInfo?.make || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Model</span><span className="font-medium">{rc.vehicleInfo?.model || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Fuel Type</span><span className="font-medium">{rc.vehicleInfo?.fuelType || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Color</span><span className="font-medium">{rc.vehicleInfo?.color || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Chassis Number</span><span className="font-medium font-mono">{rc.chassisNumber || rc.vehicleInfo?.chassisNumber || "—"}</span></div>
                  <div className="flex justify-between pb-1"><span className="text-muted-foreground">Engine Number</span><span className="font-medium font-mono">{rc.engineNumber || rc.vehicleInfo?.engineNumber || "—"}</span></div>
                </CardContent>
              </Card>

              {/* Owner Information */}
              <Card className="shadow-card border">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Owner Name</span><span className="font-semibold text-foreground">{rc.owner?.name || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Phone</span><span className="font-medium">{rc.owner?.phone || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Email</span><span className="font-medium">{rc.owner?.email || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[200px] truncate" title={rc.owner?.address}>{rc.owner?.address || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Aadhaar (Last 4)</span><span className="font-medium font-mono">•••• •••• {rc.owner?.aadhaarLast4 || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Owners Count</span><span className="font-medium">{rc.ownersCount || (1 + (rc.previousOwners?.length || 0))}</span></div>
                  <div className="flex justify-between pb-1"><span className="text-muted-foreground">Previous Owners</span><span className="font-medium text-right max-w-[200px] truncate" title={Array.isArray(rc.previousOwners) ? rc.previousOwners.join(", ") : ""}>{Array.isArray(rc.previousOwners) && rc.previousOwners.length > 0 ? rc.previousOwners.join(", ") : "None"}</span></div>
                </CardContent>
              </Card>

              {/* Registration Details */}
              <Card className="shadow-card border">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Registration State</span><span className="font-medium">{rc.registrationState || "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Registration Date</span><span className="font-medium">{rc.registrationInfo?.registrationDate ? new Date(rc.registrationInfo.registrationDate).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Valid Till</span><span className="font-medium">{rc.registrationInfo?.validTill ? new Date(rc.registrationInfo.validTill).toLocaleDateString() : "—"}</span></div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Active Status</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${rc.registrationInfo?.active ? "bg-green-100 text-green-800 dark:bg-green-900/30" : "bg-red-100 text-red-800 dark:bg-red-900/30"}`}>
                      {rc.registrationInfo?.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance & PUC Info */}
              <div className="space-y-6">
                {/* Insurance Card */}
                <Card className="shadow-card border">
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Insurance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Provider</span><span className="font-medium">{rc.insurance?.provider || "—"}</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Policy Number</span><span className="font-medium font-mono">{rc.insurance?.policyNumber || "—"}</span></div>
                    <div className="flex justify-between pb-1"><span className="text-muted-foreground">Valid Till</span><span className="font-medium">{rc.insurance?.validTill ? new Date(rc.insurance.validTill).toLocaleDateString() : "—"}</span></div>
                  </CardContent>
                </Card>

                {/* PUC Card */}
                <Card className="shadow-card border">
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">PUC Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2 text-sm">
                    <div className="flex justify-between border-b pb-2"><span className="text-muted-foreground">Certificate Number</span><span className="font-medium font-mono">{rc.puc?.certificateNumber || "—"}</span></div>
                    <div className="flex justify-between pb-1"><span className="text-muted-foreground">Valid Till</span><span className="font-medium">{rc.puc?.validTill ? new Date(rc.puc.validTill).toLocaleDateString() : "—"}</span></div>
                  </CardContent>
                </Card>
              </div>

              {/* Metadata Card */}
              <Card className="shadow-card border md:col-span-2">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Metadata Information</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 pt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">System ID</span>
                    <span className="font-mono text-xs">{rc.id || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">QR Code ID</span>
                    <span className="font-mono text-xs">{rc.qrCodeId || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Record Created</span>
                    <span>{rc.createdAt ? new Date(rc.createdAt).toLocaleString() : "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Last Updated</span>
                    <span>{rc.updatedAt ? new Date(rc.updatedAt).toLocaleString() : "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Collapsible raw JSON Viewer */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="developer-json" className="border rounded-lg bg-card px-4">
                <AccordionTrigger className="hover:no-underline font-semibold text-sm">
                  Developer JSON
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <pre className="p-4 bg-muted rounded overflow-auto text-xs font-mono max-h-[300px]">
                    {JSON.stringify(rc, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </main>
    </div>
  );
};

export default RcDetail;