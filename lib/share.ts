import { ScenarioConfig, scenarioFileSchema } from "@/lib/sim/types";

const SHARE_PARAM = "scenario";

function hasNativeBase64Url() {
  try {
    return typeof Buffer !== "undefined" && Buffer.isEncoding("base64url");
  } catch {
    return false;
  }
}

function encodeBase64Url(input: string) {
  if (hasNativeBase64Url()) {
    return Buffer.from(input, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(input: string) {
  if (hasNativeBase64Url()) {
    return Buffer.from(input, "base64url").toString("utf8");
  }

  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function buildScenarioFile(config: ScenarioConfig) {
  return {
    schemaVersion: 1 as const,
    createdAt: new Date().toISOString(),
    notes: "Shared report link from Venture Math Lab",
    config,
  };
}

export function encodeScenarioForShare(config: ScenarioConfig) {
  return encodeBase64Url(JSON.stringify(buildScenarioFile(config)));
}

export function decodeScenarioFromShare(encoded: string) {
  try {
    const parsed = scenarioFileSchema.safeParse(JSON.parse(decodeBase64Url(encoded)));
    if (!parsed.success) {
      return {
        ok: false as const,
        error: "This share link does not match the Venture Math Lab scenario schema.",
      };
    }

    return {
      ok: true as const,
      config: parsed.data.config,
    };
  } catch {
    return {
      ok: false as const,
      error: "This share link is invalid or was truncated before it reached the report page.",
    };
  }
}

export function getEncodedScenarioFromLocation(locationLike: Pick<Location, "search" | "hash">) {
  const searchParams = new URLSearchParams(locationLike.search);
  const searchValue = searchParams.get(SHARE_PARAM);
  if (searchValue) {
    return searchValue;
  }

  const hashValue = locationLike.hash.startsWith("#") ? locationLike.hash.slice(1) : locationLike.hash;
  const hashParams = new URLSearchParams(hashValue);
  return hashParams.get(SHARE_PARAM);
}

export function buildScenarioReportPath(config: ScenarioConfig) {
  return `/report#${SHARE_PARAM}=${encodeScenarioForShare(config)}`;
}

export function buildScenarioReportUrl(config: ScenarioConfig, origin: string) {
  return `${origin}${buildScenarioReportPath(config)}`;
}
