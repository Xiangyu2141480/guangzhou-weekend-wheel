import {
  hours2To3,
  hours3To4,
  hours3To5,
  metro,
} from '../copy';
import {
  createEvergreenActivities,
  expandedEvergreenPlace as e,
} from '../create';

const places = [
  e('guangdong-art-academy-museum','去广东画院美术馆看岭南创作','广东画院美术馆','art','白云区','广东画院美术馆',0,hours2To3,'indoor','美术馆,岭南艺术,展览','🖼️',metro('2','白云文化广场')),
  e('zengjiang-gallery-greenway','沿增江画廊走绿道看水岸','增江画廊','outdoor','增城区','增江画廊景区',0,hours3To5,'outdoor','绿道,水岸,郊游','🌿',metro('21','增城广场','，换乘公交前往')),
  e('longjin-east-road-food-walk','沿龙津东路吃一轮西关小店','龙津东路觅食','food','荔湾区','龙津东路',100,hours2To3,'mixed','西关,小吃,老街','🥣',metro('1','陈家祠')),
  e('grandview-theatre','去正佳大剧院看一场舞台演出','正佳大剧院','show','天河区','正佳大剧院',280,hours3To4,'indoor','戏剧,音乐剧,剧场','🎭',metro('1/3','体育西路')),
  e('lingnan-flower-market','逛岭南花卉市场选一束花','岭南花卉市场','market','荔湾区','广州岭南花卉市场',80,hours2To3,'mixed','花市,本地生活,市集','💐',metro('5','滘口')),
  e('guangzhou-metro-museum','在广州地铁博物馆了解地下城市','广州地铁博物馆','experience','海珠区','广州地铁博物馆',0,hours2To3,'indoor','地铁,工程,互动','🚇',metro('8','万胜围')),
  e('haizhu-lake-run','绕海珠湖跑一圈湿地绿道','海珠湖跑步','sport','海珠区','海珠湖公园',0,hours2To3,'outdoor','跑步,湿地,绿道','🏃',metro('3','大塘')),
  e('yuejiang-road-night-walk','沿阅江路夜看珠江与城市天际线','阅江路夜走','night','海珠区','阅江路滨江步道',0,hours2To3,'outdoor','夜景,滨江,城市漫游','🌃',metro('8','琶洲')),
] as const;

export const guangzhouExpansionActivities = createEvergreenActivities('guangzhou', places);
