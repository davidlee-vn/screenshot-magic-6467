import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Đăng nhập phòng khám — Bác sĩ Đại" },
      {
        name: "description",
        content: "Khu vực dành riêng cho bác sĩ và nhân viên phòng khám quản lý lịch hẹn.",
      },
      { property: "og:title", content: "Đăng nhập phòng khám — Bác sĩ Đại" },
      { property: "og:description", content: "Quản lý lịch hẹn siêu âm của phòng khám." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/quan-ly", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/quan-ly` },
        });
        if (error) throw error;
        if (data.session) {
          void navigate({ to: "/quan-ly", replace: true });
        } else {
          toast.success("Đã gửi email xác nhận. Vui lòng mở email để kích hoạt tài khoản.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/quan-ly", replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("Invalid login credentials")
          ? "Email hoặc mật khẩu chưa đúng."
          : message.includes("already registered")
            ? "Email này đã có tài khoản, vui lòng đăng nhập."
            : "Không thực hiện được, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-card p-7 shadow-soft">
        <div className="flex items-center gap-2 text-primary">
          <Stethoscope className="size-6" aria-hidden />
          <span className="font-semibold">Bác sĩ Đại</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "signin" ? "Đăng nhập phòng khám" : "Tạo tài khoản phòng khám"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Khu vực quản lý lịch hẹn, chỉ dành cho bác sĩ và nhân viên.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-2xl bg-gradient-primary text-base"
          >
            {loading ? "Đang xử lý..." : mode === "signin" ? "Đăng nhập" : "Đăng ký"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {mode === "signin" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
        </button>

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          ← Về trang đặt lịch
        </Link>
      </div>
    </main>
  );
}
