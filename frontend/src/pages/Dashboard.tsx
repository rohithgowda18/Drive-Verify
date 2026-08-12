import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, QrCode, Database, BarChart3, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/auth";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      toast.error("Please login with Admin Secret Key");
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    auth.clearToken();
    toast.success("Admin session logged out");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Drive Verify</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome to Your Dashboard</h2>
          <p className="text-muted-foreground">
            Manage vehicle registrations and perform fraud detection
          </p>
        </div>

        <Tabs defaultValue="verify" className="space-y-6">
          <TabsList>
            <TabsTrigger value="verify">
              <QrCode className="h-4 w-4 mr-2" />
              Verify RC
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              <Database className="h-4 w-4 mr-2" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>RC Verification</CardTitle>
                <CardDescription>
                  Scan QR code or enter RC number to verify vehicle registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate("/verify")}
                  >
                    <QrCode className="h-5 w-5 mr-2" />
                    Start Verification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Vehicle Database</CardTitle>
                <CardDescription>View and manage registered vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/vehicles")}>
                  View All Vehicles
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Fraud Analytics</CardTitle>
                <CardDescription>View fraud detection statistics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/analytics")}>
                  View Analytics Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/users")}>
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;