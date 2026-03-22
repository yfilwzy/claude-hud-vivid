import { getContextPercent, getBufferedPercent, getTotalTokens } from '../../stdin.js';
import { coloredBar, dim, getContextColor, formatCompactNumber, RESET } from '../colors.js';
import { getAdaptiveBarWidth } from '../../utils/terminal.js';
const DEBUG = process.env.DEBUG?.includes('claude-hud') || process.env.DEBUG === '*';
export function renderIdentityLine(ctx) {
    const rawPercent = getContextPercent(ctx.stdin);
    const bufferedPercent = getBufferedPercent(ctx.stdin);
    const autocompactMode = ctx.config?.display?.autocompactBuffer ?? 'enabled';
    const percent = autocompactMode === 'disabled' ? rawPercent : bufferedPercent;
    const colors = ctx.config?.colors;
    if (DEBUG && autocompactMode === 'disabled') {
        console.error(`[claude-hud:context] autocompactBuffer=disabled, showing raw ${rawPercent}% (buffered would be ${bufferedPercent}%)`);
    }
    const display = ctx.config?.display;
    const useVivid = ctx.config?.style?.useVividSegments ?? false;
    const palette = ctx.config?.style?.palette;
    const contextValueMode = display?.contextValue ?? 'percent';
    const contextValue = formatContextValue(ctx, percent, contextValueMode);
    // Token count in compact format
    const showTokenCount = display?.showTokenCount ?? true;
    const totalTokens = getTotalTokens(ctx.stdin);
    const windowSize = ctx.stdin.context_window?.context_window_size ?? 0;
    let tokenPart = '';
    if (showTokenCount && windowSize > 0) {
        tokenPart = ` · ${formatCompactNumber(totalTokens)}/${formatCompactNumber(windowSize)}`;
    }
    const barWidth = getAdaptiveBarWidth();
    if (useVivid && palette) {
        // Build entire line under continuous background — no RESET until end
        const bg = palette.ctx_bg;
        const fg = palette.ctx_fg;
        const barStr = display?.showContextBar !== false ? ` ${vividBar(percent, barWidth, bg)}` : '';
        return `${bg}${fg} CTX ◈ ${contextValue}${tokenPart}${barStr}${bg} ${RESET}`;
    }
    // Original style
    const contextValueDisplay = `${getContextColor(percent, colors)}${contextValue}${RESET}`;
    let line = display?.showContextBar !== false
        ? `${dim('Context')} ${coloredBar(percent, barWidth, colors)} ${contextValueDisplay}`
        : `${dim('Context')} ${contextValueDisplay}`;
    if (tokenPart) {
        line += dim(tokenPart);
    }
    if (display?.showTokenBreakdown !== false && percent >= 85) {
        const usage = ctx.stdin.context_window?.current_usage;
        if (usage) {
            const input = formatTokens(usage.input_tokens ?? 0);
            const cache = formatTokens((usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0));
            line += dim(` (in: ${input}, cache: ${cache})`);
        }
    }
    return line;
}
/**
 * Build a progress bar that does NOT reset background color.
 * Only changes foreground, so the segment bg stays continuous.
 */
function vividBar(percent, width, bg) {
    const safePercent = Math.min(100, Math.max(0, percent));
    const filled = Math.round((safePercent / 100) * width);
    const empty = width - filled;
    const fgColor = safePercent >= 85 ? '\x1b[31m' : safePercent >= 70 ? '\x1b[33m' : '\x1b[32m';
    // After bar, restore segment bg so background continues
    return `${fgColor}${'█'.repeat(filled)}\x1b[2m${'░'.repeat(empty)}`;
}
function formatTokens(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
}
function formatContextValue(ctx, percent, mode) {
    if (mode === 'tokens') {
        const totalTokens = getTotalTokens(ctx.stdin);
        const size = ctx.stdin.context_window?.context_window_size ?? 0;
        if (size > 0)
            return `${formatTokens(totalTokens)}/${formatTokens(size)}`;
        return formatTokens(totalTokens);
    }
    if (mode === 'remaining')
        return `${Math.max(0, 100 - percent)}%`;
    return `${percent}%`;
}
//# sourceMappingURL=identity.js.map