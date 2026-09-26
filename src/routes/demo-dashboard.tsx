import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, FlaskConical, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SLOTS, SERVICES, formatDateVN, statusLabel, todayVN } from "@/lib/booking";

export const Route = createFileRoute("/demo-dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Demo phòng khám — Bác sĩ Đại" },
      {
        name: "description",
        content: "Xem thử giao diện quản lý lịch hẹn siêu âm với dữ liệu mẫu an toàn.",
      },
      { property: "og:title", content: "Dashboard Demo phòng khám — Bác sĩ Đại" },
      {
        property: "og:description",
        content: "Trải nghiệm thống kê, lịch theo khung giờ và cập nhật trạng thái ca hẹn mẫu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoDashboard,
});

type DemoAppointment = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  gestWeek: number;
  gestDay: number;
  service: string;
  slot: string;
  status: "booked" | "received" | "in_progress" | "done";
};

const DEMO_APPOINTMENTS: DemoAppointment[] = [
  {
    id: "demo-1",
    code: "SA-2609-01",
    fullName: "Nguyễn Thu Hà",
    phone: "09•• ••• 012",
    gestWeek: 12,
    gestDay: 3,
    service: SERVICES[1] ?? "Sàng lọc dị tật hình thái học quý 1",
    slot: "17:00:00",
    status: "booked",
  },
  {
    id: "demo-2",
    code: "SA-2609-02",
    fullName: "Trần Ngọc Mai",
    phone: "09•• ••• 268",
    gestWeek: 22,
    gestDay: 0,
    service: SERVICES[2] ?? "Siêu âm khảo sát hình thái học quý 2",
    slot: "18:30:00",
    status: "received",
  },
  {
    id: "demo-3",
    code: "SA-2609-03",
    fullName: "Lê Minh Anh",
    phone: "09•• ••• 527",
    gestWeek: 28,
    gestDay: 5,
    service: SERVICES[3] ?? "Siêu âm tim thai chuyên sâu",
    slot: "20:00:00",
    status: "done",
  },
];

const NEXT_DEMO_STATUS: Partial<Record<DemoAppointment["status"], DemoAppointment["status"]>> = {
  booked: "received",
  received: "in_progress",
  in_progress: "done",
};

function DemoDashboard() {
  const today = todayVN();
  const [appointments, setAppointments] = useState(DEMO_APPOINTMENTS);
  const completed = appointments.filter((item) => item.status === "done").length;
  const waiting = appointments.length - completed;

  function advanceStatus(id: string) {
    setAppointments((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const nextStatus = NEXT_DEMO_STATUS[item.status];
        return nextStatus ? { ...item, status: nextStatus } : item;
      }),
    );
  }

  return (
    <main className="min-h-screen bg-hero pb-16">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Stethoscope className="size-6" aria-hidden />
            <span className="font-semibold">Quản lý phòng khám</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
            <FlaskConical className="size-4" aria-hidden /> Chế độ Demo · Dữ liệu minh hoạ
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link to="/auth">Về trang đăng nhập</Link>
        </Button>
      </header>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-3 px-4">
        <DemoStatCard label="Tổng ca hẹn hôm nay" value={appointments.length} />
        <DemoStatCard label="Ca đã khám" value={completed} />
        <DemoStatCard label="Ca chờ khám" value={waiting} />
      </section>

      <section className="mx-auto mt-6 w-full max-w-5xl px-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Lịch hẹn hôm nay</h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden /> {formatDateVN(today)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">17:00–20:30 · Mỗi ca 30 phút</p>
        </div>

        <div className="grid gap-3">
          {SLOTS.map((slot) => {
            const appointment = appointments.find((item) => item.slot === slot.start);
            return (
              <article
                key={slot.start}
                className="rounded-3xl bg-card p-4 shadow-card sm:flex sm:items-center sm:gap-5"
              >
                <div className="w-36 shrink-0 font-semibold text-primary">{slot.label}</div>
                {appointment ? (
                  <div className="mt-2 min-w-0 flex-1 sm:mt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{appointment.fullName}</h2>
                      <span className="rounded-full bg-primary-soft px-3 py-0.5 text-sm text-secondary-foreground">
                        {appointment.gestWeek}w{appointment.gestDay}d
                      </span>
                      <span className="rounded-full bg-accent px-3 py-0.5 text-sm text-accent-foreground">
                        {statusLabel(appointment.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{appointment.service}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Mã {appointment.code} · {appointment.phone}
                    </p>
                    {NEXT_DEMO_STATUS[appointment.status] && (
                      <Button
                        size="sm"
                        className="mt-3 rounded-xl bg-gradient-primary"
                        onClick={() => advanceStatus(appointment.id)}
                      >
                        Chuyển sang: {statusLabel(NEXT_DEMO_STATUS[appointment.status] ?? appointment.status)}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground sm:mt-0">Trống</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function DemoStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-card p-4 text-center shadow-card">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}