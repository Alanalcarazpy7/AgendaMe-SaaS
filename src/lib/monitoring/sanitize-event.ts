const PRIVATE_ROUTE_PATTERNS = [
  /\/invitacion\/[^/?#]+/gi,
  /\/reserva\/estado\/[^/?#]+/gi,
];

export function sanitizeMonitoringUrl(rawUrl: string) {
  let sanitized = rawUrl;

  try {
    const url = new URL(rawUrl);
    url.search = "";
    sanitized = url.toString();
  } catch {
    sanitized = rawUrl.split("?")[0] ?? rawUrl;
  }

  return PRIVATE_ROUTE_PATTERNS.reduce(
    (url, pattern) => url.replace(pattern, (match) => {
      const lastSlash = match.lastIndexOf("/");
      return `${match.slice(0, lastSlash)}/[redacted]`;
    }),
    sanitized
  );
}

export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    if (event.request.url) {
      event.request.url = sanitizeMonitoringUrl(event.request.url);
    }

    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
  }

  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : undefined;
  }

  if (event.transaction) {
    event.transaction = sanitizeMonitoringUrl(event.transaction);
  }

  event.breadcrumbs?.forEach((breadcrumb) => {
    if (typeof breadcrumb.data?.url === "string") {
      breadcrumb.data.url = sanitizeMonitoringUrl(breadcrumb.data.url);
    }

    if (breadcrumb.data) {
      delete breadcrumb.data.request_body;
      delete breadcrumb.data.response_body;
    }
  });

  delete event.extra;

  return event;
}
import type { ErrorEvent } from "@sentry/nextjs";
