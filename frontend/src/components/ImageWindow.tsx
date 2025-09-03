"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type { Tool } from "./Toolbar";

export type NormalizedRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

type Point = { x: number; y: number };
type PathEl = { id: string; points: Point[]; stroke: string; width: number };

type ImageWindowProps = {
  image: string | null;
  onImageChange: (dataUrl: string | null) => void;
  onRegionChange: (region: NormalizedRegion) => void;
  activeTool: Tool;
  brushWidth?: number;
};

export function ImageWindow({
  image,
  onImageChange,
  onRegionChange,
  activeTool,
  brushWidth = 2,
}: ImageWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  // Fixed purple highlight color
  const highlightColor = "#a855f7";

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const [isSelecting, setIsSelecting] = useState(false);
  const [selStart, setSelStart] = useState<Point | null>(null);
  const [selEnd, setSelEnd] = useState<Point | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [paths, setPaths] = useState<PathEl[]>([]);
  const undoStack = useRef<PathEl[][]>([]);

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Load image element when data URL is available
  useEffect(() => {
    if (!image) {
      setImgEl(null);
      setImgSize(null);
      return;
    }
    const el = new Image();
    el.onload = () => {
      setImgEl(el);
      setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
      // Force canvas resize after image loads
      setTimeout(() => {
        if (containerRef.current && canvasRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const canvas = canvasRef.current;
          canvas.width = Math.max(1, Math.floor(rect.width * dpr));
          canvas.height = Math.max(1, Math.floor(rect.height * dpr));
          canvas.style.width = `${Math.floor(rect.width)}px`;
          canvas.style.height = `${Math.floor(rect.height)}px`;
          draw();
        }
      }, 100);
    };
    el.src = image;
  }, [image]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${Math.floor(rect.width)}px`;
      canvas.style.height = `${Math.floor(rect.height)}px`;
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr]);

  // Fit image initially
  useEffect(() => {
    if (!imgSize || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const margin = 24;
    const availableW = rect.width - margin * 2;
    const availableH = rect.height - margin * 2;
    const scaleFit = Math.min(availableW / imgSize.w, availableH / imgSize.h);
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const imgCx = (imgSize.w * scaleFit) / 2;
    const imgCy = (imgSize.h * scaleFit) / 2;
    setScale(scaleFit);
    setPan({ x: cx - imgCx, y: cy - imgCy });
  }, [imgSize]);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / scale;
      const y = (clientY - rect.top - pan.y) / scale;
      return { x, y };
    },
    [pan.x, pan.y, scale]
  );

  const drawPathSmooth = (ctx: CanvasRenderingContext2D, pts: Point[]) => {
    if (pts.length === 0) return;
    if (pts.length < 3) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply world transform (scaled by dpr)
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, pan.x * dpr, pan.y * dpr);

    // Draw image
    if (imgEl) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgEl, 0, 0);
    }

    // Draw existing paths
    for (const p of paths) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = p.width;
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = p.stroke;
      drawPathSmooth(ctx, p.points);
      ctx.globalAlpha = 1;
    }

    // Draw current path in purple transparent
    if (isDrawing && currentPath.length > 0) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushWidth;
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = highlightColor;
      drawPathSmooth(ctx, currentPath);
      ctx.globalAlpha = 1;
    }

    // Draw selection rectangle in world space
    if (activeTool === "select" && selStart && selEnd) {
      const left = Math.min(selStart.x, selEnd.x);
      const top = Math.min(selStart.y, selEnd.y);
      const w = Math.abs(selEnd.x - selStart.x);
      const h = Math.abs(selEnd.y - selStart.y);
      ctx.save();
      ctx.lineWidth = 1 / scale; // keep 1px look
      const grad = ctx.createLinearGradient(left, top, left + w, top);
      grad.addColorStop(0, "#3185fe");
      grad.addColorStop(0.5, "#1651f3");
      grad.addColorStop(1, "#3185fe");
      ctx.strokeStyle = grad;
      ctx.strokeRect(left, top, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(left, top, w, h);
      ctx.restore();
    }
  }, [
    dpr,
    scale,
    pan.x,
    pan.y,
    imgEl,
    paths,
    isDrawing,
    currentPath,
    brushWidth,
    activeTool,
    selStart,
    selEnd,
    highlightColor,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: MouseEvent) => {
    if (!imgEl) return; // ignore interactions until an image is loaded
    if (!containerRef.current) return;
    const isMiddle = e.button === 1;
    const isRight = e.button === 2;
    const world = screenToWorld(e.clientX, e.clientY);
    if (isMiddle || isRight || activeTool === "cursor") {
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (activeTool === "pencil") {
      setIsDrawing(true);
      setCurrentPath([world]);
      return;
    }
    if (activeTool === "select") {
      setIsSelecting(true);
      setSelStart(world);
      setSelEnd(world);
      return;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!imgEl) return;
    if (isPanning) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      draw();
      return;
    }
    const world = screenToWorld(e.clientX, e.clientY);
    if (isDrawing && activeTool === "pencil") {
      setCurrentPath((prev) => {
        const next = [...prev, world];
        return next;
      });
      draw();
      return;
    }
    if (isSelecting && activeTool === "select") {
      setSelEnd(world);
      draw();
      return;
    }
  };

  const handleMouseUp = () => {
    if (!imgEl) return;
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (isDrawing && activeTool === "pencil") {
      setIsDrawing(false);
      if (currentPath.length > 1) {
        setPaths((prev) => {
          const next = [
            ...prev,
            {
              id: `p_${Date.now()}`,
              points: currentPath,
              stroke: highlightColor,
              width: brushWidth,
            },
          ];
          undoStack.current.push(prev);
          return next;
        });
      }
      setCurrentPath([]);
      draw();
      return;
    }
    if (isSelecting && activeTool === "select") {
      setIsSelecting(false);
      if (selStart && selEnd && imgSize) {
        const left = Math.min(selStart.x, selEnd.x);
        const top = Math.min(selStart.y, selEnd.y);
        const w = Math.abs(selEnd.x - selStart.x);
        const h = Math.abs(selEnd.y - selStart.y);
        const region = {
          x: Math.max(0, Math.min(1, left / imgSize.w)),
          y: Math.max(0, Math.min(1, top / imgSize.h)),
          width: Math.max(0, Math.min(1, w / imgSize.w)),
          height: Math.max(0, Math.min(1, h / imgSize.h)),
        };
        onRegionChange(region);
      }
      return;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!imgEl || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldBefore = {
      x: (cursor.x - pan.x) / scale,
      y: (cursor.y - pan.y) / scale,
    };
    const delta = -e.deltaY;
    const zoomFactor = Math.exp(delta * 0.001);
    const newScale = Math.max(0.1, Math.min(8, scale * zoomFactor));
    const panX = cursor.x - worldBefore.x * newScale;
    const panY = cursor.y - worldBefore.y * newScale;
    setScale(newScale);
    setPan({ x: panX, y: panY });
  };

  const onFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => onImageChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Keyboard shortcuts when focused: Ctrl +/-, Ctrl+Z
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const newScale = Math.min(8, scale * 1.1);
        setScale(newScale);
        return;
      }
      if (e.key === "-") {
        e.preventDefault();
        const newScale = Math.max(0.1, scale / 1.1);
        setScale(newScale);
        return;
      }
      // Undo
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (undoStack.current.length > 0) {
          const prev = undoStack.current.pop();
          if (prev) setPaths(prev);
        }
        return;
      }
    }
  };

  // Context menu off to allow right-drag panning
  const disableContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="gradient-border w-full">
      <div
        ref={containerRef}
        className="relative flex h-[600px] w-full items-center justify-center rounded-xl bg-[--color-background] transition-all duration-200 transform-gpu"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={disableContextMenu}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {!image && (
          <input
            type="file"
            onChange={(e) =>
              e.target.files &&
              e.target.files[0] &&
              onFileChange(e.target.files[0])
            }
            className="absolute h-full w-full cursor-pointer opacity-0"
            accept="image/png, image/jpeg"
          />
        )}
        {image && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full rounded-xl"
          />
        )}
        {!image && (
          <div className="text-center text-[--color-muted] pointer-events-none">
            <p className="text-lg">Upload Image</p>
            <p className="text-sm mt-1">to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
}
