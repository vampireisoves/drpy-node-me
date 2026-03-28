// scripts/example-task.mjs
export default {
    run: async (fastify) => {
        const timestamp = new Date().toISOString();
        fastify.log.info(`📝 Example task started at ${timestamp}`);

        // 模拟任务执行
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 随机生成成功/失败
        const success = Math.random() > 0.2;

        if (success) {
            fastify.log.info('✅ Example task completed successfully');
            return {status: 'success', message: 'Task completed'};
        } else {
            fastify.log.error('❌ Example task failed');
            throw new Error('Simulated task failure');
        }
    }
};