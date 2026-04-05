# DreamWeaver 后端接口文档（前端对接版）

## 1. 基础信息

- Base URL：`http://127.0.0.1:8000`
- 接口风格：REST + JSON
- 鉴权方式：Bearer Token（JWT）
- 文档地址：`/docs`
- OpenAPI：`/openapi.json`

---

## 2. 鉴权说明（必须先看）

## 2.1 哪些接口需要登录

除以下公开接口外，其余业务接口都需要登录：

- `GET /`
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /docs`
- `GET /openapi.json`

`/api/generate/*` 与 `/api/projects/*` 都是受保护接口。

## 2.2 正确调用顺序

1. 注册（可选，已有账号可跳过）
2. 登录拿 `access_token`
3. 在后续请求头中带：
   `Authorization: Bearer <access_token>`

如果不带 token，会返回：

```json
{
  "detail": "Not authenticated"
}
```

## 2.3 登录请求格式

`/auth/login` 使用 `application/x-www-form-urlencoded`，不是 JSON。

示例：

```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_user&password=Test123456"
```

---

## 3. 快速联调示例

## 3.1 注册

`POST /auth/register`

```json
{
  "username": "test_user",
  "email": "test_user@example.com",
  "password": "Test123456"
}
```

## 3.2 登录

`POST /auth/login`

返回示例：

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

## 3.3 带 token 生成大纲

`POST /api/generate/outline`

请求头：

- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

请求体：

```json
{
  "prompt": "一个关于友情的科幻故事"
}
```

---

## 4. 接口清单

> 标注“需要鉴权”的接口都要带 `Authorization`。

## 4.1 Auth

### 4.1.1 注册

- 方法：`POST`
- 路径：`/auth/register`
- 鉴权：否
- 请求体：

```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string"
}
```

### 4.1.2 登录

- 方法：`POST`
- 路径：`/auth/login`
- 鉴权：否
- 请求体：`x-www-form-urlencoded`
  - `username`
  - `password`

### 4.1.3 获取当前用户

- 方法：`GET`
- 路径：`/auth/me`
- 鉴权：是

### 4.1.4 更新当前用户

- 方法：`PUT`
- 路径：`/auth/me`
- 鉴权：是
- 请求体：

```json
{
  "avatar": "string|null",
  "email": "string|null"
}
```

### 4.1.5 上传头像

- 方法：`POST`
- 路径：`/auth/avatar`
- 鉴权：是
- Content-Type：`multipart/form-data`
- 字段：`file`

### 4.1.6 修改密码

- 方法：`POST`
- 路径：`/auth/change-password`
- 鉴权：是
- 请求体：

```json
{
  "old_password": "string",
  "new_password": "string"
}
```

---

## 4.2 Projects（需要鉴权）

### 4.2.1 项目列表

- `GET /api/projects`

### 4.2.2 创建项目

- `POST /api/projects`

```json
{
  "prompt": "string"
}
```

### 4.2.3 获取项目详情

- `GET /api/projects/{project_id}`

### 4.2.4 获取项目版本树

- `GET /api/projects/{project_id}/versions`

### 4.2.5 保存大纲版本

- `POST /api/projects/{project_id}/outline`

```json
{
  "title": "string",
  "chapters": ["string"],
  "parent_id": "string|null",
  "is_ai_generated": 0
}
```

### 4.2.6 保存故事版本

- `POST /api/projects/{project_id}/story`

```json
{
  "content": "string",
  "outline_id": "string",
  "parent_id": "string|null",
  "is_ai_generated": 0
}
```

### 4.2.7 保存关键帧版本

- `POST /api/projects/{project_id}/keyframes`

```json
{
  "description": "string",
  "visual_prompt": "string",
  "image_path": "string|null",
  "story_id": "string",
  "parent_id": "string|null",
  "is_ai_generated": 0
}
```

### 4.2.8 删除项目

- `DELETE /api/projects/{project_id}`

### 4.2.9 获取项目进度

- `GET /api/projects/{project_id}/progress`

---

## 4.3 Generate（需要鉴权）

### 4.3.1 生成大纲

- `POST /api/generate/outline`

```json
{
  "prompt": "string"
}
```

### 4.3.2 生成故事

- `POST /api/generate/story`

```json
{
  "outline": {
    "title": "string",
    "chapters": ["string"]
  },
  "project_id": "string|null",
  "outline_id": "string|null",
  "prompt": "string|null"
}
```

### 4.3.3 生成关键帧

- `POST /api/generate/keyframes`

```json
{
  "long_story": "string",
  "project_id": "string|null",
  "story_id": "string|null"
}
```

返回中 `keyframes[*]` 包含：

- `image_url`（前端可直接访问）
- `source_image_url`
- `local_image_path`
- `download_status`

### 4.3.4 生成视频

- `POST /api/generate/video`

```json
{
  "prompt": "string",
  "image_base64": "string|null",
  "project_id": "string|null",
  "keyframe_id": "string|null"
}
```

返回包含：

- `video_url`（前端可直接访问）
- `source_video_url`
- `local_video_path`
- `download_status`

---

## 5. 静态资源访问约定

## 5.1 头像

- 路径前缀：`/uploads/...`

## 5.2 生成媒体（图片/视频）

- 路径前缀：`/media/generated/...`
- 前端可直接用该 URL 做 `<img src>` / `<video src>`

---

## 6. 常见问题（前端）

## 6.1 401 Not authenticated

原因：

- 没带 `Authorization` 头
- token 过期或格式错误（不是 `Bearer <token>`）

## 6.2 登录成功但仍 401

排查顺序：

1. 确认请求头完整：`Authorization: Bearer xxx`
2. 确认 token 来自当前环境的 `/auth/login`
3. 确认后端服务不是旧进程（重启后再测）

## 6.3 返回 500（生成类接口）

通常是第三方模型平台（DeepSeek/MiniMax）鉴权或限流问题，先检查 `.env` 中 API Key。

---

## 7. 前端接入建议

- 建立统一 `request` 封装（自动注入 token）
- 401 时自动跳转登录并清理本地 token
- 对生成接口做“轮询中/处理中”UI 状态
- 对 `download_status=failed` 做失败提示与重试按钮

