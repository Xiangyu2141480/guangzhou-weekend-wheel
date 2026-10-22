# 鱼丸图片取消与资源监控

适用：`e2e/helpers.ts` 的 `monitorRuntime`，2026-10-22 线上验证中复现。

## 触发与复现

在较慢网络上运行任一城市的筛选、换批、开转、收藏流程。鱼丸状态在 think/run/spin 等
图片间切换，浏览器取消旧图片请求。打开结果或收藏后，页面又渲染同 URL 的新图片实例；
它位于屏外并使用 `loading=lazy`，此时可能尚未发起加载。

```bash
QA_BASE_URL=https://xiangyu2141480.github.io/guangzhou-weekend-wheel/ \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run qa:e2e -- --grep '北京可完成'
```

最小故障注入见 `e2e/runtime-monitor.spec.ts`：先取消旧图片，再以同 URL 替换为屏外 lazy
实例，后续该资源允许成功响应。在旧监控上此测试失败，新监控需实际加载并解码新实例。

## 现象、信号与根因

- 业务流程已完成，但最终资源断言报告鱼丸 PNG 的 `net::ERR_ABORTED`。
- 只看 DOM 的 `src` 会误认为旧取消仍属于当前实例。诊断必须同时读取 `currentSrc`、
  `complete`、`naturalWidth`、`loading` 及可视位置。
- 本次复现中新实例位于 720px 视口以下，`currentSrc=''`、`complete=false`、
  `naturalWidth=0`，符合尚未加载的 lazy 状态；这些字段本身不证明 URL 失效。
- 直接根因：按 URL 汇总取消记录，又按最终 DOM URL 判断是否仍故障，混淆了不同请求
  和图片实例。系统性原因：资源监控缺少“当前实例是否恢复”的验证阶段。
- 关键状态流：请求 A 取消 → 图片状态切换 → 同 URL 新实例 B → B 屏外延迟加载 →
  最终断言把 A 的取消归给 B。

排除方向：不能因该断言认定城市数据、筛选或转盘失效；普通同源 HTTP 错误、脚本失败和
浏览器异常必须独立检查。只放宽所有 `ERR_ABORTED` 或延长固定等待，不能证明当前图片可用。

## 修复与故障边界

只暂存已知鱼丸 PNG 的 image `ERR_ABORTED`。最终检查时，若没有当前引用则排除旧请求；
若仍有当前实例，则将其设为 eager，并以最多 5 秒的 decode 验证实际加载。只有当前
`complete=true`、`currentSrc` 与目标一致且 `naturalWidth>0`，或实例已移除/换源，才
排除该旧取消。未成功恢复的当前图片继续失败。

恢复等待可能跨过新的取消或节点替换，因此等待结束后必须重新采集全部当前实例，
并与最终取消列表交叉检查。沿用等待开始时的 URL 或元素快照，会漏报这段时间的新故障。

检查只作用于测试中的资源验证，不改产品组件或生产 JS。真实 HTTP 4xx/5xx、脚本取消、
非目标资源失败、pageerror 和 console error 不会被该恢复逻辑清除。

## 回归与证据

新增真实浏览器测试已先 RED 再 GREEN；7 项监控测试通过，包含旧引用移除、当前图片仍
取消、同 URL 新实例恢复、等待期间的新取消与节点替换、脚本取消、真实 HTTP 503。
修复后以线上真实 JS、CSS 和常驻
JSON 运行全部 34 项 E2E 通过；live 场景按既有测试使用受控快照。280 项 Vitest、Lint、
生产构建与预算也通过。不能用这 7 项故障注入代替城市流程或部署验证。

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run qa:e2e -- e2e/runtime-monitor.spec.ts
npm run test:run
npm run lint
npm run build
```

限制：5 秒是验收等待上限，不是资源可用性保证；超慢或中断网络仍可能使检查失败。
新增鱼丸资产命名或加载机制时需更新识别规则与故障注入，不应扩大为忽略任意同源资源。
