import batchExecute from '../libs_drpy/batchExecute.js';
// 示例任务
var results = [];
var task = function (obj) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(obj.url), 1000); // 模拟任务执行
    });
};

// 示例任务列表
let tasks = [
    {
        func: task,
        param: {
            url: 'https://gitee.com/qiusunshine233/hikerView/raw/master/module/aes2.js',
            path: 'hiker://files/cache/t1.txt',
        },
        id: 'task1',
    },
    {
        func: task,
        param: {
            url: 'https://gitee.com/qiusunshine233/hikerView/raw/master/module/aes2.js',
            path: 'hiker://files/cache/t2.txt',
        },
        id: 'task2',
    },
    {
        func: task,
        param: {
            url: 'https://gitee.com/qiusunshine233/hikerView/raw/master/module/aes2.js',
            path: 'hiker://files/cache/t3.txt',
        },
        id: 'task3',
    },
    {
        func: task,
        param: {
            url: 'https://gitee.com/qiusunshine233/hikerView/raw/master/module/aes2.js',
            path: 'hiker://files/cache/t4.txt',
        },
        id: 'task4',
    },
    {
        func: task,
        param: {
            url: 'https://gitee.com/qiusunshine233/hikerView/raw/master/module/aes2.js',
            path: 'hiker://files/cache/t5.txt',
        },
        id: 'task5',
    },
];

// 示例 listener
var count = tasks.length;
var success = 3;
count = success;

batchExecute(
    tasks,
    {
        func: function (obj, id, error, taskResult) {
            if (error) {
                console.log(`任务 ${id} 出错:`, error);
                return;
            }

            obj.results.push(taskResult);
            console.log(`任务 ${id} 完成，结果:`, taskResult);

            count--;
            if (count === 1) {
                console.log('我主动中断了');
                return 'break';
            } else if (count > 0) {
                console.log(`下载中，剩余任务：${count}`);
            } else {
                console.log('结束了');
            }
        },
        param: {
            hi: 'ccc',
            results: results,
        },
    },
    success
).then(() => {
    console.log(
        `任务数：${tasks.length}，要求结果数：${success}，返回结果数：${results.length}`
    );
    console.log('结果：', JSON.stringify(results));
});
