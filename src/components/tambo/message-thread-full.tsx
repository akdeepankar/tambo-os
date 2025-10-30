"use client";

import type { messageVariants } from "@/components/tambo/message";
import {
  MessageInput,
  MessageInputError,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
} from "@/components/tambo/message-input";
import {
  MessageSuggestions,
  MessageSuggestionsList,
  MessageSuggestionsStatus,
} from "@/components/tambo/message-suggestions";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
  ThreadContainer,
  useThreadContainerContext,
} from "@/components/tambo/thread-container";
import {
  ThreadContent,
  ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { useMergedRef } from "@/lib/thread-hooks";
import type { Suggestion } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * Props for the MessageThreadFull component
 */
export interface MessageThreadFullProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "showgeminitoggle"> {
  /** Optional context key for the thread */
  contextKey?: string;
  /**
   * Controls the visual styling of messages in the thread.
   * Possible values include: "default", "compact", etc.
   * These values are defined in messageVariants from "@/components/tambo/message".
   * @example variant="compact"
   */
  variant?: VariantProps<typeof messageVariants>["variant"];
  /** Show Gemini toggle only when PhotoEditorChat is active. */
  showgeminitoggle?: boolean;
}

/**
 * A full-screen chat thread component with message history, input, and suggestions
 */
export const MessageThreadFull = React.forwardRef<
  HTMLDivElement,
  MessageThreadFullProps
>(({ className, contextKey, variant, showgeminitoggle, ...props }, ref) => {
  const { containerRef, historyPosition } = useThreadContainerContext();
  const mergedRef = useMergedRef<HTMLDivElement | null>(ref, containerRef);

  const threadHistorySidebar = <></>;

  const defaultSuggestions: Suggestion[] = [
    {
      id: "suggestion-1",
      title: "Play",
      detailedSuggestion: "Play the current song or resume playback",
      messageId: "play-music",
    },
    {
      id: "suggestion-2",
      title: "Add 3 80s songs",
      detailedSuggestion: "Add 3 classic songs from the 1980s to my playlist",
      messageId: "add-80s-songs",
    },
    {
      id: "suggestion-3",
      title: "Reverse the order",
      detailedSuggestion: "Reverse the order of songs in my current playlist",
      messageId: "reverse-order",
    },
    {
      id: "suggestion-4",
      title: "Shuffle playlist",
      detailedSuggestion: "Shuffle the songs in my playlist to play in random order",
      messageId: "shuffle-playlist",
    },
    {
      id: "suggestion-5",
      title: "Create jazz playlist",
      detailedSuggestion: "Create a new playlist with smooth jazz and classic jazz songs",
      messageId: "create-jazz-playlist",
    },
  ];

  // Gemini status polling
  const [geminiStatus, setGeminiStatus] = React.useState("");
  React.useEffect(() => {
    const interval = setInterval(() => {
  const win = typeof window !== "undefined" ? (window as Window & typeof globalThis & { tamboInteractable?: Record<string, unknown> }) : undefined;
      const status = typeof win?.tamboInteractable?.PhotoEditorChat_lastGeminiStatus === "string"
        ? win.tamboInteractable.PhotoEditorChat_lastGeminiStatus
        : "";
      setGeminiStatus(status);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Thread History Sidebar - rendered first if history is on the left */}
      {historyPosition === "left" && threadHistorySidebar}

  <ThreadContainer ref={mergedRef} className={className}>
        <ScrollableMessageContainer className="p-4">
          <ThreadContent variant={variant}>
            <ThreadContentMessages />
          </ThreadContent>
        </ScrollableMessageContainer>

        {/* Message suggestions status */}
        <MessageSuggestions>
          <MessageSuggestionsStatus />
        </MessageSuggestions>

        {/* Gemini status indicator above message input */}
        {geminiStatus && (
          <div className="flex items-center gap-2 px-2 py-1 ml-5 text-xs rounded-md bg-transparent text-muted-foreground mt-2">
            {geminiStatus === "Gemini edit complete." ? (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-200">
                <svg className="h-3 w-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 8 11 13 8 10" /></svg>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-200">
                <svg className="h-3 w-3 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </span>
            )}
            <span>{geminiStatus}</span>
          </div>
        )}
        {/* Message input */}
        <div className="p-4">
          <MessageInput
            contextKey={contextKey}
            {...(showgeminitoggle ? { showgeminitoggle: true } : {})}
          >
            <MessageInputTextarea />
            <MessageInputToolbar>
              <MessageInputMcpConfigButton />
              <MessageInputSubmitButton />
            </MessageInputToolbar>
            <MessageInputError />
          </MessageInput>
        </div>

        {/* Message suggestions */}
        <MessageSuggestions initialSuggestions={defaultSuggestions} maxSuggestions={5}>
          <MessageSuggestionsList />
        </MessageSuggestions>
      </ThreadContainer>

      {/* Thread History Sidebar - rendered last if history is on the right */}
      {historyPosition === "right" && threadHistorySidebar}
    </>
  );
});
MessageThreadFull.displayName = "MessageThreadFull";
