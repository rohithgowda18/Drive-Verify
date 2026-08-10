import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ArrowLeft, Search, CheckCircle2, AlertTriangle, FileText, Check, X, Scale, History } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface RiskAssessment {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  mismatches: string[];
  riskReasons: string[];
  positiveFactors: string[];
  inspectionChecklist: string[];
  negotiationPoints: string[];
  generatedAt: string;
}

interface VerificationData {
  rc: any;
  assessment: RiskAssessment;
}

const Verify = () => {
  const navigate = useNavigate();
  const [rcNumber, setRcNumber] = useState("");
  const [claimedOwners, setClaimedOwners] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationData | null>(null);

  const handleEvaluate = async () => {
    if (!rcNumber.trim()) {
      toast.error("Please enter an RC number");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 1. Initiate Verification Request with Seller Claims
      const reqPayload = {
        rcNumber: rcNumber.trim().toUpperCase(),
        requestType: "BUYER",
        sellerClaim: {
          claimedOwnerCount: claimedOwners ? parseInt(claimedOwners) : undefined,
        },
      };

      const assessment = await apiClient.verifications.create(reqPayload);
      const rc = await apiClient.rc.search(rcNumber.trim());

      setResult({
        rc,
        assessment,
      });

      toast.success("Risk Assessment generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to process verification");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number, level: string) => {
    const isLow = level === "LOW";
    const isMed = level === "MEDIUM";
    const colorClass = isLow ? "text-emerald-500 stroke-emerald-500" : isMed ? "text-amber-500 stroke-amber-500" : "text-rose-500 stroke-rose-500";
    const bgClass = isLow ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700 dark:text-emerald-300" : isMed ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-300" : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-700 dark:text-rose-300";

    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex items-center gap-4">
        {/* Radial Score Gauge */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" className="stroke-muted" strokeWidth="6" fill="transparent" />
            <circle
              cx="40"
              cy="40"
              r="36"
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold tracking-tight">{score}</span>
            <span className="text-[9px] uppercase font-bold text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Text Badge */}
        <div className={`px-4 py-2 rounded-xl border font-bold text-sm flex items-center gap-2 shadow-sm ${bgClass}`}>
          {isLow ? "🟢 LOW RISK" : isMed ? "🟡 REVIEW REQUIRED" : "🔴 HIGH RISK"}
        </div>
      </div>
    );
  };

  const maskPII = (val?: string) => {
    if (!val) return "N/A";
    if (val.length <= 4) return val;
    return "******" + val.slice(-4);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-12">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Drive Verify</h1>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border">
            Vehicle Transaction Trust Platform
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card className="shadow-elevated border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Evaluate Vehicle Risk & Seller Claims
            </CardTitle>
            <CardDescription>
              Enter vehicle RC number and optional seller statements to detect mismatches against official records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rc-number">RC Registration Number *</Label>
                <Input
                  id="rc-number"
                  placeholder="e.g. KA01AB1234"
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleEvaluate()}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimed-owners">Seller Claimed Owners</Label>
                <Input
                  id="claimed-owners"
                  type="number"
                  placeholder="e.g. 1"
                  value={claimedOwners}
                  onChange={(e) => setClaimedOwners(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button onClick={handleEvaluate} disabled={loading} className="w-full text-base py-5 shadow-md">
              {loading ? "Analyzing Evidence & Claims..." : "Run Trust & Risk Assessment"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Risk Assessment Summary Header */}
            <Card className="border-2 shadow-card overflow-hidden">
              <div className="bg-card border-b p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Drive Verify Risk Assessment</h2>
                  <p className="text-xs text-muted-foreground">Generated at {new Date(result.assessment.generatedAt).toLocaleString()}</p>
                </div>
                <div>{getScoreBadge(result.assessment.trustScore, result.assessment.riskLevel)}</div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Vehicle Identity Matches */}
                <div>
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Vehicle Identity Check</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 rounded-lg border bg-card">
                      <span className="text-xs text-muted-foreground">Registration</span>
                      <p className="font-bold flex items-center gap-1.5 mt-1">
                        <Check className="h-4 w-4 text-emerald-500" /> {result.rc?.rcNumber}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <span className="text-xs text-muted-foreground">Make & Model</span>
                      <p className="font-bold flex items-center gap-1.5 mt-1">
                        <Check className="h-4 w-4 text-emerald-500" /> {result.rc?.vehicleInfo?.make} {result.rc?.vehicleInfo?.model}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <span className="text-xs text-muted-foreground">Chassis (Masked)</span>
                      <p className="font-mono font-bold text-xs mt-1">{maskPII(result.rc?.chassisNumber)}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                      <span className="text-xs text-muted-foreground">Engine (Masked)</span>
                      <p className="font-mono font-bold text-xs mt-1">{maskPII(result.rc?.engineNumber)}</p>
                    </div>
                  </div>
                </div>

                {/* Evidence Mismatches */}
                {result.assessment.mismatches && result.assessment.mismatches.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase text-destructive tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Detected Mismatches & Risk Signals
                    </h3>
                    <div className="space-y-2">
                      {result.assessment.mismatches.map((mismatch, idx) => (
                        <Alert key={idx} className="border-destructive/50 bg-destructive/10 text-destructive text-sm font-medium">
                          <AlertDescription>{mismatch}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Positive Verified Factors */}
                {result.assessment.positiveFactors && result.assessment.positiveFactors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Verified Evidence Factors
                    </h3>
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      {result.assessment.positiveFactors.map((factor, idx) => (
                        <div key={idx} className="p-2.5 rounded border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-medium">
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Before You Pay Checklist */}
                {result.assessment.inspectionChecklist && result.assessment.inspectionChecklist.length > 0 && (
                  <div className="p-4 rounded-xl border bg-amber-500/5 space-y-3">
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> "Before You Pay" Recommended Physical Inspection Checklist
                    </h3>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {result.assessment.inspectionChecklist.map((item, idx) => (
                        <li key={idx} className="font-medium text-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Negotiation Points */}
                {result.assessment.negotiationPoints && result.assessment.negotiationPoints.length > 0 && (
                  <div className="p-4 rounded-xl border bg-blue-500/5 space-y-3">
                    <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Scale className="h-4 w-4" /> Evidence-Based Negotiation Points
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                      {result.assessment.negotiationPoints.map((point, idx) => (
                        <li key={idx} className="text-foreground">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  {result.rc?.id && (
                    <Button variant="outline" className="flex-1" onClick={() => navigate(`/rc/${result.rc.id}/history`)}>
                      <History className="h-4 w-4 mr-2" /> View Ownership Timeline
                    </Button>
                  )}
                  {result.rc?.id && (
                    <Button variant="secondary" className="flex-1" onClick={() => navigate(`/rc/${result.rc.id}`)}>
                      <FileText className="h-4 w-4 mr-2" /> View Detailed Vehicle Record
                    </Button>
                  )}
                </div>

                {/* Disclaimer */}
                <p className="text-[11px] text-muted-foreground italic text-center border-t pt-4">
                  Note: Drive Verify Risk Assessments are generated strictly based on available registry evidence and user-declared claims.
                  This assessment does not replace an official government certification or legal title search.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Verify;