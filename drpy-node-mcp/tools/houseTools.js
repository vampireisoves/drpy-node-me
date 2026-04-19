import fs from "fs-extra";
import path from "path";
import { resolvePath, PROJECT_ROOT } from "../utils/pathHelper.js";
import { decodeDsSource } from "../utils/dsHelper.js";

const DEFAULT_HOUSE_URL = "http://183.87.133.60:5678";

const MIME_MAP = {
    ".js": "text/javascript",
    ".json": "application/json",
    ".html": "text/html",
    ".css": "text/css",
    ".xml": "text/xml",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".py": "text/x-python",
    ".php": "application/x-httpd-php",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".zip": "application/zip",
    ".gz": "application/gzip",
    ".pdf": "application/pdf",
};

function getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return MIME_MAP[ext] || "application/octet-stream";
}

const KNOWN_TAGS = ["ds", "dr2", "catvod", "php", "hipy", "json", "jx", "优", "失效", "密"];
const TYPE_TAGS = ["ds", "catvod", "php", "hipy", "json"];

function detectSourceTypeInfo(filePath, content) {
    const normalized = filePath.replace(/\\/g, "/");
    const ext = path.extname(filePath).toLowerCase();
    let typeTag = "";
    let extraTags = [];

    if (normalized.includes("spider/catvod/") || content.includes("extends Spider") || content.includes("CatSpider")) {
        typeTag = "catvod";
    } else if (normalized.includes("spider/js/")) {
        if (ext === ".php" || content.includes("<?php")) {
            typeTag = "php";
        } else {
            typeTag = "ds";
        }
    } else if (ext === ".php" || content.includes("<?php")) {
        typeTag = "php";
    } else if (ext === ".json") {
        typeTag = "json";
    }

    if (content.includes("hipy") || content.includes("海阔视界") || normalized.includes("hipy")) {
        typeTag = "hipy";
    }

    const fileName = path.basename(filePath, ext);
    if (fileName.includes("[官]") || fileName.includes("[优]")) {
        extraTags.push("优");
    }
    if (content.includes("jx:") || content.includes("parse:") || /解析|jx/i.test(fileName)) {
        if (!typeTag || typeTag === "json") {
            extraTags.push("jx");
        }
    }

    return { typeTag, extraTags };
}

function parseTagsString(tags) {
    if (!tags) return [];
    return String(tags).split(",").map(t => t.trim()).filter(Boolean);
}

function buildAutoTags(filePath, content, userTags) {
    const { typeTag, extraTags } = detectSourceTypeInfo(filePath, content);
    const tagSet = new Set();
    if (typeTag) tagSet.add(typeTag);
    for (const t of extraTags) tagSet.add(t);
    if (userTags) {
        for (const t of parseTagsString(userTags)) tagSet.add(t);
    }
    return Array.from(tagSet);
}

function getHouseConfig() {
    const envPath = resolvePath("config/env.json");
    let config = {};
    try {
        config = JSON.parse(fs.readFileSync(envPath, "utf-8"));
    } catch (e) { }
    return {
        url: (config.HOUSER_URL || process.env.HOUSER_URL || DEFAULT_HOUSE_URL).replace(/\/+$/, ""),
        token: config.HOUSE_TOKEN || process.env.HOUSE_TOKEN || ""
    };
}

async function houseRequest(pathname, options = {}) {
    const { url: baseUrl, token } = getHouseConfig();
    const url = baseUrl + pathname;
    const headers = { ...(options.headers || {}) };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const fetchOptions = {
        method: options.method || "GET",
        headers
    };
    if (options.body) {
        fetchOptions.body = options.body;
    }
    const resp = await fetch(url, fetchOptions);
    const contentType = resp.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
        data = await resp.json();
    } else {
        data = await resp.text();
    }
    return { status: resp.status, data };
}

async function uploadFileToHouse(filePath, endpoint, extraParams = {}) {
    const { url: baseUrl, token } = getHouseConfig();
    const absPath = resolvePath(filePath);
    if (!(await fs.pathExists(absPath))) {
        throw new Error(`File not found: ${filePath}`);
    }
    const fileName = path.basename(absPath);
    const fileContent = await fs.readFile(absPath);
    const formData = new FormData();
    formData.append("file", new Blob([fileContent], { type: getMimeType(fileName) }), fileName);

    const queryString = Object.entries(extraParams)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
    const url = baseUrl + endpoint + (queryString ? `?${queryString}` : "");

    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const resp = await fetch(url, {
        method: "POST",
        headers,
        body: formData
    });
    const respData = await resp.json();
    return { status: resp.status, data: respData };
}

