import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import Accommodation from "./pages/Accommodation";
import AdminDashboard from "./pages/AdminDashboard";
import Clearance from "./pages/Clearance";
import Users from "./pages/Users";
import Allocations from "./pages/Allocations";
import Complaints from "./pages/Complaints";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Protected({ children, admin = false }: { children: JSX.Element; admin?: boolean }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (admin && role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Protected><StudentDashboard /></Protected>} />
            <Route path="/accommodation" element={<Protected><Accommodation /></Protected>} />
            <Route path="/admin" element={<Protected admin><AdminDashboard /></Protected>} />
            <Route path="/clearance" element={<Protected><Clearance /></Protected>} />
            <Route path="/users" element={<Protected admin><Users /></Protected>} />
            <Route path="/allocations" element={<Protected admin><Allocations /></Protected>} />
            <Route path="/complaints" element={<Protected><Complaints /></Protected>} />
            <Route path="/messages" element={<Protected><Messages /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
