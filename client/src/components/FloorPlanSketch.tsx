import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoomData {
  id: number;
  name: string;
  status: string;
  damageCount: number;
  photoCount: number;
  roomType?: string;
  dimensions?: { length?: number; width?: number; height?: number };
  structure?: string;
}

interface FloorPlanSketchProps {
  rooms: RoomData[];
  currentRoomId: number | null;
  onRoomClick?: (roomId: number) => void;
  className?: string;
  expanded?: boolean;
}

const COLORS = {
  wall: "#1F2937",
  wallStroke: "#374151",
  roomComplete: "rgba(34,197,94,0.08)",
  roomCompleteStroke: "#22C55E",
  roomActive: "rgba(119,99,183,0.12)",
  roomActiveStroke: "#7763B7",
  roomPending: "rgba(241,245,249,0.6)",
  roomPendingStroke: "#94A3B8",
  currentHighlight: "#C6A54E",
  dimensionText: "#6B7280",
  labelText: "#374151",
  roofFill: "rgba(161,98,7,0.06)",
  roofStroke: "#92400E",
  ridgeLine: "#B45309",
  elevationFill: "rgba(59,130,246,0.04)",
  elevationStroke: "#3B82F6",
  groundLine: "#78716C",
  sectionLabel: "#9CA3AF",
  damageMarker: "#EF4444",
  photoMarker: "rgba(119,99,183,0.7)",
};

const WALL_THICKNESS = 3;

interface LayoutRoom {
  room: RoomData;
  x: number;
  y: number;
  w: number;
  h: number;
}

function getRoomDims(room: RoomData, scale: number, minW: number, minH: number) {
  const dims = room.dimensions as any;
  if (dims?.length && dims?.width) {
    return {
      w: Math.max(dims.length * scale, minW),
      h: Math.max(dims.width * scale, minH),
    };
  }
  return { w: minW + 10, h: minH };
}

function roomFill(room: RoomData) {
  if (room.status === "complete") return COLORS.roomComplete;
  if (room.status === "in_progress") return COLORS.roomActive;
  return COLORS.roomPending;
}

function roomStroke(room: RoomData, isCurrent: boolean) {
  if (isCurrent) return COLORS.currentHighlight;
  if (room.status === "complete") return COLORS.roomCompleteStroke;
  if (room.status === "in_progress") return COLORS.roomActiveStroke;
  return COLORS.roomPendingStroke;
}

function layoutFloorPlan(interiorRooms: RoomData[], maxWidth: number, scale: number): { rooms: LayoutRoom[]; width: number; height: number; sharedWalls: Array<{ x1: number; y1: number; x2: number; y2: number }> } {
  if (interiorRooms.length === 0) return { rooms: [], width: 0, height: 0, sharedWalls: [] };

  const minRoomW = 48;
  const minRoomH = 36;
  const pad = WALL_THICKNESS;
  const usableWidth = maxWidth - pad * 2;

  const sized = interiorRooms.map(r => ({ room: r, ...getRoomDims(r, scale, minRoomW, minRoomH) }));
  const placed: LayoutRoom[] = [];
  const sharedWalls: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  let cursorX = pad;
  let cursorY = pad;
  let rowHeight = 0;
  let rowStartIdx = 0;

  for (let i = 0; i < sized.length; i++) {
    const { room, w, h } = sized[i];

    if (cursorX + w > usableWidth + pad && cursorX > pad) {
      cursorX = pad;
      cursorY += rowHeight;
      rowHeight = 0;
      rowStartIdx = placed.length;
    }

    placed.push({ room, x: cursorX, y: cursorY, w, h });

    if (cursorX > pad) {
      const prev = placed[placed.length - 2];
      if (prev && prev.y === cursorY) {
        const wallTop = Math.max(prev.y, cursorY);
        const wallBot = Math.min(prev.y + prev.h, cursorY + h);
        if (wallBot > wallTop) {
          sharedWalls.push({ x1: cursorX, y1: wallTop, x2: cursorX, y2: wallBot });
        }
      }
    }

    if (rowStartIdx < placed.length - 1 || cursorY > pad) {
      for (let pi = 0; pi < placed.length - 1; pi++) {
        const above = placed[pi];
        if (above.y + above.h === cursorY) {
          const overlapLeft = Math.max(above.x, cursorX);
          const overlapRight = Math.min(above.x + above.w, cursorX + w);
          if (overlapRight > overlapLeft) {
            sharedWalls.push({ x1: overlapLeft, y1: cursorY, x2: overlapRight, y2: cursorY });
          }
        }
      }
    }

    cursorX += w;
    rowHeight = Math.max(rowHeight, h);
  }

  if (placed.length > 0) {
    const lastRowRooms = placed.filter(p => p.y + p.h === cursorY + rowHeight);
    if (lastRowRooms.length > 0) {
      const maxH = Math.max(...lastRowRooms.map(r => r.h));
      for (const r of lastRowRooms) {
        if (r.h < maxH) {
          r.h = maxH;
        }
      }
    }
  }

  const totalW = Math.max(...placed.map(p => p.x + p.w)) + pad;
  const totalH = cursorY + rowHeight + pad;

  return { rooms: placed, width: totalW, height: totalH, sharedWalls };
}

