import type { HudConfig } from './config.js';
import type { GitStatus } from './git.js';
export interface StdinData {
    transcript_path?: string;
    cwd?: string;
    model?: {
        id?: string;
        display_name?: string;
    };
    context_window?: {
        context_window_size?: number;
        current_usage?: {
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        } | null;
        used_percentage?: number | null;
        remaining_percentage?: number | null;
    };
}
export interface ToolEntry {
    id: string;
    name: string;
    target?: string;
    status: 'running' | 'completed' | 'error';
    startTime: Date;
    endTime?: Date;
}
export interface AgentEntry {
    id: string;
    type: string;
    model?: string;
    description?: string;
    status: 'running' | 'completed';
    startTime: Date;
    endTime?: Date;
}
export interface TodoItem {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
}
/** Usage window data from the OAuth API */
export interface UsageWindow {
    utilization: number | null;
    resetAt: Date | null;
}
export interface UsageData {
    planName: string | null;
    fiveHour: number | null;
    sevenDay: number | null;
    fiveHourResetAt: Date | null;
    sevenDayResetAt: Date | null;
    apiUnavailable?: boolean;
    apiError?: string;
}
/** Check if usage limit is reached (either window at 100%) */
export declare function isLimitReached(data: UsageData): boolean;
/** Main agent inferred state */
export type MainAgentState = 'idle' | 'running_tool' | 'coordinating';
export interface MainAgentStatus {
    state: MainAgentState;
    currentTool?: string;
    currentToolTarget?: string;
    runningAgentCount: number;
    taskSummary?: {
        inProgress: number;
        pending: number;
        completed: number;
    };
}
export interface TranscriptData {
    tools: ToolEntry[];
    agents: AgentEntry[];
    todos: TodoItem[];
    sessionStart?: Date;
    sessionName?: string;
    mainAgentStatus: MainAgentStatus;
    agentTaskBindings: Map<string, string>;
}
export interface RenderContext {
    stdin: StdinData;
    transcript: TranscriptData;
    claudeMdCount: number;
    rulesCount: number;
    mcpCount: number;
    hooksCount: number;
    sessionDuration: string;
    gitStatus: GitStatus | null;
    usageData: UsageData | null;
    config: HudConfig;
    extraLabel: string | null;
    effortLevel: string;
}
//# sourceMappingURL=types.d.ts.map