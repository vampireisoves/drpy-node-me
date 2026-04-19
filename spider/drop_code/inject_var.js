moduleObject.injectVars = (vars) => {
    // 遍历 vars 对象，将其中的键值对转化为局部变量
    for (let key in vars) {
        let value = vars[key];

        // 根据类型判断并转化值
        if (value === undefined) {
            value = 'undefined';  // undefined转为 'undefined'
        } else if (value === null) {
            value = 'null';       // null 转为 'null'
        } else if (value === '') {
            value = "''";         // 空字符串转为 "''"
        } else if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';  // 布尔值转为 'true' 或 'false'
        } else if (typeof value === 'object') {
            if (Array.isArray(value)) {
                value = JSON.stringify(value);  // 数组转为 JSON 字符串
            } else if (value instanceof Date) {
                value = `new Date("${value.toISOString()}")`;  // Date 对象转为日期字符串
            } else if (value instanceof RegExp) {
                value = value.toString();  // 正则表达式转为字符串表示
            } else {
                value = JSON.stringify(value);  // 普通对象转为 JSON 字符串
            }
        }

        // 构造赋值代码，并通过 eval 动态执行
        let _code = `moduleObject.${key} = ${value}`;
        console.log(_code); // 打印每个注入的变量代码
        eval(_code); // 使用 eval 在当前作用域中定义变量
    }
}
moduleObject.injectMethodVars = async function (method, args, vars) {
    async function _inner() {
        let input;
        let MY_URL;
        // 遍历 vars 对象，将其中的键值对转化为局部变量
        for (let key in vars) {
            let value = vars[key];

            // 根据类型判断并转化值
            if (value === undefined) {
                value = 'undefined';  // undefined转为 'undefined'
            } else if (value === null) {
                value = 'null';       // null 转为 'null'
            } else if (value === '') {
                value = "''";         // 空字符串转为 "''"
            } else if (typeof value === 'boolean') {
                value = value ? 'true' : 'false';  // 布尔值转为 'true' 或 'false'
            } else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    value = JSON.stringify(value);  // 数组转为 JSON 字符串
                } else if (value instanceof Date) {
                    value = `new Date("${value.toISOString()}")`;  // Date 对象转为日期字符串
                } else if (value instanceof RegExp) {
                    value = value.toString();  // 正则表达式转为字符串表示
                } else {
                    value = JSON.stringify(value);  // 普通对象转为 JSON 字符串
                }
            }

            // 构造赋值代码，并通过 eval 动态执行
            let _code = `${key} = ${value}`;
            console.log(_code); // 打印每个注入的变量代码
            eval(_code); // 使用 eval 在当前作用域中定义变量
        }

        // 打印 inject 的变量值，确保它们在 eval 中被正确注入
        console.log('=====inject vars=====');
        console.log(input);   // 现在 input 应该是定义好的
        console.log(MY_URL);  // MY_URL 应该被注入并可用

        // 执行传入的 method
        return await method(...args);
    }

    return await _inner();
};


const injectVars = {input: '你好', MY_URL: 'https://example.com'};
const functions = ['class_parse', '预处理', '推荐', '一级', '二级', '搜索', 'lazy'];

for (let func of functions) {
    if (typeof moduleObject[func] === 'function') {
        // 如果是箭头函数
        if (moduleObject[func].toString().includes('=>')) {
            const originalMethod = moduleObject[func];

            // 包装箭头函数，将其改为闭包函数
            moduleObject[func] = function (...args) {
                const self = injectVars; // 动态注入 self
                return (async (...innerArgs) => {
                    // 调用原始的箭头函数
                    return await originalMethod.apply(self, innerArgs);
                })(...args);
            };
        }
    }
}
