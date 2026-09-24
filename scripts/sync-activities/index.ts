import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CITY_IDS, isCityId, type CityId } from '../../src/data/cities';
import { isActivity } from '../../src/data/types';
import { createFingerprint, normalizeActivity } from './normalize';
import { deduplicateActivities } from './deduplicate';
import { removeExpiredActivities } from './expire';
import { selectSnapshot } from './fallback';
import { requestText } from './sources/http';
import { SOURCE_ADAPTERS } from './sources';
import type {
  NormalizedLiveActivity,
  RawActivityRecord,
  SourceAdapter,
} from './types';
import { validateRawActivity } from './validate';

const OUTPUT_DIRECTORY = resolve('public/data');
const ACTIVITY_OUTPUT = resolve(OUTPUT_DIRECTORY, 'live-activities.json');
const STATUS_OUTPUT = resolve(OUTPUT_DIRECTORY, 'sync-status.json');
const PRODUCTION_SNAPSHOT_URL =
  'https://xiangyu2141480.github.io/guangzhou-weekend-wheel/data/live-activities.json';

export interface SyncStatus {
  generatedAt: string;
  cityIds: CityId[];
  configuredSources: number;
  successfulSources: number;
  failedSources: number;
  sourceCounts: Record<string, number>;
  fetchedCount: number;
  invalidCount: number;
  expiredCount: number;
  duplicateCount: number;
  fallbackCount: number;
  finalCount: number;
  usedFallback: boolean;
  warnings: string[];
}

export interface SyncResult {
  activities: NormalizedLiveActivity[];
  status: SyncStatus;
  summary: string;
}

export interface RunSyncOptions {
  adapters?: SourceAdapter[];
  cityIds?: CityId[];
  loadPrevious?: () => Promise<unknown[]>;
  now?: Date;
}

export const defaultAdapters: readonly SourceAdapter[] = SOURCE_ADAPTERS;

function asNormalizedActivity(
  value: unknown,
  adapter: SourceAdapter,
): NormalizedLiveActivity | null {
  if (!isActivity(value) || !value.live) return null;
  const candidate = value as NormalizedLiveActivity;
  if (
    candidate.cityId !== adapter.cityId ||
    candidate.sourceId !== adapter.id ||
    candidate.sourceType !== adapter.sourceType ||
    candidate.sourceName !== adapter.name ||
    validateRawActivity(candidate, adapter.cityId, adapter.allowedHosts).length > 0
  ) return null;
  const fingerprint = createFingerprint(
    candidate.cityId,
    candidate.name,
    candidate.venue,
    candidate.eventStart,
  );
  return {
    ...candidate,
    id: `event:${candidate.cityId}:${fingerprint.slice(0, 16)}`,
    fingerprint,
  };
}

function normalizeFetchedActivities(
  values: unknown[],
  adapter: SourceAdapter,
  fetchedAt: string,
  now: Date,
): NormalizedLiveActivity[] {
  return values.flatMap((value) => {
    const normalized = asNormalizedActivity(value, adapter);
    if (normalized) return [normalized];
    if (isActivity(value) && value.live) return [];
    if (!value || typeof value !== 'object') return [];
    const raw = value as RawActivityRecord;
    if (
      raw.sourceId !== adapter.id ||
      raw.sourceType !== adapter.sourceType ||
      raw.sourceName !== adapter.name ||
      validateRawActivity(raw, adapter.cityId, adapter.allowedHosts).length > 0
    ) return [];
    return [normalizeActivity(raw, adapter.cityId, fetchedAt, now, adapter.allowedHosts)];
  });
}

function validatedPreviousActivities(
  values: unknown[],
  adapters: readonly SourceAdapter[],
): NormalizedLiveActivity[] {
  return values.flatMap((value) => {
    if (!isActivity(value) || !value.live) return [];
    const source = adapters.find((adapter) =>
      adapter.id === value.sourceId && adapter.cityId === value.cityId);
    if (!source) return [];
    const activity = asNormalizedActivity(value, source);
    return activity ? [activity] : [];
  });
}