function DimensionLabel({ x1, y1, x2, y2, label, offset = 10 }: { x1: number; y1: number; x2: number; y2: number; label: string; offset?: number }) {
  const isHorizontal = Math.abs(y2 - y1) < 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const tickLen = 3;

  if (isHorizontal) {
    const ly = y1 + offset;
    return (
      <g>
        <line x1={x1} y1={ly - tickLen} x2={x1} y2={ly + tickLen} stroke={COLORS.dimensionText} strokeWidth={0.5} />
        <line x1={x1} y1={ly} x2={x2} y2={ly} stroke={COLORS.dimensionText} strokeWidth={0.5} />
        <line x1={x2} y1={ly - tickLen} x2={x2} y2={ly + tickLen} stroke={COLORS.dimensionText} strokeWidth={0.5} />
        <text x={mx} y={ly - 2} textAnchor="middle" fontSize="5.5" fontFamily="Space Mono, monospace" fill={COLORS.dimensionText}>{label}</text>
      </g>
    );
  } else {
    const lx = x1 + offset;
    return (
      <g>
        <line x1={lx - tickLen} y1={y1} x2={lx + tickLen} y2={y1} stroke={COLORS.dimensionText} strokeWidth={0.5} />
        <line x1={lx} y1={y1} x2={lx} y2={y2} stroke={COLORS.dimensionText} strokeWidth={0.5} />
        <line x1={lx - tickLen} y1={y2} x2={lx + tickLen} y2={y2} stroke={COLORS.dimensionText} strokeWidth={0.5} />
        <text x={lx + 4} y={my} textAnchor="start" dominantBaseline="middle" fontSize="5.5" fontFamily="Space Mono, monospace" fill={COLORS.dimensionText}>{label}</text>
      </g>
    );
  }
}

