import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "@/lib/monitoring/sanitize-event";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  beforeSend: sanitizeSentryEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
