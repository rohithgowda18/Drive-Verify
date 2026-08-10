import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Search, ArrowRight, ShieldCheck, FileText, Scale, History, UserCheck, AlertTriangle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-xl font-bold tracking-tight">Drive Verify</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              Admin Portal
            </Button>
            <Button size="sm" onClick={() => navigate("/verify")}>
              Verify a Vehicle <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block">
            <div className="bg-primary/10 border border-primary/20 rounded-full px-4 py-1 text-sm text-primary font-semibold mb-6 flex items-center gap-1.5 justify-center">
              <ShieldCheck className="h-4 w-4" /> Vehicle Transaction Trust & Risk Platform
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Before You Buy a Used Vehicle,<br />
            <span className="text-primary bg-clip-text">Know What the Evidence Says.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Drive Verify compares vehicle information, ownership history, seller claims, and available evidence to identify inconsistencies before you make a purchase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" className="text-lg px-8 shadow-lg" onClick={() => navigate("/verify")}>
              <Shield className="mr-2 h-5 w-5" />
              Verify a Vehicle (Buyer)
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/verify")}>
              <UserCheck className="mr-2 h-5 w-5" />
              I'm Selling a Vehicle
            </Button>
          </div>
        </div>
      </section>

      {/* Why Verify Section */}
      <section className="container mx-auto px-4 py-16 border-t bg-muted/20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Why Verify Before You Buy?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Evaluate transaction risk across six core evidence layers before money changes hands.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CapabilityCard
              icon={<Search className="h-6 w-6 text-primary" />}
              title="1. Vehicle Identity"
              desc="Cross-examine registration numbers, make, model, chassis, and engine specs for physical tampering or record mismatches."
            />
            <CapabilityCard
              icon={<History className="h-6 w-6 text-primary" />}
              title="2. Ownership History"
              desc="Verify exact owner counts and transfer dates to uncover hidden multi-owner flips or claim discrepancies."
            />
            <CapabilityCard
              icon={<UserCheck className="h-6 w-6 text-primary" />}
              title="3. Seller Claims"
              desc="Compare seller-declared mileage and claims against registered system records and historical checkpoints."
            />
            <CapabilityCard
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="4. Document Checks"
              desc="Check validity status for critical compliance documents including active insurance and PUC certificates."
            />
            <CapabilityCard
              icon={<Scale className="h-6 w-6 text-primary" />}
              title="5. Risk Assessment"
              desc="Get a transparent, explainable 0–100 Trust Score highlighting exact positive factors and risk signals."
            />
            <CapabilityCard
              icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
              title="6. Buyer Action Checklist"
              desc="Receive a tailored physical inspection checklist and negotiation points before finalizing payment."
            />
          </div>
        </div>
      </section>

      {/* Trust & Transparency Note */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Evidence-Based Risk Intelligence</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Drive Verify does not rely on vague black-box AI scores. Every score point is fully explainable with clear indicators for clean stolen status, active insurance, owner count alignment, or detected discrepancies.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Deterministic scoring rules</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> PII-masked public records</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Shareable Trust Reports</li>
            </ul>
          </div>
          <div className="bg-card p-6 rounded-2xl border flex flex-col justify-center space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-sm">Demo & Verification Notice</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Drive Verify evaluates vehicle records stored in its secure verification database. Sample data is clearly demarcated for demonstration purposes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/30 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Drive Verify — Vehicle Transaction Trust & Risk Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

/* Capability Card Sub-component */
const CapabilityCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => {
  return (
    <div className="bg-card p-6 rounded-xl border flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="mb-4 bg-primary/5 p-3 rounded-lg w-fit">{icon}</div>
        <h3 className="text-base font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

export default Index;
