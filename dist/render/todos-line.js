import { yellow, green, dim, segment } from './colors.js';
export function renderTodosLine(ctx) {
    const { todos } = ctx.transcript;
    const display = ctx.config?.display;
    const todoStyle = display?.todoStyle ?? 'chinese';
    const useVivid = ctx.config?.style?.useVividSegments ?? false;
    const palette = ctx.config?.style?.palette;
    if (!todos || todos.length === 0) {
        // No todos — show placeholder with background
        if (useVivid && palette) {
            return segment('☰', '暂无任务', palette.task_bg, palette.task_fg);
        }
        return dim('☰ 暂无任务');
    }
    const inProgressItems = todos.filter((t) => t.status === 'in_progress');
    const pendingItems = todos.filter((t) => t.status === 'pending');
    const completedCount = todos.filter((t) => t.status === 'completed').length;
    const total = todos.length;
    if (todoStyle === 'chinese') {
        return renderChineseStyle(inProgressItems, pendingItems, completedCount, total, useVivid, palette);
    }
    return renderEnglishStyle(inProgressItems, completedCount, total, useVivid, palette);
}
function renderChineseStyle(inProgressItems, pendingItems, completedCount, total, useVivid, palette) {
    const inCount = inProgressItems.length;
    const pendCount = pendingItems.length;
    const headline = `进${inCount} 待${pendCount} 完${completedCount}`;
    const previewItems = [...inProgressItems, ...pendingItems].slice(0, 2);
    const previews = previewItems.map((item) => {
        const statusLabel = item.status === 'in_progress' ? '进行中' : '待办';
        return `${truncateContent(item.content, 25)}(${statusLabel})`;
    });
    const previewStr = previews.length > 0 ? ` | ${previews.join(' | ')}` : '';
    if (useVivid && palette) {
        return segment('☰', `${headline}${previewStr}`, palette.task_bg, palette.task_fg);
    }
    return `${yellow('☰')} ${headline}${previewStr ? dim(previewStr) : ''}`;
}
function renderEnglishStyle(inProgressItems, completedCount, total, useVivid, palette) {
    if (completedCount === total && total > 0) {
        const content = `All todos complete (${completedCount}/${total})`;
        if (useVivid && palette) {
            return segment('✓', content, palette.task_bg, palette.task_fg);
        }
        return `${green('✓')} ${content}`;
    }
    const inProgress = inProgressItems[0];
    if (!inProgress) {
        if (useVivid && palette) {
            return segment('☰', `${completedCount}/${total} done`, palette.task_bg, palette.task_fg);
        }
        return dim(`☰ ${completedCount}/${total} done`);
    }
    const content = `${truncateContent(inProgress.content, 50)} (${completedCount}/${total})`;
    if (useVivid && palette) {
        return segment('▸', content, palette.task_bg, palette.task_fg);
    }
    return `${yellow('▸')} ${truncateContent(inProgress.content, 50)} ${dim(`(${completedCount}/${total})`)}`;
}
function truncateContent(content, maxLen) {
    if (content.length <= maxLen)
        return content;
    return content.slice(0, maxLen - 3) + '...';
}
//# sourceMappingURL=todos-line.js.map