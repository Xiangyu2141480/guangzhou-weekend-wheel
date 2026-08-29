# 今天去哪汪？V2／鱼丸出门部设计规范

**日期：** 2026-08-29  
**仓库：** `Xiangyu2141480/guangzhou-weekend-wheel`  
**线上地址：** `https://xiangyu2141480.github.io/guangzhou-weekend-wheel/`  
**功能分支：** `codex/v2-yuwan-live-activity`

## 1. 目标与边界

V2 在现有 React、TypeScript、Vite、SVG 转盘、收藏、GitHub Pages 与测试体系上原地升级，不新建项目、不更换仓库和线上地址。目标是把现有“有小狗的随机转盘”升级为由原创角色鱼丸主持的广州周末随机决策产品，同时把可靠候选池扩到正常情况下 200+，增加由 GitHub Actions 约每 6 小时同步的近期官方活动。

产品仍然只解决一个问题：周末去哪，让鱼丸帮用户转。它不是旅游门户、票务平台、点评网站或推荐算法。V2 不引入登录、数据库、后端服务、AI 推荐、支付、评论、广告、地图 SDK 或社交系统。

P0 变更是彻底删除复制与分享结果功能。最终结果卡不得出现分享、复制或下载入口，代码不得调用 `navigator.share` 或 `navigator.clipboard`。

## 2. 已确认的品牌与视觉方向

### 2.1 品牌层级

- 产品主标题继续使用「今天去哪汪？」。
- 「鱼丸出门部」作为角色品牌印章与内容主持人标识，不与主标题争夺层级。
- 副标题使用「广州周末不知道去哪？让鱼丸替你决定。」或同语气短句。

### 2.2 鱼丸角色来源

鱼丸的造型只能从用户提供的五张参考图派生，不重新发明角色轮廓：

- `ChatGPT Image 2026年8月28日 00_48_31 (1).png`
- `ChatGPT Image 2026年8月28日 00_48_32 (2).png`
- `ChatGPT Image 2026年8月28日 00_48_32 (3).png`
- `ChatGPT Image 2026年8月28日 00_48_32 (4).png`
- `ChatGPT Image 2026年8月28日 00_37_37.png`

这些图是鱼丸的母版与动作库。实现时根据 UI 状态选择其中的对应姿态，拆成独立透明资产，再清理透明边缘、减弱厚阴影、统一描边视觉重量与画布尺寸。必要的 SVG 路径应沿现有轮廓做确定性描摹和简化，不改变头身比、云朵耳、眼鼻比例、表情和姿势。不得把整张合辑图嵌入网页，不得用 CSS `background-position` 充当精灵图。

核心资产优先输出为轻量 SVG；不适合可靠描摹的复杂道具姿态使用裁切干净、压缩后的透明 WebP/PNG。所有项目使用的最终派生资产必须进入仓库，不能依赖 Downloads 或 Codex 临时目录。

### 2.3 角色资产结构

```text
src/assets/yuwan/
  core/          idle, think, happy, point, rest
  states/        search, run, spin, empty, favorite
  categories/    art, outdoor, food, music 等
  decorative/    paw, ticket, map, heart 等

src/components/YuwanMascot.tsx
src/constants/mascot.ts
src/constants/mascotMessages.ts
```

`YuwanMascot` 负责状态到资产的唯一映射、统一 alt 文本、尺寸等级和 `idle` fallback。页面不得散落角色资源路径。核心必须状态为 `idle`、`think`、`search`、`run`、`spin`、`happy`、`point`、`rest`、`empty`、`favorite`；其他状态只在能从参考图找到一致姿态且实际 UI 会使用时添加。

### 2.4 图标策略

已选择「鱼丸主持人 + 功能图标」方案：

