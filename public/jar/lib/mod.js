/**
 * 字符串距离计算模块
 * 
 * 该模块实现了Myers算法来计算两个字符串之间的编辑距离（Levenshtein距离）。
 * 提供了高效的字符串相似度计算和最近匹配查找功能。
 * 
 * Myers算法是一种高效的编辑距离计算算法，时间复杂度为O(ND)，其中N是字符串长度，D是编辑距离。
 * 
 * @author drpy-node
 * @version 1.0.0
 */

// 预分配的位向量数组，用于Myers算法的字符匹配
const peq = new Uint32Array(0x10000);

/**
 * Myers算法的32位实现
 * 用于计算较短字符串（长度<=32）的编辑距离
 * 
 * @param {string} a - 第一个字符串
 * @param {string} b - 第二个字符串
 * @returns {number} 编辑距离
 */
const myers_32 = (a, b) => {
    const n = a.length;
    const m = b.length;
    const lst = 1 << (n - 1); // 最高位掩码
    let pv = -1; // 正向量（所有位为1）
    let mv = 0;  // 负向量（所有位为0）
    let sc = n;  // 当前得分
    let i = n;
    
    // 构建字符匹配位向量
    while (i--) {
        peq[a.charCodeAt(i)] |= 1 << i;
    }
    
    // 逐字符处理字符串b
    for (i = 0; i < m; i++) {
        let eq = peq[b.charCodeAt(i)]; // 当前字符的匹配位向量
        const xv = eq | mv;
        eq |= ((eq & pv) + pv) ^ pv; // 计算水平差异
        mv |= ~(eq | pv); // 更新负向量
        pv &= eq;         // 更新正向量
        
        // 更新得分
        if (mv & lst) {
            sc++;
        }
        if (pv & lst) {
            sc--;
        }
        
        // 移位操作
        mv = (mv << 1) | 1;
        pv = (pv << 1) | ~(xv | mv);
        mv &= xv;
    }
    
    // 清理位向量
    i = n;
    while (i--) {
        peq[a.charCodeAt(i)] = 0;
    }
    return sc;
};

/**
 * Myers算法的扩展实现
 * 用于计算较长字符串的编辑距离，支持任意长度
 * 
 * @param {string} b - 第一个字符串
 * @param {string} a - 第二个字符串
 * @returns {number} 编辑距离
 */
const myers_x = (b, a) => {
    const n = a.length;
    const m = b.length;
    const mhc = []; // 负水平进位数组
    const phc = []; // 正水平进位数组
    const hsize = Math.ceil(n / 32); // 水平块数
    const vsize = Math.ceil(m / 32); // 垂直块数
    
    // 初始化水平进位数组
    for (let i = 0; i < hsize; i++) {
        phc[i] = -1;
        mhc[i] = 0;
    }
    
    let j = 0;
    // 处理除最后一个垂直块外的所有块
    for (; j < vsize - 1; j++) {
        let mv = 0;
        let pv = -1;
        const start = j * 32;
        const vlen = Math.min(32, m) + start;
        
        // 构建当前块的字符匹配位向量
        for (let k = start; k < vlen; k++) {
            peq[b.charCodeAt(k)] |= 1 << k;
        }
        
        // 处理字符串a的每个字符
        for (let i = 0; i < n; i++) {
            const eq = peq[a.charCodeAt(i)];
            const pb = (phc[(i / 32) | 0] >>> i) & 1; // 正水平进位位
            const mb = (mhc[(i / 32) | 0] >>> i) & 1; // 负水平进位位
            const xv = eq | mv;
            const xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
            let ph = mv | ~(xh | pv);
            let mh = pv & xh;
            
            // 更新水平进位
            if ((ph >>> 31) ^ pb) {
                phc[(i / 32) | 0] ^= 1 << i;
            }
            if ((mh >>> 31) ^ mb) {
                mhc[(i / 32) | 0] ^= 1 << i;
            }
            
            // 移位操作
            ph = (ph << 1) | pb;
            mh = (mh << 1) | mb;
            pv = mh | ~(xv | ph);
            mv = ph & xv;
        }
        
        // 清理当前块的位向量
        for (let k = start; k < vlen; k++) {
            peq[b.charCodeAt(k)] = 0;
        }
    }
    
    // 处理最后一个垂直块
    let mv = 0;
    let pv = -1;
    const start = j * 32;
    const vlen = Math.min(32, m - start) + start;
    
    // 构建最后一个块的字符匹配位向量
    for (let k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] |= 1 << k;
    }
    
    let score = m; // 初始得分
    
    // 处理字符串a的每个字符
    for (let i = 0; i < n; i++) {
        const eq = peq[a.charCodeAt(i)];
        const pb = (phc[(i / 32) | 0] >>> i) & 1;
        const mb = (mhc[(i / 32) | 0] >>> i) & 1;
        const xv = eq | mv;
        const xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
        let ph = mv | ~(xh | pv);
        let mh = pv & xh;
        
        // 更新得分
        score += (ph >>> (m - 1)) & 1;
        score -= (mh >>> (m - 1)) & 1;
        
        // 更新水平进位
        if ((ph >>> 31) ^ pb) {
            phc[(i / 32) | 0] ^= 1 << i;
        }
        if ((mh >>> 31) ^ mb) {
            mhc[(i / 32) | 0] ^= 1 << i;
        }
        
        // 移位操作
        ph = (ph << 1) | pb;
        mh = (mh << 1) | mb;
        pv = mh | ~(xv | ph);
        mv = ph & xv;
    }
    
    // 清理最后一个块的位向量
    for (let k = start; k < vlen; k++) {
        peq[b.charCodeAt(k)] = 0;
    }
    return score;
};

/**
 * 计算两个字符串之间的编辑距离
 * 自动选择最优算法（32位或扩展版本）
 * 
 * @param {string} a - 第一个字符串
 * @param {string} b - 第二个字符串
 * @returns {number} 编辑距离（Levenshtein距离）
 */
const distance = (a, b) => {
    // 确保a是较长的字符串，优化算法性能
    if (a.length < b.length) {
        const tmp = b;
        b = a;
        a = tmp;
    }
    
    // 空字符串的距离就是另一个字符串的长度
    if (b.length === 0) {
        return a.length;
    }
    
    // 根据字符串长度选择算法
    if (a.length <= 32) {
        return myers_32(a, b); // 使用32位优化版本
    }
    return myers_x(a, b); // 使用扩展版本
};

/**
 * 在字符串数组中找到与目标字符串最相似的字符串
 * 
 * @param {string} str - 目标字符串
 * @param {string[]} arr - 候选字符串数组
 * @returns {string} 最相似的字符串
 */
const closest = (str, arr) => {
    let min_distance = Infinity; // 最小距离
    let min_index = 0;           // 最小距离对应的索引
    
    // 遍历所有候选字符串
    for (let i = 0; i < arr.length; i++) {
        const dist = distance(str, arr[i]);
        if (dist < min_distance) {
            min_distance = dist;
            min_index = i;
        }
    }
    
    return arr[min_index];
};

// 导出公共函数
export { closest, distance };
