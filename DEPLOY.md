# Railway 部署步骤

## 准备工作
1. 注册 Railway 账号：https://railway.app
2. 安装 Railway CLI：`npm install -g @railway/cli`
3. 登录：`railway login`

## 一、部署后端

```bash
cd backend
railway init          # 新建项目，命名 fund-monitor-backend
railway add           # 添加 PostgreSQL 插件（选 Database → PostgreSQL）
```

复制生成的 `DATABASE_URL`，然后设置环境变量：
```bash
railway variables set DATABASE_URL=<PostgreSQL连接串>
railway variables set SECRET_KEY=<随机32位字符串>
railway variables set CORS_ORIGINS=https://your-frontend.railway.app
railway up
```

部署完成后记录后端 URL，例如 `https://fund-monitor-backend.up.railway.app`

## 二、部署前端

```bash
cd ../frontend
railway init          # 新建服务，命名 fund-monitor-frontend
railway variables set VITE_API_URL=https://fund-monitor-backend.up.railway.app/api/v1
railway up
```

## 三、首次登录

- 用户名：`admin`
- 密码：`Admin@1234`
- **首次登录后立即在用户管理中修改密码**

## 四、本地开发

### 后端
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # 修改 .env 配置
uvicorn app.main:app --reload
# API 文档：http://localhost:8000/docs
```

### 前端
```bash
cd frontend
npm install
cp .env.example .env.local  # 修改 VITE_API_URL
npm run dev
# 访问：http://localhost:5173
```

## 五、手机安装 PWA

用 Chrome/Safari 访问前端 URL → 浏览器菜单 → "添加到主屏幕"
即可像 App 一样从桌面打开，支持离线浏览历史数据。