- 鱼丸用于 Hero、状态反馈、候选池说明、转盘陪伴、加载/空状态、结果签、收藏空状态、最近活动贴纸和彩蛋。
- 分类 chips 使用清楚、圆角、统一描边的小型主题图标并始终保留文字。
- 关闭、返回、心形收藏、定位、外链、折叠等基础功能使用简洁 SVG，不强行狗头化。
- 整体使用奶油暖白、黑色圆润描边、低饱和黄/粉/绿/蓝、轻手账纸与贴纸感；不得出现紫色 AI 渐变、玻璃拟态、Dashboard、厚重阴影或插画海报堆叠。

## 3. 产品界面与状态

### 3.1 页面结构

1. **Hero**：鱼丸抬爪、坐姿或开心姿态，展示主标题、副标题、鱼丸出门部印章和收藏入口。
2. **默认筛选**：只展示活动类型与预算，避免表单感。
3. **更多筛选**：在「再挑一点」内展示同行者/状态、区域、时间和室内外。
4. **候选池状态**：用地图或寻找姿态鱼丸显示 Evergreen 总数、近期活动数、当前符合条件数与本轮 10 个候选。
5. **随机模式**：默认「本周新鲜」，可切换「纯命运」。
6. **转盘**：固定显示本轮 10 个候选的 emoji 与极短 `shortName`；转盘仍是页面第一主视觉。
7. **结果签**：使用举票或指向姿态鱼丸，展示活动信息、鱼丸点评与必要链接。
8. **收藏抽屉**：继续使用稳定活动 ID；空状态使用趴着或抱心鱼丸。

### 3.2 筛选模型

一级分类控制在约八类：看展文化、户外、吃吃喝喝、演出、市集、好玩体验、运动、夜游。博物馆、Citywalk、咖啡、拍照等语义通过 tags 与状态筛选表达，避免首页放十二个一级分类。

预算：免费、≤ ¥50、≤ ¥100、≤ ¥200、≤ ¥300、随缘。动态项目价格未知时使用 `priceStatus: 'unknown'`；任何严格预算条件都排除未知价格项目。

更多筛选包括：

- 同行/状态：约会、一个人、和朋友、想躺平、想动一动、想出片、就想吃、想长知识、夜猫子、不想花钱。
- 区域：全广州及广州 11 区。
- 时间：1–2 小时、半天、一整天、晚上、随便。
- 环境：室内、户外、皆可。

状态 chips 映射为公开、可测试的 tags/filter rules，不使用黑盒推荐分数。

### 3.3 微文案与互动

鱼丸根据页面状态只说一句短文案：默认、筛选后、候选生成、旋转中、成功、空状态和连续纠结各有独立消息。语气可爱、自然、略带吐槽，不像客服。点击鱼丸循环短句；长按只触发轻量摇尾巴。V2 不加入音效，以控制首屏与交互复杂度。

所有动画尊重 `prefers-reduced-motion`。减少动态时仍保持状态变化、选中结果与转盘指针一致。

## 4. 活动数据模型与静态候选池

### 4.1 类型边界

`ActivityCore` 保存所有可筛选与展示字段：稳定 ID、名称、短名、一级分类、区域、场馆/地点、预算上限、价格标签、价格状态、时长、时间标签、室内外、tags、emoji、鱼丸点评、提醒、地图关键词、交通提示。

`EvergreenActivity` 继承核心字段并标记 `live: false`。`LiveActivity` 继承核心字段并增加：

- `sourceType: 'official' | 'venue'`
- `sourceName`、`sourceUrl`、`sourceUpdatedAt`
- `eventStart`、可选 `eventEnd`
- `fetchedAt`、`lastVerifiedAt`
- `status: 'upcoming' | 'ongoing'`
- `priceMin`、`priceMax`、`priceStatus`
- 可选 `bookingRequired`
- `live: true`

### 4.2 Evergreen 质量与规模

