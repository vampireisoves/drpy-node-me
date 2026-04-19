import fs from "fs-extra";
import vm from "vm";
import { resolvePath, isSafePath } from "../utils/pathHelper.js";
import { decodeDsSource } from "../utils/dsHelper.js";

const MAX_AFFECTED_LINES = 200;

const BLOCKED_EXTENSIONS = ['.md', '.txt', '.rst', '.adoc', '.doc', '.docx', '.pdf'];
const BLOCKED_MESSAGE = (ext) =>
    `此工具禁止操作 ${ext} 文件！drpy-node MCP 文件工具仅用于项目代码文件（.js/.json/.css/.html 等）。` +
    `创建或编辑文档/README/笔记等文件请使用 IDE 内置的 Write 或 Edit 工具。`;

function checkBlockedExtension(filePath) {
    const lower = filePath.toLowerCase();
    for (const ext of BLOCKED_EXTENSIONS) {
        if (lower.endsWith(ext)) {
            throw new Error(BLOCKED_MESSAGE(ext));
        }
    }
}

export const list_directory = async (args) => {
    const dirPath = args?.path || ".";
    if (!isSafePath(dirPath)) {
        throw new Error("Access denied");
    }
    const fullPath = resolvePath(dirPath);
    const files = await fs.readdir(fullPath, { withFileTypes: true });
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    files.map((f) => ({
                        name: f.name,
                        isDirectory: f.isDirectory(),
                    })),
                    null,
                    2
                ),
            },
        ],
    };
};

export const read_file = async (args) => {
    const filePath = args?.path;
    if (!filePath || !isSafePath(filePath)) {
        throw new Error("Invalid path");
    }

    // Check if it's an image file
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff', '.tif'];
    const isImage = imageExts.some(ext => filePath.toLowerCase().endsWith(ext));

    if (isImage) {
        // Read as buffer and convert to base64
        const buffer = await fs.readFile(resolvePath(filePath));
        const base64 = buffer.toString('base64');
        // Get mime type
        const ext = filePath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'tif': 'image/tiff'
        };
        const mimeType = mimeTypes[ext] || 'image/png';

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        type: 'image',
                        mimeType,
                        dataUrl: `data:${mimeType};base64,${base64}`
                    }),
                },
            ],
        };
    }

    // Read as text for non-image files
    let content = await fs.readFile(resolvePath(filePath), "utf-8");

    // Attempt to decode if it's a JS file (for DS sources)
    if (filePath.endsWith('.js')) {
         content = await decodeDsSource(content);
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    type: 'text',
                    content
                }),
            },
        ],
    };
};

export const write_file = async (args) => {
    const filePath = args?.path;
    const content = args?.content;
    if (!filePath || !isSafePath(filePath)) {
        throw new Error("Invalid path");
    }
    checkBlockedExtension(filePath);
    await fs.outputFile(resolvePath(filePath), content);
    return {
        content: [
            {
                type: "text",
                text: `Successfully wrote to ${filePath}`,
            },
        ],
    };
};

export const delete_file = async (args) => {
    const filePath = args?.path;
    if (!filePath || !isSafePath(filePath)) {
        throw new Error("Invalid path");
    }
    await fs.remove(resolvePath(filePath));
    return {
        content: [
            {
                type: "text",
                text: `Successfully deleted ${filePath}`,
            },
        ],
    };
};

function validateJsSyntax(code, filePath) {
    try {
        let checkCode = code;
        if (filePath.endsWith('.js')) {
            checkCode = decodeDsSource.sync ? decodeDsSource.sync(code) : code;
        }
        new vm.Script(checkCode);
        return null;
    } catch (e) {
        return e.message;
    }
}

async function validateJsSyntaxAsync(code, filePath) {
    try {
        let checkCode = code;
        if (filePath.endsWith('.js')) {
            checkCode = await decodeDsSource(code);
        }
        new vm.Script(checkCode);
        return null;
    } catch (e) {
        return e.message;
    }
}

