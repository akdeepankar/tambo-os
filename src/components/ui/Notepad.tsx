import React, { useState } from "react";

type Note = {
  heading: string;
  content: string;
};

import { withInteractable } from "@tambo-ai/react";
import { notepadSchema } from "@/components/ui/notepadSchema";
import { IconNotebook } from "@tabler/icons-react";

type NotepadProps = {
  heading?: string;
  content?: string;
  clear?: boolean;
  save?: boolean;
};

const NotepadBase: React.FC<NotepadProps> = ({ heading: propHeading = "", content: propContent = "", clear = false, save }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [heading, setHeading] = useState(propHeading);
  const [content, setContent] = useState(propContent);
  const [savedNotes, setSavedNotes] = useState<Note[]>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("notepad_notes");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [saved, setSaved] = useState(false);

  // Save note logic
  function handleSave() {
    if (heading.trim() && content.trim()) {
      const newNotes = [...savedNotes, { heading, content }];
      setSavedNotes(newNotes);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notepad_notes", JSON.stringify(newNotes));
      }
      setHeading("");
      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }
  }
  // Sync savedNotes to localStorage when changed
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("notepad_notes", JSON.stringify(savedNotes));
    }
  }, [savedNotes]);

  // Clear note logic
  function handleClear() {
    setHeading("");
    setContent("");
    setSaved(false);
  }

  // Sync heading/content from props (for interactable updates)
  React.useEffect(() => {
    if (clear) {
      setHeading("");
      setContent("");
      return;
    }
    if (propHeading !== heading) setHeading(propHeading);
    if (propContent !== content) setContent(propContent);
  }, [propHeading, propContent, clear]);

  // Save note to localStorage when save prop is true (from interactable)
  React.useEffect(() => {
    if (save && heading.trim() && content.trim()) {
      const newNotes = [...savedNotes, { heading, content }];
      setSavedNotes(newNotes);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notepad_notes", JSON.stringify(newNotes));
      }
      setHeading("");
      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    }
  }, [save]);

  // Expose Notepad state and actions to window for chat control
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as Window & typeof globalThis & {
      tamboInteractable?: {
        Notepad_state?: { heading: string; content: string; savedNotes: Array<{ heading: string; content: string }> };
        Notepad_onInteract?: (params: { heading?: string; content?: string; save?: boolean; clear?: boolean; clearAll?: boolean; deleteIndex?: number }) => void;
      };
    };
    if (!win.tamboInteractable) {
      win.tamboInteractable = {};
    }
    win.tamboInteractable.Notepad_state = {
      heading,
      content,
      savedNotes,
    };
    win.tamboInteractable.Notepad_onInteract = (params) => {
      let headingToSave = heading;
      let contentToSave = content;
      if (typeof params.heading === "string") headingToSave = params.heading;
      if (typeof params.content === "string") contentToSave = params.content;
      if (params.clear) handleClear();
      if (params.clearAll) {
        setSavedNotes([]);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("notepad_notes", JSON.stringify([]));
        }
      }
      // Automatically save if heading/content are provided via chat
      if ((typeof params.heading === "string" && params.heading.trim()) || (typeof params.content === "string" && params.content.trim())) {
        const newHeading = typeof params.heading === "string" ? params.heading : heading;
        const newContent = typeof params.content === "string" ? params.content : content;
        if (newHeading.trim() || newContent.trim()) {
          setSavedNotes(prevNotes => {
            const updatedNotes = [...prevNotes, { heading: newHeading, content: newContent }];
            if (typeof window !== "undefined") {
              window.localStorage.setItem("notepad_notes", JSON.stringify(updatedNotes));
            }
            return updatedNotes;
          });
          setHeading("");
          setContent("");
        }
      }
      if (typeof params.heading === "string") setHeading(params.heading);
      if (typeof params.content === "string") setContent(params.content);
      if (typeof params.deleteIndex === "number" && params.deleteIndex >= 0 && params.deleteIndex < savedNotes.length) {
        const updatedNotes = savedNotes.filter((_, i) => i !== params.deleteIndex);
        setSavedNotes(updatedNotes);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("notepad_notes", JSON.stringify(updatedNotes));
        }
      }
    };
    return () => {
      if (win.tamboInteractable) {
        delete win.tamboInteractable.Notepad_onInteract;
        delete win.tamboInteractable.Notepad_state;
      }
    };
  }, [heading, content, savedNotes]);

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-white/80 via-blue-50/30 to-gray-100/80 dark:from-gray-900/80 dark:via-blue-900/10 dark:to-gray-800/80 backdrop-blur-2xl rounded-xl shadow-lg overflow-hidden">
      {/* iOS-style Navbar with Tab Bar */}
      <div className="w-full flex flex-col border-b border-border shadow-sm bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(30,30,30,0.85)]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <IconNotebook className="w-6 h-6 text-primary" />
            <h2 className="font-bold text-xl text-foreground drop-shadow-lg">Notepad</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-muted rounded-full px-1 py-1 shadow-inner">
              <button
                className={`px-4 py-1 rounded-full font-semibold text-sm transition-colors ${activeTab === 'create' ? 'bg-primary text-white shadow' : 'bg-transparent text-foreground'}`}
                onClick={() => setActiveTab('create')}
              >
                Create Note
              </button>
              <button
                className={`px-4 py-1 rounded-full font-semibold text-sm transition-colors ${activeTab === 'saved' ? 'bg-primary text-white shadow' : 'bg-transparent text-foreground'}`}
                onClick={() => setActiveTab('saved')}
              >
                Saved Notes
              </button>
            </div>
            <button
              className={`p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition-all duration-200 text-xs font-semibold ${saved ? 'bg-green-500' : ''}`}
              onClick={handleSave}
              title="Save Note"
            >
              {saved ? "✔️" : "Save"}
            </button>
            <button
              className="p-2 rounded-full bg-muted hover:bg-accent transition-colors shadow text-xs font-semibold"
              onClick={handleClear}
              title="Clear Note"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
      {/* Notepad Body */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {activeTab === 'create' ? (
          <>
            <input
              className="mb-3 rounded-xl border border-border bg-white/80 dark:bg-gray-900/80 p-3 text-base font-semibold text-gray-800 dark:text-gray-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={heading}
              onChange={e => setHeading(e.target.value)}
              placeholder="Note Heading"
              maxLength={64}
            />
            <div className="text-xs text-primary mb-2">Current heading: {heading}</div>
            <textarea
              className="flex-1 rounded-xl border border-border bg-white/80 dark:bg-gray-900/80 p-4 text-base font-medium text-gray-800 dark:text-gray-100 shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type your note here..."
              style={{ minHeight: 200 }}
              maxLength={1000}
            />
            <div className="flex justify-end mt-2 text-xs text-muted-foreground">
              {content.length > 0 ? `${content.length} characters` : ""}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {savedNotes.length === 0 ? (
              <div className="text-center text-muted-foreground text-base mt-8">No saved notes yet.</div>
            ) : (
              savedNotes.map((note, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-white/90 dark:bg-gray-900/80 p-4 shadow flex flex-col gap-2 relative">
                  <div className="font-bold text-lg mb-1 text-primary">{note.heading}</div>
                  <div className="whitespace-pre-line text-base text-foreground">{note.content}</div>
                  <button
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-destructive text-white text-xs shadow hover:bg-destructive/80 transition-all"
                    title="Delete Note"
                    onClick={() => {
                      const updatedNotes = savedNotes.filter((_, i) => i !== idx);
                      setSavedNotes(updatedNotes);
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem("notepad_notes", JSON.stringify(updatedNotes));
                      }
                    }}
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full">✕</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Notepad = withInteractable(NotepadBase, {
  componentName: "Notepad",
  description:
    "Create and save notes with heading and content. Can be controlled by chat for heading, content, save, and clear actions.",
  propsSchema: notepadSchema,
});

