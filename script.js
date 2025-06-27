// My Page JavaScript - 本地服务器版本

// 本地数据存储管理类
class LocalDataManager {
    constructor() {
        // 使用环境配置获取 API 基础 URL
        if (window.APP_CONFIG && window.APP_CONFIG.getApiBaseUrl) {
            this.baseUrl = window.APP_CONFIG.getApiBaseUrl();
        } else {
            // 降级方案
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = window.location.port;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                this.baseUrl = `${protocol}//${hostname}:8080/api`;
            } else {
                this.baseUrl = `${protocol}//${hostname}:${port || 80}/api`;
            }
        }
        
        this.cache = new Map();
        console.log('LocalDataManager initialized with baseUrl:', this.baseUrl);
    }

    // 通用的服务器数据获取方法
    async getData(type) {
        try {
            // 先检查内存缓存
            if (this.cache.has(type)) {
                return this.cache.get(type);
            }

            const response = await fetch(`${this.baseUrl}/${type}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 存入内存缓存
            this.cache.set(type, data);
            
            return data;
        } catch (error) {
            console.warn(`从服务器获取 ${type} 数据失败:`, error);
            return this.getDefaultData(type);
        }
    }

    // 通用的服务器数据保存方法
    async saveData(type, data) {
        try {
            const response = await fetch(`${this.baseUrl}/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // 更新内存缓存
            this.cache.set(type, data);
            
            console.log(`${type} 数据保存成功:`, result.message);
            return result;
        } catch (error) {
            console.error(`保存 ${type} 数据到服务器失败:`, error);
            throw error;
        }
    }

    // 获取每日数据
    async getDailyData() {
        return await this.getData('daily-data');
    }

    // 保存每日数据
    async saveDailyData(data) {
        return await this.saveData('daily-data', data);
    }    // 获取用户数据
    async getUsers() {
        return await this.getData('users');
    }

    // 保存用户数据
    async saveUsers(users) {
        return await this.saveData('users', users);
    }

    // 获取管理员数据
    async getAdminData() {
        const data = await this.getData('admin-data');
    
        // 确保数据结构完整
        if (!data.globalSettings) {
            data.globalSettings = {
                theme: 'light',
                lastRefreshTime: 0
            };
        }
        
        return data;
    }

    // 保存管理员数据
    async saveAdminData(data) {
        return await this.saveData('admin-data', data);
    }

    // 获取默认数据
    getDefaultData(type) {        switch (type) {
            case 'users':
                return {};
            case 'daily-data':
                return {};
            case 'admin-data':
                return {
                    currentUser: null,
                    globalSettings: {
                        theme: 'light',
                        lastRefreshTime: 0
                    }
                };
            default:
                return {};
        }
    }

    // 清空内存缓存
    clearCache() {
        this.cache.clear();
    }    // 预热缓存 (可选)
    async preloadCache() {
        const types = ['daily-data', 'users', 'admin-data'];
        const promises = types.map(type => this.getData(type));
        await Promise.allSettled(promises);
        console.log('数据预加载完成');
    }
}

// 全局状态管理
class AppState {    constructor() {
        this.user = null;
        this.theme = 'light';
        this.dailyData = {};
        this.lastRefreshTime = 0;
        this.currentNewsTab = 'baidu'; // 跟踪当前新闻标签
        this.localDataManager = new LocalDataManager();
        this.init();
    }async init() {
        try {
            // 主题设置
            this.applyTheme();

            // 显示加载状态
            this.showLoadingSpinner();

            // 从服务器加载所有数据
            await this.loadFromServer();

            // 清理旧格式的缓存（基于日期的缓存键）
            await this.cleanOldCache();

            // 初始化内容显示
            await this.initializeContent();

            // 隐藏加载状态
            this.hideLoadingSpinner();
            this.showContent();

            //初始化时间使用
            this.initializeApp();

            this.updateUI();
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showToast('数据加载失败，请检查服务器连接', 'error');
            this.hideLoadingSpinner();
        }
    }

    // 初始化内容显示方法
    async initializeContent() {
        try {
            // 加载所有内容（优先使用缓存）
            await Promise.all([
                uiManager.loadContent('cat'),
                uiManager.loadContent('anime'),
                uiManager.loadContent('nasa'),
                uiManager.loadContent('history'),
                uiManager.loadContent('quote')
            ]);

            // 加载默认新闻
            await uiManager.loadNews('baidu');

        } catch (error) {
            console.error('加载内容失败:', error);
            throw error;
        }
    }

    // 显示内容容器
    showContent() {
        const contentContainer = document.getElementById('contentContainer');
        if (contentContainer) {
            contentContainer.classList.remove('hidden');
        }
    }


    async initializeApp() {
        //初始化时间
        this.initializeDateTimeDisplay();
    }

    //初始化日期时间显示
    initializeDateTimeDisplay() {
        this.updateDateTime();
        // 每秒更新时间
        setInterval(() => this.updateDateTime(), 1000);
    }

