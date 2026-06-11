import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeartPulse, Mail, Lock, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/home" },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب بنجاح");
        nav({ to: "/home" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحبا بعودتك");
        nav({ to: "/home" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "حدث خطأ");
    } finally { setLoading(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/home" });
    if (r.error) toast.error("تعذر تسجيل الدخول بـ Google");
  }

  return (
    <div className="min-h-[100dvh] px-6 pt-12 pb-10" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary neon-glow">
          <HeartPulse className="h-9 w-9 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-gradient">DzHealth</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "login" ? "مرحبا بك مجددًا" : "أنشئ حسابك الجديد"}
        </p>
      </div>

      <div className="mt-8 flex rounded-full bg-surface-2 p-1">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${mode === m ? "gradient-primary text-primary-foreground neon-glow" : "text-muted-foreground"}`}>
            {m === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === "signup" && (
          <Field icon={UserIcon} placeholder="الاسم الكامل" value={name} onChange={setName} />
        )}
        <Field icon={Mail} type="email" placeholder="example@mail.com" value={email} onChange={setEmail} />
        <Field icon={Lock} type="password" placeholder="كلمة المرور" value={password} onChange={setPassword} />

        <button disabled={loading} type="submit"
          className="w-full rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground neon-glow disabled:opacity-60">
          {loading ? "..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
      </div>

      <button onClick={google} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface card-elevated py-3 text-sm font-semibold">
        <span className="text-base">G</span> تسجيل الدخول مع Google
      </button>
    </div>
  );
}

function Field({ icon: Icon, value, onChange, ...rest }: any) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface card-elevated px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
    </div>
  );
}
