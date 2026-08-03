"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkspaceTab = {
  id: string;
  label: string;
  description?: string;
  count?: number;
  icon?: ReactNode;
  content: ReactNode;
};

type DashboardWorkspaceTabsProps = {
  ariaLabel: string;
  tabs: WorkspaceTab[];
  initialTab?: string;
};

export function DashboardWorkspaceTabs({
  ariaLabel,
  tabs,
  initialTab,
}: DashboardWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab ?? tabs[0]?.id ?? "");
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  if (!active) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          role="tablist"
          aria-label={ariaLabel}
          className="flex min-w-max gap-2 rounded-2xl border border-border/70 bg-muted/30 p-1.5"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${ariaLabel}-${tab.id}-tab`}
                aria-selected={selected}
                aria-controls={`${ariaLabel}-${tab.id}-panel`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold outline-none transition-[color,background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] focus-visible:ring-3 focus-visible:ring-ring/40",
                  selected
                    ? "bg-card text-foreground shadow-md shadow-slate-950/5 ring-1 ring-border/70"
                    : "text-muted-foreground hover:-translate-y-0.5 hover:bg-card/70 hover:text-foreground",
                )}
              >
                {tab.icon ? (
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 [&_svg]:h-4 [&_svg]:w-4",
                      selected ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {tab.icon}
                  </span>
                ) : null}
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span
                    className={cn(
                      "min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs tabular-nums",
                      selected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
                {!selected ? (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {active.description ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {active.description}
        </p>
      ) : null}

      <div
        role="tabpanel"
        id={`${ariaLabel}-${active.id}-panel`}
        aria-labelledby={`${ariaLabel}-${active.id}-tab`}
        className="mt-4"
      >
        {active.content}
      </div>
    </div>
  );
}
