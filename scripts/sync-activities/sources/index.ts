import { gzCulturePerformancesAdapter } from './gzCulturePerformances';
import { gzExhibitionAdapter } from './gzExhibition';
import { gzLibraryAdapter } from './gzLibrary';
import type { SourceAdapter } from '../types';

export const SOURCE_ADAPTERS = [
  gzLibraryAdapter,
  gzExhibitionAdapter,
  gzCulturePerformancesAdapter,
] as const satisfies readonly SourceAdapter[];
