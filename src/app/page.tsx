"use client";

import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { PhotoEditorChat } from "@/components/ui/PhotoEditorChat";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import React, { useState } from "react";
import HomeComponent from "@/components/ui/Home";
import { SimpleMusicPlayer as MusicPlayerComponent } from "@/components/ui/SimpleMusicPlayer";
import { ComputerDisplay, GlobeResult } from "@/components/ui/ComputerDisplay";


export default function Page() {
  const mcpServers = useMcpServers();
  const [activeTab, setActiveTab] = useState("home");
  const [messageThreadKey, setMessageThreadKey] = useState(0);
  const [globeResult, setGlobeResult] = useState<GlobeResult | undefined>(undefined);

  // Call this from your chat/tool logic when you get a place search result
  function handlePlaceSearchResult(result: GlobeResult) {
    setGlobeResult(result);
    setActiveTab("globe");
  }

  // Expose handler globally for chat/tool integration
  if (typeof window !== "undefined") {
    (window as Window & typeof globalThis & { handlePlaceSearchResult?: (result: GlobeResult) => void }).handlePlaceSearchResult = handlePlaceSearchResult;
  }

  React.useEffect(() => {
    setMessageThreadKey(prev => prev + 1);
  }, [activeTab]);


  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <TamboProvider
        apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
        components={components}
        tools={tools}
        tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      >
        <TamboMcpProvider mcpServers={mcpServers}>
          {/* Header bar */}
          <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
            <div className="flex items-center space-x-2">
            <h3 className="text-3xl font-bold z-30 text-gray-300 dark:text-white" style={{textShadow: '0 2px 16px rgba(59,130,246,0.12)'}}>🐙 Tambo OS</h3>

            </div>
            {/* TabBar removed from header */}
            <a 
              href="https://github.com/akdeepankar/tambo-os" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              View Source
            </a>
          </div>
          
          <div className="flex-1 w-full flex overflow-hidden">
            <div className="w-[1200px] min-w-[380px] max-w-6xl h-full border-r flex flex-col">
              <ComputerDisplay
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                globeResult={globeResult}
              >
                {activeTab === "home" && <HomeComponent />}
                {activeTab === "photo" && (
                  <PhotoEditorChat
                    text=""
                    brightness={100}
                    contrast={100}
                    saturation={100}
                    blur={0}
                    hue={0}
                    grayscale={0}
                    sepia={0}
                    invert={0}
                    textX={0}
                    textY={0}
                    textFontSize={16}
                    textColor="#000000"
                    textFontStyle="normal"
                    textFontFamily="Arial"
                    textFontWeight="normal"
                  />
                )}
                {activeTab === "music" && (
                  <MusicPlayerComponent
                    tracks={[{
                      title: "Sample Song",
                      artist: "Sample Artist",
                      album: "Sample Album",
                      duration: 180,
                      preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                      link: "https://example.com",
                      albumCover: "https://static.vecteezy.com/system/resources/previews/021/646/276/non_2x/vinyl-record-with-album-cover-on-package-music-retro-vintage-concept-flat-styleillustration-vector.jpg"
                    }]}
                    currentIndex={0}
                    isPlaying={false}
                  />
                )}
              </ComputerDisplay>
            </div>

            <div className="flex-1 min-w-0 h-full">
              <div className="h-full flex flex-col">
                <MessageThreadFull
                  key={messageThreadKey}
                  className="right w-full max-w-none ml-0"
                  contextKey="tambo-template"
                  showgeminitoggle={activeTab === "photo" ? true : undefined}
                />
              </div>
            </div>
          </div>
        </TamboMcpProvider>
      </TamboProvider>
    </div>
  );
}