Evergreen 目标为 180–220 条，覆盖广州 11 区，核心城区可具有更高密度。内容使用仍稳定的公共文化设施、公园、街区、古镇、公共路线和通用体验；吃喝优先街区/路线而非具体商业餐厅；演出、市集不得用无日期的伪动态条目冒充近期活动。

每条数据必须同时有可核查的区域、价格状态、交通和开放/预约提醒。稳定 ID 必须保留 V1 已使用的 ID，以保证旧收藏兼容。数据按分类或主题拆分为小文件，并由单一 index 导出完整池。

## 5. 随机与候选池算法

完整纯函数流水线：

```text
staticActivities + liveActivities
→ merge
→ validate
→ deduplicate
→ removeExpired
→ filter
→ eligiblePool
→ sampleCandidates(10)
→ uniform selectedIndex
```

「纯命运」对全部 eligible items 做等概率无放回采样。「本周新鲜」在条件允许时抽取 4 个 Live 与 6 个 Evergreen；某一侧不足时由另一侧补齐。进入轮盘后的 10 个项目保持完全等概率选中。

记录最近两轮候选 ID 和最近三次最终结果 ID。采样先排除这些 ID；若剩余池不足 10 个，则按“旧候选 → 旧结果”的顺序逐步放宽，保证不会因为防重复产生空池。换一批只重新采样，不启动转盘。

## 6. Live 数据同步

### 6.1 正式来源

首批 adapters 只实现已确认公开且能提供关键字段的官方来源：

1. **广州图书馆活动预告**：解析活动标题、开始/结束时间、地点、状态与官方详情链接。
2. **广州市会展业公共服务平台展会排期**：解析展会标题、日期、地点和详情；通过明确 allow/deny 分类规则只保留适合普通周末参与者的文化、动漫、消费、生活类展会，排除明显 B2B、采购和专业设备展。
3. **广州市文化广电旅游局公开演出许可**：解析公开的演出名称、场馆和日期；价格一律保持未知，来源链接指向许可页面，不将其描述为票务信息。

场馆 adapter 只有在实现时确认页面结构稳定、无需登录/验证码且有明确活动日期和地点后才可加入。未达标的来源不以空壳 adapter 计入最终报告。

### 6.2 抓取与归一化

同步脚本使用明确 User-Agent、连接超时、有限重试和来源级请求频率限制；每个 source 每次 workflow 只抓必要页面。不得绕过登录、验证码、反爬、付费墙或使用私人 Cookie。

所有来源先输出 source-specific raw records，再经共享 normalize、validate、classify、deduplicate 和 expire。标题、场馆和日期生成稳定 fingerprint；日期或地点不能可靠解析的记录直接丢弃。无可靠价格时不猜测，无可靠交通时只能生成清楚标为应用建议的通用地图搜索提示。

### 6.3 过期与回退

- `eventEnd < now` 的项目过期。
- 只有单日 `eventStart` 的项目在当地日期结束后过期。
- 没有可靠结束日期的长期内容必须设置有限 TTL；不能判断有效期的记录不进主候选池。
- 一个 adapter 失败不影响其他 adapter。
- workflow 同步前读取当前生产环境的有效 Live JSON 作为 previous snapshot。
- 若多个来源失败且新 Live 数较 previous snapshot 下降超过 70%，保留 previous snapshot 并在 summary 标记 warning。
- 若所有来源失败且没有 previous snapshot，生成合法空 Live JSON，应用继续只使用 Evergreen。

### 6.4 输出与部署

同步生成：

- `public/data/live-activities.json`
- `public/data/sync-status.json`

`sync-status.json` 包含最后更新时间、配置来源数、成功来源数、各来源抓取数、最终 Live 数、去重/过期/无效数、是否启用 fallback 和 warnings。

现有 Pages workflow 增加每 6 小时一次的 schedule 与手动触发。在构建阶段同步、校验、测试和构建，再直接上传 Pages artifact；定时同步不向 `main` 提交生成文件。Actions Summary 输出数据健康报告。

