import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarHeart, CheckCircle2, Download, Droplets, FileHeart, Stethoscope } from "lucide-react";

import heroImage from "@/assets/hero-mebau.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SLOTS,
  SERVICES,
  addDays,
  bookingErrorMessage,
  formatDateVN,
  slotLabel,
  todayVN,
} from "@/lib/booking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Đặt lịch siêu âm & sàng lọc dị tật thai — Bác sĩ Đại" },
      {
        name: "description",
        content:
          "Đặt lịch siêu âm thai định kỳ, sàng lọc dị tật hình thái học và tim thai chuyên sâu với Bác sĩ Đại. Khung giờ 17:00 - 20:30, mỗi ca 30 phút.",
      },
      { property: "og:title", content: "Đặt lịch siêu âm thai — Bác sĩ Đại" },
      {
        property: "og:description",
        content: "Chọn dịch vụ, chọn ngày và khung giờ 30 phút chỉ trong một phút.",
      },
    ],
  }),
  component: BookingPage,
});

type Booked = { code: string; date: string; slot: string; service: string; name: string };

function BookingPage() {
  const today = todayVN();
  const maxDate = addDays(today, 60);
  const queryClient = useQueryClient();

  const [service, setService] = useState(SERVICES[0]!);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [week, setWeek] = useState("");
  const [day, setDay] = useState("");
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState<Booked | null>(null);

  const bookedSlots = useQuery({
    queryKey: ["booked-slots", date],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("booked_slots", { p_date: date });
      if (error) throw error;
      return (data ?? []).map((r) => r.slot_start.slice(0, 8));
    },
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_appointment", {
        p_full_name: fullName,
        p_phone: phone,
        p_service: service,
        p_date: date,
        p_slot: slot,
        ...(week === "" ? {} : { p_week: Number(week) }),
        ...(day === "" ? {} : { p_day: Number(day) }),
        ...(notes.trim() === "" ? {} : { p_notes: notes }),
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: (code) => {
      setBooked({ code, date, slot, service, name: fullName });
      void queryClient.invalidateQueries({ queryKey: ["booked-slots", date] });
    },
    onError: (error: Error) => {
      toast.error(bookingErrorMessage(error.message));
      void queryClient.invalidateQueries({ queryKey: ["booked-slots", date] });
      setSlot("");
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Mẹ vui lòng nhập họ tên.");
      return;
    }
    if (phone.trim().length < 8) {
      toast.error("Mẹ vui lòng nhập số điện thoại / Zalo.");
      return;
    }
    if (!slot) {
      toast.error("Mẹ vui lòng chọn một khung giờ.");
      return;
    }
    createBooking.mutate();
  }

  if (booked) {
    return <SuccessView booked={booked} onNew={() => { setBooked(null); setSlot(""); }} />;
  }

  return (
    <main className="min-h-screen bg-hero pb-16">
      <header className="mx-auto w-full max-w-3xl px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Stethoscope className="size-6" aria-hidden />
            <span className="font-semibold">Bác sĩ Đại</span>
          </div>
          <Link
            to="/auth"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Dành cho phòng khám
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 pt-6">
        <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
          <img
            src={heroImage}
            alt="Minh hoạ mẹ bầu và nhịp tim thai"
            width={1280}
            height={912}
            className="h-44 w-full object-cover sm:h-60"
          />
          <div className="p-6">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Cổng đặt lịch & chăm sóc mẹ bầu
            </h1>
            <p className="mt-2 text-muted-foreground">
              Siêu âm thai định kỳ, sàng lọc dị tật hình thái học và siêu âm tim thai chuyên sâu.
              Phòng khám nhận lịch mỗi ngày từ <strong>17:00 đến 20:30</strong>, mỗi ca 30 phút.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pt-6">
        <div className="rounded-3xl bg-accent/60 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-accent-foreground">
            <FileHeart className="size-5" aria-hidden /> Lời dặn trước khi khám
          </h2>
          <ul className="mt-3 space-y-2 text-accent-foreground">
            <li className="flex gap-2">
              <Droplets className="mt-1 size-4 shrink-0" aria-hidden />
              Uống nhiều nước trước khi siêu âm, đặc biệt trong 3 tháng đầu thai kỳ.
            </li>
            <li className="flex gap-2">
              <FileHeart className="mt-1 size-4 shrink-0" aria-hidden />
              Mang theo hồ sơ thai kỳ, các phiếu siêu âm và xét nghiệm đã có.
            </li>
            <li className="flex gap-2">
              <CalendarHeart className="mt-1 size-4 shrink-0" aria-hidden />
              Mẹ nên đến sớm 10 phút, mặc trang phục rộng rãi thoải mái.
            </li>
          </ul>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="mx-auto mt-6 w-full max-w-3xl space-y-6 px-4">
        <fieldset className="rounded-3xl bg-card p-6 shadow-card">
          <legend className="px-1 text-lg font-semibold">1. Chọn dịch vụ khám</legend>
          <div className="mt-3 grid gap-3">
            {SERVICES.map((item) => (
              <label
                key={item}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  service === item
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="service"
                  className="mt-1.5 size-4 accent-[var(--primary)]"
                  checked={service === item}
                  onChange={() => setService(item)}
                />
                <span className="font-medium">{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-card p-6 shadow-card">
          <legend className="px-1 text-lg font-semibold">2. Thông tin mẹ bầu</legend>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Họ tên mẹ bầu *</Label>
              <Input
                id="name"
                value={fullName}
                maxLength={100}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Thị An"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại / Zalo *</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                maxLength={20}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="week">Tuần thai</Label>
                <Input
                  id="week"
                  type="number"
                  min={0}
                  max={45}
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  placeholder="20"
                  className="h-12 text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="day">Ngày lẻ (0 - 6)</Label>
                <Input
                  id="day"
                  type="number"
                  min={0}
                  max={6}
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="3"
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-3xl bg-card p-6 shadow-card">
          <legend className="px-1 text-lg font-semibold">3. Chọn ngày & khung giờ</legend>
          <div className="mt-3 grid gap-2">
            <Label htmlFor="date">Ngày khám *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              min={today}
              max={maxDate}
              onChange={(e) => {
                setDate(e.target.value);
                setSlot("");
              }}
              className="h-12 text-base"
              required
            />
            <p className="text-sm text-muted-foreground">{formatDateVN(date)}</p>
          </div>

          <div className="mt-5">
            <p className="font-medium">Khung giờ (mỗi ca 30 phút) *</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SLOTS.map((s) => {
                const taken = (bookedSlots.data ?? []).includes(s.start);
                const selected = slot === s.start;
                return (
                  <button
                    key={s.start}
                    type="button"
                    disabled={taken || bookedSlots.isLoading}
                    onClick={() => setSlot(s.start)}
                    className={`rounded-2xl border px-3 py-3 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground ${
                      selected
                        ? "border-primary bg-gradient-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-primary-soft"
                    }`}
                  >
                    {s.label}
                    {taken && <span className="block text-xs font-normal">Đã kín</span>}
                  </button>
                );
              })}
            </div>
            {bookedSlots.isError && (
              <p className="mt-2 text-sm text-destructive">
                Không tải được tình trạng khung giờ. Mẹ vui lòng tải lại trang.
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-2">
            <Label htmlFor="notes">Ghi chú hoặc dấu hiệu bất thường</Label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: đau bụng lâm râm, ra dịch bất thường..."
              className="min-h-24 text-base"
            />
          </div>
        </fieldset>

        <Button
          type="submit"
          disabled={createBooking.isPending}
          className="h-14 w-full rounded-2xl bg-gradient-primary text-lg font-semibold shadow-soft"
        >
          {createBooking.isPending ? "Đang gửi..." : "Xác nhận đặt lịch"}
        </Button>
      </form>
    </main>
  );
}

function SuccessView({ booked, onNew }: { booked: Booked; onNew: () => void }) {
  function downloadTicket() {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 620;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 900, 620);
    ctx.fillStyle = "#cdeae6";
    ctx.fillRect(0, 0, 900, 140);
    ctx.fillStyle = "#1f4f4c";
    ctx.font = "bold 38px 'Be Vietnam Pro', sans-serif";
    ctx.fillText("PHIẾU HẸN SIÊU ÂM", 48, 70);
    ctx.font = "22px 'Be Vietnam Pro', sans-serif";
    ctx.fillText("Bác sĩ Đại - Chăm sóc mẹ bầu", 48, 108);

    const rows: [string, string][] = [
      ["Mã phiếu hẹn", booked.code],
      ["Mẹ bầu", booked.name],
      ["Ngày khám", formatDateVN(booked.date)],
      ["Khung giờ", slotLabel(booked.slot)],
      ["Dịch vụ", booked.service],
    ];
    let y = 210;
    for (const [label, value] of rows) {
      ctx.fillStyle = "#6b7f85";
      ctx.font = "20px 'Be Vietnam Pro', sans-serif";
      ctx.fillText(label, 48, y);
      ctx.fillStyle = "#123b3a";
      ctx.font = "bold 24px 'Be Vietnam Pro', sans-serif";
      ctx.fillText(value.length > 46 ? value.slice(0, 45) + "…" : value, 48, y + 32);
      y += 82;
    }
    ctx.fillStyle = "#6b7f85";
    ctx.font = "18px 'Be Vietnam Pro', sans-serif";
    ctx.fillText("Vui lòng đến sớm 10 phút và mang theo hồ sơ thai kỳ.", 48, 585);

    const link = document.createElement("a");
    link.download = `phieu-hen-${booked.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function copyDetails() {
    const text = `Phiếu hẹn ${booked.code} - ${booked.name} - ${formatDateVN(booked.date)} - ${slotLabel(booked.slot)} - ${booked.service}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép thông tin phiếu hẹn.");
    } catch {
      toast.error("Không sao chép được, mẹ vui lòng chụp màn hình nhé.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-card p-7 text-center shadow-soft">
        <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">Đặt lịch thành công!</h1>
        <p className="mt-1 text-muted-foreground">
          Phòng khám sẽ liên hệ lại nếu có thay đổi. Mẹ nhớ giữ mã phiếu hẹn nhé.
        </p>

        <div className="mt-5 rounded-2xl bg-primary-soft p-5 text-left">
          <p className="text-sm text-muted-foreground">Mã phiếu hẹn</p>
          <p className="text-3xl font-bold tracking-wide text-primary">{booked.code}</p>
          <dl className="mt-4 space-y-2 text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Mẹ bầu</dt>
              <dd className="font-medium">{booked.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ngày khám</dt>
              <dd className="font-medium">{formatDateVN(booked.date)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Khung giờ</dt>
              <dd className="font-medium">{slotLabel(booked.slot)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted-foreground">Dịch vụ</dt>
              <dd className="text-right font-medium">{booked.service}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-5 grid gap-3">
          <Button onClick={downloadTicket} className="h-12 rounded-2xl bg-gradient-primary text-base">
            <Download className="size-5" aria-hidden /> Tải ảnh phiếu hẹn
          </Button>
          <Button variant="secondary" onClick={copyDetails} className="h-12 rounded-2xl text-base">
            Sao chép thông tin để gửi Zalo
          </Button>
          <Button variant="ghost" onClick={onNew} className="h-12 rounded-2xl text-base">
            Đặt thêm một lịch khác
          </Button>
        </div>
      </div>
    </main>
  );
}
