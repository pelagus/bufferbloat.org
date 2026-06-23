import { existsSync, readFileSync } from "fs";
import path from "path";

type PrivateConfig = Partial<Record<string, string>>;

const LOCAL_PRIVATE_CONFIG_PATH = path.join(
  process.cwd(),
  "local-only",
  "private.env"
);

let localConfig: PrivateConfig | null = null;

function parsePrivateConfig(contents: string) {
  const config: PrivateConfig = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");

    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key) {
      config[key] = value;
    }
  }

  return config;
}

function readLocalConfig() {
  if (localConfig) return localConfig;

  if (!existsSync(LOCAL_PRIVATE_CONFIG_PATH)) {
    localConfig = {};
    return localConfig;
  }

  localConfig = parsePrivateConfig(
    readFileSync(LOCAL_PRIVATE_CONFIG_PATH, "utf8")
  );

  return localConfig;
}

export function getPrivateConfig(key: string) {
  return process.env[key] || readLocalConfig()[key] || "";
}
