# 每日信息平台-My Page

一个每日信息聚合平台，提供多种类型的日常信息内容，包括图片、语录、新闻、历史事件等。

## 功能特色

### 核心功能

- **每日内容聚合**：猫咪图片、动漫语录、NASA天文图、历史上的今天、随机一言
- **热门新闻**：支持百度、微博、哔哩哔哩、抖音等多平台热搜
- **主题切换**：支持明暗主题无缝切换
- **数据缓存**：借助浏览器缓存数据，支持离线浏览

### 其他功能

- **数据管理**：管理员可管理历史数据和缓存
- **服务器支持**：Node.js后端服务，提供数据持久化
- **用户系统**：简单的登录功能
- **细节优化**：加载动画和错误处理

## 快速开始

### 环境要求

- Node.js (推荐 14.0 或更高版本)
- 现代浏览器

### 本地运行

1. **部分api_key获取**

自行从以下平台获取api_key:
   ```
   随机一言、历史上的今天：api盒子(https://apihz.cn/)
   每日の喵图：TheCatAPI(https://thecatapi.com/)
   NASA每日天文图：NASA APIs(https://api.nasa.gov/)
   ```

补充至以下代码中{你的api_key}：
   ```javascript
   // API 管理类
   class APIManager {
      constructor() {
         this.endpoints = {
               cat: {
                  url: 'https://api.thecatapi.com/v1/images/search?limit=1&api_key={你的api_key}}',
                  ...
               },
               ...
               nasa: {
                  url: 'https://api.nasa.gov/planetary/apod?api_key={你的api_key}',
                  ...
               },
               history: {
                  url: 'https://cn.apihz.cn/api/zici/today.php?{你的api_key}',
                  ...
               },
               quote: {
                  url: 'https://cn.apihz.cn/api/yiyan/api.php?{你的api_key}',
                  ...
               }
         };
      }
   ```

2. **安装依赖**

   ```bash
   npm install
   ```
3. **启动服务器**

   ```bash
   npm start
   ```

   或

   ```bash
   node server.js
   ```
4. **访问应用**
   在浏览器中打开：`http://localhost:8080`


## 项目结构

```
My Page/
├── 📄 index.html          # 主页面
├── 📄 script.js           # 核心JavaScript逻辑
├── 📄 styles.css          # 自定义样式
├── 📄 server.js           # Node.js服务器
├── 📄 package.json        # 项目依赖配置
├── 📄 README.md           # 项目文档
├── 📁 data/               # 数据存储目录
│   ├── users.json         # 用户数据
│   ├── admin-data.json    # 管理员数据
│   └── daily-data.json    # 每日数据缓存
└── 📁 node_modules/       # 依赖包
```

## 主要功能说明

### 1. 内容模块

#### 每日の喵图

- 随机展示（可能）可爱的猫咪图片

#### 动漫语录

- 精选动漫经典语录（并非精选）
- 显示角色名和作品名

#### NASA天文图

- NASA每日天文图片
- 包含相关解释
- 版权信息显示

#### 历史上的今天

- 重要历史事件回顾
- 精确的日期信息

#### 随机一言

- 励志或哲理短句（有时候是笑话或无意义的话）

### 2. 新闻聚合

支持以下平台的热搜：

- **百度热搜**：综合性热门话题
- **微博热搜**：社交媒体热点
- **哔哩哔哩**：热门视频
- **抖音热搜**：短视频平台热点

### 3. 用户系统（较简单）

#### 登录功能

- 简单的用户名/密码登录
- 本地存储用户状态
- 支持登出操作

### 4. 数据管理

#### 数据缓存

- 自动缓存API数据
- 离线数据访问

#### 管理员功能

- 缓存统计和管理
- 缓存详情查看

## 服务器功能

### 数据 API

- **用户数据管理**：注册、登录、用户信息
- **每日数据缓存**：内容数据的服务器端缓存

### 文件操作

- **数据读写**：JSON文件的读取和写入

## 主题系统

### 明暗主题切换

- **亮色主题**：清新的蓝白配色
- **暗色主题**：护眼的深色模式
- **自动保存**：记住用户偏好
- **平滑过渡**：优雅的切换动画

### 响应式设计

- **桌面端**：根据浏览器窗口自动调整排布（目前只有两种）

## 技术栈

### 前端技术

- **HTML5**：语义化标记
- **CSS3**：现代样式和动画
- **JavaScript**：模块化编程
- **Tailwind CSS**：实用优先的CSS框架

### 后端技术

- **Node.js**：服务器运行环境
- **文件系统**：JSON文件数据存储

### 外部依赖

- **Tailwind CSS**：样式框架
- **Font Awesome**：图标库

### 数据存储

- **文件系统**：JSON文件存储用户和应用数据

## API集成

项目集成了多个第三方API：

### 图片API

- 猫咪图片：随机猫咪图片
- NASA API：NASA天文图片数据

### 内容API

- 动漫语录：动漫台词数据库
- 历史事件：历史上的今天（百度）
- 随机一言：励志语录API

### 新闻API

- 四个平台热搜榜单
- 实时数据更新（API提供方一般30分钟更新一次）

### 感谢以上数据提供者

```
- 随机一言、历史上的今天：api盒子(https://apihz.cn/)
- 每日の喵图：TheCatAPI(https://thecatapi.com/)
- NASA每日天文图：NASA APIs(https://api.nasa.gov/)
- 动漫语录：Animechan(https://animechan.io/)
- 热点新闻：hot_news(https://github.com/orz-ai/hot_news)
```

---

*最后更新：2025年6月27日*
