import type { BrowserSession } from "./journeyTypes";

export type RecommendationAction = {
  id: string;
  label: string;
  type: "task" | "browseruse";
  buttonLabel?: string;
};

export type UserChatMessage = { id: string; role: "user"; text: string };

export type AssistantChatMessage = {
  id: string;
  role: "assistant";
  text: string;
  foodsToTry: string[];
  nearbyStores: string[];
};

export type ChatMessage = UserChatMessage | AssistantChatMessage;

export function assistantMessageFromApi(
  id: string,
  assistantText: string,
  browserSession: BrowserSession | null | undefined,
): AssistantChatMessage {
  const { foodsToTry, nearbyStores } = parseAssistantLists(assistantText, browserSession ?? null);
  return {
    id,
    role: "assistant",
    text: assistantText,
    foodsToTry,
    nearbyStores,
  };
}

export function parseAssistantLists(text: string, live: BrowserSession | null) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const foodsToTry: string[] = [];
  let seenBullet = false;
  for (const line of lines) {
    const m = line.match(/^[-*•]\s+(.+)$/);
    if (m) {
      seenBullet = true;
      foodsToTry.push(m[1].trim());
    } else if (seenBullet) {
      break;
    }
  }
  const nearbyStores =
    live?.actions?.map((a) => {
      const host = hostFromUrl(a.url);
      return host ? `${a.label} · ${host}` : a.label;
    }) ?? [];
  return { foodsToTry, nearbyStores };
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
