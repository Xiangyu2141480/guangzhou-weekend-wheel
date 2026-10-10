import {
  createEvergreenActivities,
  expandedEvergreenPlace as e,
} from '../create';

const places = [
  e('guangdong-art-academy-museum','去广东画院美术馆看岭南创作','广东画院美术馆','art','白云区','广东画院美术馆',0,'2–3 小时','indoor','美术馆,岭南艺术,展览','🖼️','地铁 2 号线白云文化广场站，步行前往'),
  e('zengjiang-gallery-greenway','沿增江画廊走绿道看水岸','增江画廊','outdoor','增城区','增江画廊景区',0,'3–5 小时','outdoor','绿道,水岸,郊游','🌿','地铁 21 号线增城广场站，换乘公交前往'),
  e('longjin-east-road-food-walk','沿龙津东路吃一轮西关小店','龙津东路觅食','food','荔湾区','龙津东路',100,'2–3 小时','mixed','西关,小吃,老街','🥣','地铁 1 号线陈家祠站，步行前往'),
  e('grandview-theatre','去正佳大剧院看一场舞台演出','正佳大剧院','show','天河区','正佳大剧院',280,'3–4 小时','indoor','戏剧,音乐剧,剧场','🎭','地铁 1/3 号线体育西路站，步行前往'),
  e('lingnan-flower-market','逛岭南花卉市场选一束花','岭南花卉市场','market','荔湾区','广州岭南花卉市场',80,'2–3 小时','mixed','花市,本地生活,市集','💐','地铁 5 号线滘口站，步行前往'),
  e('guangzhou-metro-museum','在广州地铁博物馆了解地下城市','广州地铁博物馆','experience','海珠区','广州地铁博物馆',0,'2–3 小时','indoor','地铁,工程,互动','🚇','地铁 8 号线万胜围站，步行前往'),
  e('haizhu-lake-run','绕海珠湖跑一圈湿地绿道','海珠湖跑步','sport','海珠区','海珠湖公园',0,'2–3 小时','outdoor','跑步,湿地,绿道','🏃','地铁 3 号线大塘站，步行前往'),
  e('yuejiang-road-night-walk','沿阅江路夜看珠江与城市天际线','阅江路夜走','night','海珠区','阅江路滨江步道',0,'2–3 小时','outdoor','夜景,滨江,城市漫游','🌃','地铁 8 号线琶洲站，步行前往'),
] as const;

export const guangzhouExpansionActivities = createEvergreenActivities('guangzhou', places);
