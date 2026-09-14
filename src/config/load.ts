import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { isUrl } from '../adapters/read-json.js';
import type { AdapterId } from '../adapters/types.js';
import {
  CONFIG_FILE,
  type LocateContext,
  findConfigFile,
  resolveCatalogPath,
} from '../catalog/locate.js';
import { validationError } from '../errors.js';

const ADAPTERS = [
  'storybook',
  'primer-components-json',
] as const satisfies readonly AdapterId[];

const ConfigSchema = z.strictObject({
  designSystem: z
    .strictObject({
      name: z.string().optional(),
      package: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
  sources: z
    .array(
      z.strictObject({
        adapter: z.enum(ADAPTERS),
        location: z.string().min(1),
      }),
    )
    .default([]),
});
type ConfigFile = z.infer<typeof ConfigSchema>;

export interface SourceConfig {
  adapter: AdapterId;
  location: string;
}

export interface SyncFlags {
  storybook?: string;
  primer?: string;
  catalog?: string;
}

export interface SyncConfig {
  sources: SourceConfig[];
  designSystem: { name?: string; package?: string; version?: string };
  catalogPath: string;
}

export async function resolveSyncConfig(
  ctx: LocateContext,
  flags: SyncFlags,
): Promise<SyncConfig> {
  const configPath = findConfigFile(ctx.cwd);
  const file: ConfigFile = configPath
    ? await readConfig(configPath)
    : { sources: [] };
  const base = configPath ? dirname(configPath) : ctx.cwd;

  const overrides: Partial<Record<AdapterId, string>> = {
    storybook: flags.storybook ?? ctx.env.DESIGN_SYSTEM_AXI_STORYBOOK,
    'primer-components-json': flags.primer ?? ctx.env.DESIGN_SYSTEM_AXI_PRIMER,
  };

  const sources: SourceConfig[] = file.sources
    .filter(source => !overrides[source.adapter])
    .map(source => ({
      adapter: source.adapter,
      location: locate(base, source.location),
    }));
  for (const adapter of ADAPTERS) {
    const location = overrides[adapter];
    if (location)
      sources.push({ adapter, location: locate(ctx.cwd, location) });
  }

  return {
    sources,
    designSystem: file.designSystem ?? {},
    catalogPath: resolveCatalogPath(ctx, flags.catalog),
  };
}

function locate(base: string, location: string): string {
  return isUrl(location) ? location : resolve(base, location);
}

async function readConfig(path: string): Promise<ConfigFile> {
  let data: unknown;
  try {
    data = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw validationError(
      `invalid ${CONFIG_FILE} at ${path}: not JSON`,
      'sync',
    );
  }
  const result = ConfigSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where =
      issue && issue.path.length > 0
        ? issue.path.map(String).join('.')
        : '<root>';
    throw validationError(
      `invalid ${CONFIG_FILE} at ${path}: ${where}: ${issue?.message ?? 'invalid'}`,
      'sync',
    );
  }
  return result.data;
}
