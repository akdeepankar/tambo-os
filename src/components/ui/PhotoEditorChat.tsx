import React, { useRef, useState, useEffect } from "react";
import Home from "./Home";
import { Cog, Star } from "lucide-react";
import { IconPhoto } from "@tabler/icons-react";
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";

interface EditHistoryItem {
  brightness: number;
  contrast: number;
  saturation: number;
  dataUrl: string;
}

export const photoEditorChatSchema = z.object({
  imageUrl: z.string().describe("URL of the image to edit"),
  brightness: z.number().min(0).max(200).default(100).describe("Brightness level (0-200%)"),
  contrast: z.number().min(0).max(200).default(100).describe("Contrast level (0-200%)"),
  saturation: z.number().min(0).max(200).default(100).describe("Saturation level (0-200%)"),
  blur: z.number().min(0).max(20).default(0).describe("Blur radius (0-20px)"),
  hue: z.number().min(0).max(360).default(0).describe("Hue rotation (0-360deg)"),
  grayscale: z.number().min(0).max(100).default(0).describe("Grayscale (0-100%)"),
  sepia: z.number().min(0).max(100).default(0).describe("Sepia (0-100%)"),
  invert: z.number().min(0).max(100).default(0).describe("Invert (0-100%)"),
  text: z.string().default("").describe("Text to overlay on the image"),
  textX: z.number().min(0).max(900).default(50).describe("Text X position (pixels)"),
  textY: z.number().min(0).max(675).default(50).describe("Text Y position (pixels)"),
  textColor: z.string().default("#000000").describe("Text color (hex)"),
  textFontSize: z.number().min(8).max(128).default(32).describe("Text font size (pixels)"),
  textFontFamily: z.string().default("sans-serif").describe("Text font family (CSS font-family)"),
  textFontWeight: z.string().default("bold").describe("Text font weight (normal, bold, 100-900)"),
  textFontStyle: z.string().default("normal").describe("Text font style (normal, italic, oblique)")
});

type PhotoEditorChatProps = Omit<z.infer<typeof photoEditorChatSchema>, "imageUrl"> & {
  imageUrl?: string;
  onSendEditedImage?: (editedDataUrl: string) => void;
  onPropsUpdate?: (next: Partial<z.infer<typeof photoEditorChatSchema>>) => void;
};


