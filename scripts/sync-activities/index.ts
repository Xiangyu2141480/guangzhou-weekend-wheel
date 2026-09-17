import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isActivity } from '../../src/data/types';
import { createFingerprint } from './normalize';
import { deduplicateActivities } from './deduplicate';
import { removeExpiredActivities } from './expire';
import { selectSnapshot } from './fallback';
import { fetchGzCulturePerformances } from './sources/gzCulturePerformances';
import { fetchGzExhibition } from './sources/gzExhibition';
import { fetchGzLibrary } from './sources/gzLibrary';
import { requestText } from './sources/http';
import type { NormalizedLiveActivity } from './types';
import { validateRawActivity } from './validate';

const OUTPUT_DIRECTORY = resolve('public/data');
const ACTIVITY_OUTPUT = resolve(OUTPUT_DIRECTORY, 'live-activities.json');
const STATUS_OUTPUT = resolve(OUTPUT_DIRECTORY, 'sync-status.json');
const PRODUCTION_SNAPSHOT_URL =
  'https://xiangyu2141480.github.io/guangzhou-weekend-wheel/data/live-activities.json';

export interface SourceAdapter {
  name: string;
  allowedSourceHosts?: readonly string[];
  fetch: (fetchedAt: string) => Promise<unknown[]>;
}

export interface SyncStatus {
  generatedAt: string;
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
  loadPrevious?: () => Promise<unknown[]>;
  now?: Date;
}

const defaultAdapters: SourceAdapter[] = [
  { name: '广州图书馆', allowedSourceHosts: ['gzlib.org.cn'], fetch: fetchGzLibrary },
  {
    name: '广州市会展业公共服务平台',
    allowedSourceHosts: ['mice-gz.org'],
    fetch: fetchGzExhibition,
  },
  {
    name: '广州市文化广电旅游局',
    allowedSourceHosts: ['wglj.gz.gov.cn'],
    fetch: fetchGzCulturePerformances,
  },
];

function asNormalizedActivity(
  value: unknown,
  allowedSourceHosts: readonly string[] = [],
): NormalizedLiveActivity | null {
  if (!isActivity(value) || !value.live) return null;
  const candidate = value as NormalizedLiveActivity;
  if (validateRawActivity(candidate, allowedSourceHosts).length > 0) return null;
  return {
    ...candidate,
    fingerprint:
      typeof candidate.fingerprint === 'string' && candidate.fingerprint.length > 0
        ? candidate.fingerprint
        : createFingerprint(candidate.name, candidate.venue, candidate.eventStart),
  };
}

function validatedActivities(
  values: unknown[],
  allowedSourceHosts: readonly string[] = [],
): NormalizedLiveActivity[] {
  return values.flatMap((value) => {
    const activity = asNormalizedActivity(value, allowedSourceHosts);
    return activity ? [activity] : [];
  });
}

function validatedPreviousActivities(
  values: unknown[],
  adapters: readonly SourceAdapter[],
): NormalizedLiveActivity[] {
  return values.flatMap((value) => {
    if (!isActivity(value) || !value.live) return [];
    const source = adapters.find((adapter) => adapter.name === value.sourceName);
    if (!source) return [];
    const activity = asNormalizedActivity(value, source.allowedSourceHosts);
    return activity ? [activity] : [];
  });
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
  const adapters = options.adapters ?? defaultAdapters;
  const previousValues = await (options.loadPrevious ?? loadPreviousSnapshot)();
  const previous = removeExpiredActivities(
    validatedPreviousActivities(previousValues, adapters),
    now,
  ).activities;
  const settled = await Promise.allSettled(
    adapters.map((adapter) => adapter.fetch(generatedAt)),
  );

  const warnings: string[] = [];
  const sourceCounts: Record<string, number> = {};
  const fetched: unknown[] = [];
  const valid: NormalizedLiveActivity[] = [];
  const failedSourceNames: string[] = [];
  let successfulSources = 0;
  let failedSources = 0;

  settled.forEach((result, index) => {
    const source = adapters[index];
    if (result.status === 'fulfilled') {
      successfulSources += 1;
      sourceCounts[source.name] = result.value.length;
      fetched.push(...result.value);
      valid.push(...validatedActivities(result.value, source.allowedSourceHosts));
      return;
    }
    failedSources += 1;
    failedSourceNames.push(source.name);
    sourceCounts[source.name] = 0;
    warnings.push(`${source.name}: ${errorMessage(result.reason)}`);
  });

  const invalidCount = fetched.length - valid.length;
  const expiry = removeExpiredActivities(valid, now);
  const deduplicated = deduplicateActivities(expiry.activities);
  const snapshot = selectSnapshot({
    previous,
    current: deduplicated.activities,
    failedSourceNames,
  });
  if (snapshot.warning) warnings.push(snapshot.warning);
  if (adapters.length > 0 && failedSources === adapters.length && snapshot.activities.length === 0) {
    throw new Error('All live activity sources failed and no valid previous records are available');
  }

  const status: SyncStatus = {
    generatedAt,
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

  validateSyncOutput(snapshot.activities, status);
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
  sourceAdapters: readonly SourceAdapter[] = [],
): asserts statusValue is SyncStatus {
  if (!Array.isArray(activitiesValue)) {
    throw new TypeError('live activity output must be an array');
  }
  const activities = activitiesValue.map((item) => {
    if (sourceAdapters.length === 0) return asNormalizedActivity(item);
    if (!isActivity(item) || !item.live) return null;
    const source = sourceAdapters.find((adapter) => adapter.name === item.sourceName);
    return source ? asNormalizedActivity(item, source.allowedSourceHosts) : null;
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

async function validateCommittedFiles(): Promise<void> {
  const activities = JSON.parse(await readFile(ACTIVITY_OUTPUT, 'utf8')) as unknown;
  const status = JSON.parse(await readFile(STATUS_OUTPUT, 'utf8')) as unknown;
  validateSyncOutput(activities, status, defaultAdapters);
}

async function main(): Promise<void> {
  if (process.argv.includes('--validate-only')) {
    await validateCommittedFiles();
    console.log('Live activity JSON validation passed.');
    return;
  }

  const result = await runSync();
  validateSyncOutput(result.activities, result.status, defaultAdapters);
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });
  await Promise.all([
    writeFile(ACTIVITY_OUTPUT, prettyJson(result.activities), 'utf8'),
    writeFile(STATUS_OUTPUT, prettyJson(result.status), 'utf8'),
  ]);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await appendFile(summaryPath, result.summary, 'utf8');
  console.log(result.summary);
}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : '';
if (entryUrl === import.meta.url) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
