/*
Copyright 2024 EzAgent

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * EzAgent custom message types for Claude AI responses.
 * These extend Matrix's m.room.message with structured data.
 */

export const EZAGENT_CLAUDE_MSGTYPE = "cc.ezagent.claude";
export const EZAGENT_SYSTEM_MSGTYPE = "cc.ezagent.system";
export const EZAGENT_RESULT_MSGTYPE = "cc.ezagent.result";

export interface IToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface IToolResult {
    id: string;
    output: string;
}

export interface IClaudeMessageContent {
    msgtype: typeof EZAGENT_CLAUDE_MSGTYPE;
    body: string;
    "cc.ezagent.claude": {
        role: "user" | "assistant" | "system";
        content: string;
        thinking?: string;
        tool_calls?: IToolCall[];
        tool_results?: IToolResult[];
        model?: string;
        usage?: {
            input_tokens: number;
            output_tokens: number;
        };
    };
}

export interface ISystemMessageContent {
    msgtype: typeof EZAGENT_SYSTEM_MSGTYPE;
    body: string;
    "cc.ezagent.system": {
        level: "info" | "warning" | "error" | "success";
        title?: string;
        message: string;
        details?: Record<string, unknown>;
        timestamp?: string;
    };
}

export interface IResultMessageContent {
    msgtype: typeof EZAGENT_RESULT_MSGTYPE;
    body: string;
    "cc.ezagent.result": {
        tool_name: string;
        status: "success" | "error" | "pending";
        output?: string;
        output_type?: "text" | "code" | "json" | "markdown";
        language?: string;
        duration_ms?: number;
        truncated?: boolean;
    };
}

/**
 * Type guard to check if content is a Claude message
 */
export function isClaudeMessage(content: unknown): content is IClaudeMessageContent {
    return (
        typeof content === "object" &&
        content !== null &&
        "msgtype" in content &&
        (content as { msgtype: string }).msgtype === EZAGENT_CLAUDE_MSGTYPE
    );
}

/**
 * Type guard to check if content is a System message
 */
export function isSystemMessage(content: unknown): content is ISystemMessageContent {
    return (
        typeof content === "object" &&
        content !== null &&
        "msgtype" in content &&
        (content as { msgtype: string }).msgtype === EZAGENT_SYSTEM_MSGTYPE
    );
}

/**
 * Type guard to check if content is a Result message
 */
export function isResultMessage(content: unknown): content is IResultMessageContent {
    return (
        typeof content === "object" &&
        content !== null &&
        "msgtype" in content &&
        (content as { msgtype: string }).msgtype === EZAGENT_RESULT_MSGTYPE
    );
}
