// Note control tool
export async function calendarControlTool({ year, month, highlightDates, addEvent, removeEvent }: { year?: number; month?: number; highlightDates?: string[], addEvent?: { date: string, event: string }, removeEvent?: { date: string, event: string } }) {
  type CalendarWindow = Window & typeof globalThis & {
    handleCalendarControl?: (params: { year?: number; month?: number; highlightDates?: string[]; addEvent?: { date: string; event: string }; removeEvent?: { date: string; event: string } }) => void;
  };
  const win = window as CalendarWindow;
  if (typeof window !== "undefined" && typeof win.handleCalendarControl === "function") {
    win.handleCalendarControl({ year, month, highlightDates, addEvent, removeEvent });
    return { success: true };
  }
  return { success: false, error: "Calendar component not mounted." };
}
