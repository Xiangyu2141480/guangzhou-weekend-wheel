export const evergreenReferences = {
  publicCulture: {
    name: '广州市市级以上公共文化设施目录',
    url: 'https://www.gz.gov.cn/zwgk/zdly/lysc/cyzl/content/post_10280234.html',
    verifiedAt: '2026-08-30',
  },
  cultureVenues: {
    name: '广州市文化广电旅游局文化场馆一览',
    url: 'https://wglj.gz.gov.cn/ggfw/whl/whcgylb/index.html',
    verifiedAt: '2026-08-30',
  },
  summerRoutes: {
    name: '广州市文化广电旅游局 2026 年覆盖 11 区的 20 条线路',
    url: 'https://wglj.gz.gov.cn/gkmlpt/content/10/10898/mpost_10898321.html',
    verifiedAt: '2026-08-30',
  },
  parks: {
    name: '广州市林业和园林局公开公园景区信息',
    url: 'https://lyylj.gz.gov.cn/',
    verifiedAt: '2026-08-30',
  },
} as const;

export interface EvergreenReference {
  name: string;
  url: string;
  verifiedAt: string;
}

export const evergreenReferencesByCity = {
  beijing: [
    {
      name: '首都之窗北京地区博物馆展览与场馆信息',
      url: 'https://www.beijing.gov.cn/fwcj/calendar/bwgzl/6618d5bb687c8120c07705d1.html',
      verifiedAt: '2026-09-24',
    },
    {
      name: '北京市文物局北京地区正常开放博物馆名录指引',
      url: 'https://wwj.beijing.gov.cn/bjww/wwjzzcslm/1737418/1738083/cjwt1/436282845/index.html',
      verifiedAt: '2026-09-24',
    },
    {
      name: '首都之窗“漫步北京·追光夜游”官方线路',
      url: 'https://www.beijing.gov.cn/renwen/rwzyd/xltj/202508/t20250825_4182897.html',
      verifiedAt: '2026-09-24',
    },
  ],
  shanghai: [
    {
      name: '上海市文化和旅游局文博场馆、图书馆与文化馆名录',
      url: 'https://whlyj.sh.gov.cn/wbcg/index.html',
      verifiedAt: '2026-09-24',
    },
    {
      name: '上海市市级价格管理公共文化设施目录',
      url: 'https://fgw.sh.gov.cn/fgw_jjjctk/20220824/eaacf2682f9d402c81f328667be300f1.html',
      verifiedAt: '2026-09-24',
    },
    {
      name: '上海市文化和旅游局官方 Citywalk 路线',
      url: 'https://whlyj.sh.gov.cn/gqfc/20240222/76f88e52489d4dfaa5a1a352f0fda01f.html',
      verifiedAt: '2026-09-24',
    },
  ],
  guangzhou: Object.values(evergreenReferences),
  shenzhen: [
    {
      name: '深圳市文化广电旅游体育局公共服务图谱',
      url: 'https://wtl.sz.gov.cn/fzlm/tupu/gonggong/index.html',
      verifiedAt: '2026-09-24',
    },
    {
      name: '深圳市文化广电旅游体育局博物馆一览表',
      url: 'https://wtl.sz.gov.cn/ggfw/whl/bwgylb/index.html',
      verifiedAt: '2026-09-24',
    },
    {
      name: '深圳政府在线文化场馆介绍',
      url: 'https://www.sz.gov.cn/szzt2010/szwtt/wtcg/whcg/content/mpost_11127054.html',
      verifiedAt: '2026-09-24',
    },
  ],
  suzhou: [
    {
      name: '苏州市文化广电和旅游局官方网站',
      url: 'https://wglj.suzhou.gov.cn/',
      verifiedAt: '2026-09-24',
    },
    {
      name: '苏州市园林和绿化管理局公共服务清单',
      url: 'https://ylj.suzhou.gov.cn/szsylj/qzqd/202001/832578bb74394c5ba5f725aba6cf090d.shtml',
      verifiedAt: '2026-09-24',
    },
    {
      name: '苏州博物馆官方网站',
      url: 'https://www.szmuseum.com/',
      verifiedAt: '2026-09-24',
    },
  ],
} as const satisfies Readonly<Record<string, readonly EvergreenReference[]>>;