export const edit_file = async (args) => {
    const filePath = args?.path;
    let operation = args?.operation;

    if (!filePath || !isSafePath(filePath)) {
        throw new Error("Invalid path");
    }

    if (!operation && Array.isArray(args?.edits) && args.edits.length > 0) {
        const firstEdit = args.edits[0];
        operation = firstEdit.operation;
        args = { ...args, ...firstEdit };
    }

    if (!operation) {
        throw new Error("operation is required");
    }

    checkBlockedExtension(filePath);

    const fullPath = resolvePath(filePath);

    if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File not found: ${filePath}`);
    }

    let content = await fs.readFile(fullPath, "utf-8");
    const originalContent = content;
    let summary = "";

    if (operation === "replace_text") {
        const { search, replacement } = args;
        if (!search) {
            throw new Error("replace_text requires 'search' parameter");
        }
        const idx = content.indexOf(search);
        if (idx === -1) {
            throw new Error(`Text not found: "${search.substring(0, 100)}${search.length > 100 ? '...' : ''}"`);
        }
        const secondIdx = content.indexOf(search, idx + 1);
        if (secondIdx !== -1) {
            const lineNum = content.substring(0, idx).split("\n").length;
            const lineNum2 = content.substring(0, secondIdx).split("\n").length;
            throw new Error(
                `Search text has ${2} matches (at line ${lineNum} and line ${lineNum2}). ` +
                `Refusing to replace — use more specific/longer search text to uniquely identify the target. ` +
                `You can use find_in_file to locate the exact text.`
            );
        }
        content = content.substring(0, idx) + (replacement || "") + content.substring(idx + search.length);
        summary = `Replaced text match at position ${idx} (${search.length} chars → ${(replacement || "").length} chars)`;
    } else if (operation === "replace_lines") {
        const { start_line, end_line, content: newContent } = args;
        if (!start_line || start_line < 1) {
            throw new Error("replace_lines requires start_line >= 1");
        }
        const lines = content.split("\n");
        if (start_line > lines.length) {
            throw new Error(`start_line ${start_line} out of range (1-${lines.length})`);
        }
        const end = Math.min(end_line || start_line, lines.length);
        if (end < start_line) {
            throw new Error(`end_line ${end} < start_line ${start_line}`);
        }
        const affectedCount = end - start_line + 1;
        if (affectedCount > MAX_AFFECTED_LINES) {
            throw new Error(
                `replace_lines would affect ${affectedCount} lines (max ${MAX_AFFECTED_LINES}). ` +
                `For large-scale changes, use replace_text with specific search text, or use write_file to rewrite the entire file.`
            );
        }
        const newLines = (newContent || "").split("\n");
        lines.splice(start_line - 1, end - start_line + 1, ...newLines);
        content = lines.join("\n");
        summary = `Replaced lines ${start_line}-${end} with ${newLines.length} line(s)`;
    } else if (operation === "delete_lines") {
        const { start_line, end_line } = args;
        if (!start_line || start_line < 1) {
            throw new Error("delete_lines requires start_line >= 1");
        }
        const lines = content.split("\n");
        if (start_line > lines.length) {
            throw new Error(`start_line ${start_line} out of range (1-${lines.length})`);
        }
        const end = Math.min(end_line || start_line, lines.length);
        const count = end - start_line + 1;
        if (count > MAX_AFFECTED_LINES) {
            throw new Error(
                `delete_lines would delete ${count} lines (max ${MAX_AFFECTED_LINES}). ` +
                `For large-scale deletions, use write_file to rewrite the entire file.`
            );
        }
        lines.splice(start_line - 1, count);
        content = lines.join("\n");
        summary = `Deleted lines ${start_line}-${end} (${count} line(s))`;
    } else if (operation === "insert_lines") {
        const { start_line, content: newContent } = args;
        if (start_line === undefined || start_line < 0) {
            throw new Error("insert_lines requires start_line >= 0");
        }
        const lines = content.split("\n");
        if (start_line > lines.length) {
            throw new Error(`start_line ${start_line} out of range (0-${lines.length})`);
        }
        const newLines = (newContent || "").split("\n");
        if (newLines.length > MAX_AFFECTED_LINES) {
            throw new Error(
                `insert_lines would insert ${newLines.length} lines (max ${MAX_AFFECTED_LINES}). ` +
                `For large-scale insertions, use write_file to rewrite the entire file.`
            );
        }
        lines.splice(start_line, 0, ...newLines);
        const insertPos = start_line === 0 ? "at beginning" : `after line ${start_line}`;
        summary = `Inserted ${newLines.length} line(s) ${insertPos}`;
    } else {
        throw new Error(`Unknown operation: ${operation}`);
    }

    const isJsFile = filePath.endsWith('.js');
    if (isJsFile) {
        const syntaxError = await validateJsSyntaxAsync(content, filePath);
        if (syntaxError) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: "JS_SYNTAX_CHECK_FAILED",
                            message: `Edit would break JS syntax! File NOT modified. Original content preserved.`,
                            syntaxError: syntaxError,
                            file: filePath,
                            operation: summary,
                            suggestion: "Please review your edit. The resulting code has syntax errors. Try using replace_text with more specific search text, or use find_in_file to locate the exact code to modify.",
                        }, null, 2),
                    },
                ],
            };
        }
    }

    await fs.writeFile(fullPath, content, "utf-8");

    const diffLines = [];
    const origLines = originalContent.split("\n");
    const newLines = content.split("\n");
    const maxLen = Math.max(origLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
        const o = origLines[i];
        const n = newLines[i];
        if (o !== n) {
            if (o === undefined) {
                diffLines.push({ line: i + 1, type: "added", content: n });
            } else if (n === undefined) {
                diffLines.push({ line: i + 1, type: "removed", content: o });
            } else {
                diffLines.push({ line: i + 1, type: "changed", old: o, new: n });
            }
        }
    }

    const diffSummary = diffLines.length > 50
        ? diffLines.slice(0, 50).concat([{ line: "...", type: "truncated", content: `${diffLines.length - 50} more changes` }])
        : diffLines;

    const result = {
        file: filePath,
        operation: summary,
        changes: diffLines.length,
        diff: diffSummary,
    };

    if (isJsFile) {
        result.syntaxCheck = "PASSED";
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
};

export const find_in_file = async (args) => {
    const filePath = args?.path;
    const keyword = args?.keyword;
    const useRegex = args?.regex || false;
    const contextLines = args?.surrounding_lines ?? 2;
    const maxMatches = args?.max_matches ?? 20;

    if (!filePath || !isSafePath(filePath)) {
        throw new Error("Invalid path");
    }
    if (!keyword) {
        throw new Error("keyword is required");
    }

    const fullPath = resolvePath(filePath);
    if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File not found: ${filePath}`);
    }

    let content = await fs.readFile(fullPath, "utf-8");
    if (filePath.endsWith('.js')) {
        content = await decodeDsSource(content);
    }

    const lines = content.split("\n");
    let pattern;
    if (useRegex) {
        try {
            pattern = new RegExp(keyword);
        } catch (e) {
            throw new Error(`Invalid regex: ${e.message}`);
        }
    }

    const matches = [];
    for (let i = 0; i < lines.length; i++) {
        const isMatch = useRegex ? pattern.test(lines[i]) : lines[i].includes(keyword);
        if (isMatch) {
            const start = Math.max(0, i - contextLines);
            const end = Math.min(lines.length - 1, i + contextLines);
            const contextArr = [];
            for (let j = start; j <= end; j++) {
                contextArr.push({
                    line: j + 1,
                    content: lines[j],
                    isMatch: j === i,
                });
            }
            matches.push({
                line: i + 1,
                text: lines[i],
                context: contextArr,
            });
            if (matches.length >= maxMatches) break;
        }
    }

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    file: filePath,
                    keyword,
                    regex: useRegex,
                    total_lines: lines.length,
                    matches: matches.length,
                    results: matches,
                }, null, 2),
            },
        ],
    };
};
