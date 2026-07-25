"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { sanitizeMonitoringUrl } from "@/lib/monitoring/sanitize-event";

export function MonitoringProviders() {
  return (
    <>
      <Analytics
        beforeSend={(event) => ({
          ...event,
          url: sanitizeMonitoringUrl(event.url),
        })}
      />
      <SpeedInsights
        beforeSend={(data) => ({
          ...data,
          url: sanitizeMonitoringUrl(data.url),
        })}
      />
    </>
  );
}
