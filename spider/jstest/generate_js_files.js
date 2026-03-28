import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(__dirname, 'final_sources.json');
const outputDir = path.resolve(__dirname, '../js_todo');

if (!fs.existsSync(inputPath)) {
    console.error('Input file not found');
    process.exit(1);
}

const sources = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

function getType(name) {
    if (name.includes('漫画') || name.includes('动漫')) return {suffix: '[画]', type: '漫画'};
    if (name.includes('小说') || name.includes('书')) return {suffix: '[书]', type: '小说'};
    if (name.includes('听书') || name.includes('FM')) return {suffix: '[听]', type: '听书'};
    return {suffix: '', type: '影视'};
}

function generateTemplate(source) {
    const {name, url} = source;
    const {suffix, type} = getType(name);

    // Determine class_name/class_url placeholder based on type
    let className = '电影&电视剧&综艺&动漫';
    let classUrl = '1&2&3&4';
    if (type === '漫画') {
        className = '连载&完结&日漫&国漫';
        classUrl = 'lianzai&wanjie&riman&guoman';
    } else if (type === '小说') {
        className = '玄幻&修真&都市&历史';
        classUrl = 'xuanhuan&xiuzhen&dushi&lishi';
    }

    const fileName = `${name}${suffix}.js`;

    // Template content
    // Using a minimal DSL-based structure where possible, similar to 蜻蜓FM
    const content = `var rule = {
    title: '${name}',
    host: '${url}',
    url: '/fyclass/fypage.html',
    searchUrl: '/search/wd/**/page/fypage.html',
    searchable: 2,
    quickSearch: 0,
    headers: {
        'User-Agent': 'MOBILE_UA',
    },
    timeout: 5000,
    class_name: '${className}',
    class_url: '${classUrl}',
    play_parse: true,
    lazy: '',
    limit: 6,
    推荐: '.list;a&&title;img&&src;.desc&&Text;a&&href',
    double: true,
    一级: '.list;a&&title;img&&src;.desc&&Text;a&&href',
    二级: '*',
    搜索: '.list;a&&title;img&&src;.desc&&Text;a&&href',
}
`;

    return {fileName, content};
}

console.log(`Generating ${sources.length} sources...`);

let count = 0;
sources.forEach(source => {
    // Handle duplicate names (like 包子漫画) by appending domain part if needed
    // But for now, let's just use the logic in the script or overwrite (user mentioned distinguishing them previously but here we just need a basic script)
    // Actually, I should handle the duplicate name issue mentioned in thought process.
    // Let's check for duplicates in the list first? 
    // The previous step normalized names. If there are duplicates, we might overwrite.
    // Let's just generate.

    const {fileName, content} = generateTemplate(source);
    const filePath = path.join(outputDir, fileName);

    // Check if file exists to avoid accidental overwrite of GOOD sources (though user said these are new)
    // But we might have duplicates within the list itself (e.g. 包子漫画)
    let finalPath = filePath;
    if (fs.existsSync(finalPath)) {
        // If it exists, append domain hint
        const domain = new URL(source.url).hostname.split('.')[1]; // e.g. czmanga
        const ext = path.extname(fileName);
        const base = path.basename(fileName, ext);
        finalPath = path.join(outputDir, `${base}_${domain}${ext}`);
    }

    fs.writeFileSync(finalPath, content);
    console.log(`Generated: ${path.basename(finalPath)}`);
    count++;
});

console.log(`\nDone. Generated ${count} files in ${outputDir}`);