    //更新日期时间显示
    updateDateTime() {
        const now = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const weekday = weekdays[now.getDay()];
        
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const dateStr = `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`;
        
        document.getElementById('current-date').textContent = dateStr;
    }

    // 从服务器加载数据
    async loadFromServer() {
        try {
            console.log('正在从服务器加载数据...');            // 并行加载所有数据
            const [dailyData, adminData, users] = await Promise.all([
                this.localDataManager.getDailyData(),
                this.localDataManager.getAdminData(),
                this.localDataManager.getUsers()
            ]);

            this.dailyData = dailyData;

            // 恢复用户登录状态
            if (adminData.currentUser) {
                this.user = adminData.currentUser;
                console.log('恢复用户登录状态:', this.user.username);
            }

            // 恢复全局设置（主题、刷新时间等）
            if (adminData.globalSettings) {
                this.theme = adminData.globalSettings.theme || 'light';
                this.lastRefreshTime = adminData.globalSettings.lastRefreshTime || 0;
            }            console.log('数据加载完成:', {
                dailyDataKeys: Object.keys(this.dailyData).length,
                currentUser: this.user?.username || 'none',
                theme: this.theme
            });

        } catch (error) {
            console.error('从服务器加载数据失败:', error);
            throw error;
        }
    }

    // 保存到服务器
    async saveToServer() {
        try {
            // 准备全局设置
            const globalSettings = {
                theme: this.theme,
                lastRefreshTime: this.lastRefreshTime
            };

            // 准备管理员数据
            const adminData = {
                currentUser: this.user,
                globalSettings: globalSettings
            };            // 并行保存所有数据
            const promises = [
                this.localDataManager.saveDailyData(this.dailyData),
                this.localDataManager.saveAdminData(adminData)
            ];

            await Promise.all(promises);
            console.log('数据保存到服务器成功');
            
        } catch (error) {
            console.error('保存数据到服务器失败:', error);
            this.showToast('数据保存失败', 'error');
        }
    }

    // 设置用户并保存到服务器
    async setUser(user) {
        this.user = user;
        
        try {
            // 保存用户数据
            const users = await this.localDataManager.getUsers();
            users[user.username] = user;
            await this.localDataManager.saveUsers(users);

            // 保存当前登录用户
            await this.saveToServer();

            console.log('用户状态已保存:', user.username);
            
        } catch (error) {
            console.error('保存用户状态失败:', error);
            this.showToast('保存用户状态失败', 'error');
        }

        this.updateUI();
    }    // 用户注销
    async logout() {
        this.user = null;
        
        try {
            // 保存注销状态但保留全局设置
            await this.saveToServer();
            
            console.log('用户已注销');
            
        } catch (error) {
            console.error('注销时保存状态失败:', error);
        }

        this.updateUI();
    }// 缓存内容到服务器（覆盖模式）
    async cacheContent(type, content) {
        const cacheKey = type;
        
        // 直接覆盖现有数据
        this.dailyData[cacheKey] = {
            content,
            timestamp: new Date().toISOString(),
            source: 'api'
        };

        try {
            await this.localDataManager.saveDailyData(this.dailyData);
            console.log(`${type} 内容已缓存到服务器（覆盖模式）`);
        } catch (error) {
            console.error(`缓存 ${type} 内容失败:`, error);
        }
    }

    // 获取缓存的内容
    getCachedContent(type) {
        const cacheKey = type;
        
        const cached = this.dailyData[cacheKey];
        if (cached) {
            console.log(`找到缓存: ${cacheKey}`, cached);
            return cached;
        }
        
        console.log(`无缓存: ${cacheKey}`);
        return null;
    }

    // 清理过期缓存
    async cleanupExpiredCache() {
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let hasChanges = false;
        
        Object.keys(this.dailyData).forEach(key => {
            const parts = key.split('_');
            if (parts.length >= 2) {
                const dateStr = parts.slice(1).join('_');
                const cacheDate = new Date(dateStr);
                
                if (cacheDate < sevenDaysAgo) {
                    delete this.dailyData[key];
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            try {
                await this.localDataManager.saveDailyData(this.dailyData);
                console.log('过期缓存已清理');
            } catch (error) {
                console.error('清理缓存失败:', error);
            }
        }
    }

    // 主题切换
    async toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        
        // 保存主题设置到服务器
        try {
            await this.saveToServer();
            console.log('主题设置已保存到服务器');
        } catch (error) {
            console.error('保存主题设置失败:', error);
        }
   }

    // 在 AppState 类中添加管理员功能
    async clearAllServerData() {
        if (!this.user || this.user.role !== 'admin') {
            this.showToast('权限不足', 'error');
            return;
        }        try {
            // 清空服务器数据
            await this.localDataManager.saveDailyData({});
            
            // 重置本地状态
            this.dailyData = {};
            
            // 清空内存缓存
            this.localDataManager.clearCache();
            
            this.showToast('服务器数据已清空', 'success');
            this.updateUI();
            
        } catch (error) {
            console.error('清空服务器数据失败:', error);
            this.showToast('清空数据失败', 'error');
        }
    }

    async getServerStats() {
        try {
            const response = await fetch('http://localhost:8080/api/stats');
            const stats = await response.json();
            return stats;
        } catch (error) {
            console.error('获取服务器统计失败:', error);
            return null;
        }
    }

    applyTheme() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    showLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
    }

    hideLoadingSpinner() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }

