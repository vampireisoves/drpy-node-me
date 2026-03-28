import { execFile } from 'child_process';
import { promisify } from 'util';
import { prepareBinary } from './binHelper.js';

const execFileAsync = promisify(execFile);

export let isPhpAvailable = false;

export const checkPhpAvailable = async () => {
    let phpPath = process.env.PHP_PATH || 'php';
    
    // Check existence and permissions
    const validPath = prepareBinary(phpPath);
    if (!validPath) {
        console.warn(`⚠️ PHP binary not found or invalid: ${phpPath}`);
        isPhpAvailable = false;
        return false;
    }
    phpPath = validPath;

    try {
        console.log(`[phpEnv] Verifying PHP executable: ${phpPath}`);
        await execFileAsync(phpPath, ['-v']);
        isPhpAvailable = true;
        console.log(`✅ PHP environment check passed (${phpPath}).`);
    } catch (e) {
        isPhpAvailable = false;
        console.warn(`⚠️ PHP environment check failed. PHP features will be disabled.`);
        console.warn(`[phpEnv] Error details:`, e.message);
        // console.error(e);
    }
    return isPhpAvailable;
};
