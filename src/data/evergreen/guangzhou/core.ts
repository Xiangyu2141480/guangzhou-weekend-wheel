import type {
  ActivityCategory,
  ActivityTimeTag,
  EvergreenActivity,
  IndoorOutdoor,
} from '../../types';

interface GuangzhouActivitySeed {
  id: string;
  name: string;
  shortName: string;
  category: ActivityCategory;
  district: string;
  budget: number;
  budgetLabel: string;
  duration: string;
  indoorOutdoor: IndoorOutdoor;
  tags: string[];
  emoji: string;
  reason: string;
  tip?: string;
  mapKeyword: string;
  transport: string;
  dynamic?: boolean;
}

const coreActivitySeeds: GuangzhouActivitySeed[] = [
  {
    id: 'guangdong-museum', name: '逛广东省博物馆', shortName: '广东省博物馆', category: 'art', district: '天河区', budget: 0, budgetLabel: '免费预约', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['博物馆', '建筑', '拍照'], emoji: '🏺', reason: '从自然标本到岭南历史，一栋楼就能安稳逛掉半天。', tip: '周一闭馆，热门时段建议提前预约。', mapKeyword: '广东省博物馆', transport: '地铁 3/5 号线珠江新城站，步行约 15 分钟',
  },
  {
    id: 'guangzhou-art-museum', name: '逛广州艺术博物院（广州美术馆）', shortName: '广州美术馆', category: 'art', district: '海珠区', budget: 0, budgetLabel: '常设展通常免费', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['美术馆', '建筑', '展览'], emoji: '🎨', reason: '新馆空间很舒展，适合慢慢看展，也很适合拍建筑线条。', tip: '特展规则可能不同，出发前查看馆方预约信息。', mapKeyword: '广州艺术博物院 广州美术馆', transport: '地铁 3 号线广州塔站，换乘公交或步行前往',
  },
  {
    id: 'guangzhou-museum', name: '登镇海楼逛广州博物馆', shortName: '镇海楼', category: 'art', district: '越秀区', budget: 10, budgetLabel: '约 ¥10', duration: '1.5–2 小时', indoorOutdoor: 'mixed', tags: ['历史', '古建', '公园'], emoji: '🏯', reason: '把广州城市史和越秀公园放在同一条路线里，一次收获两种心情。', tip: '逢周一闭馆，展馆位于越秀公园内。', mapKeyword: '广州博物馆 镇海楼', transport: '地铁 2 号线越秀公园站，步行入园',
  },
  {
    id: 'nanyue-king-museum', name: '看南越王博物院王墓展区', shortName: '南越王博物院', category: 'art', district: '越秀区', budget: 0, budgetLabel: '常设展免费预约', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['考古', '历史', '国宝'], emoji: '👑', reason: '两千年前的南越国宝藏就在城市中心，故事密度非常高。', tip: '临时收费特展需另行确认。', mapKeyword: '南越王博物院 王墓展区', transport: '地铁 2 号线越秀公园站 E 口附近',
  },
  {
    id: 'chen-clan-academy', name: '看陈家祠岭南雕刻', shortName: '陈家祠', category: 'art', district: '荔湾区', budget: 10, budgetLabel: '约 ¥10', duration: '1.5–2 小时', indoorOutdoor: 'mixed', tags: ['古建', '非遗', '雕刻'], emoji: '🪭', reason: '屋脊、木雕、砖雕处处有细节，抬头党会逛得很开心。', tip: '周末人多，开馆后较早到达更从容。', mapKeyword: '广东民间工艺博物馆 陈家祠', transport: '地铁 1/8 号线陈家祠站',
  },
  {
    id: 'guangzhou-maritime-museum', name: '去广州海事博物馆看海丝', shortName: '海事博物馆', category: 'art', district: '黄埔区', budget: 0, budgetLabel: '免费预约', duration: '2 小时', indoorOutdoor: 'indoor', tags: ['海丝', '博物馆', '建筑'], emoji: '⛵', reason: '从南海神庙到海丝故事，适合来一趟有历史纵深的周末远行。', tip: '和南海神庙可安排成半日联游。', mapKeyword: '广州海事博物馆', transport: '地铁 13 号线南海神庙站，换乘公交或步行',
  },
  {
    id: 'cantonese-opera-museum', name: '逛粤剧艺术博物馆', shortName: '粤剧艺术博物馆', category: 'art', district: '荔湾区', budget: 0, budgetLabel: '免费预约', duration: '1.5–2 小时', indoorOutdoor: 'mixed', tags: ['粤剧', '园林', '非遗'], emoji: '🎭', reason: '岭南园林里看戏服和粤剧故事，精致又不费腿。', tip: '可顺路走恩宁路与永庆坊。', mapKeyword: '粤剧艺术博物馆', transport: '地铁 1/6 号线黄沙站，步行约 12 分钟',
  },
  {
    id: 'guangzhou-cultural-center', name: '在广州市文化馆逛岭南园林', shortName: '广州市文化馆', category: 'art', district: '海珠区', budget: 0, budgetLabel: '免费预约', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['非遗', '园林', '展览'], emoji: '🏮', reason: '像把岭南园林和文化展馆叠在一起，雨天晴天都能逛。', tip: '部分活动需单独预约，周一通常闭馆。', mapKeyword: '广州市文化馆 新馆', transport: '地铁 3 号线大塘站，步行或短程公交',
  },
  {
    id: 'guangzhou-library', name: '在广州图书馆泡一下午', shortName: '广州图书馆', category: 'art', district: '天河区', budget: 0, budgetLabel: '免费', duration: '2–4 小时', indoorOutdoor: 'indoor', tags: ['阅读', '建筑', '安静'], emoji: '📚', reason: '不用赶行程，找一本书、看一眼江景，周末就慢下来了。', tip: '通常周三闭馆，出发前查看最新开放安排。', mapKeyword: '广州图书馆', transport: '地铁 3/5 号线珠江新城站，步行约 15 分钟',
  },
  {
    id: 'marshal-mansion', name: '看孙中山大元帅府纪念馆', shortName: '大元帅府', category: 'art', district: '海珠区', budget: 0, budgetLabel: '免费预约', duration: '1.5–2 小时', indoorOutdoor: 'indoor', tags: ['近代史', '建筑', '江边'], emoji: '🏛️', reason: '红砖建筑很有味道，看完还能沿江继续散步。', tip: '逢周一闭馆，留意停止入馆时间。', mapKeyword: '孙中山大元帅府纪念馆', transport: '地铁 6 号线团一大广场站，过江步行或换乘公交',
  },
  {
    id: 'haizhu-wetland', name: '去海珠国家湿地公园散步', shortName: '海珠湿地', category: 'outdoor', district: '海珠区', budget: 20, budgetLabel: '约 ¥20', duration: '3–4 小时', indoorOutdoor: 'outdoor', tags: ['湿地', '观鸟', '拍照'], emoji: '🌿', reason: '城市里难得的大块绿意，慢慢走、看看鸟，不需要安排得很满。', tip: '限制开放区通常周一闭园，防晒和驱蚊都要带。', mapKeyword: '广州海珠国家湿地公园', transport: '地铁 3 号线大塘站，换乘公交或短程打车',
  },
  {
    id: 'ersha-island', name: '绕二沙岛慢慢散步', shortName: '二沙岛散步', category: 'outdoor', district: '越秀区', budget: 0, budgetLabel: '免费', duration: '2–3 小时', indoorOutdoor: 'outdoor', tags: ['江景', '草坪', '散步'], emoji: '🌳', reason: '有江风、有草地，也有刚刚好的城市天际线，适合什么都不赶。', tip: '傍晚光线更舒服，周末草坪人会较多。', mapKeyword: '二沙岛艺术公园', transport: '地铁 6 号线东湖站，步行或公交上岛',
  },
  {
    id: 'yuexiu-park', name: '去越秀公园找五羊', shortName: '越秀公园', category: 'outdoor', district: '越秀区', budget: 0, budgetLabel: '免费', duration: '2–3 小时', indoorOutdoor: 'outdoor', tags: ['公园', '历史', '散步'], emoji: '🐏', reason: '老广州的经典周末路线，湖、城墙、五羊雕像一次看齐。', tip: '园区很大，穿舒服的鞋。', mapKeyword: '越秀公园', transport: '地铁 2 号线越秀公园站直达',
  },
  {
    id: 'baiyun-mountain', name: '爬白云山吸氧', shortName: '白云山', category: 'outdoor', district: '白云区', budget: 15, budgetLabel: '约 ¥15 起', duration: '4–6 小时', indoorOutdoor: 'outdoor', tags: ['登山', '城市景观', '运动'], emoji: '⛰️', reason: '想认真出一身汗的时候，白云山永远是广州的稳妥答案。', tip: '缆车等项目另收费，天气闷热时量力而行。', mapKeyword: '白云山风景名胜区 南门', transport: '地铁 3 号线北延段同和站，换乘公交',
  },
  {
    id: 'luhu-park', name: '去麓湖公园看水杉', shortName: '麓湖公园', category: 'outdoor', district: '越秀区', budget: 0, budgetLabel: '免费', duration: '2–3 小时', indoorOutdoor: 'outdoor', tags: ['湖景', '绿道', '散步'], emoji: '🦆', reason: '湖边很安静，适合想走走但不想挑战爬山强度的周末。', tip: '可接云道或白云山南麓路线。', mapKeyword: '麓湖公园', transport: '地铁 5 号线小北站，换乘公交或步行',
  },
  {
    id: 'south-china-botanical-garden', name: '去华南国家植物园看热带植物', shortName: '华南植物园', category: 'outdoor', district: '天河区', budget: 50, budgetLabel: '约 ¥20–50', duration: '3–5 小时', indoorOutdoor: 'mixed', tags: ['植物', '温室', '拍照'], emoji: '🌴', reason: '植物密度高到像短暂离开了城市，温室和湖区都值得慢慢走。', tip: '温室套票价格可能调整，按兴趣选择。', mapKeyword: '华南国家植物园', transport: '地铁 6 号线植物园站，步行或公交前往',
  },
  {
    id: 'bio-island-cycle', name: '在广州国际生物岛骑行', shortName: '生物岛骑行', category: 'outdoor', district: '黄埔区', budget: 30, budgetLabel: '约 ¥10–30', duration: '2–3 小时', indoorOutdoor: 'outdoor', tags: ['骑行', '江风', '日落'], emoji: '🚲', reason: '环岛路线平缓，风景开阔，很适合把脑袋里的噪音骑散。', tip: '共享单车供应不固定，先看天气再出发。', mapKeyword: '广州国际生物岛', transport: '地铁 4 号线官洲站直达',
  },
  {
    id: 'haixin-bridge', name: '走海心桥看珠江夜色', shortName: '海心桥夜游', category: 'outdoor', district: '海珠区', budget: 0, budgetLabel: '免费预约', duration: '1–2 小时', indoorOutdoor: 'outdoor', tags: ['夜景', '散步', '广州塔'], emoji: '🌉', reason: '在桥上看广州塔和珠江两岸亮起来，短短一程也很有仪式感。', tip: '按最新规则预约，雨天桥面可能湿滑。', mapKeyword: '海心桥', transport: '地铁 3 号线广州塔站，步行前往',
  },
  {
    id: 'pearl-river-citywalk', name: '沿珠江来一场 Citywalk', shortName: '珠江 Citywalk', category: 'outdoor', district: '越秀区', budget: 20, budgetLabel: '约 ¥0–20', duration: '2–4 小时', indoorOutdoor: 'outdoor', tags: ['江景', 'Citywalk', '夜游'], emoji: '🌊', reason: '从沿江西路慢慢走到海珠广场，骑楼、桥与江风一路陪你。', tip: '建议傍晚出发，避开正午暴晒。', mapKeyword: '海珠广场', transport: '地铁 2/6 号线海珠广场站',
  },
  {
    id: 'university-city-cycle', name: '在广州大学城环岛骑行', shortName: '大学城骑行', category: 'outdoor', district: '番禺区', budget: 30, budgetLabel: '约 ¥10–30', duration: '3–4 小时', indoorOutdoor: 'outdoor', tags: ['骑行', '校园', '江边'], emoji: '🚴', reason: '路宽、树多、青春气息足，骑累了随时找一片草地休息。', tip: '部分校园进出政策会变化，以现场规定为准。', mapKeyword: '广州大学城中心湖', transport: '地铁 4/7 号线大学城南站',
  },
  {
    id: 'guangzhou-cloud-path', name: '走一段广州云道', shortName: '广州云道', category: 'outdoor', district: '越秀区', budget: 0, budgetLabel: '免费', duration: '2–4 小时', indoorOutdoor: 'outdoor', tags: ['绿道', '徒步', '城市景观'], emoji: '☁️', reason: '把公园与山林串起来，像在城市上方悄悄开了一条绿色小路。', tip: '不必一次走完全程，按体力挑一段即可。', mapKeyword: '广州云道 越秀公园入口', transport: '地铁 2 号线越秀公园站起步',
  },
  {
    id: 'dafushan-forest-park', name: '去大夫山森林公园骑车', shortName: '大夫山骑行', category: 'outdoor', district: '番禺区', budget: 40, budgetLabel: '约 ¥20–40', duration: '4–6 小时', indoorOutdoor: 'outdoor', tags: ['森林', '骑行', '野餐'], emoji: '🌲', reason: '树荫和缓坡都很多，适合朋友一起骑车，也适合找地方野餐。', tip: '租车价格按现场为准，返程预留接驳时间。', mapKeyword: '大夫山森林公园', transport: '地铁 3 号线市桥站，换乘公交',
  },
  {
    id: 'liuhuahu-park', name: '绕流花湖公园看白宫倒影', shortName: '流花湖公园', category: 'outdoor', district: '越秀区', budget: 0, budgetLabel: '免费', duration: '2 小时', indoorOutdoor: 'outdoor', tags: ['湖景', '老公园', '散步'], emoji: '🦢', reason: '老公园的松弛感很足，随便绕湖一圈就能收获广州式慢生活。', tip: '清晨和傍晚体感更舒适。', mapKeyword: '流花湖公园', transport: '地铁 2 号线越秀公园站，换乘公交或步行',
  },
  {
    id: 'xihua-road-food', name: '去西华路一路扫街', shortName: '西华路扫街', category: 'food', district: '荔湾区', budget: 100, budgetLabel: '约 ¥50–100', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['老广', '小吃', '扫街'], emoji: '🍜', reason: '今天不要减肥了，小狗批准你从牛杂吃到糖水。', tip: '少量多份最快乐，热门小店可能排队。', mapKeyword: '西华路 美食街', transport: '地铁 1 号线陈家祠站，步行前往',
  },
  {
    id: 'beijing-road-food', name: '沿北京路边逛边吃', shortName: '北京路吃喝', category: 'food', district: '越秀区', budget: 120, budgetLabel: '约 ¥60–120', duration: '3–4 小时', indoorOutdoor: 'mixed', tags: ['步行街', '小吃', '夜游'], emoji: '🥢', reason: '选择多、交通方便，临时约朋友也不用做太多功课。', tip: '惠福东路和文明路都可以顺路加进来。', mapKeyword: '北京路步行街', transport: '地铁 6 号线北京路站',
  },
  {
    id: 'shangxiajiu-food', name: '走上下九老广吃喝线', shortName: '上下九吃喝', category: 'food', district: '荔湾区', budget: 100, budgetLabel: '约 ¥50–100', duration: '3 小时', indoorOutdoor: 'mixed', tags: ['骑楼', '西关', '小吃'], emoji: '🥟', reason: '骑楼底下边走边吃，老城区的烟火气会自动把周末填满。', tip: '把泮塘、恩宁路分开安排，别一次走太满。', mapKeyword: '上下九步行街', transport: '地铁 1 号线长寿路站',
  },
  {
    id: 'liwan-old-town-food', name: '在荔湾老城找地道小吃', shortName: '荔湾老城吃喝', category: 'food', district: '荔湾区', budget: 100, budgetLabel: '约 ¥50–100', duration: '3–4 小时', indoorOutdoor: 'mixed', tags: ['西关', '糖水', '老字号'], emoji: '🍡', reason: '不用追网红店，跟着骑楼和小巷走，常常会遇到更可爱的味道。', tip: '用地图收藏几家备选，遇到排队就灵活换。', mapKeyword: '荔湾湖公园 西关美食', transport: '地铁 5 号线中山八站',
  },
  {
    id: 'dongshankou-coffee', name: '去东山口喝咖啡 Citywalk', shortName: '东山口咖啡', category: 'food', district: '越秀区', budget: 100, budgetLabel: '约 ¥50–100', duration: '2–4 小时', indoorOutdoor: 'mixed', tags: ['咖啡', '洋楼', '拍照'], emoji: '☕', reason: '一杯咖啡配几条安静小路，适合和朋友漫无目的地聊很久。', tip: '居民区请放低音量，不在门前长时间拍照。', mapKeyword: '东山口 庙前西街', transport: '地铁 1/6 号线东山口站',
  },
  {
    id: 'jiangnanxi-food', name: '去江南西随机挑一家吃', shortName: '江南西吃喝', category: 'food', district: '海珠区', budget: 150, budgetLabel: '约 ¥80–150', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['餐厅', '甜品', '朋友聚会'], emoji: '🍲', reason: '从正餐到甜品选择密集，是那种“谁都不知道吃什么”时的安全牌。', tip: '饭点排队明显，稍微错峰更轻松。', mapKeyword: '江南西 美食', transport: '地铁 2 号线江南西站',
  },
  {
    id: 'baoye-road-night-food', name: '去宝业路吃一顿夜宵', shortName: '宝业路夜宵', category: 'food', district: '海珠区', budget: 150, budgetLabel: '约 ¥80–150', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['夜宵', '烧烤', '聚餐'], emoji: '🍢', reason: '夜晚的烟火气一上来，周末才算真的开始。', tip: '饮酒后不要骑车或开车，热门店先取号。', mapKeyword: '宝业路 美食街', transport: '地铁 8 号线沙园站，步行前往',
  },
  {
    id: 'tongfu-road-food', name: '沿同福路寻味老广州', shortName: '同福路寻味', category: 'food', district: '海珠区', budget: 100, budgetLabel: '约 ¥50–100', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['老字号', '小吃', '骑楼'], emoji: '🥣', reason: '一条很适合慢慢吃的老路，粥粉面和传统点心都能安排。', tip: '许多老店休息时间不同，别把目标锁死在一家。', mapKeyword: '同福路 美食', transport: '地铁 2 号线市二宫站，步行前往',
  },
  {
    id: 'huifu-road-food', name: '从惠福东路吃到大佛寺', shortName: '惠福东路', category: 'food', district: '越秀区', budget: 100, budgetLabel: '约 ¥50–100', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['小吃', '夜景', '步行'], emoji: '🍮', reason: '一路小吃密集，吃饱后再看亮灯的大佛寺，收尾刚刚好。', tip: '尊重宗教场所秩序，拍照不要影响他人。', mapKeyword: '惠福东路', transport: '地铁 6 号线北京路站',
  },
  {
    id: 'wenming-road-dessert', name: '去文明路来一轮糖水', shortName: '文明路糖水', category: 'food', district: '越秀区', budget: 60, budgetLabel: '约 ¥30–60', duration: '1.5–2 小时', indoorOutdoor: 'mixed', tags: ['糖水', '小吃', '夜宵'], emoji: '🍧', reason: '双皮奶、炖品和糖水都在附近，甜甜结束一天很合理。', tip: '可以和北京路、农讲所安排成同一路线。', mapKeyword: '文明路 糖水', transport: '地铁 1 号线农讲所站或 6 号线北京路站',
  },
  {
    id: 'livehouse-random-show', name: '去 Livehouse 看一场随机演出', shortName: 'Livehouse', category: 'show', district: '天河区', budget: 200, budgetLabel: '约 ¥100–200', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['现场音乐', '夜生活', '动态'], emoji: '🎸', reason: '不认识乐队也没关系，现场的鼓点会替你打开周末。', tip: '具体场次、场地与票价请出发前查询当天安排。', mapKeyword: '广州 Livehouse 演出', transport: '场地不固定，优先选择地铁末班车前可返程的场次', dynamic: true,
  },
  {
    id: 'standup-comedy', name: '去看一场脱口秀', shortName: '脱口秀现场', category: 'show', district: '越秀区', budget: 180, budgetLabel: '约 ¥80–180', duration: '1.5–2 小时', indoorOutdoor: 'indoor', tags: ['喜剧', '夜生活', '动态'], emoji: '🎙️', reason: '坐着笑一晚，特别适合脑袋已经不想再安排复杂活动的时候。', tip: '具体场次与适龄提示请以票务平台为准。', mapKeyword: '广州 脱口秀 演出', transport: '场地不固定，购票前确认最近地铁站', dynamic: true,
  },
  {
    id: 'guangzhou-opera-house-show', name: '去广州大剧院看一场戏', shortName: '广州大剧院', category: 'show', district: '天河区', budget: 300, budgetLabel: '约 ¥100–300', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['戏剧', '建筑', '动态'], emoji: '🎟️', reason: '认真打扮一下去剧院，会让普通周末突然变成纪念日。', tip: '演出与票价变化较大，出发前查看官方排期。', mapKeyword: '广州大剧院', transport: '地铁 3/5 号线珠江新城站，步行约 15 分钟', dynamic: true,
  },
  {
    id: 'xinghai-concert-hall', name: '去星海音乐厅听音乐会', shortName: '星海音乐厅', category: 'show', district: '越秀区', budget: 300, budgetLabel: '约 ¥100–300', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['音乐会', '二沙岛', '动态'], emoji: '🎻', reason: '江边散步加一场音乐会，是很广州也很浪漫的组合。', tip: '选择惠民票更容易控制在预算内，按官方排期购票。', mapKeyword: '星海音乐厅', transport: '地铁 6 号线东湖站，换乘公交或步行上岛', dynamic: true,
  },
  {
    id: 'cantonese-opera-show', name: '去看一场粤剧演出', shortName: '粤剧现场', category: 'show', district: '荔湾区', budget: 200, budgetLabel: '约 ¥50–200', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['粤剧', '岭南', '动态'], emoji: '🪭', reason: '哪怕第一次看，水袖、唱腔和舞台美术也会让人很着迷。', tip: '可查看粤剧艺术博物馆、红线女大剧院等官方排期。', mapKeyword: '广州 粤剧 演出', transport: '按实际场地选择地铁路线', dynamic: true,
  },
  {
    id: 'jazz-live', name: '去爵士空间听现场', shortName: '爵士现场', category: 'show', district: '越秀区', budget: 200, budgetLabel: '约 ¥100–200', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['爵士', '夜生活', '动态'], emoji: '🎷', reason: '灯光暗一点、音乐松一点，很适合把一周的紧绷慢慢放掉。', tip: '留意最低消费、预约规则及末班车时间。', mapKeyword: '广州 爵士 现场音乐', transport: '场地不固定，优先选择地铁可达场次', dynamic: true,
  },
  {
    id: 'guangdong-arts-theatre', name: '去广东艺术剧院看戏', shortName: '广东艺术剧院', category: 'show', district: '天河区', budget: 280, budgetLabel: '约 ¥80–280', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['话剧', '舞台', '动态'], emoji: '🎬', reason: '现场表演比刷剧多一点偶遇感，也多一点全神贯注。', tip: '以剧院官方当周节目和票价为准。', mapKeyword: '广东艺术剧院', transport: '地铁 3 号线林和西站，步行前往', dynamic: true,
  },
  {
    id: 'guangzhou-circus-show', name: '挑一场小剧场或魔术演出', shortName: '小剧场之夜', category: 'show', district: '海珠区', budget: 220, budgetLabel: '约 ¥80–220', duration: '1.5–2.5 小时', indoorOutdoor: 'indoor', tags: ['小剧场', '魔术', '动态'], emoji: '✨', reason: '距离演员更近的小剧场，很容易收获意料之外的惊喜。', tip: '不绑定固定商家，购票前确认评价、地址与退改规则。', mapKeyword: '广州 小剧场 演出', transport: '场地不固定，购票前确认公共交通', dynamic: true,
  },
  {
    id: 'yongqingfang-shops', name: '去永庆坊逛独立小店', shortName: '永庆坊逛店', category: 'market', district: '荔湾区', budget: 150, budgetLabel: '约 ¥30–150', duration: '2–4 小时', indoorOutdoor: 'mixed', tags: ['文创', '西关', '逛店'], emoji: '🛍️', reason: '骑楼、非遗、小店混在一起，边走边看不容易无聊。', tip: '市集不是每天都有，若为市集而去请先确认当周安排。', mapKeyword: '永庆坊', transport: '地铁 1/6 号线黄沙站，步行前往', dynamic: true,
  },
  {
    id: 'dongshankou-shops', name: '逛东山口独立商店', shortName: '东山口小店', category: 'market', district: '越秀区', budget: 180, budgetLabel: '约 ¥30–180', duration: '2–4 小时', indoorOutdoor: 'mixed', tags: ['设计', '文创', '洋楼'], emoji: '🎀', reason: '不需要购物清单，看看小店陈列和旧洋楼就已经很治愈。', tip: '商店营业时间各异，居民区请保持安静。', mapKeyword: '东山口 独立商店', transport: '地铁 1/6 号线东山口站',
  },
  {
    id: 'beijing-road-weekend', name: '去北京路随缘逛周末活动', shortName: '北京路闲逛', category: 'market', district: '越秀区', budget: 150, budgetLabel: '约 ¥30–150', duration: '2–4 小时', indoorOutdoor: 'mixed', tags: ['步行街', '文创', '动态'], emoji: '🎪', reason: '就算没遇上市集，也能逛店、吃东西、看夜景，容错率很高。', tip: '临时活动以街区官方发布为准。', mapKeyword: '北京路步行街', transport: '地铁 6 号线北京路站', dynamic: true,
  },
  {
    id: 'flower-city-pop-market', name: '去花城广场碰一场创意活动', shortName: '花城广场活动', category: 'market', district: '天河区', budget: 120, budgetLabel: '约 ¥0–120', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['市集', '夜景', '动态'], emoji: '🌼', reason: '城市中轴线很适合傍晚闲逛，有活动是彩蛋，没活动也有夜景。', tip: '出发前查看当周活动公告，不保证固定有市集。', mapKeyword: '花城广场', transport: '地铁 APM 线花城大道站', dynamic: true,
  },
  {
    id: 'pazhou-weekend-market', name: '去琶洲逛一次主题展或市集', shortName: '琶洲主题市集', category: 'market', district: '海珠区', budget: 200, budgetLabel: '约 ¥0–200', duration: '3–5 小时', indoorOutdoor: 'indoor', tags: ['展会', '市集', '动态'], emoji: '🧸', reason: '主题变化快，适合想看新东西、顺便淘点小物的周末。', tip: '展会日期、票价和实名规则必须提前确认。', mapKeyword: '广州 琶洲 周末展会 市集', transport: '地铁 8 号线琶洲站或新港东站', dynamic: true,
  },
  {
    id: 'taikoo-warehouse-stroll', name: '去太古仓逛店看日落', shortName: '太古仓日落', category: 'market', district: '海珠区', budget: 180, budgetLabel: '约 ¥30–180', duration: '2–3 小时', indoorOutdoor: 'mixed', tags: ['仓库', '江景', '餐饮'], emoji: '🌅', reason: '旧仓库、江边和落日放在一起，很适合轻松约会。', tip: '餐饮消费差异大，只散步也完全成立。', mapKeyword: '太古仓码头', transport: '地铁 8 号线沙园站，换乘公交或步行',
  },
  {
    id: 'huangpu-ancient-port', name: '逛黄埔古港与周边小店', shortName: '黄埔古港', category: 'market', district: '海珠区', budget: 100, budgetLabel: '约 ¥30–100', duration: '3–4 小时', indoorOutdoor: 'mixed', tags: ['古村', '小吃', '手信'], emoji: '⚓', reason: '古港、祠堂和小吃混在一起，像一趟不用离城的小旅行。', tip: '临时摊位不固定，不以市集为唯一目的。', mapKeyword: '黄埔古港', transport: '地铁 8 号线万胜围站，换乘公交',
  },
  {
    id: 'shawan-ancient-town', name: '去沙湾古镇逛手作与小吃', shortName: '沙湾古镇', category: 'market', district: '番禺区', budget: 120, budgetLabel: '约 ¥30–120', duration: '3–5 小时', indoorOutdoor: 'mixed', tags: ['古镇', '手作', '小吃'], emoji: '🏘️', reason: '老建筑和传统小吃都很集中，慢慢走比赶景点更有味道。', tip: '部分展馆另收费，店铺开放以现场为准。', mapKeyword: '沙湾古镇', transport: '地铁 3 号线市桥站，换乘公交',
  },
  {
    id: 'pottery-workshop', name: '做一个歪歪扭扭的陶杯', shortName: '陶艺体验', category: 'experience', district: '海珠区', budget: 180, budgetLabel: '约 ¥100–180', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['手作', '陶艺', '约会'], emoji: '🏺', reason: '成品不完美才可爱，而且手上沾着泥的时候很难继续焦虑。', tip: '不绑定具体商家，预约前确认烧制、邮寄是否另收费。', mapKeyword: '广州 陶艺体验', transport: '优先筛选地铁步行 10 分钟内工作室', dynamic: true,
  },
  {
    id: 'tufting-workshop', name: '亲手做一块 Tufting 小毯子', shortName: 'Tufting 手作', category: 'experience', district: '天河区', budget: 260, budgetLabel: '约 ¥180–260', duration: '3–5 小时', indoorOutdoor: 'indoor', tags: ['手作', 'Tufting', '朋友'], emoji: '🧶', reason: '专注戳线几小时，最后还能抱走一件真正属于你的作品。', tip: '确认尺寸和加时收费，复杂图案可能超过预算。', mapKeyword: '广州 Tufting 手作', transport: '优先选择体育西路或岗顶等地铁商圈', dynamic: true,
  },
  {
    id: 'indoor-climbing', name: '去室内攀岩挑战一下', shortName: '室内攀岩', category: 'experience', district: '天河区', budget: 180, budgetLabel: '约 ¥100–180', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['运动', '攀岩', '新手'], emoji: '🧗', reason: '路线像立体解谜，爬不上去也会被自己逗笑。', tip: '新手选择含装备与指导的体验票。', mapKeyword: '广州 室内攀岩馆', transport: '优先选择地铁直达商圈内场馆', dynamic: true,
  },
  {
    id: 'badminton-session', name: '约朋友打两小时羽毛球', shortName: '羽毛球局', category: 'experience', district: '白云区', budget: 80, budgetLabel: '约 ¥40–80/人', duration: '2 小时', indoorOutdoor: 'indoor', tags: ['运动', '朋友', '出汗'], emoji: '🏸', reason: '输赢不重要，能把一周坐出来的僵硬全甩掉就赢了。', tip: '周末场地紧张，提前预约并确认是否提供球拍。', mapKeyword: '广州 羽毛球馆', transport: '按同行者位置选择地铁可达场馆', dynamic: true,
  },
  {
    id: 'board-game-afternoon', name: '开一桌不用动脑太多的桌游', shortName: '桌游下午', category: 'experience', district: '越秀区', budget: 80, budgetLabel: '约 ¥40–80/人', duration: '3–5 小时', indoorOutdoor: 'indoor', tags: ['桌游', '朋友', '雨天'], emoji: '🎲', reason: '下雨、太热、懒得走路时，桌游就是室内快乐避难所。', tip: '提前确认人数、包间费和最低消费。', mapKeyword: '广州 桌游店', transport: '优先选择公园前、北京路等地铁商圈', dynamic: true,
  },
  {
    id: 'escape-room', name: '组队挑战一场密室', shortName: '密室逃脱', category: 'experience', district: '天河区', budget: 180, budgetLabel: '约 ¥100–180/人', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['密室', '团队', '解谜'], emoji: '🔐', reason: '平时各玩手机的人，一进密室马上就会开始认真合作。', tip: '确认恐怖程度、玩家人数与安全提示。', mapKeyword: '广州 密室逃脱', transport: '优先选择体育西路、岗顶等地铁商圈', dynamic: true,
  },
  {
    id: 'bowling-night', name: '去打保龄球', shortName: '保龄球局', category: 'experience', district: '天河区', budget: 150, budgetLabel: '约 ¥80–150/人', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['保龄球', '聚会', '雨天'], emoji: '🎳', reason: '技术门槛不高，打中一球就有足够理由全员欢呼。', tip: '确认鞋租、局数和周末时段价。', mapKeyword: '广州 保龄球馆', transport: '优先选择大型商场内地铁可达场馆', dynamic: true,
  },
  {
    id: 'archery-session', name: '体验一次室内射箭', shortName: '室内射箭', category: 'experience', district: '番禺区', budget: 150, budgetLabel: '约 ¥80–150/人', duration: '1.5–2 小时', indoorOutdoor: 'indoor', tags: ['射箭', '专注', '新手'], emoji: '🏹', reason: '拉弓那一刻会自动安静下来，特别适合想换换脑子的周末。', tip: '选择有教练指导和护具的正规场馆。', mapKeyword: '广州 室内射箭馆', transport: '优先选择汉溪长隆或市桥地铁商圈', dynamic: true,
  },
  {
    id: 'city-karting', name: '去开几圈室内卡丁车', shortName: '卡丁车', category: 'experience', district: '番禺区', budget: 260, budgetLabel: '约 ¥180–260/人', duration: '1.5–2.5 小时', indoorOutdoor: 'indoor', tags: ['速度', '朋友', '竞技'], emoji: '🏎️', reason: '戴上头盔后大家都会突然认真，几圈就能把压力甩在弯道上。', tip: '确认身高、服装和安全限制，不为竞速勉强驾驶。', mapKeyword: '广州 室内卡丁车', transport: '优先选择番禺地铁商圈场馆', dynamic: true,
  },
  {
    id: 'old-guangzhou-citywalk', name: '跟一条老广州主题 Citywalk', shortName: '老城 Citywalk', category: 'experience', district: '越秀区', budget: 50, budgetLabel: '约 ¥0–50', duration: '3–4 小时', indoorOutdoor: 'outdoor', tags: ['Citywalk', '历史', '拍照'], emoji: '👟', reason: '带着一个主题走老城，会比单纯打卡更容易记住街道的故事。', tip: '可以从农讲所走到北京路，午后注意防晒。', mapKeyword: '农讲所 北京路 Citywalk', transport: '地铁 1 号线农讲所站起步',
  },
  {
    id: 'pet-cafe', name: '去宠物咖啡馆发一会儿呆', shortName: '宠物咖啡', category: 'experience', district: '海珠区', budget: 100, budgetLabel: '约 ¥60–100/人', duration: '1.5–2 小时', indoorOutdoor: 'indoor', tags: ['宠物', '咖啡', '治愈'], emoji: '🐾', reason: '让毛茸茸替你接管注意力，两个小时里先别想工作。', tip: '选择重视动物福利与卫生的店，不强行抱宠物。', mapKeyword: '广州 宠物咖啡馆', transport: '优先选择江南西等地铁商圈', dynamic: true,
  },
  {
    id: 'craft-workshop', name: '参加一场随机手作 Workshop', shortName: '随机手作课', category: 'experience', district: '荔湾区', budget: 200, budgetLabel: '约 ¥100–200/人', duration: '2–3 小时', indoorOutdoor: 'indoor', tags: ['手作', '非遗', 'Workshop'], emoji: '✂️', reason: '香囊、银饰、拓印都可以，重点是把周末做成一件看得见的东西。', tip: '活动内容动态变化，预约前确认材料费和成品领取方式。', mapKeyword: '广州 周末 手作 Workshop', transport: '优先选择永庆坊、陈家祠周边工作室', dynamic: true,
  },
];

function getTimeTags(duration: string, tags: string[]): ActivityTimeTag[] {
  const timeTags: ActivityTimeTag[] = [];
  if (/1(?:\.5)?[–-]2|1–2|2 小时/.test(duration)) timeTags.push('short');
  if (/2[–-][34]|3[–-]4|2–4|3 小时/.test(duration)) timeTags.push('half-day');
  if (/4[–-][68]|5 小时|一整天/.test(duration)) timeTags.push('full-day');
  if (tags.some((tag) => /夜|日落|晚/.test(tag))) timeTags.push('evening');
  return timeTags.length > 0 ? [...new Set(timeTags)] : ['half-day'];
}

export const coreActivities: EvergreenActivity[] = coreActivitySeeds.map(
  ({ dynamic, ...activity }) => {
    void dynamic;
    return {
      ...activity,
      schemaVersion: 2,
      id: `place:guangzhou:${activity.id}`,
      legacyIds: [activity.id],
      cityId: 'guangzhou',
      venue: activity.mapKeyword,
      priceStatus: activity.budget === 0 ? 'free' : 'known',
      timeTags: getTimeTags(activity.duration, activity.tags),
      live: false,
    };
  },
);
