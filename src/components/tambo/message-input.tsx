"use client";

import { McpConfigModal } from "@/components/tambo/mcp-config-modal";
import { Tooltip, TooltipProvider } from "@/components/tambo/suggestions-tooltip";
import { cn } from "@/lib/utils";
import {
  useIsTamboTokenUpdating,
  useTamboThread,
  useTamboThreadInput,
} from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUp, Square } from "lucide-react";
import * as React from "react";

/**
 * CSS variants for the message input container
 * @typedef {Object} MessageInputVariants
 * @property {string} default - Default styling
 * @property {string} solid - Solid styling with shadow effects
 * @property {string} bordered - Bordered styling with border emphasis
 */
const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: [
        "[&>div]:bg-background",
        "[&>div]:border-0",
        "[&>div]:shadow-xl [&>div]:shadow-black/5 [&>div]:dark:shadow-black/20",
        "[&>div]:ring-1 [&>div]:ring-black/5 [&>div]:dark:ring-white/10",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:rounded-lg",
      ].join(" "),
      bordered: [
        "[&>div]:bg-transparent",
        "[&>div]:border-2 [&>div]:border-gray-300 [&>div]:dark:border-zinc-600",
        "[&>div]:shadow-none",
        "[&_textarea]:bg-transparent",
        "[&_textarea]:border-0",
      ].join(" "),
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * @typedef MessageInputContextValue
 * @property {string} value - The current input value
 * @property {function} setValue - Function to update the input value
 * @property {function} submit - Function to submit the message
 * @property {function} handleSubmit - Function to handle form submission
 * @property {boolean} isPending - Whether a submission is in progress
 * @property {Error|null} error - Any error from the submission
 * @property {string|undefined} contextKey - The thread context key
 * @property {HTMLTextAreaElement|null} textareaRef - Reference to the textarea element
 * @property {string | null} submitError - Error from the submission
 * @property {function} setSubmitError - Function to set the submission error
 */
interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    contextKey?: string;
    streamResponse?: boolean;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  contextKey?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * React Context for sharing message input data and functions among sub-components.
 * @internal
 */
const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * Throws an error if used outside of a MessageInput component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.
 * @internal
 */
const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput"
    );
  }
  return context;
};

/**
 * Props for the MessageInput component.
 * Extends standard HTMLFormElement attributes.
 */
