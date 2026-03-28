/**
 * 任务队列管理类
 * 用于控制并发任务的执行，支持设置最大并发数
 * 
 * @example
 * const queue = new DsQueue(3); // 最大并发数为3
 * queue.add(() => fetch('/api/data1'));
 * queue.add(() => fetch('/api/data2'));
 * await queue.onIdle(); // 等待所有任务完成
 */
class DsQueue {
    /**
     * 构造函数
     * @param {number} concurrency - 最大并发数，默认为1
     */
    constructor(concurrency = 1) {
        this.concurrency = concurrency; // 最大并发数
        this.queue = []; // 待执行任务队列
        this.activeCount = 0; // 当前正在执行的任务数
    }

    /**
     * 执行单个任务
     * @param {Function} task - 要执行的异步任务函数
     * @private
     */
    async runTask(task) {
        this.activeCount++;
        try {
            await task();
        } catch (err) {
            console.log('Task failed:', err);
        } finally {
            this.activeCount--;
            this.next(); // 任务完成后尝试执行下一个任务
        }
    }

    /**
     * 执行队列中的下一个任务
     * 如果当前活跃任务数小于最大并发数且队列中有待执行任务，则执行下一个任务
     * @private
     */
    next() {
        if (this.queue.length > 0 && this.activeCount < this.concurrency) {
            const nextTask = this.queue.shift();
            this.runTask(nextTask);
        }
    }

    /**
     * 添加任务到队列
     * @param {Function} task - 要添加的异步任务函数
     */
    add(task) {
        this.queue.push(task);
        this.next(); // 立即尝试执行任务
    }

    /**
     * 等待所有任务完成
     * @returns {Promise<void>} 当队列为空且没有活跃任务时resolve
     */
    onIdle() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.queue.length === 0 && this.activeCount === 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 10);
        });
    }
}

export default DsQueue;
