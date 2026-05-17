import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.POSTHOG_API_KEY;
  if (!key) return null;

  if (!_client) {
    _client = new PostHog(key, {
      host: process.env.POSTHOG_HOST ?? "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

export function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  getClient()?.capture({ distinctId, event, properties });
}

export async function shutdownPostHog() {
  await _client?.shutdown();
}
