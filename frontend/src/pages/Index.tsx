import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, AlertTriangle, Search, BarChart3, Users, HelpCircle, ArrowRight, Server, Database, Code, ShieldCheck } from "lucide-react";

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
          <Button onClick={() => navigate("/dashboard")}>
            Get Started <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block">
            <div className="bg-primary/10 border border-primary/20 rounded-full px-4 py-1 text-sm text-primary font-semibold mb-6 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Next-Gen Vehicle Registry
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            Drive Verify &<br />
            <span className="text-primary bg-clip-text">Fraud Detection System</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Instantly verify vehicle Registration Certificates, track chronological ownership transfers, and identify risk metrics seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate("/dashboard")}>
              <Shield className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 border-t bg-muted/20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">System Capabilities</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              Discover the core tools enabling automated checks and administration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Verify RC */}
            <CardLayout
              icon={<Search className="h-6 w-6 text-primary" />}
              title="Verify RC"
              desc="Search any vehicle registration certificate instantly by entering its unique RC number."
              btnText="Search Registry"
              onClick={() => navigate("/verify")}
            />

            {/* Card 2: Ownership Transfer */}
            <CardLayout
              icon={<Users className="h-6 w-6 text-primary" />}
              title="Ownership Transfer"
              desc="Maintain complete, cryptographically mapped logs of vehicle ownership changes."
              btnText="Transfer Ownership"
              onClick={() => navigate("/transfer")}
            />

            {/* Card 3: Fraud Detection */}
            <CardLayout
              icon={<AlertTriangle className="h-6 w-6 text-primary" />}
              title="Fraud Detection"
              desc="Detect suspicious behaviors, stolen flags, and inconsistency markers."
              btnText="Run Audit"
              onClick={() => navigate("/verify")}
            />

            {/* Card 4: Analytics */}
            <CardLayout
              icon={<BarChart3 className="h-6 w-6 text-primary" />}
              title="Analytics"
              desc="Monitor regional trends, monthly registrations, and fraud statistics."
              btnText="View Reports"
              onClick={() => navigate("/analytics")}
            />
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Why Choose RC Verification?</h2>
            <p className="text-muted-foreground text-sm">
              Our application offers secure, low-latency queries backed by solid infrastructure to help departments audit vehicle histories.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Fast Verification under 1 second</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Proactive Fraud Flags (Stolen/Suspicious)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Complete Ownership History Timeline</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Secure Admin Session Protection</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Real-time System Metrics Integration</li>
            </ul>
          </div>
          <div className="bg-muted p-8 rounded-2xl border flex items-center justify-center min-h-[250px]">
            <Shield className="h-32 w-32 text-primary/30" />
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-16 border-t bg-muted/10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Technology Stack</h2>
            <p className="text-muted-foreground text-sm">Built with modern enterprise-grade open source tech.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <TechBadge icon={<Code className="h-5 w-5 text-primary" />} label="React" />
            <TechBadge icon={<Server className="h-5 w-5 text-primary" />} label="Spring Boot" />
            <TechBadge icon={<Database className="h-5 w-5 text-primary" />} label="MongoDB" />
            <TechBadge icon={<Code className="h-5 w-5 text-primary" />} label="Tailwind" />
            <TechBadge icon={<Server className="h-5 w-5 text-primary" />} label="Java 21" />
            <TechBadge icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Prometheus" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card/30 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Drive Verify system. All rights reserved.</p>
      </footer>
    </div>
  );
};

/* Feature card sub-component */
const CardLayout = ({ icon, title, desc, btnText, onClick }: { icon: React.ReactNode; title: string; desc: string; btnText: string; onClick: () => void }) => {
  return (
    <div className="bg-card p-6 rounded-xl border flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="mb-4 bg-primary/5 p-3 rounded-lg w-fit">{icon}</div>
        <h3 className="text-lg font-semibold tracking-tight mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">{desc}</p>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
        {btnText}
      </Button>
    </div>
  );
};

/* Tech badge sub-component */
const TechBadge = ({ icon, label }: { icon: React.ReactNode; label: string }) => {
  return (
    <div className="bg-card border p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors">
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
};

export default Index;
