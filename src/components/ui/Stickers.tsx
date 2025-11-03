import React from "react";

interface StickersProps {
  /** Called with the sticker data URL when a sticker is selected */
  onSelect?: (dataUrl: string) => void;
  /** Optional className to style the wrapper */
  className?: string;
  /** If provided, only render the sticker with this id (e.g. 'heart') */
  stickerId?: string;
}

// Six simple SVG-based stickers encoded as data URLs. They are lightweight
// and avoid any external network dependency. Each sticker is 240x240.
const rawSvgs = [
  { id: "smile", bg: "#FFD166", emoji: "😀" },
  { id: "heart", bg: "#FF6B6B", emoji: "❤️" },
  { id: "star", bg: "#4ADE80", emoji: "⭐" },
  { id: "spark", bg: "#60A5FA", emoji: "✨" },
  { id: "sunglasses", bg: "#A78BFA", emoji: "😎" },
  { id: "thumbs", bg: "#F9A8D4", emoji: "👍" },
];

function makeDataUrl(bg: string, emoji: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><rect width='100%' height='100%' rx='24' fill='${bg}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI, Roboto, Arial' font-size='96' fill='#111'>${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const stickers = rawSvgs.map((s) => ({
  id: s.id,
  dataUrl: makeDataUrl(s.bg, s.emoji),
}));

export const Stickers: React.FC<StickersProps> = ({
  onSelect,
  className = "",
  stickerId,
}) => {
  const toRender = stickerId
    ? stickers.filter((s) => s.id === stickerId)
    : stickers;

  const colsClass = toRender.length === 1 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className={"w-full " + className}>
      <div className={`grid ${colsClass} gap-3`}>
        {toRender.map((s) => (
          <div
            key={s.id}
            className="relative rounded-lg overflow-hidden border border-border shadow-sm bg-white"
            style={{ aspectRatio: "1 / 1" }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
              <img
                src={s.dataUrl}
                alt={s.id}
                className="w-full h-full object-contain rounded"
                draggable={false}
              />
            </div>
            <div className="absolute left-1 right-1 bottom-2 flex justify-center pointer-events-auto z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    // eslint-disable-next-line no-console
                    console.log("Stickers: add-to-photo clicked", s.id, "onSelect?", !!onSelect);
                  } catch (err) {}
                  // call onSelect asynchronously to avoid any odd sync interactions
                  try {
                    if (onSelect) setTimeout(() => onSelect(s.dataUrl), 0);
                  } catch (e) {
                    try {
                      // eslint-disable-next-line no-console
                      console.error("Stickers: failed to call onSelect", e);
                    } catch (err) {}
                  }
                }}
                className="px-2 py-1 bg-primary text-white text-xs rounded-full shadow hover:bg-primary/90"
                aria-label={`Add ${s.id} to photo`}
              >
                Add to photo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stickers;
