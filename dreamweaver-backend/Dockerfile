# 基础镜像
FROM debian:bookworm-slim

# 安装 Python 3（用阿里云源）
RUN echo 'deb http://mirrors.aliyun.com/debian/ bookworm main contrib non-free' > /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free' >> /etc/apt/sources.list

# 只安装 python3 和 pip（最小化）
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖（使用清华源）
RUN pip3 install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --break-system-packages

# 安装额外依赖
RUN pip3 install --no-cache-dir sqlalchemy pyjwt email-validator -i https://pypi.tuna.tsinghua.edu.cn/simple --break-system-packages

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