    updateUI() {
        // 更新用户显示
        const userDisplayName = document.getElementById('userDisplayName');
        const userMenuContent = document.getElementById('userMenuContent');
        const adminControls = document.getElementById('adminControls');
        
        if (this.user) {
            if (userDisplayName) {
                userDisplayName.textContent = this.user.username;
            }
              if (userMenuContent) {
                userMenuContent.innerHTML = `
                    <button onclick="app.logout()" class="user-menu-item">
                        <i class="fas fa-sign-out-alt mr-2"></i>退出登录
                    </button>
                `;
            }
            
            // 显示管理员控制
            if (adminControls && this.user.role === 'admin') {
                adminControls.classList.remove('hidden');
            }
        } else {
            if (userDisplayName) {
                userDisplayName.textContent = '未登录';
            }
            
            if (userMenuContent) {
                userMenuContent.innerHTML = `
                    <button onclick="uiManager.showLoginModal()" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <i class="fas fa-sign-in-alt mr-2"></i>登录
                    </button>
                `;
            }
            
            // 隐藏管理员控制
            if (adminControls) {
                adminControls.classList.add('hidden');
            }        }    }

    showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 动画效果
        setTimeout(() => toast.classList.add('translate-x-0'), 10);
        
        // 自动移除
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }    // 清理旧缓存（简化版本，因为现在只有一份数据）
    async cleanOldCache() {
        // 由于现在只保存一份数据，这个方法可以用来清理无效的缓存键
        const validKeys = [
            'cat', 'anime', 'nasa', 'history', 'quote',
            'news_baidu', 'news_weibo', 'news_bilibili', 'news_douyin'
        ];
        
        let hasChanges = false;
        
        Object.keys(this.dailyData).forEach(key => {
            // 检查是否是旧的日期格式缓存键
            if (key.includes('_Mon') || key.includes('_Tue') || key.includes('_Wed') || 
                key.includes('_Thu') || key.includes('_Fri') || key.includes('_Sat') || 
                key.includes('_Sun')) {
                delete this.dailyData[key];
                hasChanges = true;
                console.log(`清理旧格式缓存键: ${key}`);
            }
        });

        if (hasChanges) {
            await this.saveToServer();
            console.log('旧缓存已清理');
        }
    }
}

