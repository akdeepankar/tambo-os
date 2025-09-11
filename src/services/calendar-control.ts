// Note control tool
export async function calendarControlTool({ year, month, highlightDates, addEvent, removeEvent }: { year?: number; month?: number; highlightDates?: string[], addEvent?: { date: string, event: string }, removeEvent?: { date: string, event: string } }) {
  if (typeof window !== "undefined" && typeof (window as any).handleCalendarControl === "function") {
    (window as any).handleCalendarControl({ year, month, highlightDates, addEvent, removeEvent });
    return { success: true };
  }
  return { success: false, error: "Calendar component not mounted." };
}
