# DreamWeaver 前端功能设计文档

## 1. 文档目标

本文档定义 `dreamweaver-frontend` 的前端功能设计边界与实现方案，作为产品、前端、后端协作基线。  
重点覆盖：

- 用户可见功能模块
- 核心交互流程与状态流转
- 前后端接口约定（按当前代码）
- 异常处理与体验规范
- 后续迭代建议

## 2. 产品定位

DreamWeaver 是一个“从想法到视频”的 AI 创作工具，核心路径为：

1. 输入主题
2. 生成大纲
3. 生成长故事
4. 生成关键帧
5. 生成视频

并支持账号系统、项目保存、版本历史、个人中心管理。

## 3. 技术与运行环境

- 框架：React 18 + TypeScript + Vite
- 路由：`react-router-dom`（当前主页面单页流程）
- 样式：自定义 CSS + Tailwind 工具类
- 运行方式：`npm run dev`
- 基础路径：`/dreamweaver/`

## 4. 角色与权限

### 4.1 游客

- 可访问首页与输入区
- 发起生成前需登录（受后端鉴权约束）

### 4.2 登录用户

- 完整使用生成流程
- 查看/加载/删除项目
- 查看版本历史
- 个人中心：头像上传、密码修改、登出

## 5. 信息架构

### 5.1 全局结构

- 顶部导航区：品牌、状态、帮助入口、版本历史、项目入口、用户菜单
- 主内容区：流程进度条 + 当前步骤内容
- 弹窗层：登录/注册、项目列表、版本历史、修改密码、个人中心

### 5.2 页面模式

当前为单页模式（`App.tsx`），通过内部状态机切换步骤：

- `INPUT`
- `OUTLINE`
- `STORY`
- `KEYFRAMES`
- `VIDEO`

## 6. 功能模块设计

## 6.1 认证模块

功能点：

- 登录
- 注册（注册后自动登录）
- 获取当前用户信息
- 登出清理 Token
- 修改密码
- 上传头像

前端状态：

- `isLoggedIn`
- `currentUser`
- `showLogin` / `showRegister`
- `authError`

交互原则：

- 所有鉴权失败统一提示“请重新登录”
- 登录成功后立即拉取用户信息

## 6.2 创作流程模块

### 6.2.1 输入主题（Input）

- 模板选择（蒸汽朋克、科幻、奇幻、悬疑、爱情、自定义）
- 输入故事主题文本
- 点击“开始生成”触发大纲生成

### 6.2.2 大纲生成（Outline）

- 展示章节列表
- 支持编辑大纲并保存新版本
- 可继续到故事生成

### 6.2.3 故事生成（Story）

- 展示长文本故事
- 支持编辑故事并保存新版本
- 可继续到关键帧生成

### 6.2.4 关键帧生成（Keyframes）

- 展示 3 个关键帧卡片（图 + 描述）
- 可继续到视频生成

### 6.2.5 视频生成（Video）

- 生成成功后支持播放与下载
- 未完成时展示等待态/占位态

## 6.3 项目管理模块

功能点：

- 项目列表加载
- 项目详情加载并恢复流程上下文
- 删除项目
- 从个人中心快速“查看/删除”

核心数据：

- `projectId`
- `outlineId`
- `storyId`
- `keyframes`

## 6.4 版本历史模块

已支持：

- 大纲版本列表
- 故事版本列表
- 关键帧版本列表

待完善：

- 点击历史版本后真正回滚并刷新当前状态（当前仅部分占位）

## 7. 核心状态模型

前端核心状态对象 `GenerationState`：

- `prompt`
- `outline`
- `outlineId`
- `longStory`
- `storyId`
- `keyframes`
- `videoUrl`
- `projectId`
- `status`（`idle`/`processing`/`waiting`/`completed`/`error`）
- `error`

状态流转原则：

- 每次发起生成前：`status -> processing`
- 成功后：`status -> waiting / completed`
- 异常时：`status -> error` 并展示错误提示

## 8. 接口设计（按当前前端调用）

## 8.1 认证

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/avatar`
- `POST /auth/change-password`

## 8.2 项目

- `GET /api/projects`
- `GET /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `POST /api/projects/{id}/outline`
- `POST /api/projects/{id}/story`
- `POST /api/projects/{id}/keyframes`
- `GET /api/projects/{id}/versions`

## 8.3 生成

- `POST /api/generate/outline`
- `POST /api/generate/story`
- `POST /api/generate/keyframes`
- `POST /api/generate/video`

说明：开发环境通过 Vite Proxy 映射 `/dreamweaver-api/...` 到后端服务。

## 9. 交互与体验规范

### 9.1 加载态

- 按步骤展示局部 loading，不阻塞整个页面
- 按钮在处理中禁用，避免重复触发

### 9.2 错误态

- 页面顶部统一错误提示条
- 提供“关闭”与重试入口

### 9.3 响应式

- 移动端与桌面端进度条分开渲染
- 大屏保持内容居中与宽度上限，避免过度拉伸

## 10. 非功能性要求

- 首屏可交互时间：开发目标 < 2s（本地网络）
- 关键操作可追踪（生成、保存、删除）
- 类型安全：核心状态与接口返回使用 TypeScript 类型约束
- 可维护性：后续应拆分超大组件，降低单文件复杂度

## 11. 风险与改进建议

## 11.1 当前风险

- `App.tsx` 体量过大，状态耦合高
- 部分版本切换逻辑仍是占位
- 视觉布局跨浏览器一致性需持续微调

## 11.2 迭代建议

1. 将流程步骤拆分为独立组件（Input/Outline/Story/Keyframes/Video）
2. 抽离全局状态（建议 `zustand` 或 `redux-toolkit`）
3. 增加端到端测试（登录、生成、项目恢复主链路）
4. 完成版本回滚功能闭环

## 12. 里程碑（建议）

- M1：稳定主流程（登录 + 五步生成 + 项目恢复）
- M2：版本历史可切换回滚
- M3：体验与视觉一致性优化（含跨浏览器）
- M4：组件化重构与测试体系补齐

---

维护说明：本文档随功能变更同步更新，建议在每次迭代结束后进行一次结构化审阅。
