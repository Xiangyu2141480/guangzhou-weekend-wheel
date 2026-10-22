import { createEvergreenActivities, expandedEvergreenPlace as e } from '../create';

const places = [
  e('taicang-art-museum','去太仓美术馆看一场展','太仓美术馆','art','太仓市','太仓美术馆',0,'2–3 小时','indoor','美术馆,艺术,展览','🖼️','公共交通至太仓美术馆，按官方交通指引步行前往'),
  e('jincang-lake','在太仓金仓湖看湖岸与草地','金仓湖','outdoor','太仓市','金仓湖公园',0,'3–4 小时','outdoor','湖景,公园,郊游','🌿','公共交通至金仓湖公园，按官方交通指引步行前往'),
  e('tianzhuang-food','在恬庄古街尝一顿江南味','恬庄古街觅食','food','张家港市','恬庄古街',100,'2–3 小时','mixed','古街,本地菜,小吃','🥢','公共交通至恬庄古街，按官方交通指引步行前往'),
  e('zhangjiagang-poly','在张家港保利大剧院看演出','张家港大剧院','show','张家港市','张家港保利大剧院',280,'3–4 小时','indoor','戏剧,音乐,剧场','🎭','公共交通至张家港保利大剧院，按官方交通指引步行前往'),
  e('fangta-street-stores','逛常熟方塔街找老城小店','方塔街','market','常熟市','方塔街步行街',100,'2–3 小时','mixed','小店,老城,步行街','🛍️','公共交通至方塔街步行街，按官方交通指引步行前往'),
  e('taicang-museum','在太仓博物馆认识港城历史','太仓博物馆','experience','太仓市','太仓市博物馆',0,'2–3 小时','indoor','博物馆,港口,历史','⚓','公共交通至太仓市博物馆，按官方交通指引步行前往'),
  e('yangcheng-lake-walk','在相城阳澄湖边走一段绿道','阳澄湖快走','sport','相城区','阳澄湖生态休闲旅游度假区',0,'3–4 小时','outdoor','快走,湖景,绿道','👟','公共交通至阳澄湖生态休闲旅游度假区，按官方交通指引步行前往'),
  e('tianjing-lake-night','在太仓天镜湖看夜色','天镜湖夜走','night','太仓市','天镜湖公园',0,'1–2 小时','outdoor','夜游,湖景,散步','🌙','公共交通至天镜湖公园，按官方交通指引步行前往'),
] as const;

export const suzhouDistrictExpansionActivities = createEvergreenActivities('suzhou', places);
