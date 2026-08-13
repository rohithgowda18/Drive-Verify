import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

        <div className="grid md:grid-cols-3 gap-6">
          <Card 
            className="shadow-card hover:shadow-elevated transition-all cursor-pointer border-primary/20 hover:border-primary"
            onClick={() => navigate("/customer/verify")}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <QrCode className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-xl">Verify RC</CardTitle>
                <CardDescription className="mt-1">
                  Evaluate vehicle trust score & risk factors
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-card hover:shadow-elevated transition-all cursor-pointer border-primary/20 hover:border-primary"
            onClick={() => navigate("/admin/vehicles")}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Database className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-xl">Vehicles Database</CardTitle>
                <CardDescription className="mt-1">
                  View and manage all registered vehicle records
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-card hover:shadow-elevated transition-all cursor-pointer border-primary/20 hover:border-primary"
            onClick={() => navigate("/admin/analytics")}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-xl">Fraud Analytics</CardTitle>
                <CardDescription className="mt-1">
                  Analyze fraud patterns, stolen stats & insights
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;