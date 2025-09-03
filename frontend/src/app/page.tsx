"use client";

import { useState } from "react";
import { Toolbar, type Tool } from "@/components/Toolbar";
import { ImageWindow, type NormalizedRegion } from "@/components/ImageWindow";
import { PromptPanel } from "@/components/PromptPanel";
import { GradientButton } from "@/components/GradientButton";
import { ResultPanel } from "@/components/ResultPanel";

export default function Home() {
  const [prompt, setPrompt] = useState<string>("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("cursor");
  const [region, setRegion] = useState<NormalizedRegion>(null);
  const [brushWidth, setBrushWidth] = useState<number>(4);

  const handleSubmit = async () => {
    if (!image || !prompt) {
      alert("Please upload an image and enter a prompt.");
      return;
    }
    setIsLoading(true);
    setResultImage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: image.split(",")[1],
          prompt,
          region,
        }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      setResultImage(`data:image/png;base64,${data.image}`);
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-6xl space-y-6">
        {/* Use Flexbox for robust layout */}
        <div className="flex items-center gap-2">
          <Toolbar
            activeTool={activeTool}
            onChange={setActiveTool}
            brushWidth={brushWidth}
            onBrushWidthChange={setBrushWidth}
            className="z-30"
          />
          <div className="flex-1">
            <ImageWindow
              image={image}
              onImageChange={setImage}
              onRegionChange={setRegion}
              activeTool={activeTool}
              brushWidth={brushWidth}
            />
          </div>
        </div>

        <PromptPanel value={prompt} onChange={setPrompt} onPlus={() => {}} />

        <GradientButton onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate"}
        </GradientButton>

        <ResultPanel image={resultImage} />
      </div>
    </main>
  );
}
