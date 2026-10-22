import {
  hours1To2,
  hours2To4,
  hours3To5,
  metro,
} from '../copy';
import { evergreen } from './create';

export const sportActivities = [
  evergreen('v2-ersha-run','沿二沙岛跑一圈','二沙岛慢跑','sport','越秀区','二沙岛体育公园',metro('6','东湖','，步行上岛'),0,hours1To2,'outdoor','跑步,江景,一个人','🏃','江风和树荫能把跑步变得没那么像任务，累了就慢走。','夜跑带照明并注意骑行道。'),
  evergreen('v2-guangzhou-cloud-hike','从越秀公园走一段云道','云道轻徒步','sport','越秀区','广州云道 越秀公园入口',metro('2','越秀公园','起步'),0,hours2To4,'outdoor','徒步,绿道,城市景观','🥾','城市公园被一条高低起伏的绿线串起来，很适合周末练腿。','按体力选择出口，不必走完全程。'),
  evergreen('v2-haizhu-greenway-cycle','沿海珠环岛路骑行','海珠环岛骑行','sport','海珠区','海珠环岛路','地铁 8 号线沿线选择起点',30,hours3To5,'outdoor','骑行,江景,日落','🚴','沿江路线长而开阔，适合把一周积下来的闷气骑散。','分段骑行，避开机动车混行路段。'),
  evergreen('v2-bio-island-run','在生物岛跑步看日落','生物岛跑步','sport','黄埔区','广州国际生物岛',metro('4','官洲','直达'),0,hours1To2,'outdoor','跑步,环岛,日落','🏃','路线平缓又有江风，新手也能按自己的节奏完成。','夏季傍晚更舒适。'),
  evergreen('v2-university-city-run','绕大学城中心湖跑步','大学城跑步','sport','番禺区','广州大学城中心湖',metro('4/7','大学城南',''),0,hours1To2,'outdoor','跑步,湖景,校园','🏃','路宽树多，跑累了随时在湖边停下来，不会有压力。','遵守校园及道路通行规定。'),
  evergreen('v2-huadu-lake-cycle','沿花都湖绿道骑行','花都湖骑行','sport','花都区','花都湖国家湿地公园',metro('9','莲塘'),30,hours2To4,'outdoor','骑行,湖景,湿地','🚲','绿道长度刚好，想认真骑或只兜风都成立。','共享单车供应不固定。'),
  evergreen('v2-jiaomen-cycle','沿蕉门河绿道夜骑','蕉门河骑行','sport','南沙区','蕉门河公园',metro('4','蕉门'),30,hours1To2,'outdoor','骑行,河景,晚上','🚴','平整水岸很适合轻松夜骑，风比速度更重要。','夜间务必使用车灯并避让行人。'),
  evergreen('v2-nansha-coast-cycle','骑一段南沙滨海线','南沙滨海骑行','sport','南沙区','南沙滨海公园',metro('4','南沙客运港','起步'),50,hours3To5,'outdoor','骑行,滨海,风景','🚲','海风、桥与长长的水岸让广州突然很有沿海城市感。','路程长，关注天气与返程体力。'),
  evergreen('v2-lihu-cycle','绕增城荔湖骑一圈','荔湖骑行','sport','增城区','增城荔湖公园',metro('21','增城广场','，换乘公交或骑行'),30,hours2To4,'outdoor','骑行,湖景,绿道','🚲','湖边路线开阔，适合一边骑一边决定要不要继续。','共享单车与租车供应以现场为准。'),
  evergreen('v2-fengyunling-hike','去风云岭做一次周末爬坡','风云岭爬坡','sport','从化区','风云岭森林公园',metro('14','从化客运','，换乘公交前往'),0,hours2To4,'outdoor','徒步,登山,运动','🥾','坡度足够出汗但不必全日远征，很适合临时想动一动。','雨天不走湿滑山路。'),
] as const;
