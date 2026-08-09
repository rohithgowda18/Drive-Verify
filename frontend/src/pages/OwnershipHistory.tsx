import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, History } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface HistoryEntry {
  id: string;
  rcId: string;
  rcNumber: string;
  previousOwnerName: string;
  newOwnerName: string;
  transferredAt: string;
  stolenAtTransfer?: boolean;
  suspiciousAtTransfer?: boolean;
}

const OwnershipHistory = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [rc, setRc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [historyData, rcData] = await Promise.all([
          apiClient.rc.getHistory(id),
          apiClient.rc.getById(id)
        ]);
        setEntries(Array.isArray(historyData) ? historyData : []);
        setRc(rcData);
      } catch (err: unknown) {
        const message = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Load failed";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getSynthesizedEntries = (vehicle: any): (HistoryEntry & { isSynthesized?: boolean })[] => {
    if (!vehicle) return [];
    const list: any[] = [];
    const prevs = Array.isArray(vehicle.previousOwners) ? vehicle.previousOwners.filter(Boolean) : [];
    const currentName = vehicle.owner?.name;

    if (prevs.length === 0) return [];

    const chain = [...prevs];
    if (currentName) {
      chain.push(currentName);
    }

    for (let i = 0; i < chain.length - 1; i++) {
      list.push({
        id: `synth-${i}`,
        rcId: vehicle.id,
        rcNumber: vehicle.rcNumber,
        previousOwnerName: chain[i],
        newOwnerName: chain[i + 1],
        transferredAt: vehicle.createdAt || new Date().toISOString(),
        isSynthesized: true,
      });
    }
    return list.reverse();
  };

  const displayEntries = entries.length > 0 ? entries : getSynthesizedEntries(rc);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Ownership History</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Transfer Timeline</CardTitle>
            <CardDescription>Chronological record of ownership transfers</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : displayEntries.length === 0 ? (
              <p className="text-muted-foreground">No transfers recorded.</p>
            ) : (
              <div className="relative border-l border-muted ml-4 pl-6 space-y-8">
                {displayEntries.map((e: any) => {
                  const isRisk = e.stolenAtTransfer || e.suspiciousAtTransfer;
                  return (
                    <div key={e.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[32px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-muted ring-4 ring-background">
                        <span className={`h-2 w-2 rounded-full ${isRisk ? "bg-destructive animate-pulse" : "bg-primary"}`} />
                      </span>

                      <div className="space-y-3 bg-card/30 p-4 rounded-lg border hover:bg-card/50 transition-colors">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Previous Owner</span>
                            <span className="text-base font-bold text-foreground">{e.previousOwnerName || "Unknown"}</span>
                          </div>

                          <div className="flex flex-col items-center justify-center text-muted-foreground px-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider">Transferred</span>
                            <span className="text-lg font-bold">↓</span>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">New Owner</span>
                            <span className="text-base font-bold text-foreground text-right">{e.newOwnerName}</span>
                          </div>
                        </div>

                        <div className="border-t pt-2.5 mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {e.isSynthesized 
                              ? "Imported / Legacy Record" 
                              : new Date(e.transferredAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric"
                                })}
                          </span>

                          {isRisk && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              ⚠️ Risk Flagged
                            </span>
                          )}
                        </div>

                        {isRisk && (
                          <div className="text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/10 mt-1">
                            {e.stolenAtTransfer && '• Marked stolen at transfer.'}{' '}
                            {e.suspiciousAtTransfer && '• Marked suspicious at transfer.'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OwnershipHistory;
