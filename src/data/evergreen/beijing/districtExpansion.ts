import { createEvergreenActivities, expandedEvergreenPlace as e } from '../create';

const places = [
  e('liaojin-city-wall-museum','去辽金城垣博物馆看古都遗迹','辽金城垣博物馆','art','丰台区','辽金城垣博物馆',0,'2–3 小时','indoor','考古,历史,博物馆','🏺','公共交通至辽金城垣博物馆，按官方交通指引步行前往'),
  e('yanqi-lake','在雁栖湖看山水与湖岸','雁栖湖','outdoor','怀柔区','雁栖湖景区',45,'3–5 小时','outdoor','湖景,山林,郊游','🏞️','公共交通至雁栖湖景区，按官方交通指引步行前往'),
  e('xi-weng-zhuang-food','去溪翁庄安排一顿水库鱼','溪翁庄觅食','food','密云区','溪翁庄镇',150,'3–4 小时','mixed','本地菜,郊游,餐饮','🍲','公共交通至溪翁庄镇，按官方交通指引步行前往'),
  e('changping-poly-theatre','在昌平保利影剧院看舞台','昌平保利影剧院','show','昌平区','昌平保利影剧院',200,'3–4 小时','indoor','戏剧,剧场,演出','🎭','公共交通至昌平保利影剧院，按官方交通指引步行前往'),
  e('shine-hills-stores','在中粮祥云小镇逛店','祥云小镇','market','顺义区','中粮祥云小镇',150,'2–3 小时','mixed','小店,街区,休闲','🛍️','公共交通至中粮祥云小镇，按官方交通指引步行前往'),
  e('zhoukoudian-museum','在周口店认识古人类','周口店博物馆','experience','房山区','周口店遗址博物馆',30,'3–4 小时','indoor','考古,人类演化,博物馆','🦴','公共交通至周口店遗址博物馆，按官方交通指引步行前往'),
  e('guihe-cycle','沿妫河森林公园骑绿道','妫河骑行','sport','延庆区','妫河森林公园',0,'3–5 小时','outdoor','骑行,森林,绿道','🚲','公共交通至妫河森林公园，按官方交通指引步行前往'),
  e('jinhai-lake','在金海湖走开放湖岸','金海湖','outdoor','平谷区','金海湖风景区',40,'3–5 小时','outdoor','湖景,山水,郊游','🌿','公共交通至金海湖风景区，按官方交通指引步行前往'),
] as const;

export const beijingDistrictExpansionActivities = createEvergreenActivities('beijing', places);