function DoorOpening({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const isVertical = Math.abs(x2 - x1) < 2;
  const doorWidth = 8;

  if (isVertical) {
    const midY = (y1 + y2) / 2;
    const top = midY - doorWidth / 2;
    const bot = midY + doorWidth / 2;
    return (
      <g>
        <rect x={x1 - 2} y={top} width={4} height={doorWidth} fill="white" />
        <path d={`M ${x1} ${top} Q ${x1 + 6} ${top} ${x1 + 6} ${top + 3}`} fill="none" stroke={COLORS.wallStroke} strokeWidth={0.5} />
        <path d={`M ${x1} ${bot} Q ${x1 + 6} ${bot} ${x1 + 6} ${bot - 3}`} fill="none" stroke={COLORS.wallStroke} strokeWidth={0.5} />
      </g>
    );
  } else {
    const midX = (x1 + x2) / 2;
    const left = midX - doorWidth / 2;
    const right = midX + doorWidth / 2;
    return (
      <g>
        <rect x={left} y={y1 - 2} width={doorWidth} height={4} fill="white" />
        <path d={`M ${left} ${y1} Q ${left} ${y1 + 6} ${left + 3} ${y1 + 6}`} fill="none" stroke={COLORS.wallStroke} strokeWidth={0.5} />
        <path d={`M ${right} ${y1} Q ${right} ${y1 + 6} ${right - 3} ${y1 + 6}`} fill="none" stroke={COLORS.wallStroke} strokeWidth={0.5} />
      </g>
    );
  }
}

function InteriorFloorPlan({ rooms: layoutRooms, width, height, sharedWalls, currentRoomId, onRoomClick }: {
  rooms: LayoutRoom[]; width: number; height: number; sharedWalls: Array<{ x1: number; y1: number; x2: number; y2: number }>; currentRoomId: number | null; onRoomClick?: (id: number) => void;
}) {
  if (layoutRooms.length === 0) return null;

  return (
    <g>
      <rect x={0} y={0} width={width} height={height}
        fill="none" stroke={COLORS.wall} strokeWidth={WALL_THICKNESS} rx={1} />

      {layoutRooms.map(({ room, x, y, w, h }, i) => {
        const isCurrent = room.id === currentRoomId;
        const dims = room.dimensions as any;
        const displayName = room.name.length > 16 ? room.name.substring(0, 15) + "…" : room.name;

        return (
          <g key={room.id} onClick={() => onRoomClick?.(room.id)} style={{ cursor: onRoomClick ? "pointer" : "default" }}>
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              x={x} y={y} width={w} height={h}
              fill={roomFill(room)}
              stroke={roomStroke(room, isCurrent)}
              strokeWidth={isCurrent ? 1.5 : 1}
              strokeDasharray={room.status === "not_started" ? "4,2" : "none"}
            />

            {isCurrent && (
              <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} fill="none"
                stroke={COLORS.currentHighlight} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
            )}

            <text x={x + w / 2} y={y + h / 2 - (dims?.length ? 5 : 0)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fontFamily="Work Sans, sans-serif" fontWeight="600"
              fill={COLORS.labelText}>
              {displayName}
            </text>

            {dims?.length && dims?.width && (
              <text x={x + w / 2} y={y + h / 2 + 6}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="5.5" fontFamily="Space Mono, monospace" fill={COLORS.dimensionText}>
                {dims.length}' × {dims.width}'
              </text>
            )}

            {room.damageCount > 0 && (
              <>
                <circle cx={x + w - 7} cy={y + 7} r={5} fill={COLORS.damageMarker} opacity={0.9} />
                <text x={x + w - 7} y={y + 7} textAnchor="middle" dominantBaseline="middle"
                  fontSize="5" fill="white" fontWeight="bold">{room.damageCount}</text>
              </>
            )}

            {room.photoCount > 0 && (
              <>
                <circle cx={x + 7} cy={y + h - 7} r={4} fill={COLORS.photoMarker} />
                <text x={x + 7} y={y + h - 7} textAnchor="middle" dominantBaseline="middle"
                  fontSize="4.5" fill="white" fontWeight="bold">{room.photoCount}</text>
              </>
            )}
          </g>
        );
      })}

      {sharedWalls.map((wall, wi) => (
        <g key={`wall-${wi}`}>
          <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
            stroke={COLORS.wall} strokeWidth={WALL_THICKNESS} />
          <DoorOpening x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} />
        </g>
      ))}

      {layoutRooms.length > 0 && (() => {
        const outerRight = Math.max(...layoutRooms.map(r => r.x + r.w));
        const outerBottom = Math.max(...layoutRooms.map(r => r.y + r.h));
        const outerLeft = Math.min(...layoutRooms.map(r => r.x));
        const outerTop = Math.min(...layoutRooms.map(r => r.y));
        const totalW = outerRight - outerLeft;
        const totalH = outerBottom - outerTop;
        const firstDims = layoutRooms[0].room.dimensions as any;
        return (
          <>
            {firstDims?.length && (
              <DimensionLabel x1={outerLeft} y1={outerBottom} x2={outerRight} y2={outerBottom} label={`${Math.round(totalW / 3)}'`} offset={12} />
            )}
          </>
        );
      })()}
    </g>
  );
}