function PhotoEditorChatBase({
  imageUrl = "",
  brightness: propBrightness = 100,
  contrast: propContrast = 100,
  saturation: propSaturation = 100,
  blur: propBlur = 0,
  hue: propHue = 0,
  grayscale: propGrayscale = 0,
  sepia: propSepia = 0,
  invert: propInvert = 0,
  text = "",
  textX = 50,
  textY = 50,
  textColor = "#000000",
  textFontSize = 32,
  textFontFamily = "sans-serif",
  textFontWeight = "bold",
  textFontStyle = "normal",
  onSendEditedImage,
  onPropsUpdate,
}: PhotoEditorChatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(propBrightness);
  const [contrast, setContrast] = useState(propContrast);
  const [saturation, setSaturation] = useState(propSaturation);
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [starred, setStarred] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string>("");
  const [imageVersion, setImageVersion] = useState<number>(0);
  const [showCompare, setShowCompare] = useState(false);
  const [compareSlider, setCompareSlider] = useState(50); // percent
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string>("");
  const [pendingPrompt, setPendingPrompt] = useState<string>("");
  // New editing controls
  const [blur, setBlur] = useState(propBlur);
  const [hue, setHue] = useState(propHue);
  const [grayscale, setGrayscale] = useState(propGrayscale);
  const [sepia, setSepia] = useState(propSepia);
  const [invert, setInvert] = useState(propInvert);
  // Add text overlay state
  const [textState, setTextState] = useState(text);
  const [textXState, setTextXState] = useState(textX); // default position x
  const [textYState, setTextYState] = useState(textY); // default position y
  const [textColorState, setTextColorState] = useState(textColor);
  const [textFontSizeState, setTextFontSizeState] = useState(textFontSize);
  const [textFontFamilyState, setTextFontFamilyState] = useState(textFontFamily);
  const [textFontWeightState, setTextFontWeightState] = useState(textFontWeight);
  const [textFontStyleState, setTextFontStyleState] = useState(textFontStyle);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Helper: Convert image to base64 (from dataUrl)
  function getBase64FromDataUrl(dataUrl: string) {
    // Remove prefix if present
    const base64 = dataUrl.split(',')[1];
    return base64;
  }

  // Poll for external Gemini edits from chat and update localImageUrl
  useEffect(() => {
    let lastImage = (typeof window !== "undefined" && (window as any).tamboInteractable?.PhotoEditorChat_lastImage) || "";
    const interval = setInterval(() => {
      const win = typeof window !== "undefined" ? (window as any) : undefined;
      const newImage = win?.tamboInteractable?.PhotoEditorChat_lastImage || "";
      if (newImage && newImage !== lastImage) {
        setLocalImageUrl(newImage);
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setImageVersion(v => v + 1);
        lastImage = newImage;
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Only connect to Gemini when toggle is on
  useEffect(() => {
    async function runGeminiEdit() {
      if (!starred) return; // Only run Gemini if toggle is on
      // Use the current canvas as the image source for Gemini
      let imageData = localImageUrl || imageUrl;
      const canvas = canvasRef.current;
      if (canvas) {
        // Always use the edited canvas (with text and filters)
        imageData = canvas.toDataURL("image/png");
      }
      if (!pendingPrompt || !geminiApiKey || !imageData) return;
      setGeminiLoading(true);
      setGeminiError("");
      try {
        // Debug log: show props sent to Gemini tool
        console.log("Gemini tool call:", {
          imageBase64: getBase64FromDataUrl(imageData),
          prompt: pendingPrompt,
          apiKey: geminiApiKey
        });
        // Dynamically import Gemini tool
        const { geminiImageEdit } = await import("@/services/gemini-image-edit");
        const imageBase64 = getBase64FromDataUrl(imageData);
        const result = await geminiImageEdit({ imageBase64, prompt: pendingPrompt, apiKey: geminiApiKey });
        // result: { data: string, mimeType: string }
        setLocalImageUrl(`data:${result.mimeType};base64,${result.data}`);
        setImageVersion(v => v + 1); // Force re-render
        setPendingPrompt("");
        // Redraw the new image in the canvas
        setTimeout(() => applyFilters(), 0);
      } catch (err: any) {
        setGeminiError(err?.message || "Gemini image edit failed");
      } finally {
        setGeminiLoading(false);
      }
    }
    runGeminiEdit();
  }, [starred, pendingPrompt, geminiApiKey, localImageUrl, imageUrl]);
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setLocalImageUrl(ev.target.result);
          setBrightness(100);
          setContrast(100);
          setSaturation(100);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync with props from chat/interactable (including text overlay)
  useEffect(() => {
    setBrightness(propBrightness);
    setContrast(propContrast);
    setSaturation(propSaturation);
    setBlur(propBlur);
    setHue(propHue);
    setGrayscale(propGrayscale);
    setSepia(propSepia);
    setInvert(propInvert);
    setTextState(text ?? "");
    setTextXState(textX ?? 50);
    setTextYState(textY ?? 50);
    setTextColorState(textColor ?? "#000000");
    setTextFontSizeState(textFontSize ?? 32);
    setTextFontFamilyState(textFontFamily ?? "sans-serif");
    setTextFontWeightState(textFontWeight ?? "bold");
    setTextFontStyleState(textFontStyle ?? "normal");
    // eslint-disable-next-line
  }, [propBrightness, propContrast, propSaturation, propBlur, propHue, propGrayscale, propSepia, propInvert, text, textX, textY, textColor, textFontSize, textFontFamily, textFontWeight, textFontStyle]);

  // Sync main effect states with popup states
  useEffect(() => {
    setBrightness(brightness);
    setContrast(contrast);
    setSaturation(saturation);
    setBlur(blur);
    setHue(hue);
    setGrayscale(grayscale);
    setSepia(sepia);
    setInvert(invert);
  }, [brightness, contrast, saturation, blur, hue, grayscale, sepia, invert]);

  useEffect(() => {
    setTextState(textState);
    setTextXState(textXState);
    setTextYState(textYState);
    setTextColorState(textColorState);
    setTextFontSizeState(textFontSizeState);
    setTextFontFamilyState(textFontFamilyState);
    setTextFontWeightState(textFontWeightState);
    setTextFontStyleState(textFontStyleState);
  }, [textState, textXState, textYState, textColorState, textFontSizeState, textFontFamilyState, textFontWeightState, textFontStyleState]);

  // Report state changes back to AI and expose image globally for chat
  useEffect(() => {
    // Always provide uploaded image to Tambo interactable props if present
    const props = {
      brightness,
      contrast,
      saturation,
      blur,
      hue,
      grayscale,
      sepia,
      invert,
      imageUrl: localImageUrl || imageUrl
    };
    onPropsUpdate?.(props);
    // Expose current image for chat Gemini integration
    if (typeof window !== "undefined") {
      const win = window as any;
      if (!win.tamboInteractable) win.tamboInteractable = {};
      win.tamboInteractable.PhotoEditorChat_lastImage = localImageUrl || imageUrl;
    }
  }, [brightness, contrast, saturation, blur, hue, grayscale, sepia, invert, localImageUrl, imageUrl, onPropsUpdate]);

  // Draw image with filters and set canvas size dynamically
  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!localImageUrl) return;
    const img = new window.Image();
    img.src = localImageUrl;
    img.onload = () => {
      // Set canvas size to image size or max 900x675
      const maxWidth = 900;
      const maxHeight = 675;
      let drawWidth = img.width;
      let drawHeight = img.height;
      if (drawWidth > maxWidth) {
        drawHeight = Math.round(drawHeight * (maxWidth / drawWidth));
        drawWidth = maxWidth;
      }
      if (drawHeight > maxHeight) {
        drawWidth = Math.round(drawWidth * (maxHeight / drawHeight));
        drawHeight = maxHeight;
      }
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      ctx.clearRect(0, 0, drawWidth, drawHeight);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hue}deg) grayscale(${grayscale}%) sepia(${sepia}%) invert(${invert}%)`;
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
      // Draw text overlay if present
      if (textState.trim()) {
        ctx.filter = "none";
        // Only use valid values for fontStyle and fontWeight
        const style = ["normal", "italic", "oblique"].includes(textFontStyleState) ? textFontStyleState : "normal";
        const weight = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(textFontWeightState) ? textFontWeightState : "normal";
        ctx.font = `${style} ${weight} ${textFontSizeState}px ${textFontFamilyState}`;
        ctx.textBaseline = "top";
        // Draw white outline for visibility
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#fff";
        ctx.strokeText(textState, Math.min(Math.max(textXState, 0), drawWidth - 1), Math.min(Math.max(textYState, 0), drawHeight - 1));
        // Draw actual text
        ctx.fillStyle = textColorState;
        ctx.fillText(textState, Math.min(Math.max(textXState, 0), drawWidth - 1), Math.min(Math.max(textYState, 0), drawHeight - 1));
      }
    };
  };

  useEffect(() => {
    applyFilters();
    setSettingsSaved(false);
    // eslint-disable-next-line
  }, [brightness, contrast, saturation, blur, hue, grayscale, sepia, invert, localImageUrl, imageVersion, textState, textXState, textYState, textColorState, textFontSizeState, textFontFamilyState, textFontWeightState, textFontStyleState, settingsSaved]);


  // Store last chat prompt globally and auto-call Gemini tool when toggle is enabled
  useEffect(() => {
    if (!window) return;
    if (!(window as any).tamboInteractable) {
      (window as any).tamboInteractable = {};
    }
    (window as any).tamboInteractable.PhotoEditorChat_lastPrompt = "";
    (window as any).tamboInteractable.PhotoEditorChat_onInteract = (params: { prompt: string }) => {
      (window as any).tamboInteractable.PhotoEditorChat_lastPrompt = params.prompt;
      if (starred && geminiApiKey && (localImageUrl || imageUrl) && params.prompt) {
        setPendingPrompt(params.prompt);
      }
    };
    return () => {
      delete (window as any).tamboInteractable.PhotoEditorChat_onInteract;
      delete (window as any).tamboInteractable.PhotoEditorChat_lastPrompt;
    };
  }, [starred, geminiApiKey, localImageUrl, imageUrl]);

  // Define handleSaveSettings function
  function handleSaveSettings() {
    setSettingsSaved(true);
    setShowSettings(false);
    applyFilters(); // Force canvas update
  }

  // Whenever toggle is enabled or a new prompt arrives, auto-call Gemini tool with the latest prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastPrompt = (window as any)?.tamboInteractable?.PhotoEditorChat_lastPrompt;
    // Only call Gemini if we have a prompt and an uploaded image
    if (starred && geminiApiKey && localImageUrl && lastPrompt && lastPrompt !== pendingPrompt) {
      setPendingPrompt(lastPrompt);
    }
  }, [starred, geminiApiKey, localImageUrl, pendingPrompt]);

  return (
  <div className="h-full w-full flex flex-col bg-gradient-to-br from-white/80 via-primary/10 to-gray-200/80 dark:from-gray-900/80 dark:via-primary/10 dark:to-gray-800/80 backdrop-blur-2xl">
    {/* Navbar-style header */}
    <div className="w-full flex items-center justify-between px-8 py-4 bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(30,30,30,0.85)] border-b border-border shadow-sm">
      <h2 className="font-bold text-2xl text-foreground drop-shadow-lg">Photo Editor</h2>
      <span className="text-muted-foreground text-base">Choose a photo and adjust filters, then send to chat</span>
      {localImageUrl && (
        <div className="flex gap-3 ml-8 items-center">
          {geminiLoading && (
            <span className="text-primary text-sm ml-2">Editing image with Gemini...</span>
          )}
          {geminiError && (
            <span className="text-destructive text-sm ml-2">{geminiError}</span>
          )}
          {/* Delete icon button for Clear Image */}
          <button
            onClick={() => {
              setLocalImageUrl("");
              setEditHistory([]);
              setImageVersion(v => v + 1); // Force re-render to show upload card
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              }
            }}
            className="p-2 rounded-full bg-destructive text-white shadow hover:bg-destructive/80 transition-all duration-200"
            title="Clear Image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
          {/* Download icon button for Download Image */}
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const link = document.createElement("a");
              link.download = "edited-image.png";
              link.href = canvas.toDataURL("image/png");
              link.click();
            }}
            className="p-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 transition-all duration-200"
            title="Download Image"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button
            className="p-2 rounded-full bg-muted hover:bg-accent transition-colors shadow"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Cog className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}
    </div>
    {/* Main editor area */}
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full h-full max-w-full p-8  shadow-2xl border border-border bg-[rgba(255,255,255,0.7)] dark:bg-[rgba(30,30,30,0.7)] backdrop-blur-2xl flex flex-col items-center">
        <div className="flex items-center justify-center mb-8 min-h-[160px] w-full">
          {!localImageUrl ? (
            <div className="flex flex-col items-center mt-20 justify-center">
              <div className="flex flex-col items-center justify-center p-8 rounded-3xl shadow-2xl border border-white/30 dark:border-gray-800/40 max-w-md w-full gap-3"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.65) 60%, rgba(59,130,246,0.10) 100%)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
                }}>
                <span className="mb-2 drop-shadow-lg">
                  <IconPhoto className="w-16 h-16 text-primary/70" />
                </span>
                <span className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 tracking-tight">No Photo Selected</span>
                <span className="text-base text-gray-500 dark:text-gray-400 mb-4 text-center">Choose a photo to start editing.<br />Supported formats: JPG, PNG, GIF.</span>
                <label className="w-full">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <span className="block w-full py-3 px-6 rounded-full bg-gradient-to-r from-primary/10 to-primary/20 text-primary font-semibold text-base text-center cursor-pointer shadow hover:from-primary/20 hover:to-primary/30 transition-all duration-200 border border-primary/20">Select Photo</span>
                </label>
              </div>
            </div>
          ) : showCompare ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full" style={{ maxWidth: 800, minHeight: 300 }}>
                {/* Comparison slider: overlays original and edited image */}
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {/* Only render images if src is non-empty */}
                  {localImageUrl && (
                    <>
                      {/* Original image: uploaded image before Gemini edit */}
                      <img
                        src={imageUrl || localImageUrl}
                        alt="Original"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "auto",
                          clipPath: `inset(0 ${100 - compareSlider}% 0 0)`
                        }}
                      />
                      {/* Edited image: Gemini-edited image */}
                      <img
                        src={localImageUrl}
                        alt="Edited"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "auto",
                          clipPath: `inset(0 0 0 ${compareSlider}%)`
                        }}
                      />
                    </>
                  )}
                  {/* Slider control */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={compareSlider}
                    onChange={e => setCompareSlider(Number(e.target.value))}
                    style={{ position: "absolute", bottom: 10, left: 0, width: "100%", zIndex: 2 }}
                  />
                </div>
              </div>
              <div className="flex justify-between w-full mt-2 px-2 text-sm text-muted-foreground">
                <span>Original</span>
                <span>Edited</span>
              </div>
            </div>
          ) : (
            localImageUrl ? (
              <div className="w-full flex justify-center items-center my-4">
                <div className="w-full" style={{ maxWidth: 800 }}>
                  <canvas
                    ref={canvasRef}
                    className="rounded-2xl border shadow-lg transition-all duration-300 w-full h-auto"
                    style={{ display: "block", margin: "0 auto", maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Settings Popup */}
      {showSettings && (
        <SettingsPopup
          brightness={brightness}
          setBrightness={setBrightness}
          contrast={contrast}
          setContrast={setContrast}
          saturation={saturation}
          setSaturation={setSaturation}
          blur={blur}
          setBlur={setBlur}
          hue={hue}
          setHue={setHue}
          grayscale={grayscale}
          setGrayscale={setGrayscale}
          sepia={sepia}
          setSepia={setSepia}
          invert={invert}
          setInvert={setInvert}
          text={textState}
          setText={setTextState}
          textX={textXState}
          setTextX={setTextXState}
          textY={textYState}
          setTextY={setTextYState}
          textColor={textColorState}
          setTextColor={setTextColorState}
          textFontSize={textFontSizeState}
          setTextFontSize={setTextFontSizeState}
          textFontFamily={textFontFamilyState}
          setTextFontFamily={setTextFontFamilyState}
          textFontWeight={textFontWeightState}
          setTextFontWeight={setTextFontWeightState}
          textFontStyle={textFontStyleState}
          setTextFontStyle={setTextFontStyleState}
          onClose={() => setShowSettings(false)}
          handleSaveSettings={handleSaveSettings}
        />
      )}

      {/* Gemini API Key Popup */}
      {showGeminiApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-2xl">
          <div className="bg-white/80 rounded-2xl shadow-2xl p-8 min-w-[320px] relative border border-primary">
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-accent transition-colors"
              onClick={() => setShowGeminiApiKey(false)}
              title="Close"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-6 text-foreground">Gemini API Key Required</h3>
            <div className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Enter Gemini API Key"
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-primary text-base bg-white/90"
              />
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow hover:bg-primary/90"
                onClick={() => {
                  if (geminiApiKey.trim()) {
                    setShowGeminiApiKey(false);
                  }
                }}
                disabled={!geminiApiKey.trim()}
              >
                Save API Key
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Your Gemini API key is only stored in this session and used for image editing.</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// SettingsPopup component definition
interface SettingsPopupProps {
  brightness: number;
  setBrightness: (v: number) => void;
  contrast: number;
  setContrast: (v: number) => void;
  saturation: number;
  setSaturation: (v: number) => void;
  blur: number;
  setBlur: (v: number) => void;
  hue: number;
  setHue: (v: number) => void;
  grayscale: number;
  setGrayscale: (v: number) => void;
  sepia: number;
  setSepia: (v: number) => void;
  invert: number;
  setInvert: (v: number) => void;
  text: string;
  setText: (v: string) => void;
  textX: number;
  setTextX: (v: number) => void;
  textY: number;
  setTextY: (v: number) => void;
  textColor: string;
  setTextColor: (v: string) => void;
  textFontSize: number;
  setTextFontSize: (v: number) => void;
  textFontFamily: string;
  setTextFontFamily: (v: string) => void;
  textFontWeight: string;
  setTextFontWeight: (v: string) => void;
  textFontStyle: string;
  setTextFontStyle: (v: string) => void;
  onClose: () => void;
  handleSaveSettings: () => void;
}

const SettingsPopup: React.FC<SettingsPopupProps & { handleSaveSettings: () => void }> = ({
  brightness, setBrightness,
  contrast, setContrast,
  saturation, setSaturation,
  blur, setBlur,
  hue, setHue,
  grayscale, setGrayscale,
  sepia, setSepia,
  invert, setInvert,
  text, setText,
  textX, setTextX,
  textY, setTextY,
  textColor, setTextColor,
  textFontSize, setTextFontSize,
  textFontFamily, setTextFontFamily,
  textFontWeight, setTextFontWeight,
  textFontStyle, setTextFontStyle,
  onClose,
  handleSaveSettings
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xl">
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 min-w-[320px] relative border border-primary">
      <button
        className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-accent transition-colors"
        onClick={onClose}
        title="Close"
      >
        ✕
      </button>
      <h3 className="font-bold text-lg mb-6 text-foreground">Edit Photo Settings</h3>
      <div className="flex flex-col gap-4">
        <label>
          Brightness
          <input type="range" min={0} max={200} value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
          <span className="ml-2">{brightness}%</span>
        </label>
        <label>
          Contrast
          <input type="range" min={0} max={200} value={contrast} onChange={e => setContrast(Number(e.target.value))} />
          <span className="ml-2">{contrast}%</span>
        </label>
        <label>
          Saturation
          <input type="range" min={0} max={200} value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
          <span className="ml-2">{saturation}%</span>
        </label>
        <label>
          Blur
          <input type="range" min={0} max={20} value={blur} onChange={e => setBlur(Number(e.target.value))} />
          <span className="ml-2">{blur}px</span>
        </label>
        <label>
          Hue
          <input type="range" min={0} max={360} value={hue} onChange={e => setHue(Number(e.target.value))} />
          <span className="ml-2">{hue}°</span>
        </label>
        <label>
          Grayscale
          <input type="range" min={0} max={100} value={grayscale} onChange={e => setGrayscale(Number(e.target.value))} />
          <span className="ml-2">{grayscale}%</span>
        </label>
        <label>
          Sepia
          <input type="range" min={0} max={100} value={sepia} onChange={e => setSepia(Number(e.target.value))} />
          <span className="ml-2">{sepia}%</span>
        </label>
        <label>
          Invert
          <input type="range" min={0} max={100} value={invert} onChange={e => setInvert(Number(e.target.value))} />
          <span className="ml-2">{invert}%</span>
        </label>
  <div className="flex flex-col gap-4">
          <label className="flex flex-col font-medium text-base text-foreground">
            Text
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full px-2 py-1 rounded-lg border mt-1" placeholder="Enter text to add" />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-col font-medium text-base text-foreground">
              X
              <input type="number" min="0" max="900" value={textX} onChange={e => setTextX(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border mt-1" />
            </label>
            <label className="flex flex-col font-medium text-base text-foreground">
              Y
              <input type="number" min="0" max="675" value={textY} onChange={e => setTextY(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border mt-1" />
            </label>
            <label className="flex flex-col font-medium text-base text-foreground">
              Font Size
              <input type="number" min="8" max="128" value={textFontSize} onChange={e => setTextFontSize(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border mt-1" />
            </label>
            <label className="flex flex-col font-medium text-base text-foreground">
              Font Family
              <input type="text" value={textFontFamily} onChange={e => setTextFontFamily(e.target.value)} className="w-32 px-2 py-1 rounded-lg border mt-1" placeholder="e.g. Arial, serif" />
            </label>
            <label className="flex flex-col font-medium text-base text-foreground">
              Font Weight
              <select value={textFontWeight} onChange={e => setTextFontWeight(e.target.value)} className="w-24 px-2 py-1 rounded-lg border mt-1">
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </label>
            <label className="flex flex-col font-medium text-base text-foreground">
              Font Style
              <select value={textFontStyle} onChange={e => setTextFontStyle(e.target.value)} className="w-24 px-2 py-1 rounded-lg border mt-1">
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
                <option value="oblique">Oblique</option>
              </select>
            </label>
            <label className="flex flex-col font-medium text-base text-foreground">
              Color
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 p-0 border mt-1" />
            </label>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow hover:bg-primary/90 mt-4"
          onClick={handleSaveSettings}
        >
          Save
        </button>
      </div>
    </div>
  </div>
);

export const PhotoEditorChat = withInteractable(PhotoEditorChatBase, {
  componentName: "PhotoEditorChat",
  description:
    "Edit a photo with brightness, contrast, saturation, blur, hue, grayscale, sepia, and invert controls. Shows edit history and allows sending the edited image to chat.",
  propsSchema: photoEditorChatSchema,
});
