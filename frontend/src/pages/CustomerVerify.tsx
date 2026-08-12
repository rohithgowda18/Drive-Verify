import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

const CustomerVerify = () => {
  const navigate = useNavigate();
  const [rcNumber, setRcNumber] = useState("");
  const [claimedOwners, setClaimedOwners] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcNumber.trim()) {
      toast.error("Please enter a valid RC Registration Number");
      return;
    }

    setLoading(true);
    try {
      const cleanRc = rcNumber.trim().toUpperCase();
      const rc = await apiClient.rc.search(cleanRc);
      if (!rc || !rc.id) {
        toast.error("Vehicle RC not found");
        return;
      }
      navigate(`/customer/vehicle/${rc.id}`, { state: { claimedOwners } });
    } catch (error: any) {
      toast.error(error.message || "Vehicle RC not found in system database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-between">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Role Selection
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Drive Verify</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border">
            Customer Portal
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center max-w-xl">
        <Card className="w-full shadow-elevated border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Search className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verify a Vehicle</CardTitle>
            <CardDescription>
              Enter vehicle registration details to inspect trust scores and risk flags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rc-number">RC Registration Number *</Label>
                <Input
                  id="rc-number"
                  placeholder="e.g. KA01AB1234"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimed-owners">Seller Claimed Owners (Optional)</Label>
                <Input
                  id="claimed-owners"
                  type="number"
                  placeholder="e.g. 1"
                  value={claimedOwners}
                  onChange={(e) => setClaimedOwners(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p>
                  No account required. Customer queries access public verification reports without database mutations.
                </p>
              </div>

              <Button type="submit" className="w-full text-base py-5" disabled={loading}>
                {loading ? "Searching Database..." : "Verify Vehicle"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-6 bg-card/30 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Drive Verify — Public Customer Portal.</p>
      </footer>
    </div>
  );
};

export default CustomerVerify;