## 7. 前端数据流与错误处理

页面先渲染 Evergreen，并在后台请求：

```ts
`${import.meta.env.BASE_URL}data/live-activities.json`
```

成功后合并并自然刷新池状态；失败、404、超时或解析错误只记录 console warning，不弹阻塞错误。同步状态使用相同 `BASE_URL` 规则加载。UI 显示真实的最近更新时间、近期活动数和常驻玩法数，不宣传“实时准确”，并提醒用户出发前查看官方详情。

空筛选结果展示 `empty` 鱼丸和一键清空。Live 结果显示「本周新鲜」「快结束」「0 元快乐」等满足条件的贴纸、来源名称与「查看官方详情 ↗」。地图搜索与官方详情是两个独立入口，不能把地图页面冒充来源。

## 8. 分享功能删除

删除 `ShareButton.tsx`、所有导入、分享文本、分享状态、剪贴板 fallback、分享样式和相关测试。结果卡只保留：

- 🐾 就去这里
- 🔄 不服，再来
- ♡ 收藏 / 已收藏
- 存在 `mapKeyword` 时的地图入口
- Live 且 `sourceUrl` 有效时的官方详情入口

代码库中不得再出现对 `navigator.share` 或 `navigator.clipboard` 的业务调用。

## 9. 测试策略

保留所有仍适用的 V1 测试并更新断言。新增：

- Candidate Pool：200+ 合并池、10 个无放回采样、两种模式、Live/evergreen 补位、最近候选和结果降重、过滤后采样、小池放宽。
- Filters：分类、状态、同行、区域、时间、环境和严格预算；未知价格不得进入严格预算。
- Live Core：static/live 合并、指纹去重、过期、单日结束、长期 TTL、坏数据丢弃、source failure 与 sanity fallback。
- Source Parsers：每个 adapter 使用本地 HTML/JSON fixture，不在普通测试中访问互联网。
- Data Loading：Live JSON 成功、404、超时、JSON 错误与 GitHub Pages base path。
- Mascot：核心状态映射、fallback、资源可加载、适当 alt 文本。
- Favorites：旧 `gzww:favorites` ID 读取、切换和刷新持久化。
- Share Removal：结果卡没有分享/复制/下载控件，源码不调用 share/clipboard API。
- Wheel：10 个候选、重复点击锁、selectedIndex 与结果一致、换一批不旋转。

Playwright 覆盖 375×812、390×844、430×932 与 1440×900，无横向溢出。实际验证筛选、模式切换、换一批、旋转、结果签、收藏刷新、地图/官方链接、Live 加载失败与 console error。

## 10. 发布与验收

实现使用当前功能分支，完成后运行 Vitest、TypeScript、ESLint、生产构建和 Playwright。本地保存 `docs/v2-mobile.png` 与 `docs/v2-desktop.png`，并对四个要求视口逐一视觉检查。确认无回归后推送、合入 `main`，等待 Actions 实际部署成功。

生产环境必须确认首页 HTML、构建 JS、CSS、`live-activities.json` 与 `sync-status.json` 均返回 200，并用线上 Playwright 验证核心交互。最终报告只使用真实 Evergreen、Live 和 Combined 数量，列出真正工作的 adapters、最近同步、测试数字、commit、Actions run、线上地址、截图路径和真实剩余风险。

## 11. 设计自检结论

- **占位符：** 无 TBD、TODO 或待选设计项。
- **一致性：** 10 个候选、两种随机模式、价格未知规则、Live 回退、Pages base path 与 UI 文案相互一致。
- **范围：** 仅升级当前静态产品与构建期同步，不引入后端或平台功能。
- **资产边界：** 鱼丸形象从用户提供的五张参考图派生；不再使用临时自创轮廓，也不把合辑图直接嵌入页面。
- **明确删除项：** 分享、复制和下载结果完整移除，不保留隐藏 fallback。
