import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JS_DIR = path.resolve(__dirname, '../js');
const OUTPUT_FILE = path.resolve(__dirname, 'final_sources.json');

// Get image path from command line arg or default
const imageArg = process.argv[2];
const IMAGE_PATH = imageArg ? path.resolve(process.cwd(), imageArg) : path.resolve(__dirname, '待识别.jpg');

// 1. OCR 识别部分
async function performOCR() {
    console.log(`Starting OCR on ${IMAGE_PATH}...`);

    if (!fs.existsSync(IMAGE_PATH)) {
        console.error(`Error: Image file not found at ${IMAGE_PATH}`);
        process.exit(1);
    }

    try {
        const worker = await Tesseract.createWorker('chi_sim', 1, {
            langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0',
            logger: m => {
                if (m.status === 'recognizing text') {
                    process.stdout.write(`\rOCR Progress: ${(m.progress * 100).toFixed(0)}%`);
                }
            }
        });

        console.log('\nRecognizing text...');
        const result = await worker.recognize(IMAGE_PATH);
        const {text} = result.data;

        const lines = text.split('\n').map(l => ({text: l}));

        await worker.terminate();

        console.log('\nOCR Complete. Raw text length:', text.length);
        return lines || [];
    } catch (error) {
        console.error('\nOCR Failed:', error);
        return [];
    }
}

// 2. 数据清洗与提取
function parseLines(lines) {
    const candidates = [];
    let bufferName = '';

    // 正则：匹配 http 或 https 开头的 URL
    const urlRegex = /(https?:\/\/[a-zA-Z0-9\.\-\_\/\?\&]+)/;

    for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].text.trim();
        if (!lineText) continue;

        const urlMatch = lineText.match(urlRegex);

        if (urlMatch) {
            const url = urlMatch[1];
            // 如果同一行还有其他文本（且不是简单的符号），可能就是名称
            let name = lineText.replace(url, '').trim();

            // 清理名称中的常见干扰字符
            name = name.replace(/^[.\-_|:：\s]+/, '').replace(/[.\-_|:：\s]+$/, '');

            if (name.length > 1) {
                // 同一行有名称
                candidates.push({name, url});
                bufferName = ''; // 清空 buffer
            } else if (bufferName) {
                // 使用上一行的 buffer 作为名称
                candidates.push({name: bufferName, url});
                bufferName = '';
            } else {
                // 既没有 buffer 也没有同行名称，暂时用域名当名称
                try {
                    const u = new URL(url);
                    candidates.push({name: u.hostname, url});
                } catch (e) {
                    candidates.push({name: 'Unknown', url});
                }
            }
        } else {
            // 如果不是 URL 行，假设它是名称，存入 buffer
            // 忽略太短的行或者看起来像垃圾字符的行
            if (lineText.length > 1 && !/^[.\-_|:：]+$/.test(lineText)) {
                bufferName = lineText;
            }
        }
    }

    return candidates;
}

// 3. 辅助函数
function normalizeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        // Normalize: remove www., trailing slash, protocol
        return u.hostname.toLowerCase().replace(/^www\./, '');
    } catch (e) {
        return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    }
}

async function getExistingHosts() {
    const hosts = new Set();

    // 1. Check JS folder
    if (fs.existsSync(JS_DIR)) {
        const files = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
        const hostRegex = /host\s*:\s*['"]([^'"]+)['"]/;
        for (const file of files) {
            const content = fs.readFileSync(path.join(JS_DIR, file), 'utf-8');
            const hostMatch = content.match(hostRegex);
            if (hostMatch) {
                hosts.add(normalizeUrl(hostMatch[1]));
            }
        }
    }

    // 2. Check existing final_sources.json
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.url) hosts.add(normalizeUrl(item.url));
                });
            }
        } catch (e) {
            console.warn('Warning: Could not parse existing final_sources.json');
        }
    }

    return hosts;
}

async function checkUrl(url) {
    try {
        await axios.get(url, {
            timeout: 5000,
            maxRedirects: 2,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            },
            validateStatus: (status) => status < 400
        });
        return true;
    } catch (e) {
        // console.log(`Debug: Check failed for ${url} - ${e.message}`);
        return false;
    }
}

// 4. 主流程
async function main() {
    // A. 执行 OCR
    const lines = await performOCR();
    const candidates = parseLines(lines);

    console.log(`Extracted ${candidates.length} potential sources from image.`);

    if (candidates.length === 0) {
        console.log('No sources extracted. Exiting.');
        return;
    }

    // B. 对比现有源
    console.log('Scanning existing sources...');
    const existingHosts = await getExistingHosts();
    console.log(`Found ${existingHosts.size} existing hosts (in project + json).`);

    console.log('Comparing and validating candidates...');
    const newValidSources = [];

    // Load existing data to append to
    let finalSources = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            finalSources = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        } catch (e) {
        }
    }

    for (const cand of candidates) {
        // 清理 URL 结尾可能的 OCR 错误（如多余的点）
        let cleanUrl = cand.url.replace(/[.\s]+$/, '');
        // 补全协议
        if (!cleanUrl.startsWith('http')) cleanUrl = 'http://' + cleanUrl;

        const normUrl = normalizeUrl(cleanUrl);

        // Check if already exists
        if (existingHosts.has(normUrl)) {
            console.log(`[SKIP] ${cand.name} (${cleanUrl}) - Already exists.`);
            continue;
        }

        // Check if we already added it in this run (deduplication)
        if (newValidSources.find(s => normalizeUrl(s.url) === normUrl)) {
            continue;
        }

        process.stdout.write(`Checking ${cand.name} (${cleanUrl})... `);
        const isValid = await checkUrl(cleanUrl);
        if (isValid) {
            console.log('VALID');
            const sourceObj = {name: cand.name, url: cleanUrl};
            newValidSources.push(sourceObj);
            finalSources.push(sourceObj); // Add to final list
            existingHosts.add(normUrl); // Add to set to prevent dupes in same run
        } else {
            console.log('INVALID/TIMEOUT');
        }
    }

    console.log('\n=== NEW VALID SOURCES ADDED ===');
    console.log(JSON.stringify(newValidSources, null, 2));

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalSources, null, 2));
    console.log(`\nUpdated ${OUTPUT_FILE} with ${newValidSources.length} new sources.`);
    console.log(`Total sources in file: ${finalSources.length}`);
}

main();
