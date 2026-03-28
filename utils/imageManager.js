// 图片存储控制器 - 基于Fastify插件模式
// 实现内存共享变量存储图片base64并提供路由返回图片


const imageStore = new Map();

// 图片管理工具类
class ImageManager {
    constructor() {
        this.images = imageStore;
    }

    // 存储图片
    storeImage(imageId, base64Data) {
        if (!imageId || !base64Data) {
            throw new Error('imageId和base64Data不能为空');
        }

        // 验证base64格式
        const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp|bmp|svg\+xml);base64,/i;
        if (!base64Regex.test(base64Data)) {
            throw new Error('base64格式不正确，必须包含正确的图片MIME类型');
        }

        // 计算图片大小
        const size = Buffer.byteLength(base64Data, 'utf8');

        // 存储图片信息
        this.images.set(imageId, {
            data: base64Data,
            timestamp: Date.now(),
            size: size,
            mimeType: this.extractMimeType(base64Data)
        });

        return {
            imageId,
            imageUrl: `/image/${imageId}`,
            size: size,
            mimeType: this.extractMimeType(base64Data)
        };
    }

    // 获取图片
    getImage(imageId) {
        const imageInfo = this.images.get(imageId);
        return imageInfo || null;
    }

    // 删除图片
    deleteImage(imageId) {
        return this.images.delete(imageId);
    }

    // 获取所有图片信息
    getAllImages() {
        const result = [];
        for (const [imageId, info] of this.images) {
            result.push({
                imageId,
                imageUrl: `/image/${imageId}`,
                timestamp: info.timestamp,
                size: info.size,
                mimeType: info.mimeType
            });
        }
        return result;
    }

    // 清理过期图片
    cleanExpiredImages(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
        const now = Date.now();
        let cleanedCount = 0;
        for (const [imageId, info] of this.images) {
            if (now - info.timestamp > maxAge) {
                this.images.delete(imageId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }

    // 获取内存使用情况
    getMemoryUsage() {
        let totalSize = 0;
        for (const [, info] of this.images) {
            totalSize += info.size;
        }
        return {
            imageCount: this.images.size,
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }

    // 提取MIME类型
    extractMimeType(base64Data) {
        const matches = base64Data.match(/^data:image\/(\w+);base64,/);
        return matches ? matches[1] : 'unknown';
    }

    // 解析base64数据为Buffer
    parseBase64ToBuffer(base64Data) {
        const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            throw new Error('无效的base64图片格式');
        }

        const mimeType = matches[1];
        const imageBuffer = Buffer.from(matches[2], 'base64');

        return {
            mimeType,
            buffer: imageBuffer
        };
    }
}

// 创建图片管理器实例
const imageManager = new ImageManager();

// 导出图片管理器实例供其他模块使用
export {imageManager};