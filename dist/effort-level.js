import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getClaudeConfigDir } from './claude-config-dir.js';
let cachedEffortLevel = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10000; // 10 seconds
export function readEffortLevel() {
    const now = Date.now();
    if (cachedEffortLevel !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedEffortLevel;
    }
    const homeDir = os.homedir();
    const configDir = getClaudeConfigDir(homeDir);
    const settingsPath = path.join(configDir, 'settings.json');
    const configPath = path.join(homeDir, '.claude', 'config.json');
    for (const filePath of [settingsPath, configPath]) {
        try {
            if (!fs.existsSync(filePath))
                continue;
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            const value = data?.effortLevel;
            if (typeof value === 'string' && value.trim()) {
                cachedEffortLevel = value.trim().toUpperCase();
                cacheTimestamp = now;
                return cachedEffortLevel;
            }
        }
        catch {
            // skip invalid files
        }
    }
    cachedEffortLevel = 'AUTO';
    cacheTimestamp = now;
    return cachedEffortLevel;
}
//# sourceMappingURL=effort-level.js.map