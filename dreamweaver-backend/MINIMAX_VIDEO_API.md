# MiniMax 视频生成 API 文档

> 来源：https://platform.minimaxi.com

---

## 概述

视频生成是**异步过程**，包含三个步骤：

1. **创建任务** → 获得 `task_id`
2. **轮询状态** → 获得 `file_id`
3. **获取视频** → 下载视频文件

## 四种生成模式

| 模式 | 说明 | 关键参数 |
|------|------|----------|
| 文生视频 | 根据文本生成视频 | `prompt` |
| 图生视频 | 图片 + 文本生成视频 | `prompt` + `first_frame_image` |
| 首尾帧生成视频 | 首帧 + 尾帧图片生成 | `first_frame_image` + `last_frame_image` |
| 主体参考生成视频 | 人脸参考保持一致性 | `subject_reference` |

## 接口信息

- **Base URL**: `https://api.minimaxi.com`
- **创建任务**: POST `/v1/video_generation`
- **查询状态**: GET `/v1/query/video_generation?task_id=xxx`
- **获取文件**: GET `/v1/files/retrieve?file_id=xxx`

## 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prompt | string | 是 | 视频描述文本 |
| model | string | 是 | 模型名，如 `MiniMax-Hailuo-2.3` |
| duration | integer | 否 | 视频时长（秒），默认 6 |
| resolution | string | 否 | 分辨率，如 `1080P` |
| first_frame_image | string | 否 | 首帧图片 URL（图生视频/首尾帧） |
| last_frame_image | string | 否 | 尾帧图片 URL（首尾帧模式） |
| subject_reference | array | 否 | 主体参考图片（主体参考模式） |

## 完整调用示例 (Python)

```python
import os
import time
import requests

api_key = os.environ["MINIMAX_API_KEY"]
headers = {"Authorization": f"Bearer {api_key}"}


# --- 步骤 1: 发起视频生成任务 ---
def invoke_text_to_video() -> str:
    """（模式一）通过文本描述发起视频生成任务。"""
    url = "https://api.minimaxi.com/v1/video_generation"
    payload = {
        "prompt": "镜头拍摄一个女性坐在咖啡馆里，女人抬头看着窗外，镜头缓缓移动拍摄到窗外的街道，画面呈现暖色调，色彩浓郁，氛围轻松惬意。",
        "model": "MiniMax-Hailuo-2.3",
        "duration": 6,
        "resolution": "1080P",
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    task_id = response.json()["task_id"]
    return task_id


def invoke_image_to_video() -> str:
    """（模式二）通过首帧图像和文本描述发起视频生成任务。"""
    url = "https://api.minimaxi.com/v1/video_generation"
    payload = {
        "prompt": "Contemporary dance, the people in the picture are performing contemporary dance.",
        "first_frame_image": "https://filecdn.minimax.chat/public/xxx.png",
        "model": "MiniMax-Hailuo-2.3",
        "duration": 6,
        "resolution": "1080P",
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    task_id = response.json()["task_id"]
    return task_id


def invoke_start_end_to_video() -> str:
    """(模式三) 使用首帧图像、尾帧图像和文本描述发起视频生成任务。"""
    url = "https://api.minimaxi.com/v1/video_generation"
    payload = {
        "prompt": "A little girl grow up.",
        "first_frame_image": "https://filecdn.minimax.chat/public/fe9d04da-f60e-444d-a2e0-18ae743add33.jpeg",
        "last_frame_image": "https://filecdn.minimax.chat/public/97b7cd08-764e-4b8b-a7bf-87a0bd898575.jpeg",
        "model": "MiniMax-Hailuo-02",
        "duration": 6,
        "resolution": "1080P"
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    task_id = response.json()["task_id"]
    return task_id


def invoke_subject_reference() -> str:
    """(模式四) 使用人物主体图片和文本描述发起视频生成任务"""
    url = "https://api.minimaxi.com/v1/video_generation"
    payload = {
        "prompt": "On an overcast day, in an ancient cobbled alleyway...",
        "subject_reference": [
            {
                "type": "character",
                "image": ["https://filecdn.minimax.chat/public/xxx.PNG"]
            }
        ],
        "model": "S2V-01",
        "duration": 6,
        "resolution": "1080P",
    }
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    task_id = response.json()["task_id"]
    return task_id


# --- 步骤 2: 轮询查询任务状态 ---
def query_task_status(task_id: str):
    """根据 task_id 轮询任务状态，直至任务成功或失败。"""
    url = "https://api.minimaxi.com/v1/query/video_generation"
    params = {"task_id": task_id}
    while True:
        time.sleep(10)  # 推荐轮询间隔 10 秒
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        response_json = response.json()
        status = response_json["status"]
        print(f"当前任务状态: {status}")
        if status == "Success":
            return response_json["file_id"]
        elif status == "Fail":
            raise Exception(f"视频生成失败: {response_json.get('error_message', '未知错误')}")


# --- 步骤 3: 获取并保存视频文件 ---
def fetch_video(file_id: str, output_path: str = "output.mp4"):
    """根据 file_id 获取视频下载链接，并将其保存到本地。"""
    url = "https://api.minimaxi.com/v1/files/retrieve"
    params = {"file_id": file_id}
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    download_url = response.json()["file"]["download_url"]

    with open(output_path, "wb") as f:
        video_response = requests.get(download_url)
        video_response.raise_for_status()
        f.write(video_response.content)
    print(f"视频已成功保存至 {output_path}")


# --- 主流程: 完整调用示例 ---
if __name__ == "__main__":
    # 选择一种方式创建任务
    task_id = invoke_text_to_video()  # 方式一：文生视频
    # task_id = invoke_image_to_video()  # 方式二：图生视频
    # task_id = invoke_start_end_to_video()  # 方式三: 根据首尾帧生成视频
    # task_id = invoke_subject_reference()  # 方式四: 主体参考生成视频

    print(f"视频生成任务已提交，任务 ID: {task_id}")
    file_id = query_task_status(task_id)
    print(f"任务处理成功，文件 ID: {file_id}")
    fetch_video(file_id)
```

## 运镜指令

在 `prompt` 中可添加 `[运镜]` 指令控制镜头：

```
prompt = "镜头拍摄一个女性坐在咖啡馆里[运镜]镜头缓缓移动拍摄到窗外的街道..."
```

支持的运镜方式：
- 推拉镜头
- 摇镜
- 俯仰镜头
- 等等

## 注意事项

1. **异步任务**：视频生成需要时间，需轮询等待
2. **推荐轮询间隔**：10 秒，避免对服务器压力
3. **文件有效期**：下载 URL 有效期需查看 API 返回
4. **模型选择**：
   - `MiniMax-Hailuo-2.3` - 文生视频/图生视频
   - `MiniMax-Hailuo-02` - 首尾帧
   - `S2V-01` - 主体参考