async function replaceFileOnHouse(fileId, filePath) {
    const { url: baseUrl, token } = getHouseConfig();
    const absPath = resolvePath(filePath);
    if (!(await fs.pathExists(absPath))) {
        throw new Error(`File not found: ${filePath}`);
    }
    const fileName = path.basename(absPath);
    const fileContent = await fs.readFile(absPath);
    const formData = new FormData();
    formData.append("file", new Blob([fileContent], { type: getMimeType(fileName) }), fileName);

    const url = `${baseUrl}/api/files/${fileId}/replace`;
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const resp = await fetch(url, {
        method: "PUT",
        headers,
        body: formData
    });
    const respData = await resp.json();
    return { status: resp.status, data: respData };
}

export const house_verify = async () => {
    const { url, token } = getHouseConfig();
    if (!token) {
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    configured: false,
                    message: "HOUSE_TOKEN not configured. Set HOUSE_TOKEN in config/env.json or environment variable to enable repository features."
                }, null, 2)
            }]
        };
    }
    try {
        const { status, data } = await houseRequest("/api/files/list?limit=1");
        if (status === 200) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        configured: true,
                        connected: true,
                        house_url: url,
                        token_valid: true,
                        message: "Repository connection verified successfully."
                    }, null, 2)
                }]
            };
        } else if (status === 401) {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        configured: true,
                        connected: true,
                        house_url: url,
                        token_valid: false,
                        message: "Token is invalid or expired. Please update HOUSE_TOKEN."
                    }, null, 2)
                }]
            };
        } else {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        configured: true,
                        connected: true,
                        house_url: url,
                        token_valid: false,
                        status,
                        message: `Unexpected response: ${status}`,
                        detail: data
                    }, null, 2)
                }]
            };
        }
    } catch (e) {
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    configured: true,
                    connected: false,
                    house_url: url,
                    message: `Connection failed: ${e.message}`
                }, null, 2)
            }]
        };
    }
};

