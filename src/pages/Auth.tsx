import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import bgImage from "@/assets/bg-image.jpeg";

export default function Auth() {
  const nav = useNavigate();
  const { user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav(role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [user, role, loading, nav]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    else toast({ title: "Welcome!", description: "Your account is ready." });
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
  }

  return (
    <div className="min-h-screen bg-surface grid lg:grid-cols-2">
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* dark overlay for readability */}
        <div className="absolute inset-0 bg-black/55" />
        <Logo className="relative z-10 [&_span]:text-white" />
        <div className="relative z-10">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight max-w-md">Your residency, thoughtfully managed.</h2>
          <p className="mt-4 text-white/80 max-w-md">Sign in to view your allocation, chat with roommates, and stay ahead of clearance deadlines.</p>
        </div>
        <p className="text-xs text-white/50 relative z-10">© 2026 Lodgingly Pro — Hostel Management System</p>
      </div>

      <div className="flex flex-col p-6 md:p-12">
        <div className="lg:hidden mb-8"><Logo /></div>
        <div className="flex-1 grid place-items-center">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Portal access</h1>
            <p className="text-sm text-muted-foreground mt-1">Students and administrators sign in here.</p>

            <Tabs defaultValue="signin" className="mt-8">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={signIn} className="space-y-4">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  <Button disabled={busy} type="submit" className="w-full">Sign in</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={signUp} className="space-y-4">
                  <div className="space-y-2"><Label>Full name</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                  <Button disabled={busy} type="submit" className="w-full">Create account</Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">OR</span><div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              <svg viewBox="0 0 24 24" className="size-4 mr-2"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-8.5 0-.6-.1-1.1-.2-1.5H12z" /></svg>
              Continue with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-6">
              <Link to="/" className="hover:text-foreground">← Back to home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
