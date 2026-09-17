# 发布验证与回滚检查清单

本清单用于将功能分支通过 Pull Request 发布到现有 GitHub Pages：

<https://xiangyu2141480.github.io/guangzhou-weekend-wheel/>

任一门禁失败时停止后续步骤，修复后从失败门禁重新验证。不要绕过分支保护、CI 或 Pages 环境保护。

## 当前自动化覆盖

- Vitest：26 个测试文件、102 项单元与组件测试。
- Playwright：1 个测试文件、12 项 E2E 测试。
- E2E 覆盖：
  - 375、390、430、1440 像素视口与水平溢出。
  - 固定候选、停止扇区与结果一致性。
  - 收藏持久化、无结果一键重置。
  - 全键盘筛选、开转、收藏，以及结果和收藏弹层的焦点恢复。
  - reduced-motion 下及时显示结果。
  - 实时数据 404、非法 JSON、全部过期时回退常驻池。
  - 旋转期间实时数据延迟到达时保持候选和结果锁定。
  - 主页面、结果弹层、收藏弹层无 axe serious/critical 违规。
  - 无非预期 console error、pageerror、未处理异常和同源资源 4xx/5xx。

测试数量变化时，同时更新本文件和 `README.md`。

## 1. 发布前准备

- [ ] 使用 Node.js 24，并确认位于目标功能分支。
- [ ] `git status --short` 无无关改动。
- [ ] `git fetch origin --prune` 成功。
- [ ] `git rev-list --left-right --count origin/main...HEAD` 的左侧计数为 `0`；否则先执行 `git rebase origin/main` 并解决冲突。
- [ ] 检查提交范围，不包含凭据、无关大文件或临时产物。
- [ ] 确认仍发布到现有仓库与 Pages URL，不创建替代仓库或更换地址。

## 2. 完整本地验证

从仓库根目录依次运行：

```bash
npm ci
npm run sync:check
npm run test:run
npm run lint
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run qa:e2e
npm audit --omit=dev --audit-level=high
git diff --check origin/main...HEAD
git status --short
```

如果使用 Playwright 自带 Chromium，可省略 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。验收结果：

- [ ] `sync:check` 通过，且不会覆盖已提交的发布快照。
- [ ] 102 项单元/组件测试通过。
- [ ] 12 项 E2E 通过，axe serious/critical 为零。
- [ ] ESLint、TypeScript、Vite 构建和构建体积预算通过。
- [ ] 生产依赖不存在 high 或 critical 级审计问题。
- [ ] diff 无空白错误，工作树仅包含预期改动。

## 3. Draft PR 与 CI

- [ ] 推送功能分支并创建以 `main` 为 base 的 Draft PR。
- [ ] PR 说明记录变更动机、用户影响、数据 fallback、性能与安全限制、验证结果和回滚方式。
- [ ] Draft 阶段保持不可合并，等待 `.github/workflows/ci.yml` 的门禁完成。
- [ ] `quality` job 通过：`npm ci`、数据校验、Vitest、Lint、Build、生产依赖审计。
- [ ] `e2e` job 通过：安装 Chromium 并运行 12 项 Playwright 测试。
- [ ] PR CI 没有 Pages 写权限，也没有执行部署。
- [ ] 若 CI 失败，先查看失败步骤和 Playwright 失败产物；修复以新提交推送，不改写已评审历史。

## 4. Ready 与合并

- [ ] 所有 required checks 全绿。
- [ ] 没有未解决的 review conversation 或 requested changes。
- [ ] 分支仍可合并且未落后 `main`；若已落后，rebase 后重新等待 CI。
- [ ] 将 PR 从 Draft 标记为 Ready for review。
- [ ] 审批完成后选择 **Rebase and merge**，不要 squash，也不要绕过保护规则。
- [ ] 记录合并后的 `main` commit SHA，供 Pages 部署核对。

## 5. GitHub Pages 发布

合并到 `main` 后，`.github/workflows/deploy.yml` 会同步近期活动、验证数据、运行测试、构建、E2E，并发布 `dist`。

- [ ] `Deploy to GitHub Pages` workflow 对应刚记录的 `main` commit SHA。
- [ ] build job 的同步、校验、测试、Lint、Build、E2E 和 artifact 上传全部通过。
- [ ] deploy job 在 build 成功后执行，并显示正确的 `github-pages` 环境 URL。
- [ ] Workflow Summary 中的成功/失败来源、最终活动数、fallback、warnings 与 commit SHA 合理。
- [ ] Pages URL 已提供新版本；不要仅以 workflow 成功代替线上验收。

