import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ArrowLeft, Search, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface VehicleData {
  id: string;
  rcNumber: string;
  ownerName: string;
  chassisNumber: string;
  engineNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number | string;
  registrationDate: string | null;
  registeredState: string;
  status: string; // derived from registrationInfo.active
  insuranceValidUntil: string | null;
  pucValidUntil: string | null;
}

interface FraudCheck {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

const Verify = () => {
  const navigate = useNavigate();
  const [rcNumber, setRcNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [fraudChecks, setFraudChecks] = useState<FraudCheck[]>([]);
  const [fraudScore, setFraudScore] = useState(0);

  useEffect(() => {
    // Auth check removed: no /auth route or backend auth in this project
  }, [navigate]);

  const handleVerify = async () => {
    if (!rcNumber.trim()) {
      toast.error("Please enter an RC number");
      return;
    }

    setLoading(true);
    setVehicleData(null);
    setFraudChecks([]);

    try {
      const rc = await apiClient.rc.search(rcNumber);

      if (!rc) {
        toast.error("Vehicle Registration Certificate (RC) not found");
        setLoading(false);
        return;
      }

      if ((rc as any)?.error) {
        toast.error((rc as any).error);
        setLoading(false);
        return;
      }

      const mapped: VehicleData = {
        id: rc.id,
        rcNumber: rc.rcNumber,
        ownerName: rc.owner?.name || "N/A",
        chassisNumber: rc.chassisNumber || rc.vehicleInfo?.chassisNumber || "N/A",
        engineNumber: rc.engineNumber || rc.vehicleInfo?.engineNumber || "N/A",
        vehicleMake: rc.vehicleInfo?.make || "N/A",
        vehicleModel: rc.vehicleInfo?.model || "N/A",
        vehicleYear: rc.vehicleInfo?.manufactureYear ?? "N/A",
        registrationDate: rc.registrationInfo?.registrationDate || null,
        registeredState: rc.registrationState || rc.vehicleInfo?.registrationState || "N/A",
        status: rc.registrationInfo?.active ? "active" : "inactive",
        insuranceValidUntil: rc.insurance?.validTill || null,
        pucValidUntil: rc.puc?.validTill || null,
      };

      setVehicleData(mapped);

      // Fraud logic: treat stolen or suspicious as fraud indicators
      const isStolen = !!rc.stolen;
      const isSuspicious = !!rc.suspicious;
      const checks: FraudCheck[] = [];
      if (isStolen) {
        checks.push({ type: "Stolen Vehicle", message: "This RC is marked as stolen.", severity: "high" });
      }
      if (isSuspicious) {
        checks.push({ type: "Suspicious Activity", message: "This RC has suspicious flags.", severity: isStolen ? "high" : "medium" });
      }
      setFraudChecks(checks);
      setFraudScore(checks.length ? (isStolen ? 1 : 0.6) : 0);

      toast.success("Verification complete");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify RC");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-xl font-bold">Drive Verify</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-elevated mb-6">
          <CardHeader>
            <CardTitle>Verify Registration Certificate</CardTitle>
            <CardDescription>
              Enter the RC number to verify vehicle registration and check for fraud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rc-number">RC Number</Label>
              <div className="flex gap-2">
                <Input
                  id="rc-number"
                  placeholder="e.g., MH12AB1234"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  disabled={loading}
                />
                <Button onClick={handleVerify} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {vehicleData && (
          <>
            {/* Fraud Score Alert */}
            {fraudScore > 0 && (
              <Alert className={`mb-6 ${fraudScore > 0.5 ? "border-destructive bg-destructive/10" : "border-warning bg-warning/10"}`}>
                <AlertTriangle className={`h-4 w-4 ${fraudScore > 0.5 ? "text-destructive" : "text-warning"}`} />
                <AlertDescription className="ml-2">
                  <span className="font-semibold">
                    Fraud Score: {(fraudScore * 100).toFixed(0)}%
                  </span>
                  {" - "}
                  {fraudScore > 0.5 ? "High risk detected" : "Moderate concerns found"}
                </AlertDescription>
              </Alert>
            )}

            {fraudScore === 0 && (
              <Alert className="mb-6 border-success bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="ml-2">
                  <span className="font-semibold">Verified</span> - No fraud indicators detected
                </AlertDescription>
              </Alert>
            )}

            {/* Vehicle Details */}
            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Vehicle Details
                  <Badge variant={vehicleData.status === "active" ? "default" : "destructive"}>
                    {vehicleData.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">RC Number</p>
                  <p className="font-semibold">{vehicleData.rcNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner Name</p>
                  <p className="font-semibold">{vehicleData.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-semibold">
                    {vehicleData.vehicleMake} {vehicleData.vehicleModel} ({vehicleData.vehicleYear})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registered State</p>
                  <p className="font-semibold">{vehicleData.registeredState}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chassis Number</p>
                  <p className="font-mono text-sm">{vehicleData.chassisNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Engine Number</p>
                  <p className="font-mono text-sm">{vehicleData.engineNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Insurance Valid Until</p>
                  <p className="font-semibold">
                    {vehicleData.insuranceValidUntil || "Not available"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PUC Valid Until</p>
                  <p className="font-semibold">
                    {vehicleData.pucValidUntil || "Not available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Checks */}
            {fraudChecks.length > 0 && (
              <Card className="shadow-card border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Fraud Indicators Detected
                  </CardTitle>
                  <CardDescription>
                    The following issues were found during verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fraudChecks.map((check, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        check.severity === "high"
                          ? "bg-destructive/10 border-destructive"
                          : check.severity === "medium"
                          ? "bg-warning/10 border-warning"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 ${
                            check.severity === "high"
                              ? "text-destructive"
                              : check.severity === "medium"
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-sm">{check.type}</p>
                          <p className="text-sm text-muted-foreground">{check.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Verify;