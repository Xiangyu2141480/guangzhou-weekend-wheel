import { createEvergreenActivities, expandedEvergreenPlace as e } from '../create';

const places = [
  e('baoshan-folk-art','去宝山看国际民间艺术','宝山民间艺术馆','art','宝山区','上海宝山国际民间艺术博览馆',30,'2–3 小时','indoor','民间艺术,博物馆,工艺','🎨','公共交通至上海宝山国际民间艺术博览馆，按官方交通指引步行前往'),
  e('shanghai-fish-park','在上海之鱼走水岸绿道','上海之鱼','outdoor','奉贤区','上海之鱼',0,'3–4 小时','outdoor','湖景,公园,散步','🌿','公共交通至上海之鱼，按官方交通指引步行前往'),
  e('fengjing-food','去枫泾古镇尝一顿江南菜','枫泾觅食','food','金山区','枫泾古镇',120,'3–4 小时','mixed','古镇,江南菜,小吃','🥢','公共交通至枫泾古镇，按官方交通指引步行前往'),
  e('international-dance-centre','在上海国际舞蹈中心看舞台','国际舞蹈中心','show','长宁区','上海国际舞蹈中心',280,'3–4 小时','indoor','舞蹈,剧场,演出','💃','公共交通至上海国际舞蹈中心，按官方交通指引步行前往'),
  e('columbia-circle','逛上生新所的老建筑与商店','上生新所','market','长宁区','上生新所',150,'2–3 小时','mixed','建筑,设计,小店','🛍️','公共交通至上生新所，按官方交通指引步行前往'),
  e('an-ting-science','在上海汽车博览公园认识汽车','汽车博览公园','experience','嘉定区','上海汽车博览公园',0,'2–3 小时','mixed','汽车,工业,公园','🚗','公共交通至上海汽车博览公园，按官方交通指引步行前往'),
  e('fengpu-four-seasons','沿奉浦四季生态园快走','奉浦四季生态园','sport','奉贤区','奉浦四季生态园',0,'2–3 小时','outdoor','快走,公园,轻运动','👟','公共交通至奉浦四季生态园，按官方交通指引步行前往'),
  e('baoshan-riverside-night','去宝山滨江看长江夜色','宝山滨江夜走','night','宝山区','宝山滨江公园',0,'1–2 小时','outdoor','夜游,滨江,散步','🌙','公共交通至宝山滨江公园，按官方交通指引步行前往'),
] as const;

export const shanghaiDistrictExpansionActivities = createEvergreenActivities('shanghai', places);
