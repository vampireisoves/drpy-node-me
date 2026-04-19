import { getOriginalJs } from '../../libs_drpy/drpyCustom.js';

/**
 * Decode DS source code (encrypted JS) to plaintext
 * @param {string} content - Encrypted content
 * @returns {Promise<string>} - Decoded content
 */
export async function decodeDsSource(content) {
    try {
        // First try the standard drpy method
        let result = await getOriginalJs(content);
        
        // Check if result is still seemingly encrypted (starts with comment or looks like base64)
        // A simple check: if it contains "var rule" or "export default", it's likely decoded.
        // If it starts with "/*" and has no "var rule", it might still be encrypted.
        if (result.includes('var rule') || result.includes('export default')) {
            return result;
        }
        
        // Fallback: Manual decoding if getOriginalJs returned original or failed to decode
        // 1. Remove comments
        let cleanContent = content.replace(/\/\*[\s\S]*?\*\//, '').trim();
        
        // 2. Try Base64 decode
        try {
             // Check if it looks like base64 (no spaces, alphanumeric + +/=)
             if (/^[A-Za-z0-9+/=]+$/.test(cleanContent)) {
                 const decoded = Buffer.from(cleanContent, 'base64').toString('utf-8');
                 if (decoded.includes('var rule') || decoded.includes('function')) {
                     return decoded;
                 }
             }
        } catch (e) {
            // Ignore base64 error
        }
        
        return result;
    } catch (error) {
        console.error('Error decoding DS source:', error);
        
        // Fallback in catch block as well
        try {
            let cleanContent = content.replace(/\/\*[\s\S]*?\*\//, '').trim();
            const decoded = Buffer.from(cleanContent, 'base64').toString('utf-8');
            if (decoded.includes('var rule')) {
                return decoded;
            }
        } catch (e) {}
        
        return content; // Return original if all fails
    }
}
