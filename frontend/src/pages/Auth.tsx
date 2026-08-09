import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("adminKey");
    if (key) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      toast.error("Please enter a valid Admin Key");
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem("adminKey", adminKey.trim());
      toast.success("Admin Session Active!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize Admin Session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Session Login</CardTitle>
          <CardDescription>
            Enter the X-ADMIN-KEY to enable management capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSession} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key" className="flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Admin Key
              </Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter Admin Secret Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="bg-muted p-3 rounded-md flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">
                Your key will be securely saved in your browser session for direct API communication.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Start Admin Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;