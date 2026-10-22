import { createEvergreenActivities, expandedEvergreenPlace as e } from '../create';

const places = [
  e('guangming-art-centre','在光明文化艺术中心看展','光明美术馆','art','光明区','光明文化艺术中心美术馆',0,'2–3 小时','indoor','美术馆,展览,建筑','🖼️','公共交通至光明文化艺术中心美术馆，按官方交通指引步行前往'),
  e('hongqiao-park','沿光明虹桥公园看森林','虹桥公园','outdoor','光明区','虹桥公园',0,'3–4 小时','outdoor','森林,步道,公园','🌿','公共交通至虹桥公园，按官方交通指引步行前往'),
  e('yantian-seafood','去盐田海鲜街安排一顿海味','盐田海鲜街','food','盐田区','盐田海鲜街',200,'2–3 小时','mixed','海鲜,海边,餐饮','🦐','公共交通至盐田海鲜街，按官方交通指引步行前往'),
  e('guangming-theatre','在光明文化艺术中心看演出','光明演艺中心','show','光明区','光明文化艺术中心演艺中心',280,'3–4 小时','indoor','戏剧,音乐,剧场','🎭','公共交通至光明文化艺术中心演艺中心，按官方交通指引步行前往'),
  e('haiya-stores','逛宝安海雅缤纷城','海雅缤纷城','market','宝安区','海雅缤纷城',150,'2–3 小时','indoor','商场,小店,休闲','🛍️','公共交通至海雅缤纷城，按官方交通指引步行前往'),
  e('migrant-worker-museum','在劳务工博物馆看城市变迁','劳务工博物馆','experience','宝安区','深圳劳务工博物馆',0,'2–3 小时','indoor','城市记忆,工业,博物馆','🏭','公共交通至深圳劳务工博物馆，按官方交通指引步行前往'),
  e('longhua-greenway','沿龙华环城绿道轻徒步','龙华绿道','sport','龙华区','龙华环城绿道阳台山段',0,'3–4 小时','outdoor','徒步,山林,绿道','🥾','公共交通至龙华环城绿道阳台山段，按官方交通指引步行前往'),
  e('yantian-coastal-night','沿盐田海滨栈道看夜色','盐田海滨夜走','night','盐田区','盐田海滨栈道盐田海鲜街段',0,'1–2 小时','outdoor','夜游,海岸,散步','🌙','公共交通至盐田海滨栈道盐田海鲜街段，按官方交通指引步行前往'),
] as const;

export const shenzhenDistrictExpansionActivities = createEvergreenActivities('shenzhen', places);
