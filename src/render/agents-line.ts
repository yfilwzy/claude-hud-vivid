import type { RenderContext, AgentEntry } from '../types.js';
import { yellow, green, magenta, cyan, dim, segment, mutedSeparator, RESET } from './colors.js';

export function renderAgentsLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  const { agents, mainAgentStatus, agentTaskBindings } = ctx.transcript;
  const useVivid = ctx.config?.style?.useVividSegments ?? false;
  const palette = ctx.config?.style?.palette;
  const maxDisplay = display?.agentMaxDisplay ?? 5;
  const todoStyle = display?.todoStyle ?? 'chinese';

  const lines: string[] = [];

  // Main agent status line (always shown if enabled)
  if (display?.showMainAgent !== false) {
    lines.push(renderMainAgentLine(ctx, todoStyle, useVivid, palette));
  }

  // Sub-agent lines
  const runningAgents = agents.filter((a) => a.status === 'running');
  const recentCompleted = agents
    .filter((a) => a.status === 'completed')
    .slice(-2);

  const toShow = [...runningAgents, ...recentCompleted].slice(0, maxDisplay);

  if (toShow.length > 0) {
    for (const agent of toShow) {
      lines.push(formatAgent(agent, agentTaskBindings, useVivid, palette));
    }

    const totalVisible = runningAgents.length + recentCompleted.length;
    if (totalVisible > maxDisplay) {
      if (useVivid && palette) {
        lines.push(segment('…', `+${totalVisible - maxDisplay} more agents`, palette.agent_bg, palette.agent_fg));
      } else {
        lines.push(dim(`  +${totalVisible - maxDisplay} more agents...`));
      }
    }
  } else {
    // No sub-agents — show placeholder with background
    if (useVivid && palette) {
      lines.push(segment('◇', '无子Agent活动', palette.agent_bg, palette.agent_fg));
    } else {
      lines.push(dim('◇ 无子Agent活动'));
    }
  }

  return lines.join('\n');
}

function renderMainAgentLine(
  ctx: RenderContext,
  todoStyle: string,
  useVivid: boolean,
  palette: any
): string {
  const { mainAgentStatus } = ctx.transcript;
  const parts: string[] = [];

  let statusText: string;
  switch (mainAgentStatus.state) {
    case 'coordinating':
      statusText = `协调 ${mainAgentStatus.runningAgentCount} 个子Agent`;
      break;
    case 'running_tool': {
      const toolName = mainAgentStatus.currentTool ?? '?';
      const target = mainAgentStatus.currentToolTarget
        ? `: ${truncateStr(mainAgentStatus.currentToolTarget, 20)}`
        : '';
      statusText = `正在执行 ${toolName}${target}`;
      break;
    }
    default:
      statusText = '空闲';
  }

  const summary = mainAgentStatus.taskSummary;
  let taskPart = '';
  if (summary && (summary.inProgress + summary.pending + summary.completed) > 0) {
    if (todoStyle === 'chinese') {
      taskPart = `进${summary.inProgress} 待${summary.pending} 完${summary.completed}`;
    } else {
      taskPart = `${summary.completed}/${summary.inProgress + summary.pending + summary.completed} done`;
    }
  }

  if (useVivid && palette) {
    const content = taskPart
      ? `main │ ${statusText} │ ${taskPart}`
      : `main │ ${statusText}`;
    return segment('⚙', content, palette.agent_bg, palette.agent_fg);
  }

  parts.push(`${cyan('⚙')} ${magenta('main')}`);
  parts.push(dim(statusText));
  if (taskPart) parts.push(dim(taskPart));

  return parts.join(' │ ');
}

function formatAgent(agent: AgentEntry, bindings: Map<string, string>, useVivid: boolean, palette: any): string {
  const isRunning = agent.status === 'running';
  const type = agent.type;
  const model = agent.model ? `[${agent.model}]` : '';
  const desc = agent.description ? `: ${truncateStr(agent.description, 35)}` : '';
  const elapsed = formatElapsed(agent);
  const boundTask = bindings.get(agent.type) ?? bindings.get(agent.description ?? '');
  const taskInfo = boundTask ? ` │ 任务: ${truncateStr(boundTask, 25)}` : '';

  if (useVivid && palette) {
    const icon = isRunning ? '◐' : '✓';
    const content = `${icon} ${type}${model ? ` ${model}` : ''}${desc} (${elapsed})${taskInfo}`;
    return segment(' ', content, palette.agent_bg, palette.agent_fg);
  }

  const statusIcon = isRunning ? yellow('◐') : green('✓');
  return `${statusIcon} ${magenta(type)}${model ? ` ${dim(model)}` : ''}${desc ? dim(desc) : ''} ${dim(`(${elapsed})`)}${taskInfo ? ` │ ${dim(taskInfo)}` : ''}`;
}

function truncateStr(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function formatElapsed(agent: AgentEntry): string {
  const now = Date.now();
  const start = agent.startTime.getTime();
  const end = agent.endTime?.getTime() ?? now;
  const ms = end - start;
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
