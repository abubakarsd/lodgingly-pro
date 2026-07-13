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

  // Student states
  const [regNumber, setRegNumber] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [isStudentSignup, setIsStudentSignup] = useState(false);

  // Admin states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      nav(role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, role, loading, nav]);

  async function studentSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: regNumber.trim(),
      password: studentPassword
    });
    setBusy(false);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
  }

  async function studentSignUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error, data } = await supabase.auth.signUp({
      email: regNumber.trim(),
      password: studentPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, matric_number: regNumber.trim().toUpperCase(), program: department }
      },
    });

    if (!error && data?.user) {
      // Best effort to update matric_number in the profile
      await supabase.from("profiles").update({ matric_number: regNumber.trim().toUpperCase(), program: department }).eq("id", data.user.id);
    }

    setBusy(false);
    if (error) toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    else toast({ title: "Welcome!", description: "Your account is ready." });
  }

  async function adminSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    setBusy(false);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
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
            <p className="text-sm text-muted-foreground mt-1">Select your portal to continue.</p>

            <Tabs defaultValue="student" className="mt-8">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="admin">Administrator</TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="mt-6">
                {!isStudentSignup ? (
                  <form onSubmit={studentSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input required placeholder="e.g. U16CSC206" value={regNumber} onChange={(e) => setRegNumber(e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" required value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} />
                    </div>
                    <Button disabled={busy} type="submit" className="w-full">Sign in as Student</Button>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      New student? <button type="button" onClick={() => setIsStudentSignup(true)} className="text-leaf-600 hover:underline">Create an account</button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={studentSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Registration Number</Label>
                      <Input required placeholder="e.g. U16CSC206" value={regNumber} onChange={(e) => setRegNumber(e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input required placeholder="e.g. Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" required minLength={6} value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)} />
                    </div>
                    <Button disabled={busy} type="submit" className="w-full">Create Student Account</Button>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Already have an account? <button type="button" onClick={() => setIsStudentSignup(false)} className="text-leaf-600 hover:underline">Sign in</button>
                    </p>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="admin" className="mt-6">
                <form onSubmit={adminSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Admin Email</Label>
                    <Input type="email" required placeholder="admin@abu.edu.ng" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                  </div>
                  <Button disabled={busy} type="submit" className="w-full">Sign in as Admin</Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-xs text-muted-foreground mt-8">
              <Link to="/" className="hover:text-foreground">← Back to home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
