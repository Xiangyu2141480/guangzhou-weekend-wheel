export const CITY_IDS = [
  'beijing',
  'shanghai',
  'guangzhou',
  'shenzhen',
  'suzhou',
  'hangzhou',
  'nanjing',
  'chengdu',
  'chongqing',
] as const;

export type CityId = (typeof CITY_IDS)[number];

export interface CityConfig {
  id: CityId;
  name: string;
  englishName: string;
  adcode: string;
  timezone: 'Asia/Shanghai';
  districts: readonly string[];
  enabled: boolean;
}

export const CITY_CONFIGS = [
  {
    id: 'beijing',
    name: '北京',
    englishName: 'Beijing',
    adcode: '110000',
    timezone: 'Asia/Shanghai',
    districts: [
      '东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区',
      '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区',
    ],
    enabled: true,
  },
  {
    id: 'shanghai',
    name: '上海',
    englishName: 'Shanghai',
    adcode: '310000',
    timezone: 'Asia/Shanghai',
    districts: [
      '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区',
      '闵行区', '宝山区', '嘉定区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区',
    ],
    enabled: true,
  },
  {
    id: 'guangzhou',
    name: '广州',
    englishName: 'Guangzhou',
    adcode: '440100',
    timezone: 'Asia/Shanghai',
    districts: [
      '越秀区', '荔湾区', '海珠区', '天河区', '白云区', '黄埔区',
      '番禺区', '南沙区', '花都区', '增城区', '从化区',
    ],
    enabled: true,
  },
  {
    id: 'shenzhen',
    name: '深圳',
    englishName: 'Shenzhen',
    adcode: '440300',
    timezone: 'Asia/Shanghai',
    districts: [
      '福田区', '罗湖区', '南山区', '盐田区', '宝安区',
      '龙岗区', '龙华区', '坪山区', '光明区',
    ],
    enabled: true,
  },
  {
    id: 'suzhou',
    name: '苏州',
    englishName: 'Suzhou',
    adcode: '320500',
    timezone: 'Asia/Shanghai',
    districts: [
      '姑苏区', '虎丘区', '吴中区', '相城区', '吴江区',
      '常熟市', '张家港市', '昆山市', '太仓市',
    ],
    enabled: true,
  },
  {
    id: 'hangzhou',
    name: '杭州',
    englishName: 'Hangzhou',
    adcode: '330100',
    timezone: 'Asia/Shanghai',
    districts: ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '临平区', '钱塘区', '富阳区', '临安区', '桐庐县', '淳安县', '建德市'],
    enabled: true,
  },
  {
    id: 'nanjing',
    name: '南京',
    englishName: 'Nanjing',
    adcode: '320100',
    timezone: 'Asia/Shanghai',
    districts: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区'],
    enabled: true,
  },
  {
    id: 'chengdu',
    name: '成都',
    englishName: 'Chengdu',
    adcode: '510100',
    timezone: 'Asia/Shanghai',
    districts: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区', '郫都区', '新津区', '都江堰市', '彭州市', '邛崃市', '崇州市', '简阳市', '金堂县', '大邑县', '蒲江县'],
    enabled: true,
  },
  {
    id: 'chongqing',
    name: '重庆',
    englishName: 'Chongqing',
    adcode: '500000',
    timezone: 'Asia/Shanghai',
    districts: ['万州区', '涪陵区', '渝中区', '大渡口区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '巴南区', '綦江区', '大足区', '长寿区', '江津区', '合川区', '永川区', '南川区', '璧山区', '铜梁区', '潼南区', '荣昌区', '开州区', '梁平区', '武隆区', '黔江区', '城口县', '丰都县', '垫江县', '忠县', '云阳县', '奉节县', '巫山县', '巫溪县', '石柱土家族自治县', '秀山土家族苗族自治县', '酉阳土家族苗族自治县', '彭水苗族土家族自治县', '两江新区'],
    enabled: true,
  },
] as const satisfies readonly CityConfig[];

export const cities = CITY_CONFIGS;

export function validateCityConfigs(configs: readonly CityConfig[]): void {
  const uniqueFields = ['id', 'name', 'englishName', 'adcode'] as const;
  for (const field of uniqueFields) {
    const values = configs.map((city) => city[field]);
    if (new Set(values).size !== values.length) {
      throw new TypeError(`City ${field} values must be unique`);
    }
  }

  for (const city of configs) {
    if (city.districts.length === 0 || city.districts.some((district) => district.trim() === '')) {
      throw new TypeError(`City ${city.id} must define non-empty districts`);
    }
    if (new Set(city.districts).size !== city.districts.length) {
      throw new TypeError(`City ${city.id} district values must be unique`);
    }
  }
}

validateCityConfigs(CITY_CONFIGS);

export const CITY_CONFIG_BY_ID: Readonly<Record<CityId, CityConfig>> =
  Object.fromEntries(CITY_CONFIGS.map((city) => [city.id, city])) as unknown as Record<CityId, CityConfig>;

export function isCityId(value: unknown): value is CityId {
  return typeof value === 'string' && CITY_IDS.includes(value as CityId);
}

export function getCityConfig(cityId: CityId): CityConfig {
  return CITY_CONFIG_BY_ID[cityId];
}

export function isDistrictInCity(cityId: CityId, district: unknown): district is string {
  return typeof district === 'string' && getCityConfig(cityId).districts.includes(district);
}
