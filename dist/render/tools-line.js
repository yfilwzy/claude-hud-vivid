import { yellow, green, cyan, dim, segment } from './colors.js';
export function renderToolsLine(ctx) {
    const { tools } = ctx.transcript;
    const useVivid = ctx.config?.style?.useVividSegments ?? false;
    const palette = ctx.config?.style?.palette;
    const runningTools = tools.filter((t) => t.status === 'running');
    const completedTools = tools.filter((t) => t.status === 'completed' || t.status === 'error');
    if (tools.length === 0) {
        // No tools used yet — show placeholder with background
        if (useVivid && palette) {
            return segment('⚒', '等待工具调用...', palette.tools_bg, palette.tools_fg);
        }
        return dim('⚒ 等待工具调用...');
    }
    const parts = [];
    for (const tool of runningTools.slice(-2)) {
        const target = tool.target ? truncatePath(tool.target) : '';
        parts.push(`◐ ${tool.name}${target ? `: ${target}` : ''}`);
    }
    const toolCounts = new Map();
    for (const tool of completedTools) {
        const count = toolCounts.get(tool.name) ?? 0;
        toolCounts.set(tool.name, count + 1);
    }
    const sortedTools = Array.from(toolCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    for (const [name, count] of sortedTools) {
        parts.push(`✓ ${name} ×${count}`);
    }
    if (parts.length === 0) {
        if (useVivid && palette) {
            return segment('⚒', '等待工具调用...', palette.tools_bg, palette.tools_fg);
        }
        return dim('⚒ 等待工具调用...');
    }
    const content = parts.join(' | ');
    if (useVivid && palette) {
        return segment('⚒', content, palette.tools_bg, palette.tools_fg);
    }
    // Fallback: original colored style
    const coloredParts = [];
    for (const tool of runningTools.slice(-2)) {
        const target = tool.target ? truncatePath(tool.target) : '';
        coloredParts.push(`${yellow('◐')} ${cyan(tool.name)}${target ? dim(`: ${target}`) : ''}`);
    }
    for (const [name, count] of sortedTools) {
        coloredParts.push(`${green('✓')} ${name} ${dim(`×${count}`)}`);
    }
    return coloredParts.join(' | ');
}
function truncatePath(path, maxLen = 20) {
    const normalizedPath = path.replace(/\\/g, '/');
    if (normalizedPath.length <= maxLen)
        return normalizedPath;
    const parts = normalizedPath.split('/');
    const filename = parts.pop() || normalizedPath;
    if (filename.length >= maxLen)
        return filename.slice(0, maxLen - 3) + '...';
    return '.../' + filename;
}
//# sourceMappingURL=tools-line.js.map