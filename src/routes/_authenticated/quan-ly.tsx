import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, LogOut, Phone, Stethoscope } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SLOTS, STATUSES, formatDateVN, slotLabel, statusLabel, todayVN } from "@/lib/booking";

export const Route = createFileRoute("/_authenticated/quan-ly")({
  head: () => ({
    meta: [
      { title: "Quản lý lịch hẹn — Bác sĩ Đại" },
      { name: "description", content: "Bảng điều khiển lịch hẹn siêu âm của phòng khám." },
      { property: "og:title", content: "Quản lý lịch hẹn — Bác sĩ Đại" },
      { property: "og:description", content: "Theo dõi và cập nhật trạng thái các ca hẹn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type Appointment = {
  id: string;
  code: string;
  full_name: string;
  phone: string;
  gest_week: number | null;
  gest_day: number | null;
  service: string;
  appt_date: string;
  slot_start: string;
  notes: string | null;
  status: string;
};

const NEXT_STATUS: Record<string, string> = {
  booked: "received",
  received: "in_progress",
  in_progress: "done",
};

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = todayVN();
  const [tab, setTab] = useState("today");

  const appointments = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appt_date", { ascending: false })
        .order("slot_start", { ascending: true });
      if (error) throw error;
      return data as Appointment[];
    },
  });

  const rows = appointments.data ?? [];
  const todayRows = rows
    .filter((r) => r.appt_date === today)
    .sort((a, b) => a.slot_start.localeCompare(b.slot_start));
  const stats = {
    total: todayRows.filter((r) => r.status !== "cancelled").length,
    done: todayRows.filter((r) => r.status === "done").length,
    pending: todayRows.filter((r) => r.status === "booked").length,
  };

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("Không cập nhật được trạng thái.");
      return;
    }
    toast.success(`Đã chuyển sang "${statusLabel(status)}".`);
    void queryClient.invalidateQueries({ queryKey: ["appointments"] });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-hero pb-16">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-6">
        <div className="flex items-center gap-2 text-primary">
          <Stethoscope className="size-6" aria-hidden />
          <span className="font-semibold">Quản lý phòng khám</span>
        </div>
        <Button variant="ghost" onClick={signOut} className="rounded-2xl">
          <LogOut className="size-4" aria-hidden /> Đăng xuất
        </Button>
      </header>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-3 px-4">
        <StatCard label="Tổng ca hẹn hôm nay" value={stats.total} />
        <StatCard label="Ca đã khám" value={stats.done} />
        <StatCard label="Ca chờ khám" value={stats.pending} />
      </section>

      <section className="mx-auto mt-6 w-full max-w-5xl px-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-12 rounded-2xl">
            <TabsTrigger value="today" className="rounded-xl px-4 text-base">
              Lịch hẹn hôm nay
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl px-4 text-base">
              Toàn bộ danh sách
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4">
            <p className="mb-3 flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden /> {formatDateVN(today)}
            </p>
            {appointments.isLoading ? (
              <Empty text="Đang tải..." />
            ) : (
              <div className="grid gap-3">
                {SLOTS.map((s) => {
                  const row = todayRows.find(
                    (r) => r.slot_start.slice(0, 8) === s.start && r.status !== "cancelled",
                  );
                  return (
                    <div
                      key={s.start}
                      className="rounded-3xl bg-card p-4 shadow-card sm:flex sm:items-center sm:gap-4"
                    >
                      <div className="w-36 shrink-0 font-semibold text-primary">{s.label}</div>
                      {row ? (
                        <div className="mt-2 flex-1 sm:mt-0">
                          <AppointmentBody row={row} />
                          <StatusActions row={row} onUpdate={updateStatus} />
                        </div>
                      ) : (
                        <div className="mt-2 text-muted-foreground sm:mt-0">Trống</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {rows.length === 0 ? (
              <Empty text="Chưa có lịch hẹn nào." />
            ) : (
              <div className="grid gap-3">
                {rows.map((row) => (
                  <div key={row.id} className="rounded-3xl bg-card p-4 shadow-card">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold text-primary">
                      <span>{formatDateVN(row.appt_date)}</span>
                      <span>· {slotLabel(row.slot_start)}</span>
                    </div>
                    <AppointmentBody row={row} />
                    <StatusActions row={row} onUpdate={updateStatus} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function AppointmentBody({ row }: { row: Appointment }) {
  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-lg font-semibold">{row.full_name}</span>
        {row.gest_week !== null && (
          <span className="rounded-full bg-primary-soft px-3 py-0.5 text-sm text-secondary-foreground">
            {row.gest_week}w{row.gest_day ?? 0}d
          </span>
        )}
        <span className="rounded-full bg-accent px-3 py-0.5 text-sm text-accent-foreground">
          {statusLabel(row.status)}
        </span>
        <span className="text-sm text-muted-foreground">Mã {row.code}</span>
      </div>
      <p className="mt-1 text-muted-foreground">{row.service}</p>
      <a
        href={`tel:${row.phone}`}
        className="mt-1 inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
      >
        <Phone className="size-4" aria-hidden /> {row.phone}
      </a>
      {row.notes && <p className="mt-1 text-sm text-muted-foreground">Ghi chú: {row.notes}</p>}
    </div>
  );
}

function StatusActions({
  row,
  onUpdate,
}: {
  row: Appointment;
  onUpdate: (id: string, status: string) => void;
}) {
  const next = NEXT_STATUS[row.status];
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {next && (
        <Button
          size="sm"
          className="rounded-xl bg-gradient-primary"
          onClick={() => onUpdate(row.id, next)}
        >
          {statusLabel(next)}
        </Button>
      )}
      {STATUSES.filter((s) => s.value !== row.status && s.value !== next).map((s) => (
        <Button
          key={s.value}
          size="sm"
          variant={s.value === "cancelled" ? "destructive" : "secondary"}
          className="rounded-xl"
          onClick={() => onUpdate(row.id, s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-card p-4 text-center shadow-card">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl bg-card p-8 text-center text-muted-foreground">{text}</div>;
}
