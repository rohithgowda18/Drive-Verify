import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, UserCheck, ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-between">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary animate-pulse" />
            <span className="text-xl font-bold tracking-tight">Drive Verify</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border">
            Vehicle Transaction Trust Platform
          </span>
        </div>
      </header>

      {/* Main Entry Role Selection */}
      <main className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center max-w-4xl space-y-8 text-center">
        <div className="space-y-3">
          <div className="bg-primary/10 border border-primary/20 rounded-full px-4 py-1 text-sm text-primary font-semibold inline-flex items-center gap-1.5 justify-center">
            <ShieldCheck className="h-4 w-4" /> Verify Vehicles Before You Buy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            How would you like to continue?
          </h1>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Select your role to access public vehicle verification reports or system administration capabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
          {/* Customer Card */}
          <Card className="hover:shadow-elevated transition-all border-primary/20 flex flex-col justify-between group cursor-pointer" onClick={() => navigate("/customer")}>
            <CardHeader className="space-y-3">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Customer</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Verify a vehicle's registration status, owner count, and risk factors.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground">
                Continue as Customer <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card className="hover:shadow-elevated transition-all border-muted flex flex-col justify-between group cursor-pointer" onClick={() => navigate("/admin/login")}>
            <CardHeader className="space-y-3">
              <div className="bg-muted w-12 h-12 rounded-xl flex items-center justify-center text-foreground group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Admin</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Manage vehicle records, ownership transfers, and system analytics.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full justify-between group-hover:border-primary">
                Admin Access <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-card/30 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Drive Verify — Vehicle Transaction Trust Platform.</p>
      </footer>
    </div>
  );
};

export default Home;
