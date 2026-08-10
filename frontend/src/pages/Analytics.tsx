import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, BarChart3, CheckCircle2, History, ShieldAlert, AlertTriangle } from "lucide-react";
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
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Fraud & System Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="shadow-elevated mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Fraud & Verification Analytics
            </CardTitle>
            <CardDescription>System-wide vehicle risk indicators and registration statistics.</CardDescription>
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
                {/* Key Metrics */}
                <div className="grid md:grid-cols-4 gap-4">
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
                      <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-full">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Verified Active</p>
                      <h3 className="text-2xl font-bold">{stats.activeCount}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-destructive/10 text-destructive p-3 rounded-full">
                        <ShieldAlert className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Stolen Flagged</p>
                      <h3 className="text-2xl font-bold text-destructive">{stats.stolenCount}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-amber-500/10 text-amber-600 p-3 rounded-full">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Suspicious Flagged</p>
                      <h3 className="text-2xl font-bold text-amber-600">{stats.suspiciousCount}</h3>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Row Metric */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-blue-500/10 text-blue-600 p-3 rounded-full">
                        <History className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Recorded Ownership Transfers</p>
                      <h3 className="text-2xl font-bold">{stats.ownershipTransfersCount || 0}</h3>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-card flex items-center">
                    <CardHeader className="p-4 flex-shrink-0">
                      <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Shield className="h-6 w-6" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pl-0">
                      <p className="text-sm font-medium text-muted-foreground">Clean Registered Ratio</p>
                      <h3 className="text-2xl font-bold">
                        {stats.total ? Math.round((((stats.total - (stats.stolenCount + stats.suspiciousCount)) / stats.total) * 100)) : 100}%
                      </h3>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
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
                      <CardTitle className="text-base font-semibold">Risk Distribution</CardTitle>
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
                          {getPieData().map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <ChartTooltip formatter={(value) => [`${value} Vehicles`]} />
                      </PieChart>
                    </CardContent>
                  </Card>

                  {/* Monthly Verifications */}
                  <Card className="border shadow-card md:col-span-2">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base font-semibold">Monthly Verifications Trend</CardTitle>
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