function ElevationView({ room, x, y, viewWidth, viewHeight, isCurrent, onClick }: {
  room: RoomData; x: number; y: number; viewWidth: number; viewHeight: number;
  isCurrent: boolean; onClick?: () => void;
}) {
  const dims = room.dimensions as any;
  const wallH = viewHeight * 0.55;
  const roofPeakH = viewHeight * 0.35;
  const groundY = y + viewHeight;
  const wallTopY = groundY - wallH;
  const roofPeakY = wallTopY - roofPeakH;

  const wallLeftX = x + viewWidth * 0.12;
  const wallRightX = x + viewWidth * 0.88;
  const wallWidth = wallRightX - wallLeftX;
  const roofOverhang = wallWidth * 0.08;

  const elevType = room.roomType || "";
  const isFrontOrRear = elevType.includes("front") || elevType.includes("rear");

  const displayName = room.name.length > 20 ? room.name.substring(0, 19) + "…" : room.name;

  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <rect x={x} y={y} width={viewWidth} height={viewHeight} fill="none" stroke="none" />

      <line x1={x} y1={groundY} x2={x + viewWidth} y2={groundY}
        stroke={COLORS.groundLine} strokeWidth={1.5} />
      <line x1={x} y1={groundY + 1} x2={x + viewWidth} y2={groundY + 1}
        stroke={COLORS.groundLine} strokeWidth={0.3} strokeDasharray="2,2" />

      <rect x={wallLeftX} y={wallTopY} width={wallWidth} height={wallH}
        fill={COLORS.elevationFill}
        stroke={isCurrent ? COLORS.currentHighlight : COLORS.elevationStroke}
        strokeWidth={isCurrent ? 1.5 : 1} />

      {isFrontOrRear ? (
        <polygon
          points={`${wallLeftX - roofOverhang},${wallTopY} ${(wallLeftX + wallRightX) / 2},${roofPeakY} ${wallRightX + roofOverhang},${wallTopY}`}
          fill={COLORS.roofFill}
          stroke={isCurrent ? COLORS.currentHighlight : COLORS.roofStroke}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      ) : (
        <polygon
          points={`${wallLeftX - roofOverhang},${wallTopY} ${wallLeftX + wallWidth * 0.15},${roofPeakY} ${wallRightX - wallWidth * 0.15},${roofPeakY} ${wallRightX + roofOverhang},${wallTopY}`}
          fill={COLORS.roofFill}
          stroke={isCurrent ? COLORS.currentHighlight : COLORS.roofStroke}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      )}

      {isFrontOrRear && (
        <>
          <rect x={wallLeftX + wallWidth * 0.42} y={groundY - wallH * 0.6}
            width={wallWidth * 0.16} height={wallH * 0.6}
            fill="white" stroke={COLORS.wallStroke} strokeWidth={0.7} />
          <line x1={wallLeftX + wallWidth * 0.5} y1={groundY - wallH * 0.6}
            x2={wallLeftX + wallWidth * 0.5} y2={groundY}
            stroke={COLORS.wallStroke} strokeWidth={0.3} />

          {[0.15, 0.72].map((pos, wi) => (
            <g key={wi}>
              <rect x={wallLeftX + wallWidth * pos} y={wallTopY + wallH * 0.2}
                width={wallWidth * 0.12} height={wallH * 0.25}
                fill="white" stroke={COLORS.wallStroke} strokeWidth={0.5} />
              <line x1={wallLeftX + wallWidth * (pos + 0.06)} y1={wallTopY + wallH * 0.2}
                x2={wallLeftX + wallWidth * (pos + 0.06)} y2={wallTopY + wallH * 0.45}
                stroke={COLORS.wallStroke} strokeWidth={0.3} />
              <line x1={wallLeftX + wallWidth * pos} y1={wallTopY + wallH * 0.325}
                x2={wallLeftX + wallWidth * (pos + 0.12)} y2={wallTopY + wallH * 0.325}
                stroke={COLORS.wallStroke} strokeWidth={0.3} />
            </g>
          ))}
        </>
      )}

      {!isFrontOrRear && (
        <>
          {[0.2, 0.5, 0.75].map((pos, wi) => (
            <g key={wi}>
              <rect x={wallLeftX + wallWidth * pos} y={wallTopY + wallH * 0.2}
                width={wallWidth * 0.1} height={wallH * 0.25}
                fill="white" stroke={COLORS.wallStroke} strokeWidth={0.5} />
              <line x1={wallLeftX + wallWidth * (pos + 0.05)} y1={wallTopY + wallH * 0.2}
                x2={wallLeftX + wallWidth * (pos + 0.05)} y2={wallTopY + wallH * 0.45}
                stroke={COLORS.wallStroke} strokeWidth={0.3} />
            </g>
          ))}
        </>
      )}

      <text x={x + viewWidth / 2} y={y + 8}
        textAnchor="middle" fontSize="6.5" fontFamily="Work Sans, sans-serif" fontWeight="600"
        fill={isCurrent ? COLORS.currentHighlight : COLORS.labelText}>
        {displayName}
      </text>

      {dims?.length && (
        <DimensionLabel
          x1={wallLeftX} y1={groundY} x2={wallRightX} y2={groundY}
          label={`${dims.length}'`} offset={6}
        />
      )}
      {dims?.height && (
        <text x={wallLeftX - 4} y={wallTopY + wallH / 2}
          textAnchor="end" dominantBaseline="middle"
          fontSize="5" fontFamily="Space Mono, monospace" fill={COLORS.dimensionText}>
          {dims.height}'
        </text>
      )}

      {room.damageCount > 0 && (
        <>
          <circle cx={x + viewWidth - 8} cy={y + 8} r={5} fill={COLORS.damageMarker} opacity={0.9} />
          <text x={x + viewWidth - 8} y={y + 8} textAnchor="middle" dominantBaseline="middle"
            fontSize="5" fill="white" fontWeight="bold">{room.damageCount}</text>
        </>
      )}

      {room.photoCount > 0 && (
        <>
          <circle cx={x + viewWidth - 8} cy={y + 18} r={4} fill={COLORS.photoMarker} />
          <text x={x + viewWidth - 8} y={y + 18} textAnchor="middle" dominantBaseline="middle"
            fontSize="4.5" fill="white" fontWeight="bold">{room.photoCount}</text>
        </>
      )}
    </g>
  );
}

