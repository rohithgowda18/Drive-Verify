import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, PlusCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { rcSchema } from "@/lib/validation";

const AddVehicle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Please login with Admin Secret Key first.");
      navigate("/auth");
    }
  }, [navigate]);

  const [rcData, setRcData] = useState({
    rcNumber: "",
    owner: { name: "", email: "", phone: "", address: "", aadhaarLast4: "" },
    vehicleInfo: { make: "", model: "", manufactureYear: "", color: "", fuelType: "PETROL", type: "FOUR_WHEELER", variant: "" },
    registrationState: "",
    registrationInfo: { active: true, registrationDate: "", validTill: "" },
    insurance: { provider: "", policyNumber: "", validTill: "" },
    puc: { certificateNumber: "", validTill: "" },
    chassisNumber: "",
    engineNumber: "",
    stolen: false,
    suspicious: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const yearNum = typeof rcData.vehicleInfo.manufactureYear === "string" 
        ? (rcData.vehicleInfo.manufactureYear.trim() ? parseInt(rcData.vehicleInfo.manufactureYear) : 2024) 
        : rcData.vehicleInfo.manufactureYear;

      const payload = {
        ...rcData,
        rcNumber: rcData.rcNumber.trim().toUpperCase(),
        vehicleInfo: {
          ...rcData.vehicleInfo,
          manufactureYear: yearNum,
        },
      };

      const validation = rcSchema.safeParse(payload);
      if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || "Validation failed";
        toast.error(firstError);
        setLoading(false);
        return;
      }

      await apiClient.rc.create(payload);
      toast.success("Vehicle registered successfully!");
      navigate("/admin/vehicles");
    } catch (err: any) {
      toast.error(err.message || "Failed to register vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Register New Vehicle</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PlusCircle className="h-6 w-6 text-primary" /> Vehicle Registration Form
            </CardTitle>
            <CardDescription>
              Enter complete vehicle specifications and initial owner details to add a record to the system database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primary Identifier */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Primary Identification
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1">RC Registration Number *</label>
                    <Input
                      required
                      placeholder="e.g. KA01AB1234"
                      value={rcData.rcNumber}
                      onChange={(e) => setRcData({ ...rcData, rcNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Chassis Number *</label>
                    <Input
                      required
                      placeholder="Chassis Number"
                      value={rcData.chassisNumber}
                      onChange={(e) => setRcData({ ...rcData, chassisNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Engine Number *</label>
                    <Input
                      required
                      placeholder="Engine Number"
                      value={rcData.engineNumber}
                      onChange={(e) => setRcData({ ...rcData, engineNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Owner Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1">Full Name *</label>
                    <Input
                      required
                      placeholder="Owner Name"
                      value={rcData.owner.name}
                      onChange={(e) => setRcData({ ...rcData, owner: { ...rcData.owner, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Email Address</label>
                    <Input
                      type="email"
                      placeholder="owner@example.com"
                      value={rcData.owner.email}
                      onChange={(e) => setRcData({ ...rcData, owner: { ...rcData.owner, email: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Phone Number</label>
                    <Input
                      placeholder="Phone Number"
                      value={rcData.owner.phone}
                      onChange={(e) => setRcData({ ...rcData, owner: { ...rcData.owner, phone: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Aadhaar Last 4 Digits</label>
                    <Input
                      maxLength={4}
                      placeholder="1234"
                      value={rcData.owner.aadhaarLast4}
                      onChange={(e) => setRcData({ ...rcData, owner: { ...rcData.owner, aadhaarLast4: e.target.value } })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium block mb-1">Full Address</label>
                    <Input
                      placeholder="Residential Address"
                      value={rcData.owner.address}
                      onChange={(e) => setRcData({ ...rcData, owner: { ...rcData.owner, address: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Vehicle Specifications
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1">Make *</label>
                    <Input
                      required
                      placeholder="e.g. Hyundai, Tata"
                      value={rcData.vehicleInfo.make}
                      onChange={(e) => setRcData({ ...rcData, vehicleInfo: { ...rcData.vehicleInfo, make: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Model *</label>
                    <Input
                      required
                      placeholder="e.g. Creta, Nexon"
                      value={rcData.vehicleInfo.model}
                      onChange={(e) => setRcData({ ...rcData, vehicleInfo: { ...rcData.vehicleInfo, model: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Manufacture Year</label>
                    <Input
                      type="number"
                      placeholder="e.g. 2023"
                      value={rcData.vehicleInfo.manufactureYear}
                      onChange={(e) => setRcData({ ...rcData, vehicleInfo: { ...rcData.vehicleInfo, manufactureYear: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Color</label>
                    <Input
                      placeholder="e.g. Black"
                      value={rcData.vehicleInfo.color}
                      onChange={(e) => setRcData({ ...rcData, vehicleInfo: { ...rcData.vehicleInfo, color: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Fuel Type</label>
                    <Input
                      placeholder="PETROL / DIESEL / EV"
                      value={rcData.vehicleInfo.fuelType}
                      onChange={(e) => setRcData({ ...rcData, vehicleInfo: { ...rcData.vehicleInfo, fuelType: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Registration State *</label>
                    <Input
                      required
                      placeholder="e.g. Karnataka"
                      value={rcData.registrationState}
                      onChange={(e) => setRcData({ ...rcData, registrationState: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance & PUC Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">
                  Insurance & Compliance
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1">Insurance Provider</label>
                    <Input
                      placeholder="e.g. ICICI Lombard"
                      value={rcData.insurance.provider}
                      onChange={(e) => setRcData({ ...rcData, insurance: { ...rcData.insurance, provider: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Policy Number</label>
                    <Input
                      placeholder="Policy Number"
                      value={rcData.insurance.policyNumber}
                      onChange={(e) => setRcData({ ...rcData, insurance: { ...rcData.insurance, policyNumber: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">PUC Certificate Number</label>
                    <Input
                      placeholder="PUC Number"
                      value={rcData.puc.certificateNumber}
                      onChange={(e) => setRcData({ ...rcData, puc: { ...rcData.puc, certificateNumber: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">PUC Valid Till</label>
                    <Input
                      type="date"
                      value={rcData.puc.validTill}
                      onChange={(e) => setRcData({ ...rcData, puc: { ...rcData.puc, validTill: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {loading ? "Registering..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddVehicle;
