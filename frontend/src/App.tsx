import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Verify = lazy(() => import("./pages/Verify"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const RcDetail = lazy(() => import("./pages/RcDetail"));
const OwnershipHistory = lazy(() => import("./pages/OwnershipHistory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TransferOwnership = lazy(() => import("./pages/TransferOwnership"));
const Auth = lazy(() => import("./pages/Auth"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/rc/:id" element={<RcDetail />} />
            <Route path="/rc/:id/history" element={<OwnershipHistory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/transfer" element={<TransferOwnership />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
