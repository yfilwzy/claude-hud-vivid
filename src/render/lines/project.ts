import type { RenderContext } from '../../types.js';
import { getModelName, getProviderLabel } from '../../stdin.js';
import { getOutputSpeed } from '../../speed-tracker.js';
import { segment, mutedSeparator, cyan, dim, magenta, yellow, red, claudeOrange, RESET } from '../colors.js';

/** Line 1: Model │ Git │ Effort │ Session │ Speed │ Duration */
export function renderProjectLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  const useVivid = ctx.config?.style?.useVividSegments ?? false;
  const palette = ctx.config?.style?.palette;
  const parts: string[] = [];

  // Model segment
  if (display?.showModel !== false) {
    const model = getModelName(ctx.stdin);
    const providerLabel = getProviderLabel(ctx.stdin);
    const showUsage = display?.showUsage !== false;
    const planName = showUsage ? ctx.usageData?.planName : undefined;
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    const billingLabel = showUsage ? (planName ?? (hasApiKey ? 'API' : undefined)) : undefined;
    const planDisplay = providerLabel ?? billingLabel;
    const modelDisplay = planDisplay ? `${model} | ${planDisplay}` : model;

    if (useVivid && palette) {
      parts.push(segment('✦', modelDisplay, palette.model_bg, palette.model_fg));
    } else {
      parts.push(cyan(`[${modelDisplay}]`));
    }
  }

  // Git segment
  const gitConfig = ctx.config?.gitStatus;
  const showGit = gitConfig?.enabled ?? true;

  if (showGit && ctx.gitStatus) {
    const gitParts: string[] = [ctx.gitStatus.branch];
    if ((gitConfig?.showDirty ?? true) && ctx.gitStatus.isDirty) gitParts.push('*');
    if (gitConfig?.showAheadBehind) {
      if (ctx.gitStatus.ahead > 0) gitParts.push(` ↑${ctx.gitStatus.ahead}`);
      if (ctx.gitStatus.behind > 0) gitParts.push(` ↓${ctx.gitStatus.behind}`);
    }
    if (gitConfig?.showFileStats && ctx.gitStatus.fileStats) {
      const { modified, added, deleted, untracked } = ctx.gitStatus.fileStats;
      const s: string[] = [];
      if (modified > 0) s.push(`!${modified}`);
      if (added > 0) s.push(`+${added}`);
      if (deleted > 0) s.push(`✘${deleted}`);
      if (untracked > 0) s.push(`?${untracked}`);
      if (s.length > 0) gitParts.push(` ${s.join(' ')}`);
    }
    const gitText = gitParts.join('');
    if (useVivid && palette) {
      parts.push(segment('\ue0a0', gitText, palette.git_bg, palette.git_fg));
    } else {
      parts.push(`${magenta('git:(')}${cyan(gitText)}${magenta(')')}`);
    }
  }

  // Effort level
  if (display?.showEffortLevel !== false && ctx.effortLevel) {
    if (useVivid && palette) {
      parts.push(segment('◆', ctx.effortLevel, palette.effort_bg, palette.effort_fg));
    } else {
      parts.push(dim(`◆ ${ctx.effortLevel}`));
    }
  }

  // Session name
  if (display?.showSessionName && ctx.transcript.sessionName) {
    if (useVivid && palette) {
      parts.push(segment('◎', ctx.transcript.sessionName, palette.session_bg, palette.session_fg));
    } else {
      parts.push(dim(ctx.transcript.sessionName));
    }
  }

  // Extra label
  if (ctx.extraLabel) {
    parts.push(dim(ctx.extraLabel));
  }

  // Output speed
  if (display?.showSpeed) {
    const speed = getOutputSpeed(ctx.stdin);
    if (speed !== null) {
      const speedText = `${speed.toFixed(1)} tok/s`;
      if (useVivid && palette) {
        parts.push(segment('⚡', speedText, palette.speed_bg, palette.speed_fg));
      } else {
        parts.push(dim(`out: ${speedText}`));
      }
    }
  }

  // Session duration
  if (display?.showDuration !== false && ctx.sessionDuration) {
    if (useVivid && palette) {
      parts.push(segment('⏱', ctx.sessionDuration, palette.duration_bg, palette.duration_fg));
    } else {
      parts.push(dim(`⏱️  ${ctx.sessionDuration}`));
    }
  }

  // Custom line
  const customLine = display?.customLine;
  if (customLine) {
    parts.push(claudeOrange(customLine));
  }

  if (parts.length === 0) return null;

  const separator = useVivid ? mutedSeparator() : ' \u2502 ';
  return parts.join(separator);
}

/** Dedicated workdir line — always shows full path, never truncated */
export function renderWorkdirLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  if (display?.showProject === false || !ctx.stdin.cwd) return null;

  const useVivid = ctx.config?.style?.useVividSegments ?? false;
  const palette = ctx.config?.style?.palette;
  const fullPath = ctx.stdin.cwd.replace(/\\/g, '/');

  if (useVivid && palette) {
    return segment('▣', fullPath, palette.dir_bg, palette.dir_fg);
  }
  return `${yellow('▣')} ${yellow(fullPath)}`;
}
