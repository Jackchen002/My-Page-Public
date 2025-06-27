const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// 确保数据目录存在
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// 获取文件路径
function getDataFilePath(type) {
    return path.join(DATA_DIR, `${type}.json`);
}

// 读取数据文件
async function readDataFile(type) {
    try {
        const filePath = getDataFilePath(type);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 文件不存在，返回默认值
            return getDefaultData(type);
        }
        throw error;
    }
}

// 写入数据文件
async function writeDataFile(type, data) {
    const filePath = getDataFilePath(type);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 获取默认数据
function getDefaultData(type) {
    switch (type) {
        case 'users':
            return {};
        case 'daily-data':
            return {};
        case 'admin-data':
            return {};
        default:
            return {};
    }
}

// API路由

// 获取数据
app.get('/api/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = await readDataFile(type);
        res.json(data);
    } catch (error) {
        console.error(`读取${req.params.type}数据失败:`, error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 保存数据
app.post('/api/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;
        
        await writeDataFile(type, data);
        
        res.json({ 
            success: true, 
            message: `${type}数据保存成功`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`保存${req.params.type}数据失败:`, error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        server: 'My Page Local Server'
    });
});

// 获取数据统计
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {};
        const types = ['users', 'daily-data', 'admin-data'];
        
        for (const type of types) {
            try {
                const data = await readDataFile(type);
                stats[type] = {
                    exists: true,
                    size: JSON.stringify(data).length,
                    items: Array.isArray(data) ? data.length : Object.keys(data).length,
                    lastModified: new Date().toISOString()
                };
            } catch (error) {
                stats[type] = {
                    exists: false,
                    error: error.message
                };
            }
        }
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 备份数据
app.post('/api/backup', async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(DATA_DIR, 'backups', timestamp);
        
        await fs.mkdir(backupDir, { recursive: true });
        
        const types = ['users', 'daily-data', 'admin-data'];
        const backupFiles = [];
        
        for (const type of types) {
            try {
                const data = await readDataFile(type);
                const backupPath = path.join(backupDir, `${type}.json`);
                await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
                backupFiles.push(`${type}.json`);
            } catch (error) {
                console.warn(`备份${type}失败:`, error.message);
            }
        }
        
        res.json({
            success: true,
            message: '数据备份成功',
            timestamp,
            files: backupFiles
        });
    } catch (error) {
        console.error('备份数据失败:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

// 启动服务器
async function startServer() {
    try {
        await ensureDataDir();
        
        app.listen(PORT, () => {
            console.log(`\nMy Page 本地服务器已启动`);
            console.log(`服务器地址: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

// 关闭
process.on('SIGINT', () => {
    process.exit(0);
});

process.on('SIGTERM', () => {
    process.exit(0);
});

startServer();
