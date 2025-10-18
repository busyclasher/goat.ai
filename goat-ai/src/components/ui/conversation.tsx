"use client";

import * as React from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ArrowDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// Main Conversation Container
interface ConversationProps extends React.ComponentPropsWithoutRef<typeof StickToBottom> {
  className?: string;
}

export function Conversation({ 
  className, 
  initial = "smooth",
  resize = "smooth",
  ...props 
}: ConversationProps) {
  return (
    <StickToBottom
      className={cn("relative h-full overflow-hidden", className)}
      initial={initial}
      resize={resize}
      {...props}
    />
  );
}

// Conversation Content Container
interface ConversationContentProps extends React.ComponentPropsWithoutRef<typeof StickToBottom.Content> {
  className?: string;
}

export function ConversationContent({ className, ...props }: ConversationContentProps) {
  return (
    <StickToBottom.Content
      className={cn("h-full overflow-y-auto scroll-smooth", className)}
      {...props}
    />
  );
}

// Empty State Component
interface ConversationEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ConversationEmptyState({
  title = "No messages yet",
  description,
  icon,
  className,
  children,
  ...props
}: ConversationEmptyStateProps) {
  if (children) {
    return (
      <div
        className={cn("flex h-full items-center justify-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("flex h-full items-center justify-center p-4", className)}
      {...props}
    >
      <div className="text-center max-w-md">
        {icon ? (
          <div className="mb-4 flex justify-center">{icon}</div>
        ) : (
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

// Scroll to Bottom Button
interface ConversationScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export function ConversationScrollButton({
  className,
  ...props
}: ConversationScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) {
    return null;
  }

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        "absolute bottom-4 right-4 z-10",
        "flex h-10 w-10 items-center justify-center",
        "rounded-full bg-blue-500 text-white shadow-lg",
        "hover:bg-blue-600 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      aria-label="Scroll to bottom"
      {...props}
    >
      <ArrowDown className="h-5 w-5" />
    </button>
  );
}

