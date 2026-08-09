import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Verify from "./pages/Verify";
import Vehicles from "./pages/Vehicles";
import RcDetail from "./pages/RcDetail";
import OwnershipHistory from "./pages/OwnershipHistory";
import Analytics from "./pages/Analytics";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import TransferOwnership from "./pages/TransferOwnership";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