export interface MessageInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  /** The context key identifying which thread to send messages to. */
  contextKey?: string;
  /** Optional styling variant for the input container. */
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  /** The child elements to render within the form container. */
  children?: React.ReactNode;
  /** Show Gemini toggle only when PhotoEditorChat is active. */
  showgeminitoggle?: boolean;
}

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput contextKey="my-thread" variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, contextKey, variant, ...props }, ref) => {
    const { value, setValue, submit, isPending, error } = useTamboThreadInput();
    const { cancel } = useTamboThread();
    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Gemini toggle state
    const [geminiEnabled, setGeminiEnabled] = React.useState(false);
  // Gemini API key
  const [geminiApiKey, setGeminiApiKey] = React.useState("");
  // Popup state for API key entry
  const [showGeminiApiKey, setShowGeminiApiKey] = React.useState(false);

    // Get selected image from PhotoEditorChat (global window)
    // Helper to safely access window.tamboInteractable
    const getPhotoEditorImage = () => {
      if (typeof window !== "undefined") {
        const win = window as any;
        if (win.tamboInteractable?.PhotoEditorChat_lastImage) {
          return win.tamboInteractable.PhotoEditorChat_lastImage;
        }
      }
      return "";
    };

    // Resize image before base64 conversion
    const resizeImage = (dataUrl: string, maxWidth = 900, maxHeight = 675): Promise<string> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = dataUrl;
      });
    };

    React.useEffect(() => {
      setDisplayValue(value);
      if (value && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [value]);

    const handleSubmit = React.useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim() || isSubmitting) return;

        setSubmitError(null);
        setDisplayValue("");
        setIsSubmitting(true);

        try {
          // If Gemini toggle is enabled, call Gemini edit tool
          if (geminiEnabled && geminiApiKey) {
            let imageData = getPhotoEditorImage();
            if (!imageData) throw new Error("No image selected in Photo Editor");
            // Resize before base64
            imageData = await resizeImage(imageData);
            const imageBase64 = imageData.split(',')[1];
            const { geminiImageEdit } = await import("@/services/gemini-image-edit");
            let geminiStatus = "Editing image with Gemini...";
            if (typeof window !== "undefined") {
              const win = window as any;
              if (!win.tamboInteractable) win.tamboInteractable = {};
              win.tamboInteractable.PhotoEditorChat_lastGeminiStatus = geminiStatus;
            }
            try {
              const geminiResult = await geminiImageEdit({ imageBase64, prompt: value, apiKey: geminiApiKey });
              const { data, mimeType } = geminiResult;
              geminiStatus = "Gemini edit complete.";
              if (typeof window !== "undefined") {
                const win = window as any;
                if (!win.tamboInteractable) win.tamboInteractable = {};
                win.tamboInteractable.PhotoEditorChat_lastGeminiStatus = geminiStatus;
              }
              if (typeof window !== "undefined") {
                const win = window as any;
                if (!win.tamboInteractable) win.tamboInteractable = {};
                win.tamboInteractable.PhotoEditorChat_lastImage = `data:${mimeType};base64,${data}`;
              }
            } catch (geminiErr: any) {
              geminiStatus = geminiErr?.message || "Gemini image edit failed";
              if (typeof window !== "undefined") {
                const win = window as any;
                if (!win.tamboInteractable) win.tamboInteractable = {};
                win.tamboInteractable.PhotoEditorChat_lastGeminiStatus = geminiStatus;
              }
              throw geminiErr;
            }
          } else {
            await submit({
              contextKey,
              streamResponse: true,
            });
            setValue("");
            setTimeout(() => {
              textareaRef.current?.focus();
            }, 0);
          }
        } catch (error) {
          console.error("Failed to submit message:", error);
          setDisplayValue(value);
          setSubmitError(
            error instanceof Error
              ? error.message
              : "Failed to send message. Please try again."
          );
          cancel();
        } finally {
          setIsSubmitting(false);
        }
      },
      [value, submit, contextKey, setValue, setDisplayValue, setSubmitError, cancel, isSubmitting, geminiEnabled, geminiApiKey],
    );

    const contextValue = React.useMemo(
      () => ({
        value: displayValue,
        setValue: (newValue: string) => {
          setValue(newValue);
          setDisplayValue(newValue);
        },
        submit,
        handleSubmit,
        isPending: isPending ?? isSubmitting,
        error,
        contextKey,
        textareaRef,
        submitError,
        setSubmitError,
      }),
      [displayValue, setValue, submit, handleSubmit, isPending, isSubmitting, error, contextKey, submitError]
    );
    return (
      <MessageInputContext.Provider value={contextValue as MessageInputContextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={cn(messageInputVariants({ variant }), className)}
          data-slot="message-input-form"
          {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== "showgeminitoggle"))}
        >
          <div className="flex flex-col border border-gray-200 rounded-xl bg-background shadow-md p-2 px-3">
            {/* Gemini toggle UI - only show if showgeminitoggle is true */}
            {props.showgeminitoggle && (
              <div className="flex items-center mb-2">
                <label className="flex items-center cursor-pointer select-none mr-2">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={geminiEnabled}
                      onChange={() => {
                        setGeminiEnabled(s => !s);
                        if (!geminiEnabled) setShowGeminiApiKey(true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-muted rounded-full peer-checked:bg-yellow-400 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow flex items-center justify-center transition-all duration-200 peer-checked:translate-x-4">
                      <svg className={`w-3 h-3 ${geminiEnabled ? 'text-yellow-500' : 'text-muted-foreground'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.16-5.13a4.5 4.5 0 016.32-6.32 4.5 4.5 0 016.32 6.32z"></path></svg>
                    </div>
                  </div>
                  <span className="ml-2 text-sm font-medium">Gemini</span>
                </label>
                {/* Popup for API key input */}
                {showGeminiApiKey && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 min-w-[320px] flex flex-col gap-4">
                      <h3 className="text-lg font-semibold mb-2">Enter Gemini API Key</h3>
                      <input
                        type="text"
                        placeholder="Gemini API Key"
                        value={geminiApiKey}
                        onChange={e => setGeminiApiKey(e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          className="px-3 py-1 bg-primary text-white rounded shadow hover:bg-primary/90"
                          onClick={() => setShowGeminiApiKey(false)}
                          disabled={!geminiApiKey}
                        >Save</button>
                        <button
                          className="px-3 py-1 bg-muted text-foreground rounded shadow hover:bg-muted/80"
                          onClick={() => {
                            setShowGeminiApiKey(false);
                            setGeminiEnabled(false);
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {children}
            {/* Gemini status and errors are no longer shown here. */}
          </div>
        </form>
      </MessageInputContext.Provider>
    );
  }
);
MessageInput.displayName = "MessageInput";

/**
 * Props for the MessageInputTextarea component.
 * Extends standard TextareaHTMLAttributes.
 */
export interface MessageInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Custom placeholder text. */
  placeholder?: string;
}

/**
 * Textarea component for entering message text.
 * Automatically connects to the context to handle value changes and key presses.
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea placeholder="Type your message..." />
 * </MessageInput>
 * ```
 */
const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, textareaRef, handleSubmit } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className
      )}
      disabled={isPending || isUpdatingToken}
      placeholder={placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/**
 * Props for the MessageInputSubmitButton component.
 * Extends standard ButtonHTMLAttributes.
 */
export interface MessageInputSubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional content to display inside the button. */
  children?: React.ReactNode;
}

/**
 * Submit button component for sending messages.
 * Automatically connects to the context to handle submission state.
 * @component MessageInput.SubmitButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <div className="flex justify-end mt-2 p-1">
 *     <MessageInput.SubmitButton />
 *   </div>
 * </MessageInput>
 * ```
 */
const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();
  const { cancel } = useTamboThread();
  const isUpdatingToken = useIsTamboTokenUpdating();

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cancel();
  };

  const buttonClasses = cn(
    "w-10 h-10 bg-black/80 text-white rounded-lg hover:bg-black/70 disabled:opacity-50 flex items-center justify-center enabled:cursor-pointer",
    className,
  );

  return (
    <button
      ref={ref}
      type={isPending ? "button" : "submit"}
      disabled={isUpdatingToken}
      onClick={isPending ? handleCancel : undefined}
      className={buttonClasses}
      aria-label={isPending ? "Cancel message" : "Send message"}
      data-slot={isPending ? "message-input-cancel" : "message-input-submit"}
      {...props}
    >
      {children ??
        (isPending ? (
          <Square className="w-4 h-4" fill="currentColor" />
        ) : (
          <ArrowUp className="w-5 h-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

/**
 * MCP Config Button component for opening the MCP configuration modal.
 * @component MessageInput.McpConfigButton
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * </MessageInput>
 * ```
 */
const MessageInputMcpConfigButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const buttonClasses = cn(
    "w-10 h-10 bg-muted text-primary rounded-lg hover:bg-muted/80 disabled:opacity-50 flex items-center justify-center cursor-pointer",
    className
  );

  const MCPIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        color="#000000"
        fill="none"
      >
        <path
          d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32823 15.921C6.22373 14.8164 6.22373 13.0255 7.32823 11.921L13.4999 5.74939"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip
        content="Configure MCP Servers"
        side="right"
        className="bg-muted text-primary"
      >
        <button
          ref={ref}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={buttonClasses}
          aria-label="Open MCP Configuration"
          data-slot="message-input-mcp-config"
          {...props}
        >
          <MCPIcon />
        </button>
      </Tooltip>
      <McpConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </TooltipProvider>
  );
});
MessageInputMcpConfigButton.displayName = "MessageInput.McpConfigButton";

/**
 * Props for the MessageInputError component.
 * Extends standard HTMLParagraphElement attributes.
 */
export type MessageInputErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Error message component for displaying submission errors.
 * Automatically connects to the context to display any errors.
 * @component MessageInput.Error
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  MessageInputErrorProps
>(({ className, ...props }, ref) => {
  const { error, submitError } = useMessageInputContext();

  if (!error && !submitError) {
    return null;
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm text-destructive mt-2", className)}
      data-slot="message-input-error"
      {...props}
    >
      {error?.message ?? submitError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";

/**
 * Container for the toolbar components (like submit button and MCP config button).
 * Provides correct spacing and alignment.
 * @component MessageInput.Toolbar
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea />
 *   <MessageInput.Toolbar>
 *     <MessageInput.McpConfigButton />
 *     <MessageInput.SubmitButton />
 *   </MessageInput.Toolbar>
 * ```
 */
const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-between items-center mt-2 p-1 gap-2",
        className
      )}
      data-slot="message-input-toolbar"
      {...props}
    >
      <div className="flex items-center gap-2">
        {/* Left side - everything except submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return null; // Don't render submit button here
          }
          return child;
        })}
      </div>
      <div className="flex items-center gap-2">
        {/* Right side - only submit button */}
        {React.Children.map(children, (child): React.ReactNode => {
          if (
            React.isValidElement(child) &&
            child.type === MessageInputSubmitButton
          ) {
            return child; // Only render submit button here
          }
          return null;
        })}
      </div>
    </div>
  );
});
MessageInputToolbar.displayName = "MessageInput.Toolbar";

// --- Exports ---
export {
  MessageInput,
  MessageInputError,
  MessageInputMcpConfigButton,
  MessageInputSubmitButton,
  MessageInputTextarea,
  MessageInputToolbar,
  messageInputVariants,
};
