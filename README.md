# 今天去哪玩？

「今天去哪玩？」是一个由鱼丸陪你做决定的城市周末随机 Web App。目前支持北京、上海、广州、深圳、苏州，把每座城市的常驻去处与近期官方活动合并成独立活动池，支持完整筛选、两种随机模式和固定 10 候选转盘；结果票根同时给出参考费用、交通、地图入口与动态活动的官方来源。

线上地址：<https://xiangyu2141480.github.io/guangzhou-weekend-wheel/>

![今天去哪玩？手机端](docs/v2-mobile.png)

![今天去哪玩？桌面端](docs/v2-desktop.png)

## 功能

- 8 类活动：看展、户外、吃喝、演出、市集、体验、运动、夜游。
- 预算、区域、时长、室内外，以及约会、独处、朋友、休息、运动、拍照、吃喝、知识、夜间、免费等状态筛选。
- `✨ 本周新鲜`：在符合条件时优先混入最多 4 个有效实时活动。
- `🎲 纯命运`：从全部符合条件的活动中等规则随机抽取。
- 每轮固定展示最多 10 个候选；支持单独「换一批」，不会因此直接生成结果。
- 最近候选和最近结果去重；池较小时逐级放宽，避免无结果死锁。
- 票根展示地点、场馆、费用、时长、环境、公共交通、地图和出发提醒；动态活动另有日期、官方来源和状态贴纸。
- 首访选择城市，之后可从页头切换；选择会保存在浏览器本地，筛选、候选、结果、行政区和活动缓存均按城市隔离。
- 收藏保存在浏览器本地并支持跨城市查看。应用已彻底移除分享、复制和下载结果功能。
- 移动端优先，并提供 1440px 双栏桌面布局、键盘焦点与减少动态效果支持。

## 鱼丸角色资产

V2 的鱼丸角色来自项目维护者在本次任务中提供的 5 张透明 PNG 参考图。构建过程没有把整张参考图塞进页面，也没有重新设计另一只狗；而是从指定姿势中拆分、清理背景与低透明阴影、统一透明画布，产出 12 个独立的 512×512 PNG 状态资产：

- 核心：`idle`、`think`、`happy`、`point`、`rest`
- 场景：`search`、`run`、`spin`、`empty`、`favorite`、`map`、`ticket`

网页只通过 `YuwanMascot` 的中央映射读取角色资产。处理脚本位于 `scripts/process-yuwan-assets.ps1`，资产说明位于 `src/assets/yuwan/README.md`；原始参考图不随仓库发布。

代码按仓库许可证使用。鱼丸角色图形及用户提供的参考图不自动纳入代码许可证，后续复用或再发布需由使用者自行确认相应授权。地点名称、交通信息与 emoji 仅用于信息说明。

## 多城市数据维护

### Evergreen 常驻池

城市注册表位于 `src/data/cities.ts`，常驻池位于
`src/data/evergreen/<cityId>/`。业务代码只通过
`getEvergreenActivities(cityId)` 和 `getAllEvergreenActivities()` 读取数据。每条记录包含区域和场馆、参考预算、预计时长、室内外属性、状态标签、公共交通、推荐理由、出发提醒与核对来源。

正式启用一座城市前，必须同时满足：

- 常驻池不少于 30 条，8 个类别每类不少于 2 条。
- 每条记录的 `cityId`、行政区、预算、交通、地图关键词和必填字段通过校验，`place:<cityId>:<stable-slug>` ID 全局唯一。
- 至少 2 个已评审的政府或官方场馆参考来源，且至少 1 个官方实时来源适配器及固定 fixture 通过测试。

新增城市时：

1. 在 `CITY_IDS` 和 `CITY_CONFIGS` 中登记 ID、名称、adcode、行政区与时区，开发期间先设 `enabled: false`。
2. 新建 `src/data/evergreen/<cityId>/index.ts`，在 `src/data/evergreen/index.ts` 注册常驻池，并在 `src/data/evergreen/references.ts` 记录来源与核对日期。
3. 新增官方 `SourceAdapter`、fixture 和解析测试，在 `scripts/sync-activities/sources/index.ts` 注册。
4. 生成并校验 `public/data/cities/<cityId>.json`，将城市加入 manifest 协议和相关参数化测试。
5. 全部门槛和发布验证通过后才把 `enabled` 改为 `true`。`enabled: false` 会从城市选择器隐藏该城市，并拒绝恢复或写入该城市选择；它不是删除数据或绕过同步校验的开关。

维护常驻数据时请同步核对费用、开放状态、公共交通和场馆名称，并运行全量测试。

### Live 近期活动

每个候选来源在写适配器前都要评审：归属必须是政府或官方公共文化场馆；列表和详情无需登录、验证码或私人 Cookie；标题、日期、地点和详情 URL 可稳定解析；分页、跨月和长期活动规则明确；自动访问不违反站点规则。不得用票务聚合站、自媒体或社区帖子凑数。前端只发布可信 HTTPS 详情链接。

`SourceAdapter` 在 `scripts/sync-activities/types.ts` 定义。每个适配器只负责一个城市的一个官方栏目，声明稳定且全局唯一的 `id`、`cityId`、`name`、`sourceType`、`allowedHosts`、`allowEmptyResult` 和 `fetch(fetchedAt)`。缺少可靠日期、场馆或详情链接的记录必须丢弃；返回零条默认视为来源失败，只有官方栏目能明确表达“当前无活动”时才可设置 `allowEmptyResult: true`。

