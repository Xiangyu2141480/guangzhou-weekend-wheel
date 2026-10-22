import { createEvergreenActivities, expandedEvergreenPlace as e } from '../create';

const places = [
  e('hong-xiuquan-museum','到洪秀全纪念馆读花都往事','洪秀全纪念馆','art','花都区','洪秀全纪念馆',0,'2–3 小时','indoor','历史,博物馆,花都','🏺','公共交通至洪秀全纪念馆，按官方交通指引步行前往'),
  e('tianshi-garden','在天适樱花悠乐园看花木','天适樱花悠乐园','outdoor','从化区','天适樱花悠乐园',80,'3–4 小时','outdoor','花木,公园,郊游','🌸','公共交通至天适樱花悠乐园，花期及开放以园区公告为准'),
  e('licheng-food-walk','在荔城街区尝增城本地菜','荔城觅食','food','增城区','增城挂绿广场周边街区',120,'2–3 小时','mixed','本地菜,小吃,街区','🥢','公共交通至增城挂绿广场周边街区，按官方交通指引步行前往'),
  e('conghua-theatre','去从化影剧院看官方排期','从化影剧院','show','从化区','从化影剧院',120,'2–3 小时','indoor','舞台,戏曲,剧场','🎭','公共交通至从化影剧院，按官方交通指引步行前往'),
  e('xintang-denim-market','去新塘逛牛仔服装商贸城','新塘牛仔城','market','增城区','新塘国际牛仔服装纺织城',150,'2–3 小时','mixed','服装,商贸,本地生活','🛍️','公共交通至新塘国际牛仔服装纺织城，按官方交通指引步行前往'),
  e('nansha-waterbird-park','在水鸟世界认识湿地鸟类','南沙水鸟世界','experience','南沙区','南沙水鸟世界生态园',100,'3–4 小时','outdoor','鸟类,自然,科普','🦆','公共交通至南沙水鸟世界生态园，按官方交通指引步行前往'),
  e('huaguoshan-walk','在花果山公园完成一次快走','花果山快走','sport','花都区','花果山公园',0,'2–3 小时','outdoor','快走,公园,轻运动','👟','公共交通至花果山公园，按官方交通指引步行前往'),
  e('conghua-riverside-night','在从化流溪河边饭后夜走','从化滨河夜走','night','从化区','从化风云岭大桥滨江步道',0,'1–2 小时','outdoor','夜游,滨河,散步','🌙','公共交通至从化风云岭大桥滨江步道，按官方交通指引步行前往'),
] as const;

export const guangzhouDistrictExpansionActivities = createEvergreenActivities('guangzhou', places);
