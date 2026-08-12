import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { auth } from "@/lib/auth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated()) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      toast.error("Please enter Admin Key");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.auth.adminLogin(adminKey.trim());
      if (res && res.token) {
        auth.setToken(res.token);
        toast.success("Admin authentication successful");
        navigate("/admin/dashboard");
      } else {
        toast.error("Invalid Admin Key");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid Admin Key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col justify-between p-4">
      <header className="container mx-auto py-4 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Role Selection
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">Drive Verify</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-elevated border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-primary p-3 rounded-full text-primary-foreground">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access Login</CardTitle>
            <CardDescription>
              Enter the configured system Admin Secret Key to access management capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-key" className="flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Admin Secret Key
                </Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Enter Admin Key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p>
                  Key is validated by the backend. Raw secrets are never stored in localStorage.
                </p>
              </div>

              <Button type="submit" className="w-full text-base py-5" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Sign In to Admin Portal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Drive Verify Admin Access Control.</p>
      </footer>
    </div>
  );
};

export default AdminLogin;
