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

import React, { useState } from "react";
import { type MatrixEvent } from "matrix-js-sdk/src/matrix";

import { type IBodyProps } from "./IBodyProps";
import { type IClaudeMessageContent, isClaudeMessage } from "../../../@types/EzAgentMessages";
import { _t } from "../../../languageHandler";

interface IProps extends IBodyProps {
    mxEvent: MatrixEvent;
}

const MClaudeBody: React.FC<IProps> = ({ mxEvent }) => {
    const [showThinking, setShowThinking] = useState(false);
    const [showToolCalls, setShowToolCalls] = useState(false);

    const rawContent = mxEvent.getContent();

    if (!isClaudeMessage(rawContent)) {
        // Fallback to body text
        return <div className="mx_MClaudeBody_fallback">{rawContent.body as string}</div>;
    }

    const content = rawContent as IClaudeMessageContent;
    const claudeData = content["cc.ezagent.claude"];

    return (
        <div className="mx_MClaudeBody">
            {/* Thinking section (collapsible) */}
            {claudeData.thinking && (
                <div className="mx_MClaudeBody_thinking">
                    <button
                        className="mx_MClaudeBody_toggle"
                        onClick={() => setShowThinking(!showThinking)}
                        aria-expanded={showThinking}
                    >
                        <span className="mx_MClaudeBody_toggleIcon">{showThinking ? "▼" : "▶"}</span>
                        {_t("claude|thinking")}
                    </button>
                    {showThinking && <pre className="mx_MClaudeBody_thinkingContent">{claudeData.thinking}</pre>}
                </div>
            )}

            {/* Tool calls section (collapsible) */}
            {claudeData.tool_calls && claudeData.tool_calls.length > 0 && (
                <div className="mx_MClaudeBody_toolCalls">
                    <button
                        className="mx_MClaudeBody_toggle"
                        onClick={() => setShowToolCalls(!showToolCalls)}
                        aria-expanded={showToolCalls}
                    >
                        <span className="mx_MClaudeBody_toggleIcon">{showToolCalls ? "▼" : "▶"}</span>
                        {_t("claude|tool_calls", { count: claudeData.tool_calls.length })}
                    </button>
                    {showToolCalls && (
                        <div className="mx_MClaudeBody_toolCallsList">
                            {claudeData.tool_calls.map((call, i) => (
                                <div key={call.id || i} className="mx_MClaudeBody_toolCall">
                                    <span className="mx_MClaudeBody_toolName">{call.name}</span>
                                    <pre className="mx_MClaudeBody_toolInput">{JSON.stringify(call.input, null, 2)}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tool results (shown when tool calls expanded) */}
            {claudeData.tool_results && claudeData.tool_results.length > 0 && showToolCalls && (
                <div className="mx_MClaudeBody_toolResults">
                    {claudeData.tool_results.map((result, i) => (
                        <div key={result.id || i} className="mx_MClaudeBody_toolResult">
                            <pre>{result.output}</pre>
                        </div>
                    ))}
                </div>
            )}

            {/* Main content */}
            <div className="mx_MClaudeBody_content">
                <ClaudeContent content={claudeData.content} />
            </div>

            {/* Usage stats */}
            {claudeData.usage && (
                <div className="mx_MClaudeBody_usage">
                    <span>
                        Tokens: {claudeData.usage.input_tokens} in / {claudeData.usage.output_tokens} out
                    </span>
                    {claudeData.model && <span className="mx_MClaudeBody_model">{claudeData.model}</span>}
                </div>
            )}
        </div>
    );
};

/**
 * Simple content renderer with basic markdown support
 */
const ClaudeContent: React.FC<{ content: string }> = ({ content }) => {
    const lines = content.split("\n");

    return (
        <div className="mx_MClaudeBody_contentInner">
            {lines.map((line, i) => {
                // Skip code fence markers
                if (line.startsWith("```")) {
                    return null;
                }

                // Headers
                if (line.startsWith("### ")) {
                    return <h4 key={i}>{line.slice(4)}</h4>;
                }
                if (line.startsWith("## ")) {
                    return <h3 key={i}>{line.slice(3)}</h3>;
                }
                if (line.startsWith("# ")) {
                    return <h2 key={i}>{line.slice(2)}</h2>;
                }

                // Regular paragraph
                return <p key={i}>{line || "\u00A0"}</p>;
            })}
        </div>
    );
};

export default MClaudeBody;
