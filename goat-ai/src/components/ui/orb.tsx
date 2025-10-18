"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface OrbProps extends React.HTMLAttributes<HTMLDivElement> {
  agentState?: "idle" | "listening" | "talking" | null;
  avatarUrl?: string;
  size?: number;
}

export function Orb({
  agentState = null,
  avatarUrl,
  size = 200,
  className,
  ...props
}: OrbProps) {
  const getStateStyles = () => {
    switch (agentState) {
      case "listening":
        return {
          ring: "animate-pulse bg-blue-500/30 scale-110",
          glow: "shadow-[0_0_60px_rgba(59,130,246,0.6)]",
        };
      case "talking":
        return {
          ring: "animate-pulse bg-green-500/30 scale-110",
          glow: "shadow-[0_0_60px_rgba(34,197,94,0.6)]",
        };
      case "idle":
        return {
          ring: "animate-breathing bg-gray-500/20 scale-100",
          glow: "shadow-[0_0_30px_rgba(0,0,0,0.2)]",
        };
      default:
        return {
          ring: "bg-gray-500/10 scale-100",
          glow: "shadow-[0_0_20px_rgba(0,0,0,0.1)]",
        };
    }
  };

  const stateStyles = getStateStyles();

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      {/* Outer pulsing ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500",
          stateStyles.ring
        )}
        style={{
          width: size,
          height: size,
        }}
      />

      {/* Middle ring with glow */}
      <div
        className={cn(
          "absolute rounded-full bg-white transition-all duration-500",
          stateStyles.glow
        )}
        style={{
          width: size * 0.85,
          height: size * 0.85,
        }}
      />

      {/* Avatar container */}
      <div
        className="absolute rounded-full overflow-hidden bg-gray-100 border-4 border-white"
        style={{
          width: size * 0.75,
          height: size * 0.75,
        }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Persona avatar"
            width={size * 0.75}
            height={size * 0.75}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
            <span className="text-white text-4xl font-bold">AI</span>
          </div>
        )}
      </div>

      {/* State indicator dot (optional) */}
      {agentState && (
        <div
          className="absolute bottom-2 right-2 rounded-full border-2 border-white"
          style={{ width: size * 0.15, height: size * 0.15 }}
        >
          <div
            className={cn(
              "w-full h-full rounded-full",
              agentState === "listening" && "bg-blue-500 animate-pulse",
              agentState === "talking" && "bg-green-500 animate-pulse",
              agentState === "idle" && "bg-gray-400"
            )}
          />
        </div>
      )}
    </div>
  );
}

