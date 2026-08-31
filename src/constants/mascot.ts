import happy from '../assets/yuwan/core/happy.png';
import idle from '../assets/yuwan/core/idle.png';
import point from '../assets/yuwan/core/point.png';
import rest from '../assets/yuwan/core/rest.png';
import think from '../assets/yuwan/core/think.png';
import empty from '../assets/yuwan/states/empty.png';
import favorite from '../assets/yuwan/states/favorite.png';
import map from '../assets/yuwan/states/map.png';
import run from '../assets/yuwan/states/run.png';
import search from '../assets/yuwan/states/search.png';
import spin from '../assets/yuwan/states/spin.png';
import ticket from '../assets/yuwan/states/ticket.png';

export type YuwanState =
  | 'idle'
  | 'think'
  | 'search'
  | 'run'
  | 'spin'
  | 'happy'
  | 'point'
  | 'rest'
  | 'empty'
  | 'favorite'
  | 'map'
  | 'ticket';

export const YUWAN_SOURCES: Record<YuwanState, string> = {
  idle,
  think,
  search,
  run,
  spin,
  happy,
  point,
  rest,
  empty,
  favorite,
  map,
  ticket,
};

export const YUWAN_ALT: Record<YuwanState, string> = {
  idle: '安静坐好的鱼丸',
  think: '正在认真思考的鱼丸',
  search: '拿放大镜寻找周末去处的鱼丸',
  run: '开心跑起来的鱼丸',
  spin: '转到晕乎乎的鱼丸',
  happy: '举起双手庆祝的鱼丸',
  point: '抬爪指路的鱼丸',
  rest: '趴着休息的鱼丸',
  empty: '等着新点子的鱼丸',
  favorite: '抱着爱心的鱼丸',
  map: '背着背包看地图的鱼丸',
  ticket: '举着周末票根的鱼丸',
};
