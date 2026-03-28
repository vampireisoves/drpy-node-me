/**
 * 字符串相似度计算工具模块
 * 提供字符串相似度比较和最佳匹配查找功能
 */

/**
 * 比较两个字符串的相似度
 * @param {string} first 第一个字符串
 * @param {string} second 第二个字符串
 * @returns {number} 相似度值(0-1之间)
 */
function compareTwoStrings(first, second) {
    // 去除空白字符后比较，如果完全相同返回1
    if ((first = first.replace(/\s+/g, '')) === (second = second.replace(/\s+/g, ''))) return 1;
    // 字符串长度小于2无法计算bigram，返回0
    if (first.length < 2 || second.length < 2) return 0;
    
    // 构建第一个字符串的bigram映射
    const firstBigrams = new Map();
    for (let i = 0; i < first.length - 1; i++) {
        const bigram = first.substring(i, i + 2),
            count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
        firstBigrams.set(bigram, count);
    }
    
    // 计算交集大小
    let intersectionSize = 0;
    for (let i = 0; i < second.length - 1; i++) {
        const bigram = second.substring(i, i + 2),
            count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;
        0 < count && (firstBigrams.set(bigram, count - 1), intersectionSize++);
    }
    
    // 返回Dice系数
    return (2 * intersectionSize) / (first.length + second.length - 2);
}

/**
 * 在目标字符串数组中找到与主字符串最相似的匹配
 * @param {string} mainString 主字符串
 * @param {string[]} targetStrings 目标字符串数组
 * @returns {Object} 包含所有评分和最佳匹配的对象
 */
function findBestMatch(mainString, targetStrings) {
    const ratings = [];
    let bestMatchIndex = 0;
    
    // 计算每个目标字符串的相似度
    for (let i = 0; i < targetStrings.length; i++) {
        const currentTargetString = targetStrings[i],
            currentRating = compareTwoStrings(mainString, currentTargetString);
        ratings.push({ target: currentTargetString, rating: currentRating }), currentRating > ratings[bestMatchIndex].rating && (bestMatchIndex = i);
    }
    return { ratings: ratings, bestMatch: ratings[bestMatchIndex], bestMatchIndex: bestMatchIndex };
}

/**
 * 计算两个字符串的最长公共子序列
 * @param {string} str1 第一个字符串
 * @param {string} str2 第二个字符串
 * @returns {Object} 包含长度、序列和偏移量的对象
 */
function lcs(str1, str2) {
    let j;
    let sequence;
    let str1Length = str1.length;
    let str2Length = str2.length;
    let num = new Array(str1Length);
    let maxlen;
    let lastSubsBegin;
    let i;
    
    // 空字符串处理
    if (!str1 || !str2) return { length: 0, sequence: '', offset: 0 };
    
    // 初始化二维数组
    for (; i < str1Length; i++) {
        let subArray = new Array(str2Length);
        for (; j < str2Length; j++) subArray[j] = 0;
        num[i] = subArray;
    }
    
    let thisSubsBegin = null;
    i = 0;
    // 动态规划计算LCS
    for (; i < str1Length; i++) for (j = 0; j < str2Length; j++) str1[i] !== str2[j] ? (num[i][j] = 0) : ((num[i][j] = 0 === i || 0 === j ? 1 : 1 + num[i - 1][j - 1]), num[i][j] > maxlen && ((maxlen = num[i][j]), lastSubsBegin === (thisSubsBegin = i - num[i][j] + 1) ? (sequence += str1[i]) : ((lastSubsBegin = thisSubsBegin), (sequence = ''), (sequence += str1.substr(lastSubsBegin, i + 1 - lastSubsBegin)))));
    return { length: maxlen, sequence: sequence, offset: thisSubsBegin };
}

/**
 * 在目标字符串数组中找到与主字符串LCS最长的匹配
 * @param {string} mainString 主字符串
 * @param {string[]} targetStrings 目标字符串数组
 * @returns {Object} 包含所有LCS结果和最佳匹配的对象
 */
function findBestLCS(mainString, targetStrings) {
    const results = [];
    let bestMatchIndex = 0;
    
    // 计算每个目标字符串的LCS
    for (let i = 0; i < targetStrings.length; i++) {
        const currentTargetString = targetStrings[i],
            currentLCS = lcs(mainString, currentTargetString);
        results.push({ target: currentTargetString, lcs: currentLCS }), currentLCS.length > results[bestMatchIndex].lcs.length && (bestMatchIndex = i);
    }
    return { allLCS: results, bestMatch: results[bestMatchIndex], bestMatchIndex: bestMatchIndex };
}

// 导出主要函数
export { compareTwoStrings, findBestMatch, findBestLCS };
