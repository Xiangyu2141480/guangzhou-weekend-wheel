import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
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
import {
  createManifest,
  deriveAvailability,
  validateCitySnapshot,
  validateManifest,
  type ActivityManifest,
  type CityActivitySnapshot,
  type SnapshotSource,
} from './snapshot';

const OUTPUT_DIRECTORY = resolve('public/data');
const CITY_OUTPUT_DIRECTORY = resolve(OUTPUT_DIRECTORY, 'cities');
const MANIFEST_OUTPUT = resolve(OUTPUT_DIRECTORY, 'manifest.json');
const ACTIVITY_OUTPUT = resolve(OUTPUT_DIRECTORY, 'live-activities.json');
const STATUS_OUTPUT = resolve(OUTPUT_DIRECTORY, 'sync-status.json');
const PRODUCTION_DATA_URL =
  'https://xiangyu2141480.github.io/guangzhou-weekend-wheel/data';

export interface SyncStatus {
  generatedAt: string | null;
  cityIds: CityId[];
  configuredSources: number;
  successfulSources: number;
  failedSources: number;
  failedSourceIds: string[];
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

export interface PublicationResult {
  manifest: ActivityManifest;
  snapshots: CityActivitySnapshot[];
  compatibilityActivities: NormalizedLiveActivity[];
  compatibilityStatus: SyncStatus;
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
    if (normalized) {
      return [{
        ...normalized,
        fetchedAt,
        lastVerifiedAt: fetchedAt,
      }];
    }
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

export function createSummary(status: SyncStatus): string {
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

export function createDeploymentSummary(
  manifest: ActivityManifest,
  snapshots: readonly CityActivitySnapshot[],
  commitSha = process.env.GITHUB_SHA,
): string {
  const cityRows = snapshots.map((snapshot) => {
    const oldestVerifiedAt = snapshot.activities.reduce<string | null>((oldest, activity) =>
      !oldest || activity.lastVerifiedAt < oldest ? activity.lastVerifiedAt : oldest, null);
    const successfulSources = snapshot.sources.filter((source) =>
      source.availability === 'fresh').length;
    return `| ${snapshot.cityId} | ${snapshot.availability} | ${successfulSources} | ` +
      `${snapshot.sources.length - successfulSources} | ` +
      `${snapshot.counts.current} | ${snapshot.counts.fallback} | ${snapshot.counts.final} | ` +
      `${oldestVerifiedAt ?? '—'} |`;
  });
  const sourceRows = snapshots.flatMap((snapshot) => snapshot.sources.map((source) => {
    const fetchResult = source.availability === 'fresh' ? 'success' : 'failure';
    return `| ${snapshot.cityId} | ${source.name} | ${fetchResult} | ` +
      `${source.availability} | ${source.fetched} | ${source.final} |`;
  }));
  const warnings = snapshots.flatMap((snapshot) =>
    snapshot.warnings.map((warning) => `- ${snapshot.cityId}: ${warning}`));

  return [
    '## 鱼丸出门部 · Atomic activity snapshots',
    '',
    `Commit SHA: \`${commitSha ?? 'unknown'}\``,
    '',
    `Manifest generated: ${manifest.generatedAt ?? 'bootstrap'}`,
    '',
    '| City | Availability | Sources succeeded | Sources failed | Current | Fallback | Final | Oldest lastVerifiedAt |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |',
    ...cityRows,
    '',
    '| City | Source | Fetch result | Availability | Fetched | Final |',
    '| --- | --- | --- | --- | ---: | ---: |',
    ...sourceRows,
    '',
    'Warnings:',
    ...(warnings.length > 0 ? warnings : ['- None']),
    '',
  ].join('\n');
}

async function loadPreviousSnapshot(cityIds: readonly CityId[]): Promise<unknown[]> {
  const cityId = cityIds.length === 1 ? cityIds[0] : null;
  try {
    const path = cityId ? `cities/${cityId}.json` : 'live-activities.json';
    const remote = JSON.parse(await requestText(`${PRODUCTION_DATA_URL}/${path}`)) as unknown;
    if (Array.isArray(remote)) return remote;
    if (remote && typeof remote === 'object') {
      const activities = (remote as { activities?: unknown }).activities;
      if (Array.isArray(activities)) return activities;
    }
  } catch {
    // The committed snapshot remains the first-deploy and offline fallback.
  }

  try {
    const path = cityId
      ? resolve(CITY_OUTPUT_DIRECTORY, `${cityId}.json`)
      : ACTIVITY_OUTPUT;
    const local = JSON.parse(await readFile(path, 'utf8')) as unknown;
    if (Array.isArray(local)) return local;
    if (local && typeof local === 'object') {
      const activities = (local as { activities?: unknown }).activities;
      return Array.isArray(activities) ? activities : [];
    }
    return [];
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
  const previousValues = await (options.loadPrevious ?? (() => loadPreviousSnapshot(cityIds)))();
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
    now,
  });
  if (snapshot.warning) warnings.push(snapshot.warning);
  const status: SyncStatus = {
    generatedAt,
    cityIds,
    configuredSources: adapters.length,
    successfulSources,
    failedSources,
    failedSourceIds: failedSourceAdapters.map((adapter) => adapter.id),
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

export function createCitySnapshot(
  result: SyncResult,
  cityId: CityId,
  adapters: readonly SourceAdapter[],
): CityActivitySnapshot {
  const activities = result.activities.filter((activity) => activity.cityId === cityId);
  const fallbackActivities = activities.filter((activity) =>
    activity.lastVerifiedAt !== result.status.generatedAt);
  const fallbackIds = new Set(fallbackActivities.map((activity) => activity.id));
  const failedIds = new Set(result.status.failedSourceIds);
  const sources: SnapshotSource[] = adapters.map((adapter) => {
    const sourceActivities = activities.filter((activity) => activity.sourceId === adapter.id);
    const fallbackCount = sourceActivities.filter((activity) => fallbackIds.has(activity.id)).length;
    return {
      id: adapter.id,
      name: adapter.name,
      sourceType: adapter.sourceType,
      availability: failedIds.has(adapter.id)
        ? (fallbackCount > 0 ? 'fallback' : 'unavailable')
        : 'fresh',
      fetched: result.status.sourceCounts[adapter.id] ?? 0,
      final: sourceActivities.length,
    };
  });
  const currentCount = activities.length - fallbackActivities.length;

  return {
    schemaVersion: 2,
    cityId,
    generatedAt: result.status.generatedAt,
    availability: deriveAvailability(
      result.status.successfulSources,
      result.status.failedSources,
      currentCount,
      fallbackActivities.length,
    ),
    sources,
    counts: {
      fetched: result.status.fetchedCount,
      invalid: result.status.invalidCount,
      expired: result.status.expiredCount,
      duplicate: result.status.duplicateCount,
      current: currentCount,
      fallback: fallbackActivities.length,
      final: activities.length,
    },
    warnings: result.status.warnings,
    activities,
  };
}

export async function runPublication(
  cityIds: readonly CityId[] = CITY_IDS,
  options: Omit<RunSyncOptions, 'cityIds'> = {},
): Promise<PublicationResult> {
  const results = await Promise.all(cityIds.map((cityId) =>
    runSync({ ...options, cityIds: [cityId] })));
  const updatedSnapshots = results.map((result, index) => {
    const cityId = cityIds[index];
    return createCitySnapshot(result, cityId, selectAdapters(options.adapters ?? defaultAdapters, [cityId]));
  });
  const updatedByCity = new Map(updatedSnapshots.map((snapshot) => [snapshot.cityId, snapshot]));
  const snapshots = await Promise.all(CITY_IDS.map(async (cityId) => {
    const updated = updatedByCity.get(cityId);
    if (updated) return updated;
    const existing = JSON.parse(
      await readFile(resolve(CITY_OUTPUT_DIRECTORY, `${cityId}.json`), 'utf8'),
    ) as unknown;
    validateCitySnapshot(existing, cityId, selectAdapters(defaultAdapters, [cityId]));
    return existing;
  }));
  const manifest = createManifest(snapshots);
  const guangzhouIndex = cityIds.indexOf('guangzhou');
  const compatibilityActivities = guangzhouIndex >= 0
    ? results[guangzhouIndex].activities
    : JSON.parse(await readFile(ACTIVITY_OUTPUT, 'utf8')) as NormalizedLiveActivity[];
  const compatibilityStatus = guangzhouIndex >= 0
    ? results[guangzhouIndex].status
    : JSON.parse(await readFile(STATUS_OUTPUT, 'utf8')) as SyncStatus;

  return {
    manifest,
    snapshots,
    compatibilityActivities,
    compatibilityStatus,
    summary: createDeploymentSummary(manifest, snapshots),
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
    !Array.isArray(status.failedSourceIds) ||
    !status.failedSourceIds.every((id) => typeof id === 'string') ||
    new Set(status.failedSourceIds).size !== status.failedSourceIds.length ||
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
    typedStatus.failedSourceIds.length !== typedStatus.failedSources ||
    typedStatus.failedSourceIds.some((id) => !(id in typedStatus.sourceCounts)) ||
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
  const snapshots = await Promise.all(CITY_IDS.map(async (cityId) => {
    const value = JSON.parse(
      await readFile(resolve(CITY_OUTPUT_DIRECTORY, `${cityId}.json`), 'utf8'),
    ) as unknown;
    validateCitySnapshot(value, cityId, selectAdapters(defaultAdapters, [cityId]));
    return value;
  }));
  const manifest = JSON.parse(await readFile(MANIFEST_OUTPUT, 'utf8')) as unknown;
  validateManifest(manifest, snapshots);

  const compatibilityActivities =
    JSON.parse(await readFile(ACTIVITY_OUTPUT, 'utf8')) as unknown;
  const compatibilityStatus =
    JSON.parse(await readFile(STATUS_OUTPUT, 'utf8')) as unknown;
  validateSyncOutput(
    compatibilityActivities,
    compatibilityStatus,
    selectAdapters(defaultAdapters, ['guangzhou']),
    ['guangzhou'],
  );
  const guangzhou = snapshots[CITY_IDS.indexOf('guangzhou')];
  const sourceCounts = Object.fromEntries(
    guangzhou.sources.map((source) => [source.id, source.fetched]),
  );
  const failedSourceIds = guangzhou.sources
    .filter((source) => source.availability !== 'fresh')
    .map((source) => source.id);
  if (
    JSON.stringify(compatibilityActivities) !== JSON.stringify(guangzhou.activities) ||
    compatibilityStatus.generatedAt !== guangzhou.generatedAt ||
    JSON.stringify(compatibilityStatus.cityIds) !== JSON.stringify(['guangzhou']) ||
    compatibilityStatus.configuredSources !== guangzhou.sources.length ||
    compatibilityStatus.successfulSources !==
      guangzhou.sources.filter((source) => source.availability === 'fresh').length ||
    compatibilityStatus.failedSources !== failedSourceIds.length ||
    JSON.stringify(compatibilityStatus.failedSourceIds) !== JSON.stringify(failedSourceIds) ||
    JSON.stringify(compatibilityStatus.sourceCounts) !== JSON.stringify(sourceCounts) ||
    compatibilityStatus.finalCount !== guangzhou.counts.final ||
    compatibilityStatus.fetchedCount !== guangzhou.counts.fetched ||
    compatibilityStatus.invalidCount !== guangzhou.counts.invalid ||
    compatibilityStatus.expiredCount !== guangzhou.counts.expired ||
    compatibilityStatus.duplicateCount !== guangzhou.counts.duplicate ||
    compatibilityStatus.fallbackCount !== guangzhou.counts.fallback ||
    compatibilityStatus.usedFallback !== (guangzhou.counts.fallback > 0) ||
    JSON.stringify(compatibilityStatus.warnings) !== JSON.stringify(guangzhou.warnings)
  ) {
    throw new TypeError('Guangzhou compatibility files do not match the city snapshot');
  }
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

async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, prettyJson(value), 'utf8');
  await rename(temporaryPath, path);
}

async function writePublication(result: PublicationResult): Promise<void> {
  await mkdir(CITY_OUTPUT_DIRECTORY, { recursive: true });
  await Promise.all(result.snapshots.map((snapshot) =>
    writeJsonAtomically(resolve(CITY_OUTPUT_DIRECTORY, `${snapshot.cityId}.json`), snapshot)));
  await Promise.all([
    writeJsonAtomically(ACTIVITY_OUTPUT, result.compatibilityActivities),
    writeJsonAtomically(STATUS_OUTPUT, result.compatibilityStatus),
  ]);
  await writeJsonAtomically(MANIFEST_OUTPUT, result.manifest);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await appendFile(summaryPath, result.summary, 'utf8');
}

interface CliDependencies {
  validateFiles?: () => Promise<void>;
  publish?: (cityIds: readonly CityId[]) => Promise<PublicationResult>;
  write?: (result: PublicationResult) => Promise<void>;
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

  const result = await (dependencies.publish ?? runPublication)(options.cityIds);
  for (const snapshot of result.snapshots) {
    validateCitySnapshot(
      snapshot,
      snapshot.cityId,
      selectAdapters(defaultAdapters, [snapshot.cityId]),
    );
  }
  validateManifest(result.manifest, result.snapshots);
  await (dependencies.write ?? writePublication)(result);
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
