import type { ReactNode } from "react";

export function GradientText({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
}) {
  return (
    <Tag className={`bg-linear-to-r from-studio-accent via-cyan-300 to-studio-accent bg-clip-text text-transparent ${className}`}>
      {children}
    </Tag>
  );
}
