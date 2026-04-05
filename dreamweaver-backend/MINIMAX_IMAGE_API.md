# MiniMax 文生图 API 文档

> 来源：https://platform.minimaxi.com

---

## 概述

使用本接口，输入文本提示词，生成图片。

## 接口信息

- **Base URL**: `https://api.minimaxi.com`
- **接口路径**: `/v1/image_generation`
- **请求方法**: POST

## 请求头

| 参数 | 必填 | 说明 |
|------|------|------|
| Content-Type | 是 | `application/json` |
| Authorization | 是 | Bearer Token，即 API Key |

## 请求体

```json
{
  "model": "image-01",
  "prompt": "图片描述文本，最长1500字符",
  "aspect_ratio": "16:9",
  "response_format": "url",
  "n": 1,
  "prompt_optimizer": false,
  "aigc_watermark": false
}
```

## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型名称。可选值：`image-01`，`image-01-live` |
| prompt | string | 是 | 图像的文本描述，最长 1500 字符 |
| style | object | 否 | 画风设置，仅 `image-01-live` 生效 |
| aspect_ratio | string | 否 | 宽高比，默认 1:1 |
| width | integer | 否 | 宽度像素 [512, 2048]，必须是 8 的倍数 |
| height | integer | 否 | 高度像素 [512, 2048]，必须是 8 的倍数 |
| response_format | string | 否 | 返回格式：`url` 或 `base64`，默认 url |
| seed | integer | 否 | 随机种子，用于复现结果 |
| n | integer | 否 | 生成数量 [1, 9]，默认 1 |
| prompt_optimizer | boolean | 否 | 是否开启 prompt 自动优化，默认 false |
| aigc_watermark | boolean | 否 | 是否添加水印，默认 false |

## aspect_ratio 可选值

| 比例 | 分辨率 |
|------|--------|
| 1:1 | 1024x1024 |
| 16:9 | 1280x720 |
| 4:3 | 1152x864 |
| 3:2 | 1248x832 |
| 2:3 | 832x1248 |
| 3:4 | 864x1152 |
| 9:16 | 720x1280 |
| 21:9 | 1344x576 (仅 image-01) |

## style 画风设置

仅 `image-01-live` 生效：

```json
{
  "style_type": "漫画",
  "style_weight": 0.8
}
```

可选画风类型：`漫画`, `元气`, `中世纪`, `水彩`

## 响应示例

```json
{
  "id": "03ff3cd0820949eb8a410056b5f21d38",
  "data": {
    "image_urls": [
      "https://xxx.com/image1.jpg",
      "https://xxx.com/image2.jpg"
    ]
  },
  "metadata": {
    "success_count": 2,
    "failed_count": 0
  },
  "base_resp": {
    "status_code": 0,
    "status_msg": "success"
  }
}
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1002 | 触发限流，请稍后再试 |
| 1004 | 账号鉴权失败，检查 API-Key |
| 1008 | 账号余额不足 |
| 1026 | 图片描述涉及敏感内容 |
| 2013 | 传入参数异常 |
| 2049 | 无效的 API Key |

## 使用示例 (Python)

```python
import requests

def generate_image(prompt: str, api_key: str):
    url = "https://api.minimaxi.com/v1/image_generation"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "image-01",
        "prompt": prompt,
        "aspect_ratio": "16:9",
        "response_format": "url",
        "n": 1
    }
    
    response = requests.post(url, json=payload, headers=headers)
    result = response.json()
    
    if result["base_resp"]["status_code"] == 0:
        image_urls = result["data"]["image_urls"]
        return image_urls
    else:
        raise Exception(result["base_resp"]["status_msg"])

# 使用
image_urls = generate_image("一只可爱的小猫", "your-api-key")
print(image_urls)
```
