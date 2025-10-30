import React, { useState } from "react";
import { IconCalendarEvent } from "@tabler/icons-react";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const Calendar: React.FC = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [events, setEvents] = useState<{ [date: string]: string[] }>({});
  const [newEvent, setNewEvent] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [highlightDates, setHighlightDates] = useState<string[]>([]);

  // Expose chat control
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & typeof globalThis & {
        handleCalendarControl?: (params: { year?: number; month?: number; highlightDates?: string[], selectDate?: string, addEvent?: { date: string, event: string }, removeEvent?: { date: string, event: string } }) => void;
        getEventsForDate?: (date: string) => string[];
      }).handleCalendarControl = (params) => {
        if (typeof params.year === "number") setYear(params.year);
        if (typeof params.month === "number") setMonth(params.month);
        if (Array.isArray(params.highlightDates)) setHighlightDates(params.highlightDates);
        // If a date is searched/highlighted, select it to open the event section
        if (typeof params.selectDate === "string") setSelectedDate(params.selectDate);
        // If highlightDates is provided and only one date, select it
        if (Array.isArray(params.highlightDates) && params.highlightDates.length === 1) {
          setSelectedDate(params.highlightDates[0]);
        }
        // If addEvent is provided, add the event to the specified date
        const addEvent = params.addEvent;
        if (addEvent && typeof addEvent.date === "string" && typeof addEvent.event === "string" && addEvent.event.trim()) {
          setEvents(prev => ({
            ...prev,
            [addEvent.date]: [...(prev[addEvent.date] || []), addEvent.event.trim()]
          }));
          setSelectedDate(addEvent.date);
        }
        // If removeEvent is provided, remove the event from the specified date
        const removeEvent = params.removeEvent;
        if (removeEvent && typeof removeEvent.date === "string" && typeof removeEvent.event === "string" && removeEvent.event.trim()) {
          setEvents(prev => {
            const updated = { ...prev };
            updated[removeEvent.date] = (updated[removeEvent.date] || []).filter(ev => ev !== removeEvent.event.trim());
            return updated;
          });
          setSelectedDate(removeEvent.date);
        }
      };
      // Expose a function to check events for a particular date
      (window as Window & typeof globalThis & {
        getEventsForDate?: (date: string) => string[];
      }).getEventsForDate = (date: string) => {
        return events[date] || [];
      };
    }
    return () => {
      const win = window as Window & typeof globalThis & {
        handleCalendarControl?: (params: { year?: number; month?: number; highlightDates?: string[], selectDate?: string, addEvent?: { date: string, event: string }, removeEvent?: { date: string, event: string } }) => void;
        getEventsForDate?: (date: string) => string[];
      };
      if (typeof window !== "undefined" && win.handleCalendarControl) {
        delete win.handleCalendarControl;
      }
      if (typeof window !== "undefined" && win.getEventsForDate) {
        delete win.getEventsForDate;
      }
    };
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function handleAddEvent() {
    if (!selectedDate || !newEvent.trim()) return;
    setEvents(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newEvent.trim()]
    }));
    setNewEvent("");
  }

  function formatDate(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
  <div className="h-full w-full flex flex-col bg-gradient-to-br from-white via-blue-50/60 to-gray-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-800 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 resize both overflow-auto min-h-[400px] min-w-[350px] max-h-[90vh] max-w-[100vw]">
      {/* Navbar */}
  <div className="w-full flex flex-col border-b border-gray-200 dark:border-gray-800 shadow bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
  <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <IconCalendarEvent className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
              {new Date(year, month).toLocaleString("default", { month: "long" })} {year}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full bg-blue-500 text-white shadow hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setShowModal(true)}
              title="Add Event"
              disabled={!selectedDate}
            >
              Add Event
            </button>
            <button onClick={() => setMonth(m => m === 0 ? 11 : m - 1)} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 text-gray-700 dark:text-gray-200">Prev</button>
            <button onClick={() => setMonth(m => m === 11 ? 0 : m + 1)} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 text-gray-700 dark:text-gray-200">Next</button>
          </div>
        </div>
      </div>
      {/* Calendar Body */}
  <div className="flex-1 flex flex-row gap-6 p-6 overflow-y-auto min-h-0 h-full">
        {/* Calendar grid column */}
  <div className="flex-1 min-w-[220px] max-w-full overflow-auto">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center font-semibold text-gray-500 dark:text-gray-300 tracking-wide pb-2">{d}</div>
            ))}
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={"empty-" + i} />
            ))}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(day);
              const isHighlighted = highlightDates.includes(dateStr);
              const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              let cellClass = "rounded-xl border flex flex-col items-center justify-center h-16 min-h-0 shadow-sm transition-all duration-200 ";
              if (selectedDate === dateStr) {
                cellClass += "bg-blue-100 border-blue-500 ";
              } else if (isHighlighted) {
                cellClass += "bg-yellow-100 border-yellow-500 ";
              } else {
                cellClass += "bg-gray-50 dark:bg-gray-800 ";
              }
              if (isToday) {
                cellClass += " ring-2 ring-blue-400 ";
              }
              return (
                <button
                  key={dateStr}
                  className={cellClass + " hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-300"}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span className="font-semibold text-base text-gray-700 dark:text-gray-100">{day}</span>
                  {events[dateStr] && events[dateStr].length > 0 && (
                    <span className="text-xs text-green-600 mt-1">{events[dateStr].length} event{events[dateStr].length > 1 ? "s" : ""}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Events column */}
  <div className="w-80 min-w-[220px] max-w-xs overflow-auto">
          {selectedDate ? (
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow h-full border border-gray-200 dark:border-gray-800">
              <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Events for {selectedDate}</div>
              <ul className="mb-2">
                {(events[selectedDate] || []).map((ev, i) => (
                  <li
                    key={i}
                    className="mb-3 last:mb-0 px-4 py-3 bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-blue-900/10 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-sm text-gray-800 dark:text-gray-100 font-medium border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  >
                    {ev}
                  </li>
                ))}
                {(events[selectedDate] || []).length === 0 && <li className="text-gray-400">No events</li>}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-gray-400">Select a date to view events.</div>
          )}
        </div>
      </div>
      {/* Modal for adding event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Add Event for {selectedDate}</h3>
            <input
              type="text"
              value={newEvent}
              onChange={e => setNewEvent(e.target.value)}
              placeholder="Event description..."
              className="w-full px-3 py-2 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
              >Cancel</button>
              <button
                onClick={() => { handleAddEvent(); setShowModal(false); }}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!newEvent.trim()}
              >Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
