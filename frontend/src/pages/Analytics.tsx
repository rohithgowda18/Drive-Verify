import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, History, ShieldAlert, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

const COLORS = ["#ef4444", "#eab308", "#10b981"]; // Red (Stolen), Yellow (Suspicious), Green (Clean)

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/api/rc/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Compute clean counts for Pie Chart: Total - (Stolen + Suspicious)
  const getPieData = () => {
    if (!stats) return [];
    const stolen = stats.stolenCount || 0;
    const suspicious = stats.suspiciousCount || 0;
    const clean = Math.max(0, (stats.total || 0) - (stolen + suspicious));
    return [
      { name: "Stolen", value: stolen },
      { name: "Suspicious", value: suspicious },
      { name: "Clean", value: clean }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Fraud Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-elevated mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Fraud Detection Analytics
            </CardTitle>
            <CardDescription>Overview of registration certificates, fraud patterns, and verification metrics.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : !stats ? (
              <div className="text-center py-8">
                <Button variant="outline" size="sm" onClick={load}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Load Stats
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Row 1 KPIs */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Shield className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                      <h3 className="text-2xl font-bold">{stats.total}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-success/10 text-success p-3 rounded-full">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Verified Registrations</p>
                      <h3 className="text-2xl font-bold">{stats.activeCount}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center relative overflow-hidden">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-muted text-muted-foreground p-3 rounded-full">
                        <History className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Ownership Transfers</p>
                      <h3 className="text-sm font-medium text-muted-foreground italic">
                        Available when backend supports this metric
                      </h3>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2 KPIs */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-destructive/10 text-destructive p-3 rounded-full">
                        <ShieldAlert className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Stolen Vehicles</p>
                      <h3 className="text-2xl font-bold text-destructive">{stats.stolenCount}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-warning/10 text-warning p-3 rounded-full">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Suspicious Vehicles</p>
                      <h3 className="text-2xl font-bold text-warning">{stats.suspiciousCount}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center relative overflow-hidden">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-muted text-muted-foreground p-3 rounded-full">
                        <Award className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Active Insurance</p>
                      <h3 className="text-sm font-medium text-muted-foreground italic">
                        Available when backend supports this metric
                      </h3>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 3: Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Registrations by State */}
                  <Card className="border shadow-card">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Registrations by State</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center min-h-[300px]">
                      {stats.byState && Object.keys(stats.byState).length > 0 ? (
                        <ChartContainer
                          config={{ count: { label: "Vehicles", color: "hsl(var(--primary))" } }}
                          className="w-full h-[300px]"
                        >
                          <BarChart data={Object.entries(stats.byState).map(([state, count]) => ({ state, count }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="state" />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <p className="text-muted-foreground self-center">No state data available.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Fraud Distribution (Pie Chart) */}
                  <Card className="border shadow-card">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Fraud Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                      <PieChart width={300} height={250}>
                        <Pie
                          data={getPieData()}
                          cx={150}
                          cy={110}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <ChartTooltip formatter={(value) => [`${value} Vehicles`]} />
                      </PieChart>
                    </CardContent>
                  </Card>

                  {/* Monthly Verifications */}
                  <Card className="border shadow-card">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Monthly Verifications</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center min-h-[300px]">
                      {Array.isArray(stats.monthlyVerifications) && stats.monthlyVerifications.length > 0 ? (
                        <ChartContainer
                          config={{ count: { label: "Verifications", color: "hsl(var(--primary))" } }}
                          className="w-full h-[300px]"
                        >
                          <LineChart data={stats.monthlyVerifications}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ChartContainer>
                      ) : (
                        <p className="text-muted-foreground self-center">No verification history.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Vehicle Manufacturer Distribution Placeholder */}
                  <Card className="border shadow-card flex flex-col justify-between">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Manufacturer Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-grow py-8 text-center bg-muted/20 border-t">
                      <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground">Manufacturer Distribution Chart</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Available when backend supports this metric
                      </p>
                    </CardContent>
                  </Card>

                  {/* Ownership Transfers Over Time Placeholder */}
                  <Card className="border shadow-card flex flex-col justify-between md:col-span-2">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Ownership Transfers Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-grow py-12 text-center bg-muted/20 border-t">
                      <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground">Transfers Timeline Trend</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Available when backend supports this metric
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
