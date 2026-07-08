"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

type FaqAccordionProps = {
  items: readonly (readonly [string, string])[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map(([question, answer], index) => {
        const open = openIndex === index;

        return (
          <div
            key={question}
            className={`overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-foreground/5 transition-[border-color,box-shadow] duration-300 ${
              open ? "border-primary/30 shadow-md shadow-primary/10" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:py-5"
              aria-expanded={open}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                  open ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
              </span>
              <span className="flex-1 font-bold">{question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
                  open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ease-[var(--ease-out)] ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </span>
            </button>

            <div
              className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out)]"
              style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pl-17 text-sm leading-6 text-muted-foreground sm:px-6 sm:pl-19">
                  {answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
