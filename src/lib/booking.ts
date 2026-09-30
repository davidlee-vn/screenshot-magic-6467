export type Slot = { start: string; label: string };

export const SLOTS: Slot[] = [
  { start: "17:00:00", label: "17:00 - 17:30" },
  { start: "17:30:00", label: "17:30 - 18:00" },
  { start: "18:00:00", label: "18:00 - 18:30" },
  { start: "18:30:00", label: "18:30 - 19:00" },
  { start: "19:00:00", label: "19:00 - 19:30" },
  { start: "19:30:00", label: "19:30 - 20:00" },
  { start: "20:00:00", label: "20:00 - 20:30" },
];

export const SERVICES = [
  "Siêu âm 2D/4D/5D thai định kỳ",
  "Sàng lọc dị tật hình thái học quý 1 (11w - 13w6d) & Đo độ mờ da gáy",
  "Siêu âm khảo sát hình thái học quý 2 (20w - 22w)",
  "Siêu âm tim thai & Thần kinh thai chuyên sâu",
];

export const STATUSES = [
  { value: "booked", label: "Chờ đến" },
  { value: "received", label: "Đã tiếp nhận" },
  { value: "in_progress", label: "Đang siêu âm" },
  { value: "done", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
] as const;

export function statusLabel(value: string) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function slotLabel(start: string) {
  return SLOTS.find((s) => s.start === start.slice(0, 8))?.label ?? start.slice(0, 5);
}

/** Today's date (YYYY-MM-DD) in Vietnam time. */
export function todayVN(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateVN(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const weekday = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][
    d.getUTCDay()
  ];
  return `${weekday}, ${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

export function formatGestAge(week: string, day: string): string {
  if (week === "") return day === "" ? "Chưa cung cấp" : `${day} ngày`;
  return day === "" ? `${week} tuần` : `${week} tuần ${day} ngày`;
}

export const BOOKING_ERRORS: Record<string, string> = {
  SLOT_TAKEN: "Khung giờ này vừa có người đặt. Mẹ vui lòng chọn khung giờ khác nhé.",
  INVALID_DATE: "Ngày khám không hợp lệ (chỉ nhận đặt trong vòng 60 ngày tới).",
  INVALID_SLOT: "Khung giờ không hợp lệ.",
  INVALID_NAME: "Vui lòng nhập họ tên hợp lệ.",
  INVALID_PHONE: "Vui lòng nhập số điện thoại hợp lệ.",
  INVALID_WEEK: "Tuần thai không hợp lệ.",
  INVALID_DAY: "Số ngày lẻ phải từ 0 đến 6.",
  INVALID_NOTES: "Ghi chú quá dài.",
};

export function bookingErrorMessage(message: string): string {
  const key = Object.keys(BOOKING_ERRORS).find((k) => message.includes(k));
  return key
    ? BOOKING_ERRORS[key]!
    : "Không thể đặt lịch lúc này. Mẹ vui lòng thử lại sau ít phút.";
}
