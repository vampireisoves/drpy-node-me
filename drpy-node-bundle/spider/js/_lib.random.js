function getRandomFromList(list) {
    // 将列表转换为数组
    const array = Array.isArray(list) ? list : Array.from(list);
    // 获取随机索引
    const randomIndex = Math.floor(Math.random() * array.length);
    // 返回随机选取的元素
    return array[randomIndex];
}

/**
 * 对数组进行随机乱序（Fisher-Yates 洗牌算法）
 * @param {Array} array - 需要乱序的数组
 * @returns {Array} - 返回乱序后的新数组
 */
function shuffleArray(array) {
    const result = [...array]; // 创建数组副本，避免修改原数组
    for (let i = result.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1)); // 随机索引
        [result[i], result[randomIndex]] = [result[randomIndex], result[i]]; // 交换元素
    }
    return result;
}

$.exports = {
    getRandomFromList,
    shuffleArray
}