export function selectAdapters(
  adapters: readonly SourceAdapter[],
  cityIds: readonly CityId[],
): SourceAdapter[] {
  const selectedCities = new Set(cityIds);
  return adapters.filter((adapter) => selectedCities.has(adapter.cityId));
}

export function validateAdapterRegistry(adapters: readonly SourceAdapter[]): void {
  const identities = new Set<string>();
  for (const adapter of adapters) {
    const identity = adapter.id;
    if (
      !isCityId(adapter.cityId) ||
      !adapter.id ||
      !adapter.name ||
      (adapter.sourceType !== 'government' && adapter.sourceType !== 'official-venue') ||
      adapter.allowedHosts.length === 0 ||
      adapter.allowedHosts.some((host) => !host.trim()) ||
      typeof adapter.allowEmptyResult !== 'boolean' ||
      typeof adapter.fetch !== 'function' ||
      identities.has(identity)
    ) {
      throw new TypeError(`Invalid or duplicate source adapter: ${identity}`);
    }
    identities.add(identity);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createSummary(status: SyncStatus): string {
  const rows = [
    ['Configured sources', status.configuredSources],
    ['Successful sources', status.successfulSources],
    ['Failed sources', status.failedSources],
    ['Fetched', status.fetchedCount],
    ['Invalid', status.invalidCount],
    ['Expired', status.expiredCount],
    ['Duplicates', status.duplicateCount],
    ['Fallback records', status.fallbackCount],
    ['Final live activities', status.finalCount],
  ];
  const sourceRows = Object.entries(status.sourceCounts)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');
  const warnings = status.warnings.length > 0
    ? status.warnings.map((warning) => `- ${warning}`).join('\n')
    : '- None';

  return [
    '## 鱼丸出门部 · Live activity sync',
    '',
    `Cities: ${status.cityIds.join(', ')}`,
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    ...rows.map(([label, count]) => `| ${label} | ${count} |`),
    '',
    '| Source | Records |',
    '| --- | ---: |',
    sourceRows,
    '',
    `Fallback used: ${status.usedFallback ? 'yes' : 'no'}`,
    '',
    'Warnings:',
    warnings,
    '',
  ].join('\n');
}

async function loadPreviousSnapshot(): Promise<unknown[]> {
  try {
    const remote = JSON.parse(await requestText(PRODUCTION_SNAPSHOT_URL)) as unknown;
    if (Array.isArray(remote)) return remote;
  } catch {
    // The committed snapshot remains the first-deploy and offline fallback.
  }

  try {
    const local = JSON.parse(await readFile(ACTIVITY_OUTPUT, 'utf8')) as unknown;
    return Array.isArray(local) ? local : [];
  } catch {
    return [];
  }
}

export async function runSync(options: RunSyncOptions = {}): Promise<SyncResult> {
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();
  const cityIds = options.cityIds ?? [...CITY_IDS];
  if (cityIds.length === 0 || cityIds.some((cityId) => !isCityId(cityId))) {
    throw new TypeError(`Invalid city selection. Allowed values: ${CITY_IDS.join(', ')}`);
  }
  const registry = options.adapters ?? defaultAdapters;
  validateAdapterRegistry(registry);
  const adapters = selectAdapters(registry, cityIds);
  const previousValues = await (options.loadPrevious ?? loadPreviousSnapshot)();
  const previous = removeExpiredActivities(
    validatedPreviousActivities(previousValues, adapters),
    now,
    cityIds,
  ).activities;
  const settled = await Promise.allSettled(
    adapters.map((adapter) => adapter.fetch(generatedAt)),
  );

  const warnings: string[] = [];
  const sourceCounts: Record<string, number> = {};
  const fetched: unknown[] = [];
  const valid: NormalizedLiveActivity[] = [];
  const failedSourceAdapters: SourceAdapter[] = [];
  let successfulSources = 0;
  let failedSources = 0;

  settled.forEach((result, index) => {
    const source = adapters[index];
    if (result.status === 'fulfilled') {
      if (result.value.length === 0 && !source.allowEmptyResult) {
        failedSources += 1;
        failedSourceAdapters.push(source);
        sourceCounts[source.id] = 0;
        warnings.push(`${source.name}: source returned an empty result`);
        return;
      }
      successfulSources += 1;
      sourceCounts[source.id] = result.value.length;
      fetched.push(...result.value);
      valid.push(...normalizeFetchedActivities(result.value, source, generatedAt, now));
      return;
    }
    failedSources += 1;
    failedSourceAdapters.push(source);
    sourceCounts[source.id] = 0;
    warnings.push(`${source.name}: ${errorMessage(result.reason)}`);
  });

  const invalidCount = fetched.length - valid.length;
  const expiry = removeExpiredActivities(valid, now, cityIds);
  const deduplicated = deduplicateActivities(expiry.activities, cityIds);
  const snapshot = selectSnapshot({
    previous,
    current: deduplicated.activities,
    failedSources: failedSourceAdapters,
    cityIds,
  });
  if (snapshot.warning) warnings.push(snapshot.warning);
  if (adapters.length > 0 && failedSources === adapters.length && snapshot.activities.length === 0) {
    throw new Error('All live activity sources failed and no valid previous records are available');
  }

  const status: SyncStatus = {
    generatedAt,
    cityIds,
    configuredSources: adapters.length,
    successfulSources,
    failedSources,
    sourceCounts,
    fetchedCount: fetched.length,
    invalidCount,
    expiredCount: expiry.expiredCount,
    duplicateCount: deduplicated.duplicateCount,
    fallbackCount: snapshot.fallbackCount,
    finalCount: snapshot.activities.length,
    usedFallback: snapshot.usedFallback,
    warnings,
  };

  validateSyncOutput(snapshot.activities, status, adapters, cityIds);
  return {
    activities: snapshot.activities,
    status,
    summary: createSummary(status),
  };
}

function prettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function validateSyncOutput(
  activitiesValue: unknown,
  statusValue: unknown,
  sourceAdapters: readonly SourceAdapter[] = defaultAdapters,
  cityIds: readonly CityId[] = CITY_IDS,
): asserts statusValue is SyncStatus {
  if (!Array.isArray(activitiesValue)) {
    throw new TypeError('live activity output must be an array');
  }
  const activities = activitiesValue.map((item) => {
    if (!isActivity(item) || !item.live) return null;
    const source = sourceAdapters.find((adapter) =>
      adapter.id === item.sourceId && adapter.cityId === item.cityId);
    return source && cityIds.includes(item.cityId) ? asNormalizedActivity(item, source) : null;
  });
  if (activities.some((item) => item === null)) {
    throw new TypeError('live activity output contains an invalid record');
  }
  const fingerprints = activities.map((item) => item!.fingerprint);
  if (new Set(fingerprints).size !== fingerprints.length) {
    throw new TypeError('live activity output contains duplicate fingerprints');
  }

  if (!statusValue || typeof statusValue !== 'object') {
    throw new TypeError('sync status has an invalid shape');
  }
  const status = statusValue as Record<string, unknown>;
  const countKeys = [
    'configuredSources',
    'successfulSources',
    'failedSources',
    'fetchedCount',
    'invalidCount',
    'expiredCount',
    'duplicateCount',
    'fallbackCount',
    'finalCount',
  ] as const;
  if (
    !(typeof status.generatedAt === 'string' || status.generatedAt === null) ||
    !Array.isArray(status.cityIds) ||
    status.cityIds.length === 0 ||
    !status.cityIds.every(isCityId) ||
    new Set(status.cityIds).size !== status.cityIds.length ||
    status.cityIds.length !== cityIds.length ||
    status.cityIds.some((cityId) => !cityIds.includes(cityId)) ||
    !countKeys.every((key) => isNonNegativeInteger(status[key])) ||
    typeof status.usedFallback !== 'boolean' ||
    !Array.isArray(status.warnings) ||
    !status.warnings.every((warning) => typeof warning === 'string') ||
    !status.sourceCounts ||
    typeof status.sourceCounts !== 'object'
  ) {
    throw new TypeError('sync status has an invalid shape');
  }

  const typedStatus = status as unknown as SyncStatus;
  const sourceCounts = Object.values(typedStatus.sourceCounts);
  if (
    !sourceCounts.every(isNonNegativeInteger) ||
    sourceCounts.length !== typedStatus.configuredSources ||
    typedStatus.successfulSources + typedStatus.failedSources !== typedStatus.configuredSources ||
    sourceCounts.reduce((sum, count) => sum + count, 0) !== typedStatus.fetchedCount ||
    typedStatus.fetchedCount - typedStatus.invalidCount - typedStatus.expiredCount -
      typedStatus.duplicateCount + typedStatus.fallbackCount !== typedStatus.finalCount ||
    typedStatus.finalCount !== activities.length ||
    typedStatus.usedFallback !== (typedStatus.fallbackCount > 0)
  ) {
    throw new TypeError('sync status counts do not match the activity output');
  }
}

export async function validateCommittedFiles(): Promise<void> {
  const activities = JSON.parse(await readFile(ACTIVITY_OUTPUT, 'utf8')) as unknown;
  const status = JSON.parse(await readFile(STATUS_OUTPUT, 'utf8')) as unknown;
  const statusCityIds = status && typeof status === 'object'
    ? (status as { cityIds?: unknown }).cityIds
    : undefined;
  const cityIds = Array.isArray(statusCityIds) &&
      statusCityIds.length > 0 &&
      statusCityIds.every(isCityId)
    ? statusCityIds
    : [...CITY_IDS];
  validateSyncOutput(
    activities,
    status,
    selectAdapters(defaultAdapters, cityIds),
    cityIds,
  );
}

export type CliOptions =
  | { validateOnly: true; cityIds: typeof CITY_IDS }
  | { validateOnly: false; cityIds: CityId[] };

export function parseCliArgs(args: readonly string[]): CliOptions {
  if (args.length === 1 && args[0] === '--validate-only') {
    return { validateOnly: true, cityIds: CITY_IDS };
  }
  if (args.length === 1 && args[0] === '--all') {
    return { validateOnly: false, cityIds: [...CITY_IDS] };
  }
  if (args.length === 2 && args[0] === '--city' && isCityId(args[1])) {
    return { validateOnly: false, cityIds: [args[1]] };
  }
  throw new TypeError(
    `Usage: sync-activities (--all | --city <${CITY_IDS.join('|')}> | --validate-only)`,
  );
}

async function writeSyncResult(result: SyncResult): Promise<void> {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  await Promise.all([
    writeFile(ACTIVITY_OUTPUT, prettyJson(result.activities), 'utf8'),
    writeFile(STATUS_OUTPUT, prettyJson(result.status), 'utf8'),
  ]);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await appendFile(summaryPath, result.summary, 'utf8');
}

interface CliDependencies {
  validateFiles?: () => Promise<void>;
  sync?: (options: RunSyncOptions) => Promise<SyncResult>;
  write?: (result: SyncResult) => Promise<void>;
}

export async function runCli(
  args: readonly string[],
  dependencies: CliDependencies = {},
): Promise<void> {
  const options = parseCliArgs(args);
  if (options.validateOnly) {
    await (dependencies.validateFiles ?? validateCommittedFiles)();
    console.log('Live activity JSON validation passed.');
    return;
  }

  const result = await (dependencies.sync ?? runSync)({ cityIds: options.cityIds });
  const adapters = selectAdapters(defaultAdapters, options.cityIds);
  validateSyncOutput(result.activities, result.status, adapters, options.cityIds);
  await (dependencies.write ?? writeSyncResult)(result);
  console.log(result.summary);
}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : '';
if (entryUrl === import.meta.url) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
