import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { getHudPluginDir } from './claude-config-dir.js';
export const DEFAULT_ELEMENT_ORDER = [
    'project',
    'context',
    'usage',
    'environment',
    'tools',
    'agents',
    'todos',
];
const KNOWN_ELEMENTS = new Set(DEFAULT_ELEMENT_ORDER);
export const DEFAULT_VIVID_PALETTE = {
    // Line 1: Model — 深钴蓝，科技感
    model_bg: '\x1b[48;5;25m',
    model_fg: '\x1b[38;5;255m',
    // Line 2: Workdir — 深琥珀，温暖路径感
    dir_bg: '\x1b[48;5;130m',
    dir_fg: '\x1b[38;5;255m',
    // Line 1: Git — 深青色，版本控制
    git_bg: '\x1b[48;5;30m',
    git_fg: '\x1b[38;5;255m',
    // Line 1: Effort — 暗紫，能力等级
    effort_bg: '\x1b[48;5;97m',
    effort_fg: '\x1b[38;5;255m',
    // Line 3: Context — 深石墨灰
    ctx_bg: '\x1b[48;5;237m',
    ctx_fg: '\x1b[38;5;255m',
    // Line 4: Environment — 深靛蓝，配置信息
    env_bg: '\x1b[48;5;24m',
    env_fg: '\x1b[38;5;255m',
    // Line 5: Tools — 深翡翠绿，工具活动
    tools_bg: '\x1b[48;5;28m',
    tools_fg: '\x1b[38;5;255m',
    // Line 7: Todos — 深酒红，任务紧迫感
    task_bg: '\x1b[48;5;88m',
    task_fg: '\x1b[38;5;255m',
    // Line 6: Agent — 深紫罗兰，Agent 智能感
    agent_bg: '\x1b[48;5;54m',
    agent_fg: '\x1b[38;5;255m',
    // Line 1: Session name — 深板岩灰
    session_bg: '\x1b[48;5;239m',
    session_fg: '\x1b[38;5;252m',
    // Line 1: Duration — 深橄榄
    duration_bg: '\x1b[48;5;58m',
    duration_fg: '\x1b[38;5;255m',
    // Line 1: Speed — 深青灰
    speed_bg: '\x1b[48;5;23m',
    speed_fg: '\x1b[38;5;255m',
};
export const DEFAULT_CONFIG = {
    lineLayout: 'expanded',
    showSeparators: false,
    pathLevels: 1,
    elementOrder: [...DEFAULT_ELEMENT_ORDER],
    gitStatus: {
        enabled: true,
        showDirty: true,
        showAheadBehind: false,
        showFileStats: false,
    },
    display: {
        showModel: true,
        showProject: true,
        showContextBar: true,
        contextValue: 'percent',
        showConfigCounts: false,
        showDuration: false,
        showSpeed: false,
        showTokenBreakdown: true,
        showUsage: true,
        usageBarEnabled: true,
        showTools: false,
        showAgents: false,
        showTodos: false,
        showSessionName: false,
        autocompactBuffer: 'enabled',
        usageThreshold: 0,
        sevenDayThreshold: 80,
        environmentThreshold: 0,
        customLine: '',
        showEffortLevel: true,
        showMainAgent: true,
        agentMaxDisplay: 5,
        todoStyle: 'chinese',
        showTokenCount: true,
    },
    style: {
        useVividSegments: true,
        palette: { ...DEFAULT_VIVID_PALETTE },
    },
    usage: {
        cacheTtlSeconds: 60,
        failureCacheTtlSeconds: 15,
    },
    colors: {
        context: 'green',
        usage: 'brightBlue',
        warning: 'yellow',
        usageWarning: 'brightMagenta',
        critical: 'red',
    },
};
export function getConfigPath() {
    const homeDir = os.homedir();
    return path.join(getHudPluginDir(homeDir), 'config.json');
}
function validatePathLevels(value) {
    return value === 1 || value === 2 || value === 3;
}
function validateLineLayout(value) {
    return value === 'compact' || value === 'expanded';
}
function validateAutocompactBuffer(value) {
    return value === 'enabled' || value === 'disabled';
}
function validateContextValue(value) {
    return value === 'percent' || value === 'tokens' || value === 'remaining';
}
function validateColorName(value) {
    return value === 'red'
        || value === 'green'
        || value === 'yellow'
        || value === 'magenta'
        || value === 'cyan'
        || value === 'brightBlue'
        || value === 'brightMagenta';
}
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
function validateColorValue(value) {
    if (validateColorName(value))
        return true;
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255)
        return true;
    if (typeof value === 'string' && HEX_COLOR_PATTERN.test(value))
        return true;
    return false;
}
function validateElementOrder(value) {
    if (!Array.isArray(value) || value.length === 0) {
        return [...DEFAULT_ELEMENT_ORDER];
    }
    const seen = new Set();
    const elementOrder = [];
    for (const item of value) {
        if (typeof item !== 'string' || !KNOWN_ELEMENTS.has(item)) {
            continue;
        }
        const element = item;
        if (seen.has(element)) {
            continue;
        }
        seen.add(element);
        elementOrder.push(element);
    }
    return elementOrder.length > 0 ? elementOrder : [...DEFAULT_ELEMENT_ORDER];
}
function migrateConfig(userConfig) {
    const migrated = { ...userConfig };
    if ('layout' in userConfig && !('lineLayout' in userConfig)) {
        if (typeof userConfig.layout === 'string') {
            // Legacy string migration (v0.0.x → v0.1.x)
            if (userConfig.layout === 'separators') {
                migrated.lineLayout = 'compact';
                migrated.showSeparators = true;
            }
            else {
                migrated.lineLayout = 'compact';
                migrated.showSeparators = false;
            }
        }
        else if (typeof userConfig.layout === 'object' && userConfig.layout !== null) {
            // Object layout written by third-party tools — extract nested fields
            const obj = userConfig.layout;
            if (typeof obj.lineLayout === 'string')
                migrated.lineLayout = obj.lineLayout;
            if (typeof obj.showSeparators === 'boolean')
                migrated.showSeparators = obj.showSeparators;
            if (typeof obj.pathLevels === 'number')
                migrated.pathLevels = obj.pathLevels;
        }
        delete migrated.layout;
    }
    return migrated;
}
function validateThreshold(value, max = 100) {
    if (typeof value !== 'number')
        return 0;
    return Math.max(0, Math.min(max, value));
}
function validatePositiveInt(value, defaultValue) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0)
        return defaultValue;
    return value;
}
function validateTodoStyle(value) {
    return value === 'chinese' || value === 'english';
}
export function mergeConfig(userConfig) {
    const migrated = migrateConfig(userConfig);
    const lineLayout = validateLineLayout(migrated.lineLayout)
        ? migrated.lineLayout
        : DEFAULT_CONFIG.lineLayout;
    const showSeparators = typeof migrated.showSeparators === 'boolean'
        ? migrated.showSeparators
        : DEFAULT_CONFIG.showSeparators;
    const pathLevels = validatePathLevels(migrated.pathLevels)
        ? migrated.pathLevels
        : DEFAULT_CONFIG.pathLevels;
    const elementOrder = validateElementOrder(migrated.elementOrder);
    const gitStatus = {
        enabled: typeof migrated.gitStatus?.enabled === 'boolean'
            ? migrated.gitStatus.enabled
            : DEFAULT_CONFIG.gitStatus.enabled,
        showDirty: typeof migrated.gitStatus?.showDirty === 'boolean'
            ? migrated.gitStatus.showDirty
            : DEFAULT_CONFIG.gitStatus.showDirty,
        showAheadBehind: typeof migrated.gitStatus?.showAheadBehind === 'boolean'
            ? migrated.gitStatus.showAheadBehind
            : DEFAULT_CONFIG.gitStatus.showAheadBehind,
        showFileStats: typeof migrated.gitStatus?.showFileStats === 'boolean'
            ? migrated.gitStatus.showFileStats
            : DEFAULT_CONFIG.gitStatus.showFileStats,
    };
    const display = {
        showModel: typeof migrated.display?.showModel === 'boolean'
            ? migrated.display.showModel
            : DEFAULT_CONFIG.display.showModel,
        showProject: typeof migrated.display?.showProject === 'boolean'
            ? migrated.display.showProject
            : DEFAULT_CONFIG.display.showProject,
        showContextBar: typeof migrated.display?.showContextBar === 'boolean'
            ? migrated.display.showContextBar
            : DEFAULT_CONFIG.display.showContextBar,
        contextValue: validateContextValue(migrated.display?.contextValue)
            ? migrated.display.contextValue
            : DEFAULT_CONFIG.display.contextValue,
        showConfigCounts: typeof migrated.display?.showConfigCounts === 'boolean'
            ? migrated.display.showConfigCounts
            : DEFAULT_CONFIG.display.showConfigCounts,
        showDuration: typeof migrated.display?.showDuration === 'boolean'
            ? migrated.display.showDuration
            : DEFAULT_CONFIG.display.showDuration,
        showSpeed: typeof migrated.display?.showSpeed === 'boolean'
            ? migrated.display.showSpeed
            : DEFAULT_CONFIG.display.showSpeed,
        showTokenBreakdown: typeof migrated.display?.showTokenBreakdown === 'boolean'
            ? migrated.display.showTokenBreakdown
            : DEFAULT_CONFIG.display.showTokenBreakdown,
        showUsage: typeof migrated.display?.showUsage === 'boolean'
            ? migrated.display.showUsage
            : DEFAULT_CONFIG.display.showUsage,
        usageBarEnabled: typeof migrated.display?.usageBarEnabled === 'boolean'
            ? migrated.display.usageBarEnabled
            : DEFAULT_CONFIG.display.usageBarEnabled,
        showTools: typeof migrated.display?.showTools === 'boolean'
            ? migrated.display.showTools
            : DEFAULT_CONFIG.display.showTools,
        showAgents: typeof migrated.display?.showAgents === 'boolean'
            ? migrated.display.showAgents
            : DEFAULT_CONFIG.display.showAgents,
        showTodos: typeof migrated.display?.showTodos === 'boolean'
            ? migrated.display.showTodos
            : DEFAULT_CONFIG.display.showTodos,
        showSessionName: typeof migrated.display?.showSessionName === 'boolean'
            ? migrated.display.showSessionName
            : DEFAULT_CONFIG.display.showSessionName,
        autocompactBuffer: validateAutocompactBuffer(migrated.display?.autocompactBuffer)
            ? migrated.display.autocompactBuffer
            : DEFAULT_CONFIG.display.autocompactBuffer,
        usageThreshold: validateThreshold(migrated.display?.usageThreshold, 100),
        sevenDayThreshold: validateThreshold(migrated.display?.sevenDayThreshold, 100),
        environmentThreshold: validateThreshold(migrated.display?.environmentThreshold, 100),
        customLine: typeof migrated.display?.customLine === 'string'
            ? migrated.display.customLine.slice(0, 80)
            : DEFAULT_CONFIG.display.customLine,
        showEffortLevel: typeof migrated.display?.showEffortLevel === 'boolean'
            ? migrated.display.showEffortLevel
            : DEFAULT_CONFIG.display.showEffortLevel,
        showMainAgent: typeof migrated.display?.showMainAgent === 'boolean'
            ? migrated.display.showMainAgent
            : DEFAULT_CONFIG.display.showMainAgent,
        agentMaxDisplay: validatePositiveInt(migrated.display?.agentMaxDisplay, DEFAULT_CONFIG.display.agentMaxDisplay),
        todoStyle: validateTodoStyle(migrated.display?.todoStyle)
            ? migrated.display.todoStyle
            : DEFAULT_CONFIG.display.todoStyle,
        showTokenCount: typeof migrated.display?.showTokenCount === 'boolean'
            ? migrated.display.showTokenCount
            : DEFAULT_CONFIG.display.showTokenCount,
    };
    const usage = {
        cacheTtlSeconds: validatePositiveInt(migrated.usage?.cacheTtlSeconds, DEFAULT_CONFIG.usage.cacheTtlSeconds),
        failureCacheTtlSeconds: validatePositiveInt(migrated.usage?.failureCacheTtlSeconds, DEFAULT_CONFIG.usage.failureCacheTtlSeconds),
    };
    const style = {
        useVividSegments: typeof migrated.style?.useVividSegments === 'boolean'
            ? migrated.style.useVividSegments
            : DEFAULT_CONFIG.style.useVividSegments,
        palette: {
            ...DEFAULT_VIVID_PALETTE,
            ...(migrated.style?.palette ?? {}),
        },
    };
    const colors = {
        context: validateColorValue(migrated.colors?.context)
            ? migrated.colors.context
            : DEFAULT_CONFIG.colors.context,
        usage: validateColorValue(migrated.colors?.usage)
            ? migrated.colors.usage
            : DEFAULT_CONFIG.colors.usage,
        warning: validateColorValue(migrated.colors?.warning)
            ? migrated.colors.warning
            : DEFAULT_CONFIG.colors.warning,
        usageWarning: validateColorValue(migrated.colors?.usageWarning)
            ? migrated.colors.usageWarning
            : DEFAULT_CONFIG.colors.usageWarning,
        critical: validateColorValue(migrated.colors?.critical)
            ? migrated.colors.critical
            : DEFAULT_CONFIG.colors.critical,
    };
    return { lineLayout, showSeparators, pathLevels, elementOrder, gitStatus, display, style, usage, colors };
}
export async function loadConfig() {
    const configPath = getConfigPath();
    try {
        if (!fs.existsSync(configPath)) {
            return DEFAULT_CONFIG;
        }
        const content = fs.readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(content);
        return mergeConfig(userConfig);
    }
    catch {
        return DEFAULT_CONFIG;
    }
}
//# sourceMappingURL=config.js.map