export const house_file = async (args) => {
    const action = args?.action;
    if (!action) {
        return { isError: true, content: [{ type: "text", text: "action is required. Valid actions: list, upload, replace, delete, info, toggle_visibility, update_tags" }] };
    }

    const { token } = getHouseConfig();

    switch (action) {
        case "list": {
            const page = args.page || 1;
            const limit = args.limit || 20;
            const search = args.search || "";
            const tag = args.tag || "";
            const uploader = args.uploader || "";
            let qs = `page=${page}&limit=${limit}`;
            if (search) qs += `&search=${encodeURIComponent(search)}`;
            if (tag) qs += `&tag=${encodeURIComponent(tag)}`;
            if (uploader) qs += `&uploader=${encodeURIComponent(uploader)}`;
            const { status, data } = await houseRequest(`/api/files/list?${qs}`);
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `List failed (${status}): ${JSON.stringify(data)}` }] };
            }
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "upload": {
            if (!token) {
                return { isError: true, content: [{ type: "text", text: "HOUSE_TOKEN not configured. Upload requires authentication." }] };
            }
            const filePath = args.path;
            if (!filePath) {
                return { isError: true, content: [{ type: "text", text: "path is required for upload action." }] };
            }
            const absPath = resolvePath(filePath);
            if (!(await fs.pathExists(absPath))) {
                return { isError: true, content: [{ type: "text", text: `File not found: ${filePath}` }] };
            }

            let rawContent = await fs.readFile(absPath, "utf-8");
            if (filePath.endsWith(".js")) {
                try { rawContent = await decodeDsSource(rawContent); } catch (e) { }
            }

            const { typeTag } = detectSourceTypeInfo(filePath, rawContent);
            const autoTags = buildAutoTags(filePath, rawContent, args.tags);
            const tagsStr = autoTags.join(",");
            const isPublic = args.is_public !== false ? "true" : "false";

            const fileName = path.basename(absPath);
            let shouldReplace = false;
            let replaceId = null;

            if (args.auto_replace !== false && typeTag) {
                try {
                    const { status: lsStatus, data: lsData } = await houseRequest(
                        `/api/files/list?search=${encodeURIComponent(fileName)}&limit=50`
                    );
                    if (lsStatus === 200 && lsData.files && lsData.files.length > 0) {
                        for (const f of lsData.files) {
                            if (f.filename !== fileName) continue;
                            const fileTags = parseTagsString(f.tags);
                            if (fileTags.includes(typeTag)) {
                                shouldReplace = true;
                                replaceId = f.id;
                                break;
                            }
                        }
                    }
                } catch (e) { }
            }

            if (shouldReplace && replaceId) {
                const { status, data } = await replaceFileOnHouse(replaceId, filePath);
                if (status !== 200) {
                    return { isError: true, content: [{ type: "text", text: `Replace failed (${status}): ${JSON.stringify(data)}` }] };
                }
                const existingTags = parseTagsString(data.tags);
                const mergedSet = new Set([...existingTags, ...autoTags]);
                const finalTags = Array.from(mergedSet);
                try {
                    await houseRequest(`/api/files/${data.id}/tags`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tags: finalTags })
                    });
                } catch (e) { }
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            action: "replaced",
                            file_id: data.id,
                            filename: data.filename,
                            old_cid: data.old_cid,
                            new_cid: data.cid,
                            size: data.size,
                            detected_type: typeTag || "unknown",
                            tags: finalTags.join(","),
                            message: `File "${fileName}" replaced (ID: ${data.id}). Type: ${typeTag}. Tags merged.`
                        }, null, 2)
                    }]
                };
            }

            const params = { is_public: isPublic, tags: tagsStr };
            const { status, data } = await uploadFileToHouse(filePath, "/api/files/upload", params);
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `Upload failed (${status}): ${JSON.stringify(data)}` }] };
            }
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        action: "uploaded",
                        file_id: data.id,
                        filename: data.filename,
                        cid: data.cid,
                        size: data.size,
                        is_public: data.is_public,
                        detected_type: typeTag || "unknown",
                        tags: tagsStr,
                        message: `File "${fileName}" uploaded successfully (ID: ${data.id}). Type: ${typeTag || "unknown"}. Tags: ${tagsStr}`
                    }, null, 2)
                }]
            };
        }

        case "replace": {
            if (!token) {
                return { isError: true, content: [{ type: "text", text: "HOUSE_TOKEN not configured. Replace requires authentication." }] };
            }
            const fileId = args.file_id;
            const filePath = args.path;
            if (!fileId || !filePath) {
                return { isError: true, content: [{ type: "text", text: "file_id and path are required for replace action." }] };
            }
            const absPath = resolvePath(filePath);
            let rawContent = "";
            if (await fs.pathExists(absPath)) {
                rawContent = await fs.readFile(absPath, "utf-8");
                if (filePath.endsWith(".js")) {
                    try { rawContent = await decodeDsSource(rawContent); } catch (e) { }
                }
            }
            const { status, data } = await replaceFileOnHouse(fileId, filePath);
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `Replace failed (${status}): ${JSON.stringify(data)}` }] };
            }
            if (rawContent) {
                const autoTags = buildAutoTags(filePath, rawContent, args.tags);
                const existingTags = parseTagsString(data.tags);
                const mergedSet = new Set([...existingTags, ...autoTags]);
                const finalTags = Array.from(mergedSet);
                try {
                    await houseRequest(`/api/files/${data.id}/tags`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ tags: finalTags })
                    });
                } catch (e) { }
            }
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        action: "replaced",
                        file_id: data.id,
                        filename: data.filename,
                        old_cid: data.old_cid,
                        new_cid: data.cid,
                        size: data.size,
                        message: `File replaced successfully.`
                    }, null, 2)
                }]
            };
        }

        case "delete": {
            if (!token) {
                return { isError: true, content: [{ type: "text", text: "HOUSE_TOKEN not configured. Delete requires authentication." }] };
            }
            const fileId = args.file_id;
            if (!fileId) {
                return { isError: true, content: [{ type: "text", text: "file_id is required for delete action." }] };
            }
            const { status, data } = await houseRequest(`/api/files/${fileId}`, { method: "DELETE" });
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `Delete failed (${status}): ${JSON.stringify(data)}` }] };
            }
            return { content: [{ type: "text", text: JSON.stringify({ action: "deleted", file_id: fileId, message: "File deleted successfully." }, null, 2) }] };
        }

        case "info": {
            const cid = args.cid;
            const id = args.file_id;
            if (!cid) {
                return { isError: true, content: [{ type: "text", text: "cid is required for info action." }] };
            }
            let qs = `/api/files/${cid}`;
            if (id) qs += `?id=${id}`;
            const { status, data } = await houseRequest(qs);
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `Info failed (${status}): ${JSON.stringify(data)}` }] };
            }
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "toggle_visibility": {
            if (!token) {
                return { isError: true, content: [{ type: "text", text: "HOUSE_TOKEN not configured. Toggle visibility requires authentication." }] };
            }
            const fileId = args.file_id;
            if (!fileId) {
                return { isError: true, content: [{ type: "text", text: "file_id is required for toggle_visibility action." }] };
            }
            const { status, data } = await houseRequest(`/api/files/${fileId}/toggle-visibility`, { method: "POST" });
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `Toggle visibility failed (${status}): ${JSON.stringify(data)}` }] };
            }
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        case "update_tags": {
            if (!token) {
                return { isError: true, content: [{ type: "text", text: "HOUSE_TOKEN not configured. Update tags requires authentication." }] };
            }
            const fileId = args.file_id;
            const tags = args.tags;
            if (!fileId || !tags) {
                return { isError: true, content: [{ type: "text", text: "file_id and tags (array of strings) are required for update_tags action." }] };
            }
            const tagArr = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim()).filter(Boolean);
            const { status, data } = await houseRequest(`/api/files/${fileId}/tags`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: tagArr })
            });
            if (status !== 200) {
                return { isError: true, content: [{ type: "text", text: `Update tags failed (${status}): ${JSON.stringify(data)}` }] };
            }
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        default:
            return { isError: true, content: [{ type: "text", text: `Unknown action: ${action}. Valid actions: list, upload, replace, delete, info, toggle_visibility, update_tags` }] };
    }
};
