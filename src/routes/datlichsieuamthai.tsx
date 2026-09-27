import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarHeart, CheckCircle2, Download, Droplets, FileHeart, Sparkles, Star, Stethoscope } from "lucide-react";

import heroImage from "@/assets/hero-mebau.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SLOTS,
  SERVICES,
  NT_SCREENING_SERVICE,
  addDays,
  bookingErrorMessage,
  formatDateVN,
  formatGestAge,
  isNuchalScreeningWindow,
  randomTicketCode,
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingPage,
});

type Booked = {
  code: string;
  date: string;
  slot: string;
  service: string;
  name: string;
  week: string;
  day: string;
};

function BookingPage() {
  const today = todayVN();
  const maxDate = addDays(today, 60);
  const queryClient = useQueryClient();

  const [service, setService] = useState(SERVICES[0] ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [week, setWeek] = useState("");
  const [day, setDay] = useState("");
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [booked, setBooked] = useState<Booked | null>(null);
  const gestationalWeek = week === "" ? Number.NaN : Number(week);
  const isFirstTrimesterWindow = isNuchalScreeningWindow(gestationalWeek);

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
    onSuccess: () => {
      const newCode = randomTicketCode();
      
      supabase.from('appointments').insert([
        {
          patient_name: fullName,
          phone: phone,
          gestational_week: week,
          service_name: service,
          appointment_date: date,
          time_slot: slot,
          ticket_code: newCode,
        }
      ]).then(({ error }) => {
        if (error) console.error('Lỗi lưu Supabase:', error.message);
        else console.log('Đã lưu lịch hẹn thành công lên mây!');
      });

      setBooked({
        code: newCode,
        date,
        slot,
        service,
        name: fullName,
        week,
        day,
      });
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
              Siêu âm thai định kỳ, sàng lọc dị tật hình thái học và tim thai chuyên sâu.
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
        {/* 1. Chọn dịch vụ khám */}
        <fieldset className="rounded-3xl bg-card p-6 shadow-card">
          <legend className="px-1 text-lg font-semibold">1. Chọn dịch vụ khám</legend>
          <div className="mt-3 grid gap-3">
            {SERVICES.map((item) => {
              const recommendNuchal = isFirstTrimesterWindow && item === NT_SCREENING_SERVICE;
              const selected = service === item;
              return (
                <label
                  key={item}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                    recommendNuchal
                      ? "border-2 border-primary bg-primary-soft shadow-soft ring-2 ring-primary/40"
                      : selected
                        ? "border-primary bg-primary-soft shadow-card ring-1 ring-primary/30"
                        : "border-border hover:bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    className="mt-1.5 size-4 accent-[var(--primary)]"
                    checked={selected}
                    onChange={() => setService(item)}
                  />
                  <span className="min-w-0">
                    <span className="flex items-start gap-2 font-medium">
                      {recommendNuchal && (
                        <Star className="mt-0.5 size-4 shrink-0 fill-primary text-primary" aria-hidden />
                      )}
                      <span>{item}</span>
                    </span>
                    {recommendNuchal && (
                      <span className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-success">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        Thời điểm vàng khảo sát bất thường NST thai nhi
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* 2. Thông tin mẹ bầu */}
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
                  onChange={(e) => {
                    const next = e.target.value;
                    setWeek(next);
                    if (isNuchalScreeningWindow(Number(next))) {
                      setService(NT_SCREENING_SERVICE);
                    }
                  }}
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

        {/* 3. Chọn ngày & khung giờ */}
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

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cursorY);
  return cursorY;
}

function SuccessView({ booked, onNew }: { booked: Booked; onNew: () => void }) {
  const gestAge = formatGestAge(booked.week, booked.day);

  function downloadTicket() {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#e8f4f2";
    ctx.fillRect(0, 0, 900, 1100);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 40, 40, 820, 1020, 28);
    ctx.fill();
    ctx.strokeStyle = "#5eb8ad";
    ctx.lineWidth = 4;
    roundRect(ctx, 58, 58, 784, 984, 22);
    ctx.stroke();

    ctx.fillStyle = "#cdeae6";
    roundRect(ctx, 58, 58, 784, 170, 22);
    ctx.fill();
    ctx.fillStyle = "#cdeae6";
    ctx.fillRect(58, 140, 784, 88);

    ctx.fillStyle = "#1f4f4c";
    ctx.font = "bold 36px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PHIẾU HẸN ĐIỆN TỬ", 450, 125);
    ctx.font = "22px 'Be Vietnam Pro', sans-serif";
    ctx.fillText("Phòng khám Bác sĩ Đại — Siêu âm & sàng lọc thai", 450, 168);
    ctx.textAlign = "left";

    const rows: [string, string][] = [
      ["Mã phiếu hẹn", booked.code],
      ["Tên mẹ bầu", booked.name],
      ["Tuần thai", gestAge],
      ["Dịch vụ", booked.service],
      ["Ngày hẹn", formatDateVN(booked.date)],
      ["Khung giờ", slotLabel(booked.slot)],
    ];

    let y = 280;
    for (const [label, value] of rows) {
      ctx.fillStyle = "#6b7f85";
      ctx.font = "18px 'Be Vietnam Pro', sans-serif";
      ctx.fillText(label, 100, y);
      ctx.fillStyle = "#123b3a";
      ctx.font = label === "Mã phiếu hẹn"
        ? "bold 36px 'Be Vietnam Pro', sans-serif"
        : "bold 24px 'Be Vietnam Pro', sans-serif";
      y = wrapCanvasText(ctx, value, 100, y + 36, 680, 32) + 52;
    }

    ctx.fillStyle = "#6b7f85";
    ctx.font = "18px 'Be Vietnam Pro', sans-serif";
    ctx.fillText("Vui lòng đến sớm 10 phút và mang theo hồ sơ thai kỳ.", 100, 1000);

    const link = document.createElement("a");
    link.download = `phieu-hen-${booked.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-lg space-y-5">
        <div className="text-center">
          <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
          <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-primary">
            Đặt lịch thành công
          </p>
        </div>

        <article className="overflow-hidden rounded-3xl border-2 border-primary bg-card text-left shadow-soft">
          <header className="bg-gradient-primary px-6 py-5 text-center text-primary-foreground">
            <p className="flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-[0.2em]">
              <Star className="size-4 fill-current" aria-hidden />
              Phiếu hẹn điện tử
            </p>
            <h1 className="mt-1 text-xl font-bold">Phòng khám Bác sĩ Đại</h1>
          </header>

          <div className="px-6 py-5">
            <p className="text-sm text-muted-foreground">Mã phiếu hẹn</p>
            <p className="mt-1 text-3xl font-bold tracking-[0.18em] text-primary">{booked.code}</p>

            <dl className="mt-5 divide-y divide-border">
              <TicketRow label="Tên mẹ bầu" value={booked.name} />
              <TicketRow label="Tuần thai" value={gestAge} />
              <TicketRow label="Dịch vụ" value={booked.service} />
              <TicketRow label="Ngày hẹn" value={formatDateVN(booked.date)} />
              <TicketRow label="Khung giờ" value={slotLabel(booked.slot)} accent />
            </dl>

            <p className="mt-5 text-sm text-muted-foreground">
              Mẹ vui lòng đến sớm 10 phút và mang theo hồ sơ thai kỳ.
            </p>
          </div>
        </article>

        <div className="grid gap-3">
          <Button onClick={downloadTicket} className="h-12 rounded-2xl bg-gradient-primary text-base">
            <Download className="size-5" aria-hidden /> Tải ảnh phiếu hẹn
          </Button>
          <Button variant="secondary" onClick={onNew} className="h-12 rounded-2xl text-base">
            Đặt lịch khám mới
          </Button>
        </div>
      </div>
    </main>
  );
}

function TicketRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${accent ? "text-primary" : ""}`}>{value}</dd>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