function RoofPlanView({ roofRooms, x, y, planWidth, planHeight, currentRoomId, onRoomClick }: {
  roofRooms: RoomData[]; x: number; y: number; planWidth: number; planHeight: number;
  currentRoomId: number | null; onRoomClick?: (id: number) => void;
}) {
  if (roofRooms.length === 0) return null;

  const ridgeCenterX = x + planWidth / 2;
  const ridgeCenterY = y + planHeight / 2;
  const ridgeHalfLen = planWidth * 0.25;

  const ridgeLeft = ridgeCenterX - ridgeHalfLen;
  const ridgeRight = ridgeCenterX + ridgeHalfLen;

  return (
    <g>
      <rect x={x} y={y} width={planWidth} height={planHeight}
        fill={COLORS.roofFill} stroke={COLORS.roofStroke} strokeWidth={1} />

      <line x1={ridgeLeft} y1={ridgeCenterY} x2={ridgeRight} y2={ridgeCenterY}
        stroke={COLORS.ridgeLine} strokeWidth={1.5} />

      <line x1={x} y1={y} x2={ridgeLeft} y2={ridgeCenterY}
        stroke={COLORS.roofStroke} strokeWidth={0.7} strokeDasharray="3,2" />
      <line x1={x + planWidth} y1={y} x2={ridgeRight} y2={ridgeCenterY}
        stroke={COLORS.roofStroke} strokeWidth={0.7} strokeDasharray="3,2" />
      <line x1={x} y1={y + planHeight} x2={ridgeLeft} y2={ridgeCenterY}
        stroke={COLORS.roofStroke} strokeWidth={0.7} strokeDasharray="3,2" />
      <line x1={x + planWidth} y1={y + planHeight} x2={ridgeRight} y2={ridgeCenterY}
        stroke={COLORS.roofStroke} strokeWidth={0.7} strokeDasharray="3,2" />

      <text x={ridgeCenterX} y={ridgeCenterY - 5}
        textAnchor="middle" fontSize="5.5" fontFamily="Space Mono, monospace" fill={COLORS.ridgeLine}>
        RIDGE
      </text>

      {roofRooms.map((room, i) => {
        const isCurrent = room.id === currentRoomId;
        const slopeAreas = [
          { lx: x + 8, ly: y + 8 },
          { lx: x + planWidth - 8, ly: y + 8 },
          { lx: x + 8, ly: y + planHeight - 8 },
          { lx: x + planWidth - 8, ly: y + planHeight - 8 },
        ];
        const pos = slopeAreas[i % slopeAreas.length];
        const dims = room.dimensions as any;
        const pitchLabel = dims?.pitch ? `${dims.pitch}/12 pitch` : "slope";
        const slopeName = room.name.length > 12 ? room.name.substring(0, 11) + "…" : room.name;

        return (
          <g key={room.id} onClick={() => onRoomClick?.(room.id)} style={{ cursor: onRoomClick ? "pointer" : "default" }}>
            <text x={pos.lx} y={pos.ly}
              textAnchor={pos.lx < ridgeCenterX ? "start" : "end"}
              fontSize="6" fontFamily="Work Sans, sans-serif" fontWeight="500"
              fill={isCurrent ? COLORS.currentHighlight : COLORS.labelText}>
              {slopeName}
            </text>
            <text x={pos.lx} y={pos.ly + 9}
              textAnchor={pos.lx < ridgeCenterX ? "start" : "end"}
              fontSize="5" fontFamily="Space Mono, monospace" fill={COLORS.dimensionText}>
              {pitchLabel}
            </text>
            {room.damageCount > 0 && (
              <>
                <circle cx={pos.lx + (pos.lx < ridgeCenterX ? 40 : -40)} cy={pos.ly - 2} r={4} fill={COLORS.damageMarker} opacity={0.9} />
                <text x={pos.lx + (pos.lx < ridgeCenterX ? 40 : -40)} y={pos.ly - 2}
                  textAnchor="middle" dominantBaseline="middle" fontSize="4.5" fill="white" fontWeight="bold">
                  {room.damageCount}
                </text>
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

function SectionHeader({ x, y, width, label, sublabel }: { x: number; y: number; width: number; label: string; sublabel?: string }) {
  return (
    <g>
      <line x1={x} y1={y + 10} x2={x + width} y2={y + 10}
        stroke={COLORS.sectionLabel} strokeWidth={0.3} />
      <text x={x} y={y + 7} fontSize="6.5" fontFamily="Space Mono, monospace" fontWeight="700"
        fill={COLORS.sectionLabel} letterSpacing="1">
        {label}
      </text>
      {sublabel && (
        <text x={x + width} y={y + 7} textAnchor="end"
          fontSize="5.5" fontFamily="Space Mono, monospace" fill={COLORS.sectionLabel} opacity={0.6}>
          {sublabel}
        </text>
      )}
    </g>
  );
}

export default function FloorPlanSketch({ rooms, currentRoomId, onRoomClick, className, expanded }: FloorPlanSketchProps) {
  const structureData = useMemo(() => {
    const groups: Record<string, { interior: RoomData[]; elevations: RoomData[]; roof: RoomData[]; other: RoomData[] }> = {};

    for (const room of rooms) {
      const structure = room.structure || "Main Dwelling";
      if (!groups[structure]) groups[structure] = { interior: [], elevations: [], roof: [], other: [] };

      const rt = room.roomType || "";
      if (rt.startsWith("exterior_elevation_")) {
        groups[structure].elevations.push(room);
      } else if (rt === "exterior_roof_slope" || rt.startsWith("roof")) {
        groups[structure].roof.push(room);
      } else if (rt.startsWith("exterior_")) {
        groups[structure].other.push(room);
      } else {
        groups[structure].interior.push(room);
      }
    }

    return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
  }, [rooms]);

  const svgWidth = expanded ? 520 : 260;
  const scale = expanded ? 4.5 : 3;
  const elevViewW = expanded ? 120 : 58;
  const elevViewH = expanded ? 80 : 50;
  const roofPlanSize = expanded ? 160 : 100;
  const sectionGap = expanded ? 28 : 18;

  const sections = useMemo(() => {
    const result: Array<{ type: string; yOffset: number; height: number; data: any }> = [];
    let runningY = 8;

    for (const group of structureData) {
      if (structureData.length > 1 || group.name !== "Main Dwelling") {
        result.push({ type: "structureLabel", yOffset: runningY, height: 14, data: { name: group.name } });
        runningY += 14;
      }

      if (group.interior.length > 0) {
        const layout = layoutFloorPlan(group.interior, svgWidth - 30, scale);
        const planWidth = Math.min(layout.width, svgWidth - 30);
        const planHeight = layout.height;
        result.push({
          type: "floorPlan",
          yOffset: runningY,
          height: planHeight + sectionGap + 20,
          data: { ...layout, planWidth, planHeight, rooms: layout.rooms },
        });
        runningY += planHeight + sectionGap + 20;
      }

      if (group.roof.length > 0) {
        const rh = roofPlanSize * 0.65;
        result.push({
          type: "roofPlan",
          yOffset: runningY,
          height: rh + sectionGap + 10,
          data: { roofRooms: group.roof, planWidth: roofPlanSize, planHeight: rh },
        });
        runningY += rh + sectionGap + 10;
      }

      if (group.elevations.length > 0) {
        const elevOrder = ["front", "left", "right", "rear"];
        const sorted = [...group.elevations].sort((a, b) => {
          const aIdx = elevOrder.findIndex(e => (a.roomType || "").includes(e));
          const bIdx = elevOrder.findIndex(e => (b.roomType || "").includes(e));
          return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
        });

        const perRow = expanded ? 4 : 2;
        const rowCount = Math.ceil(sorted.length / perRow);
        const totalElevH = rowCount * (elevViewH + 8) + sectionGap;

        result.push({
          type: "elevations",
          yOffset: runningY,
          height: totalElevH,
          data: { elevations: sorted, perRow },
        });
        runningY += totalElevH;
      }

      if (group.other.length > 0) {
        const otherH = Math.ceil(group.other.length / (expanded ? 4 : 2)) * 28 + sectionGap;
        result.push({
          type: "otherExterior",
          yOffset: runningY,
          height: otherH,
          data: { items: group.other },
        });
        runningY += otherH;
      }
    }

    return { sections: result, totalHeight: runningY + 8 };
  }, [structureData, svgWidth, scale, elevViewW, elevViewH, roofPlanSize, sectionGap, expanded]);

  if (rooms.length === 0) {
    return (
      <div className={cn("bg-slate-50 rounded-lg border border-slate-200 p-4", className)}>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-mono">Property Sketch</p>
        <div className="h-24 flex items-center justify-center">
          <p className="text-xs text-slate-300">Rooms will appear as they're created during inspection</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 overflow-hidden", className)} data-testid="floor-plan-sketch">
      <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-semibold">Property Sketch</p>
        <p className="text-[10px] text-slate-400 font-mono">
          {structureData.length > 1 ? `${structureData.length} structures · ` : ""}
          {rooms.length} area{rooms.length !== 1 ? "s" : ""}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${sections.totalHeight}`}
        className="w-full"
        style={expanded ? undefined : { maxHeight: 500 }}
      >
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#F1F5F9" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width={svgWidth} height={sections.totalHeight} fill="url(#grid)" />

        {sections.sections.map((section, si) => {
          switch (section.type) {
            case "structureLabel":
              return (
                <g key={si}>
                  <text x={8} y={section.yOffset + 9} fontSize="7" fontFamily="Work Sans, sans-serif"
                    fontWeight="700" fill={COLORS.labelText} letterSpacing="0.5">
                    {section.data.name.toUpperCase()}
                  </text>
                  <line x1={8} y1={section.yOffset + 12} x2={svgWidth - 8} y2={section.yOffset + 12}
                    stroke={COLORS.wall} strokeWidth={0.5} />
                </g>
              );

            case "floorPlan": {
              const d = section.data;
              const offsetX = (svgWidth - d.planWidth) / 2;
              return (
                <g key={si} transform={`translate(0, ${section.yOffset})`}>
                  <SectionHeader x={8} y={0} width={svgWidth - 16} label="FLOOR PLAN" sublabel={`${d.rooms.length} rooms`} />
                  <g transform={`translate(${offsetX}, 16)`}>
                    <InteriorFloorPlan
                      rooms={d.rooms}
                      width={d.planWidth}
                      height={d.planHeight}
                      sharedWalls={d.sharedWalls || []}
                      currentRoomId={currentRoomId}
                      onRoomClick={onRoomClick}
                    />
                  </g>
                </g>
              );
            }

            case "roofPlan": {
              const d = section.data;
              const offsetX = (svgWidth - d.planWidth) / 2;
              return (
                <g key={si} transform={`translate(0, ${section.yOffset})`}>
                  <SectionHeader x={8} y={0} width={svgWidth - 16} label="ROOF PLAN" sublabel={`${d.roofRooms.length} slopes`} />
                  <g transform={`translate(${offsetX}, 16)`}>
                    <RoofPlanView
                      roofRooms={d.roofRooms}
                      x={0} y={0}
                      planWidth={d.planWidth}
                      planHeight={d.planHeight}
                      currentRoomId={currentRoomId}
                      onRoomClick={onRoomClick}
                    />
                  </g>
                </g>
              );
            }

            case "elevations": {
              const d = section.data;
              const gap = expanded ? 8 : 4;
              const totalRowWidth = d.perRow * elevViewW + (d.perRow - 1) * gap;
              const startX = (svgWidth - totalRowWidth) / 2;

              return (
                <g key={si} transform={`translate(0, ${section.yOffset})`}>
                  <SectionHeader x={8} y={0} width={svgWidth - 16} label="ELEVATIONS" sublabel={`${d.elevations.length} views`} />
                  {d.elevations.map((elev: RoomData, ei: number) => {
                    const col = ei % d.perRow;
                    const row = Math.floor(ei / d.perRow);
                    const ex = startX + col * (elevViewW + gap);
                    const ey = 16 + row * (elevViewH + 8);

                    return (
                      <ElevationView
                        key={elev.id}
                        room={elev}
                        x={ex} y={ey}
                        viewWidth={elevViewW}
                        viewHeight={elevViewH}
                        isCurrent={elev.id === currentRoomId}
                        onClick={onRoomClick ? () => onRoomClick(elev.id) : undefined}
                      />
                    );
                  })}
                </g>
              );
            }

            case "otherExterior": {
              const d = section.data;
              const cols = expanded ? 4 : 2;
              const itemW = (svgWidth - 24) / cols;

              return (
                <g key={si} transform={`translate(0, ${section.yOffset})`}>
                  <SectionHeader x={8} y={0} width={svgWidth - 16} label="OTHER EXTERIOR" sublabel={`${d.items.length} areas`} />
                  {d.items.map((item: RoomData, ii: number) => {
                    const col = ii % cols;
                    const row = Math.floor(ii / cols);
                    const ix = 12 + col * itemW;
                    const iy = 18 + row * 24;
                    const isCurrent = item.id === currentRoomId;

                    return (
                      <g key={item.id} onClick={() => onRoomClick?.(item.id)} style={{ cursor: onRoomClick ? "pointer" : "default" }}>
                        <rect x={ix} y={iy} width={itemW - 6} height={20} rx={2}
                          fill={roomFill(item)}
                          stroke={roomStroke(item, isCurrent)}
                          strokeWidth={isCurrent ? 1.5 : 0.7} />
                        <text x={ix + (itemW - 6) / 2} y={iy + 10.5}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize="6" fontFamily="Work Sans, sans-serif" fontWeight="500"
                          fill={isCurrent ? COLORS.currentHighlight : COLORS.labelText}>
                          {item.name.length > 14 ? item.name.substring(0, 13) + "…" : item.name}
                        </text>
                        {item.damageCount > 0 && (
                          <>
                            <circle cx={ix + itemW - 10} cy={iy + 5} r={4} fill={COLORS.damageMarker} opacity={0.9} />
                            <text x={ix + itemW - 10} y={iy + 5} textAnchor="middle" dominantBaseline="middle"
                              fontSize="4.5" fill="white" fontWeight="bold">{item.damageCount}</text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            }

            default:
              return null;
          }
        })}
      </svg>
    </div>
  );
}
