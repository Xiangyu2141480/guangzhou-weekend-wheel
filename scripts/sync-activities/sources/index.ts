import { chongqingThreeGorgesExhibitionsAdapter } from './chongqingThreeGorgesExhibitions';
import { chengduMuseumExhibitionsAdapter } from './chengduMuseumExhibitions';
import { nanjingMuseumActivitiesAdapter } from './nanjingMuseumActivities';
import { hangzhouSilkExhibitionsAdapter } from './hangzhouSilkExhibitions';
import { beijingCityEventsAdapter } from './beijingCityEvents';
import { gzCulturePerformancesAdapter } from './gzCulturePerformances';
import { gzExhibitionAdapter } from './gzExhibition';
import { gzLibraryAdapter } from './gzLibrary';
import { shanghaiCultureEventsAdapter } from './shanghaiCultureEvents';
import { shenzhenCultureEventsAdapter } from './shenzhenCultureEvents';
import { suzhouMuseumExhibitionsAdapter } from './suzhouMuseumExhibitions';
import type { SourceAdapter } from '../types';

export const SOURCE_ADAPTERS = [
  beijingCityEventsAdapter,
  shanghaiCultureEventsAdapter,
  gzLibraryAdapter,
  gzExhibitionAdapter,
  gzCulturePerformancesAdapter,
  shenzhenCultureEventsAdapter,
  suzhouMuseumExhibitionsAdapter,
  hangzhouSilkExhibitionsAdapter,
  nanjingMuseumActivitiesAdapter,
  chengduMuseumExhibitionsAdapter,
  chongqingThreeGorgesExhibitionsAdapter,
] as const satisfies readonly SourceAdapter[];
