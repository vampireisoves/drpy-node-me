import axios from 'axios';

/**
 * GitHub Release 控制器
 * 用于获取 GitHub 仓库的最新 Release 下载链接
 */
export default (fastify, options, done) => {
    
    /**
     * 获取最新 Release 下载链接
     * 路径: /gh/release
     * 参数: repo (可选，默认 hjdhnx/drpy-node)
     */
    fastify.get('/gh/release', async (request, reply) => {
        const repo = request.query.repo || 'hjdhnx/drpy-node';
        const proxyPrefix = 'https://github.catvod.com/';
        const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;

        try {
            fastify.log.info(`Fetching release info for ${repo}`);
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'drpy-node-client',
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const data = response.data;
            
            if (!data.assets || data.assets.length === 0) {
                return reply.status(404).send({ error: 'No assets found in the latest release' });
            }

            // 打印全部文件列表的链接
            fastify.log.info(`Assets for ${repo} ${data.tag_name}:`);
            const fileList = data.assets.map(asset => {
                fastify.log.info(`- ${asset.name}: ${asset.browser_download_url}`);
                return {
                    name: asset.name,
                    url: asset.browser_download_url,
                    proxy_url: proxyPrefix + asset.browser_download_url
                };
            });

            // 优先选择后缀为 .7z 且文件名不包含 green 的文件
            let targetAsset = data.assets.find(asset => asset.name.toLowerCase().endsWith('.7z') && !asset.name.toLowerCase().includes('green'));
            
            if (!targetAsset) {
                fastify.log.warn(`No asset found matching criteria (.7z, no 'green'), falling back to the first asset.`);
                targetAsset = data.assets[0];
            }

            const originalUrl = targetAsset.browser_download_url;
            const finalUrl = proxyPrefix + originalUrl;

            // 返回这个完整链接
            // 用户要求"返回这个完整链接"，这里直接返回字符串
            return reply.send(finalUrl);

        } catch (error) {
            fastify.log.error(`Error fetching release for ${repo}: ${error.message}`);
            if (error.response) {
                 fastify.log.error(`GitHub API Status: ${error.response.status}`);
                 return reply.status(error.response.status).send({ 
                     error: 'GitHub API Error', 
                     message: error.response.data.message 
                 });
            }
            return reply.status(500).send({ error: 'Internal Server Error', message: error.message });
        }
    });

    done();
};