适配器及固定 HTML/JSON 样本位于：

```text
scripts/sync-activities/sources/
scripts/sync-activities/__fixtures__/
```

解析测试只读取 fixture，不访问真实官网；生产抓取只在 Pages 工作流或维护者明确执行同步命令时发生。fixture 应保留最小但完整的列表/详情结构，并覆盖日期、行政区、详情 URL 和来源域名解析。官网结构变化时，先更新评审记录和 fixture，再修改适配器，不要用放宽校验掩盖解析失败。

数据链路为：

```text
官方来源 → GitHub Actions → normalize → validate → dedupe → expire → deploy
```

`.github/workflows/deploy.yml` 每 6 小时运行一次，也会在推送 `main` 时运行。同步器设置请求超时和一次重试；失败按“城市 + 来源”隔离，成功来源使用本轮数据，失败来源只允许回填同城、同来源且 `lastVerifiedAt` 不超过 7 天的上一版有效记录。单城异常不应污染其他城市。

Live 数据是准实时快照，不是实时票务库存。日期、场次、票价、预约和交通都可能变化，出发前必须以结果票根中的官方来源为准。

### manifest 与城市快照

前端先加载 manifest，再只加载当前城市的原子快照：

```text
public/data/manifest.json
public/data/cities/<cityId>.json
```

manifest 和快照均使用 `schemaVersion: 2`。manifest 的每个城市条目包含
`cityId`、相对 `snapshot` 路径、`availability`、`generatedAt` 和
`liveCount`；城市快照同时包含 `cityId`、来源状态、计数、warnings 和
activities。发布器先原子替换所有城市快照和广州兼容文件，最后替换 manifest，避免 manifest 指向未完成的数据。

城市级 `availability` 有四级：

- `fresh`：所有已配置来源成功，本轮有有效实时数据。
- `partial`：至少一个来源成功、至少一个来源失败，且仍有可发布的实时活动。
- `stale`：本轮没有来源成功，但仍发布 7 天内的有效 fallback。
- `evergreen-only`：没有可发布的实时活动，前端只使用该城常驻池。

浏览器会把成功快照缓存到 `where-to-go:snapshot:<cityId>:v2`。网络、解析或校验失败时只读取同城缓存；缓存超过 7 天、快照城市不匹配或活动全部过期时，退回同城常驻池。服务端 fallback 和浏览器缓存都禁止跨城复用。

为兼容旧客户端，以下文件至少保留一个兼容发布周期：

```text
public/data/live-activities.json
public/data/sync-status.json
```

它们必须从广州 V2 城市快照派生并与其逐项一致，不运行第二套广州抓取。`npm run sync:check` 会离线校验 manifest、五城快照及这两个兼容文件。

### 收藏迁移

多城市收藏写入 `where-to-go:favorites:v2`，记录 `activityId`、`cityId`、保存时间和展示快照。若 V2 数据缺失或非法，应用读取旧键 `gzww:favorites`，把旧 ID 按广州活动的 `id`/`legacyIds` 映射到新 ID；无法映射的旧收藏仍按广州收藏保留，可在收藏页删除。迁移会去重且可重复执行，暂不删除旧键，以便回滚。

## 本地开发

需要 Node.js 24+：

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run sync:activities        # 同步全部城市并写入 manifest、城市快照和广州兼容文件
npm run sync:city -- shanghai  # 只同步指定城市，并重建完整 manifest
npm run sync:check             # 离线校验已提交数据，不访问网络、不写文件
npm run test:data              # 校验城市数据、快照协议、来源适配器与 fixture
npm run test:run               # Vitest 单元与组件测试
npm run lint                   # ESLint
npm run build                  # TypeScript + Vite 生产构建
npm run qa:e2e                 # Playwright Chromium 浏览器流程
```

如果当前网络无法下载 Playwright Chromium，可设置
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指向本机 Chrome 后运行 `npm run qa:e2e`。

自动化覆盖五城选择与持久化、城市切换隔离、常驻池门槛、来源 fixture、manifest/快照一致性、广州兼容文件、收藏迁移、四级 availability、7 天 fallback、375/390/430/1440 像素视口、键盘与焦点、reduced-motion、转盘结果一致性，以及 serious/critical axe 检查；E2E 还会拦截非预期控制台错误、页面异常和同源资源失败。

生产环境使用 `/guangzhou-weekend-wheel/` 作为 Vite base path。前端通过 `import.meta.env.BASE_URL` 读取 JSON，因此 GitHub Pages 子路径和本地开发路径使用同一套代码。

## 部署与维护

推送到 `main` 后，GitHub Actions 会依次同步五城活动、校验原子快照、运行测试与构建，并部署到现有 GitHub Pages 地址。不要新建仓库或更换 Pages URL。

完整的 Draft PR、CI、合并、Pages 发布、线上验收与回滚步骤见 [`docs/release-checklist.md`](docs/release-checklist.md)。

发布前完整本地检查：

```bash
npm ci
npm run sync:check
npm run test:data
npm run test:run
npm run lint
npm run build
npm run qa:e2e
npm audit --omit=dev --audit-level=high
git diff --check
```

线上验收可通过 `QA_BASE_URL` 让同一套 Playwright 测试直接指向 Pages。发布时还需核对数据计数、资源加载、控制台和多视口表现；具体门禁与平台安全头限制以发布检查清单为准。
