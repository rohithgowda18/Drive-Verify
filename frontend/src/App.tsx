import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const CustomerVerify = lazy(() => import("./pages/CustomerVerify"));
const Verify = lazy(() => import("./pages/Verify"));
const RcDetail = lazy(() => import("./pages/RcDetail"));
const OwnershipHistory = lazy(() => import("./pages/OwnershipHistory"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const TransferOwnership = lazy(() => import("./pages/TransferOwnership"));
const AddVehicle = lazy(() => import("./pages/AddVehicle"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/customer" element={<CustomerVerify />} />
            <Route path="/customer/verify" element={<Verify />} />
            <Route path="/customer/vehicle/:id" element={<RcDetail />} />
            <Route path="/rc/:id" element={<RcDetail />} />
            <Route path="/rc/:id/history" element={<OwnershipHistory />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/vehicles" element={<Vehicles />} />
            <Route path="/admin/add-vehicle" element={<AddVehicle />} />
            <Route path="/admin/transfer" element={<TransferOwnership />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/add-vehicle" element={<AddVehicle />} />
            <Route path="/transfer" element={<TransferOwnership />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/auth" element={<AdminLogin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