// API 管理类
class APIManager {
    constructor() {
        this.endpoints = {
            cat: {
                url: 'https://api.thecatapi.com/v1/images/search?limit=1&api_key={你的api_key}}',
                parser: (data) => ({
                    image: data[0]?.url,
                    width: data[0]?.width,
                    height: data[0]?.height
                })
            },
            anime: {
                url: 'https://api.animechan.io/v1/quotes/random',
                parser: (data) => ({
                    quote: data.data?.content,
                    anime: data.data?.anime?.name,
                    character: data.data?.character?.name
                })
            },
            nasa: {
                url: 'https://api.nasa.gov/planetary/apod?api_key={你的api_key}',
                parser: (data) => ({
                    title: data.title,
                    explanation: data.explanation,
                    url: data.url,
                    hdurl: data.hdurl,
                    date: data.date,
                    copyright: data.copyright
                })
            },
            history: {
                url: 'https://cn.apihz.cn/api/zici/today.php?{你的api_key}',
                parser: (data) => ({
                    title: data.title,
                    year: data.y,
                    month: data.m,
                    day: data.d,
                    keywords: data.words,
                    url: data.url
                })
            },
            quote: {
                url: 'https://cn.apihz.cn/api/yiyan/api.php?{你的api_key}',
                parser: (data) => ({
                    message: data.msg
                })
            }
        };
    }    async fetchData(type, forceRefresh = false, cacheOnly = false) {
        const cacheKey = type;
        
        // 如果不强制刷新，先检查缓存
        if (!forceRefresh && app.dailyData[cacheKey]) {
            console.log(`返回缓存数据: ${cacheKey}`);
            return app.dailyData[cacheKey].content;
        }

        // 如果只允许缓存，返回空
        if (cacheOnly) {
            throw new Error('无缓存数据且不允许网络请求');
        }

        try {
            console.log(`从网络获取数据: ${type}`);
            const endpoint = this.endpoints[type];
            if (!endpoint) {
                throw new Error(`Unknown API type: ${type}`);
            }

            const response = await fetch(endpoint.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();
            const parsedData = endpoint.parser(rawData);
            
            // 缓存数据（覆盖现有数据）
            await app.cacheContent(type, parsedData);
            
            return parsedData;
        } catch (error) {
            console.error(`获取 ${type} 数据失败:`, error);
            throw error;
        }
    }    async fetchNews(platform, forceRefresh = false, cacheOnly = false) {
        const cacheKey = `news_${platform}`;
        
        if (!forceRefresh && app.dailyData[cacheKey]) {
            return app.dailyData[cacheKey];
        }
        
        if (cacheOnly) {
            return [];
        }
        
        try {
            console.log(`从网络获取新闻: ${platform}`);
            const response = await fetch(`https://orz.ai/api/v1/dailynews/?platform=${platform}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const newsData = data.data || [];
              
            // 直接覆盖缓存数据
            app.dailyData[cacheKey] = newsData;
            await app.saveToServer();
            
            return newsData;
        } catch (error) {
            console.error(`Error fetching news for ${platform}:`, error);
            return [];
        }
    }    async fetchRefreshedDailyData(type) {
        const cacheKey = type;
        
        try {
            const endpoint = this.endpoints[type];
            if (!endpoint) {
                throw new Error(`Unknown API type: ${type}`);
            }

            const response = await fetch(endpoint.url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const rawData = await response.json();
            const parsedData = endpoint.parser(rawData);
            
            // 直接覆盖缓存数据
            app.dailyData[cacheKey] = {
                content: parsedData,
                timestamp: new Date().toISOString(),
                source: 'api'
            };
            await app.saveToServer();

            return parsedData;
        } catch (error) {
            console.error(`Error refreshing ${type} data:`, error);
            throw error;
        }
    }

    async fetchRefreshedNewsData(platform) {
        const cacheKey = `news_${platform}`;
        
        try {
            const response = await fetch(`https://orz.ai/api/v1/dailynews/?platform=${platform}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const newsData = data.data || [];
            
            // 直接覆盖缓存数据
            app.dailyData[cacheKey] = newsData;
            await app.saveToServer();

            return newsData;
        } catch (error) {
            console.error(`Error refreshing news for ${platform}:`, error);
            throw error;
        }
    }
}

// UI 管理类
class UIManager {    constructor() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
    }
    
    // 确保主题正确应用到动态内容
    ensureThemeApplied() {
        // 强制重新应用主题
        if (app && app.applyTheme) {
            app.applyTheme();
        }
    }setupEventListeners() {
        // 确保元素存在后再添加事件监听器
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                app.toggleTheme();
            });
        }

        // 用户菜单
        document.getElementById('userMenuBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('userMenu');
            menu.classList.toggle('hidden');
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('userMenu');
            if (!menu.contains(e.target) && !document.getElementById('userMenuBtn').contains(e.target)) {
                menu.classList.add('hidden');
            }
        });

        // 登录相关
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });        document.getElementById('closeLoginModal').addEventListener('click', () => {
            this.hideLoginModal();
        });

        // 新闻标签
        document.querySelectorAll('.news-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchNewsTab(tab.dataset.platform);
            });
        });        const cacheManageBtn = document.getElementById('cacheManageBtn');
        if (cacheManageBtn) {
            cacheManageBtn.addEventListener('click', () => {
                this.showCacheManagement();
            });
        }
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        // 观察所有内容卡片
        document.querySelectorAll('.content-card').forEach(card => {
            card.classList.add('content-fade-in');
            observer.observe(card);
        });
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.remove('hidden');
        modal.querySelector('.bg-white').classList.add('modal-enter');
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.add('hidden');
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            app.showToast('请输入用户名和密码', 'error');
            return;
        }

        try {
            // 从服务器获取用户数据
            const users = await app.localDataManager.getUsers();
            
            // 简单的用户验证
            const defaultUsers = {
                'admin': { id: 1, username: 'admin', role: 'admin' },
                'user': { id: 2, username: 'user', role: 'user' }
            };

            let user = users[username] || defaultUsers[username];
            
            if (user && password === '123456') {
                await app.setUser(user);
                this.hideLoginModal();
                app.showToast(`欢迎回来，${username}！`, 'success');
                
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            } else {
                app.showToast('用户名或密码错误', 'error');
            }
        } catch (error) {
            console.error('登录失败:', error);
            app.showToast('登录失败，请重试', 'error');
        }    }

    async switchNewsTab(platform) {
        // 更新标签状态
        document.querySelectorAll('.news-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelector(`[data-platform="${platform}"]`).classList.add('active');
        app.currentNewsTab = platform;

        // 加载新闻（允许网络请求以获取数据）
        await this.loadNews(platform, false, false);
    }    async loadNews(platform, forceRefresh = false, cacheOnly = false) {
        const newsContent = document.getElementById('newsContent');
        newsContent.innerHTML = '<div class="text-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div>';

        try {
            // 检查本地缓存
            const cacheKey = `news_${platform}`;
            let newsData;
            
            if (!forceRefresh && app.dailyData[cacheKey]) {
                console.log(`使用本地缓存的新闻数据: ${platform}`);
                newsData = app.dailyData[cacheKey];
                this.renderNews(newsData, platform);
                return;
            }
              
            // 如果只允许缓存且没有缓存，显示错误
            if (cacheOnly && !app.dailyData[cacheKey]) {
                newsContent.innerHTML = `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>无本地新闻数据</p>
                    </div>
                `;
                return;
            }

            // 从网络获取新数据并覆盖本地数据
            console.log(`从网络获取新闻数据并覆盖本地: ${platform}`);
            newsData = await apiManager.fetchNews(platform, forceRefresh, cacheOnly);
            this.renderNews(newsData, platform);
        } catch (error) {
            console.error(`加载新闻失败: ${platform}`, error);
            
            // 尝试使用本地缓存作为降级方案
            const cacheKey = `news_${platform}`;
            if (app.dailyData[cacheKey]) {
                console.log(`网络失败，使用本地缓存: ${platform}`);
                this.renderNews(app.dailyData[cacheKey], platform);
                app.showToast(`网络获取失败，显示本地新闻`, 'warning');
            } else {
                newsContent.innerHTML = `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <p>加载新闻失败，请稍后重试</p>
                    </div>
                `;
            }
        }
    }

    renderNews(newsData, platform) {
        const newsContent = document.getElementById('newsContent');
        
        if (!newsData || newsData.length === 0) {
            newsContent.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-newspaper text-2xl mb-2"></i>
                    <p>暂无新闻数据</p>
                </div>
            `;
            return;
        }        const newsHTML = newsData.map((item, index) => `
            <div class="news-item bg-white dark:bg-gray-800 animate-fadeIn" style="animation-delay: ${index * 100}ms">
                <div class="flex items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <a href="${item.url}" target="_blank" rel="noopener noreferrer">
                                ${item.title}
                            </a>
                        </h3>
                        ${item.desc ? `<p class="text-gray-600 dark:text-gray-400 text-sm mb-2">${item.desc}</p>` : ''}
                        ${item.content ? `<p class="text-gray-600 dark:text-gray-400 text-sm mb-2">${item.content}</p>` : ''}
                        <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            ${item.score ? `<span class="mr-4"><i class="fas fa-fire mr-1"></i>热度: ${item.score}</span>` : ''}
                            ${item.publish_time ? `<span><i class="fas fa-clock mr-1"></i>${item.publish_time}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        newsContent.innerHTML = newsHTML;
        
        // 确保主题正确应用到新渲染的新闻内容
        this.ensureThemeApplied();
    }showHomePage() {        document.querySelector('main').classList.remove('hidden');
        const dataManagePage = document.getElementById('dataManagePage');
        if (dataManagePage) {
            dataManagePage.classList.add('hidden');
        }
        const cacheManagePage = document.getElementById('cacheManagePage');
        if (cacheManagePage) {
            cacheManagePage.classList.add('hidden');
        }
    }    showCacheManagement() {
        document.querySelector('main').classList.add('hidden');
        const dataManagePage = document.getElementById('dataManagePage');
        if (dataManagePage) {
            dataManagePage.classList.add('hidden');
        }
        
        let cacheManagePage = document.getElementById('cacheManagePage');
        if (!cacheManagePage) {
            this.createCacheManagePage();
        } else {
            cacheManagePage.classList.remove('hidden');
        }
        
        this.renderCacheManagement();
    }    createCacheManagePage() {
        const cacheManagePage = document.createElement('div');
        cacheManagePage.id = 'cacheManagePage';
        cacheManagePage.className = 'hidden';
        cacheManagePage.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-white">
                        <i class="fas fa-memory mr-2 text-blue-500"></i>
                        缓存管理
                    </h2>
                    <button id="backToHomeFromCache" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>
                        返回首页
                    </button>
                </div>
                
                <!-- 缓存管理工具 - 优化为两栏布局 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <!-- 缓存统计 -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                        <div class="flex items-center mb-6">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                                <i class="fas fa-chart-pie text-green-600 dark:text-green-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-800 dark:text-white">缓存统计</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm">当前缓存数据概览</p>
                            </div>
                        </div>
                        <div id="cacheStats" class="space-y-3">
                            <!-- 缓存统计信息 -->
                        </div>
                    </div>
                    
                    <!-- 刷新数据 -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                        <div class="flex items-center mb-6">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                                <i class="fas fa-sync text-blue-600 dark:text-blue-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-800 dark:text-white">刷新数据</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm">获取最新数据并覆盖本地缓存</p>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <div class="flex items-center text-blue-700 dark:text-blue-300 mb-2">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    <span class="font-medium">刷新说明</span>
                                </div>
                                <p class="text-blue-600 dark:text-blue-400 text-sm">
                                    点击即从网络获取所有最新数据，并覆盖本地缓存。限制15s一次。
                                </p>
                            </div>
                            <button id="forceRefreshAllBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors w-full font-medium">
                                <i class="fas fa-sync mr-2"></i>刷新全部数据
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 缓存详情 -->
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                        <h3 class="text-xl font-semibold text-white flex items-center">
                            <i class="fas fa-list mr-3"></i>
                            缓存详情
                        </h3>
                    </div>
                    <div class="p-6">
                        <div id="cacheDetailsContainer">
                            <!-- 缓存详情内容 -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(cacheManagePage);
        
        // 添加事件监听器
        document.getElementById('backToHomeFromCache').addEventListener('click', () => {
            this.showHomePage();
        });document.getElementById('forceRefreshAllBtn').addEventListener('click', async () => {
            const btn = document.getElementById('forceRefreshAllBtn');
            // 检查刷新间隔限制（15秒） - 使用内存中的时间
            const now = Date.now();
            if (app.lastRefreshTime && (now - app.lastRefreshTime) < 15000) {
                const remainingTime = Math.ceil((15000 - (now - app.lastRefreshTime)) / 1000);
                app.showToast(`请等待 ${remainingTime} 秒后再刷新`, 'warning');
                return;
            }
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>刷新数据中...';
            btn.disabled = true;
            
            try {
                // 记录刷新时间到内存和服务器
                app.lastRefreshTime = now;
                await app.saveToServer(); // 保存刷新时间到服务器
                
                // 重新获取当日信息并覆写缓存
                const contentTypes = ['cat', 'anime', 'nasa', 'history', 'quote'];
                const newsTypes = ['baidu', 'weibo', 'bilibili', 'douyin'];
                
                // 刷新内容数据 - 强制覆盖本地数据
                await Promise.all(contentTypes.map(async (type) => {
                    try {
                        const refreshedData = await apiManager.fetchRefreshedDailyData(type);
                        if (refreshedData) {
                            console.log(`刷新${type}数据成功，已覆盖本地数据`);
                            // 立即更新显示
                            uiManager.renderContent(type, refreshedData);
                        }
                    } catch (error) {
                        console.warn(`刷新${type}数据失败:`, error.message);
                    }
                }));
                
                // 刷新新闻数据 - 强制覆盖本地数据
                await Promise.all(newsTypes.map(async (platform) => {
                    try {
                        const refreshedNewsData = await apiManager.fetchRefreshedNewsData(platform);
                        if (refreshedNewsData && refreshedNewsData.length > 0) {
                            console.log(`刷新${platform}新闻数据成功，已覆盖本地数据`);
                            // 如果当前显示的是这个平台的新闻，立即更新
                            if (app.currentNewsTab === platform) {
                                uiManager.renderNews(refreshedNewsData, platform);
                            }
                        }
                    } catch (error) {
                        console.warn(`刷新${platform}新闻数据失败:`, error.message);
                    }
                }));
                
                this.renderCacheManagement();
                app.showToast('数据刷新成功，本地缓存已覆盖更新', 'success');
                
            } catch (error) {
                console.error('刷新数据失败:', error);
                app.showToast('刷新数据失败', 'error');
            } finally {
                btn.innerHTML = '<i class="fas fa-sync mr-2"></i>刷新数据';
                btn.disabled = false;
            }
        });
    }

    renderCacheManagement() {
        const cacheManagePage = document.getElementById('cacheManagePage');
        if (!cacheManagePage) return;
        
        cacheManagePage.classList.remove('hidden');
        
        // 渲染缓存统计
        this.renderCacheStats();
        
        // 渲染缓存详情
        this.renderCacheDetails();
    }    renderCacheStats() {
        const statsContainer = document.getElementById('cacheStats');
        const cacheData = app.dailyData;
        
        // 计算统计信息
        const totalItems = Object.keys(cacheData).length;
        const cacheSize = JSON.stringify(cacheData).length;
        const cacheSizeKB = (cacheSize / 1024).toFixed(2);
        
        // 统计不同类型的缓存数量
        const typeStats = {
            content: 0,
            news: 0
        };
        
        Object.keys(cacheData).forEach(key => {
            if (key.startsWith('news_')) {
                typeStats.news++;
            } else {
                typeStats.content++;
            }
        });
        
        statsContainer.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-database text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">总缓存项</p>
                            <p class="text-2xl font-bold text-gray-800 dark:text-white">${totalItems}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500 dark:text-gray-400">占用空间</p>
                        <p class="text-lg font-semibold text-purple-600 dark:text-purple-400">${cacheSizeKB} KB</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-image text-green-600 dark:text-green-400 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-xs text-green-600 dark:text-green-400">内容数据</p>
                                <p class="text-xl font-bold text-green-700 dark:text-green-300">${typeStats.content}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3">
                                <i class="fas fa-newspaper text-indigo-600 dark:text-indigo-400 text-sm"></i>
                            </div>
                            <div>
                                <p class="text-xs text-indigo-600 dark:text-indigo-400">新闻数据</p>
                                <p class="text-xl font-bold text-indigo-700 dark:text-indigo-300">${typeStats.news}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }renderCacheDetails() {
        const detailsContainer = document.getElementById('cacheDetailsContainer');
        const cacheData = app.dailyData;
        
        if (Object.keys(cacheData).length === 0) {
            detailsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-memory text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">暂无缓存数据</h3>
                    <p class="text-gray-500 dark:text-gray-500">当有数据被缓存时，会在这里显示详细信息</p>
                </div>
            `;
            return;
        }
        
        // 按类型分组缓存项
        const groupedCache = {
            content: [],
            news: []
        };
        
        Object.keys(cacheData).forEach(key => {
            const item = {
                key: key,
                type: key,
                data: cacheData[key],
                timestamp: cacheData[key].timestamp || new Date().toISOString()
            };
            
            if (key.startsWith('news_')) {
                groupedCache.news.push(item);
            } else {
                groupedCache.content.push(item);
            }
        });
          const detailsHTML = `
            <div class="space-y-6">
                ${groupedCache.content.length > 0 ? `
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">
                                <i class="fas fa-image mr-2 text-green-500"></i>
                                内容数据 (${groupedCache.content.length})
                            </h4>
                            <button onclick="uiManager.clearContentCache()" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
                                <i class="fas fa-trash mr-1"></i>清除全部
                            </button>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            ${groupedCache.content.map(item => `
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                                    <div class="text-sm font-medium text-gray-800 dark:text-white mb-1">
                                        ${this.getTypeDisplayName(item.type)}
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        ${item.type}
                                    </div>
                                    <div class="text-xs text-gray-400 dark:text-gray-500">
                                        ${new Date(item.timestamp).toLocaleString()}
                                    </div>
                                    <button onclick="uiManager.clearSingleCache('${item.key}')" class="mt-2 text-xs text-red-500 hover:text-red-700">
                                        删除
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${groupedCache.news.length > 0 ? `
                    <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-white">
                                <i class="fas fa-newspaper mr-2 text-blue-500"></i>
                                新闻数据 (${groupedCache.news.length})
                            </h4>
                            <button onclick="uiManager.clearNewsCache()" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm">
                                <i class="fas fa-trash mr-1"></i>清除全部
                            </button>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            ${groupedCache.news.map(item => `
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                                    <div class="text-sm font-medium text-gray-800 dark:text-white mb-1">
                                        ${this.getTypeDisplayName(item.type)}
                                    </div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        ${item.type}
                                    </div>
                                    <div class="text-xs text-gray-400 dark:text-gray-500 mb-1">
                                        ${Array.isArray(item.data) ? item.data.length + ' 条新闻' : '无数据'}
                                    </div>
                                    <div class="text-xs text-gray-400 dark:text-gray-500">
                                        最近更新
                                    </div>
                                    <button onclick="uiManager.clearSingleCache('${item.key}')" class="mt-2 text-xs text-red-500 hover:text-red-700">
                                        删除
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        detailsContainer.innerHTML = detailsHTML;
    }    async clearSingleCache(key) {
        if (confirm(`确定要清除 ${key} 的缓存吗？`)) {
            delete app.dailyData[key];
            await app.saveToServer();
            this.renderCacheManagement();
            app.showToast(`缓存 ${key} 已清除`, 'success');
        }
    }

    async clearContentCache() {
        if (confirm('确定要清除所有内容数据缓存吗？')) {
            const keysToDelete = Object.keys(app.dailyData).filter(key => !key.startsWith('news_'));
            keysToDelete.forEach(key => {
                delete app.dailyData[key];
            });
            await app.saveToServer();
            this.renderCacheManagement();
            app.showToast(`已清除 ${keysToDelete.length} 项内容缓存`, 'success');
        }
    }

    async clearNewsCache() {
        if (confirm('确定要清除所有新闻数据缓存吗？')) {
            const keysToDelete = Object.keys(app.dailyData).filter(key => key.startsWith('news_'));
            keysToDelete.forEach(key => {
                delete app.dailyData[key];
            });
            await app.saveToServer();
            this.renderCacheManagement();
            app.showToast(`已清除 ${keysToDelete.length} 项新闻缓存`, 'success');
        }
    }

    async clearCacheForDate(date) {
        // 这个方法现在主要用于清理旧格式的缓存
        if (confirm(`确定要清除包含 ${date} 的旧格式缓存吗？`)) {
            const keysToDelete = Object.keys(app.dailyData).filter(key => key.includes(date));
            
            keysToDelete.forEach(key => {
                delete app.dailyData[key];
            });
            
            await app.saveToServer();
            this.renderCacheManagement();
            app.showToast(`已清除 ${keysToDelete.length} 项旧格式缓存`, 'success');
        }
    }

    deleteDayData(date) {
        if (confirm(`确定要删除 ${date} 的数据吗？`)) {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            delete adminData[date];
            localStorage.setItem('adminData', JSON.stringify(adminData));
            
            app.showToast(`${date} 数据已删除`, 'success');
        }
    }

    clearAllData() {        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            localStorage.removeItem('adminData');
            localStorage.removeItem('dailyData');
            
            app.showToast('所有数据已清除', 'success');
        }
    }async loadContent(type, forceRefresh = false, cacheOnly = false) {
        try {
            // 先检查本地缓存
            const cached = app.getCachedContent(type);
            
            if (cached && !forceRefresh) {
                console.log(`使用本地缓存的 ${type} 数据`);
                this.renderContent(type, cached.content);
                return;
            }

            // 如果只允许缓存且没有缓存，显示错误
            if (cacheOnly && !cached) {
                this.renderError(type, '无本地数据');
                return;
            }

            // 从网络获取新数据并覆盖本地数据
            console.log(`从网络获取 ${type} 数据并覆盖本地`);
            const data = await apiManager.fetchData(type, forceRefresh, cacheOnly);
            this.renderContent(type, data);
            
        } catch (error) {
            console.error(`加载 ${type} 失败:`, error);
            
            // 尝试使用本地缓存作为降级方案
            const cached = app.getCachedContent(type);
            if (cached) {
                console.log(`网络失败，使用本地缓存: ${type}`);
                this.renderContent(type, cached.content);
                app.showToast(`网络获取失败，显示本地数据`, 'warning');
            } else {
                this.renderError(type, error.message);
            }
        }
    }

    loadFromAdminData(type) {
        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const today = new Date().toISOString().split('T')[0];
            
            // 尝试今天的数据
            if (adminData[today] && adminData[today][type]) {
                const endpoint = apiManager.endpoints[type];
                return endpoint.parser(adminData[today][type].data);
            }
            
            // 如果今天没有，尝试最近的数据
            const dates = Object.keys(adminData).sort().reverse();
            for (const date of dates) {
                if (adminData[date][type]) {
                    const endpoint = apiManager.endpoints[type];
                    return endpoint.parser(adminData[date][type].data);
                }
            }
            
            return null;
        } catch (error) {
            console.error(`Error loading ${type} from admin data:`, error);
            return null;
        }
    }    getTypeDisplayName(type) {
        const names = {
            'cat': '猫咪图片',
            'anime': '动漫语录',
            'nasa': 'NASA天文图',
            'history': '历史上的今天',
            'quote': '随机一言',
            'news_baidu': '百度热搜',
            'news_weibo': '微博热搜',
            'news_bilibili': '哔哩哔哩热搜',
            'news_douyin': '抖音热搜'
        };
        
        return names[type] || type;
    }

    renderContent(type, data) {
        const elementId = `${type}Content`;
        const element = document.getElementById(elementId);
        
        if (!element) return;        switch (type) {            case 'cat':
                element.innerHTML = `
                    <div class="image-container">
                        <img src="${data.image}" alt="每日一猫" class="w-full h-48 object-cover rounded-lg" loading="lazy">
                    </div>
                `;
                break;

            case 'anime':
                element.innerHTML = `
                    <div class="flex flex-col justify-center h-full">
                        <blockquote class="text-gray-700 dark:text-gray-300 italic mb-4 quote-text text-base leading-relaxed">"${data.quote}"</blockquote>
                        <div class="text-right mt-auto">
                            <p class="text-sm text-gray-600 dark:text-gray-400 character-name font-medium">—— ${data.character}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 anime-name">${data.anime}</p>
                        </div>
                    </div>
                `;
                break;            case 'nasa':
                element.innerHTML = `
                    <div class="image-container mb-3">
                        <img src="${data.url}" alt="${data.title}" class="w-full h-72 object-cover rounded-lg" loading="lazy">
                    </div>
                    <h4 class="font-semibold text-gray-800 dark:text-white mb-2 nasa-title text-base">${data.title}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 nasa-explanation leading-relaxed">${data.explanation.substring(0, 180)}...</p>
                    ${data.copyright ? `<p class="text-xs text-gray-500 dark:text-gray-500 mt-2">© ${data.copyright}</p>` : ''}
                `;
                break;

            case 'history':
                element.innerHTML = `
                    <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg h-full flex flex-col justify-center">
                        <h4 class="font-semibold text-gray-800 dark:text-white mb-3 history-title text-base leading-relaxed">${data.title}</h4>
                        <p class="text-lg font-bold text-green-600 dark:text-green-400 history-year mb-2">${data.year}年${data.month}月${data.day}日</p>
                        ${data.keywords ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">关键词：${data.keywords}</p>` : ''}
                        ${data.url ? `<a href="${data.url}" target="_blank" class="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">查看详情 →</a>` : ''}
                    </div>
                `;
                break;            
            case 'quote':
                element.innerHTML = `
                    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-1 rounded-lg h-full flex flex-col justify-center">
                        <i class="fas fa-quote-left text-yellow-500 text-xs mb-1"></i>
                        <p class="text-gray-700 dark:text-gray-300 quote-message font-medium text-base leading-tight flex-1 flex items-center">${data.message}</p>
                    </div>
                `;
                break;
        }
        
        // 渲染完成后，确保主题正确应用
        this.ensureThemeApplied();
    }

    renderError(type, message) {
        const elementId = `${type}Content`;
        const element = document.getElementById(elementId);
        
        if (!element) return;

        element.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p class="text-sm">加载失败</p>
                <p class="text-xs">${message}</p>
            </div>        `;
    }
}

// 初始化应用
const app = new AppState();
const apiManager = new APIManager();
const uiManager = new UIManager();

window.app = app;
window.apiManager = apiManager;
window.uiManager = uiManager;