定时同步也必须经过同一组部署门禁。没有有效新数据且没有有效 fallback 时不得生成新 artifact；此时保留当前线上版本。

## 6. `QA_BASE_URL` 线上验收

Pages 发布完成后运行：

```bash
QA_BASE_URL=https://xiangyu2141480.github.io/guangzhou-weekend-wheel/ \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run qa:e2e
```

然后完成以下人工或浏览器开发者工具检查。

### 数据计数与有效性

- [ ] 页面根节点的 `data-pool-loading` 最终为 `false`。
- [ ] `sync-status.json` 的 `finalCount` 等于 `live-activities.json` 数组长度。
- [ ] `configuredSources = successfulSources + failedSources`。
- [ ] `sourceCounts`、`fetchedCount`、`invalidCount`、`expiredCount`、`duplicateCount`、`fallbackCount`、`usedFallback` 和 `warnings` 与 workflow Summary 一致。
- [ ] 活动没有过期记录、重复 ID 或不可信的 `sourceUrl`。
- [ ] 页面显示的 live 数量与有效 live JSON 数量一致；降级时状态文案与 `usedFallback`/实际数据相符。

### 资源与控制台

- [ ] HTML、JS、CSS、鱼丸图片、favicon、`data/live-activities.json` 和 `data/sync-status.json` 均成功响应。
- [ ] 所有同源资源均使用 `/guangzhou-weekend-wheel/` 子路径，没有 4xx/5xx 或 mixed content。
- [ ] 控制台无非预期 error，页面无 `pageerror`、未处理 Promise rejection。
- [ ] 地图与官方来源链接使用 HTTPS、可信域名及安全的新窗口属性。

### 交互与多视口

- [ ] 375、390、430、1440 像素视口无水平溢出、遮挡或不可操作控件。
- [ ] 筛选、换一批、开转、结果与收藏流程正常。
- [ ] 键盘可完成主流程，Escape 关闭弹层后焦点回到触发按钮。
- [ ] 收藏刷新后仍存在。
- [ ] reduced-motion 生效，结果无需等待完整动画。
- [ ] 主页面、结果弹层和收藏弹层无 axe serious/critical 违规。

## 7. 回滚

### 代码回滚

1. 确认引入问题的合并提交或具体提交。
2. 从最新 `main` 创建回滚分支，使用 `git revert <commit>` 生成可审计的反向提交；不要强推或改写 `main`。
3. 通过 Draft PR 和完整 CI 后，按相同 Ready、Rebase and merge 流程合并。
4. 确认 Pages 重新部署到回滚后的 `main` commit，并重复线上验收。

### 数据回滚

- 新同步结果无有效数据且无有效 fallback：让同步/校验失败，阻止 artifact 和 deploy，保留最后有效线上部署。
- 全部来源失败或新结果无效但存在有效快照：继续使用最后有效快照，部署状态明确标为 degraded。
- 单一来源异常：保留该来源仍有效的旧记录，其他成功来源继续更新；检查 `failedSources`、`fallbackCount`、`usedFallback` 和 `warnings`。
- 已发布数据有问题：先停止或禁用触发问题的发布，修复来源适配器或恢复最后有效快照；验证后通过正常 Pages workflow 重发，不手工篡改线上 artifact。

## 8. GitHub Pages 安全头限制

GitHub Pages 是静态托管，仓库无法控制所有 HTTP 响应安全头，例如完整的响应头形式 CSP、HSTS、`X-Content-Type-Options`、`Referrer-Policy` 和 `Permissions-Policy`。当前页面中的 CSP `<meta>` 只能覆盖浏览器支持的部分 CSP 能力，不等价于服务端 `Content-Security-Policy` 响应头，也不能补齐其他响应头。

发布验收应继续检查 HTTPS、可信 URL、外链 `rel` 属性和 CSP meta，但不得把这些检查描述为“已设置全部安全响应头”。如未来必须控制响应头，应迁移到支持自定义响应头的托管层或在前方增加可控代理，并单独评审。

## 9. 禁止提交的临时产物

提交前确认以下内容未进入 Git：

- `dist/`
- `test-results/`
- `playwright-report/`
- `coverage/`
- `node_modules/`
- Playwright/Chromium 或其他浏览器缓存
- `.env*`、`*.local`、访问令牌、Cookie、私钥及其他凭据
- 本地日志、临时截图、调试快照和仅用于人工验证的导出文件

使用 `git status --short` 和 `git diff --cached --stat` 检查暂存区；发现上述内容时先移除，再提交发布变更。
