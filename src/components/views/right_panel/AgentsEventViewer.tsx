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

import React, { useState, useEffect, useMemo } from "react";
import { type Room, type MatrixEvent, EventType } from "matrix-js-sdk/src/matrix";

import { _t } from "../../../languageHandler";
import BaseCard from "./BaseCard";
import {
    EZAGENT_CLAUDE_MSGTYPE,
    EZAGENT_SYSTEM_MSGTYPE,
    EZAGENT_RESULT_MSGTYPE,
} from "../../../@types/EzAgentMessages";
import MClaudeBody from "../messages/MClaudeBody";

interface IProps {
    room: Room;
    onClose: () => void;
}

type MessageFilter = "all" | "claude" | "system" | "result";
type AgentFilter = string | "all";

const EZAGENT_MSGTYPES = [EZAGENT_CLAUDE_MSGTYPE, EZAGENT_SYSTEM_MSGTYPE, EZAGENT_RESULT_MSGTYPE];

const AgentsEventViewer: React.FC<IProps> = ({ room, onClose }) => {
    const [events, setEvents] = useState<MatrixEvent[]>([]);
    const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
    const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
    const [loading, setLoading] = useState(true);

    // Load events from room timeline
    useEffect(() => {
        const loadEvents = (): void => {
            setLoading(true);
            const timeline = room.getLiveTimeline();
            const timelineEvents = timeline.getEvents();

            // Filter to EzAgent message types
            const agentEvents = timelineEvents.filter((event) => {
                if (event.getType() !== EventType.RoomMessage) return false;
                const content = event.getContent();
                return EZAGENT_MSGTYPES.includes(content.msgtype as string);
            });

            setEvents(agentEvents);
            setLoading(false);
        };

        loadEvents();

        // Listen for new events
        const onTimelineEvent = (event: MatrixEvent): void => {
            if (event.getRoomId() !== room.roomId) return;
            if (event.getType() !== EventType.RoomMessage) return;

            const content = event.getContent();
            if (EZAGENT_MSGTYPES.includes(content.msgtype as string)) {
                setEvents((prev) => [...prev, event]);
            }
        };

        room.on("Room.timeline" as any, onTimelineEvent);

        return () => {
            room.off("Room.timeline" as any, onTimelineEvent);
        };
    }, [room]);

    // Extract unique agents from events
    const agents = useMemo(() => {
        const agentSet = new Set<string>();
        events.forEach((event) => {
            const sender = event.getSender();
            if (sender) agentSet.add(sender);
        });
        return Array.from(agentSet);
    }, [events]);

    // Filter events based on current filters
    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const content = event.getContent();

            // Message type filter
            if (messageFilter !== "all") {
                const expectedMsgtype = {
                    claude: EZAGENT_CLAUDE_MSGTYPE,
                    system: EZAGENT_SYSTEM_MSGTYPE,
                    result: EZAGENT_RESULT_MSGTYPE,
                }[messageFilter];
                if (content.msgtype !== expectedMsgtype) return false;
            }

            // Agent filter
            if (agentFilter !== "all" && event.getSender() !== agentFilter) {
                return false;
            }

            return true;
        });
    }, [events, messageFilter, agentFilter]);

    return (
        <BaseCard header={_t("agents_viewer|title")} className="mx_AgentsEventViewer" onClose={onClose}>
            {/* Filters */}
            <div className="mx_AgentsEventViewer_filters">
                <div className="mx_AgentsEventViewer_filterGroup">
                    <label>{_t("agents_viewer|message_type")}</label>
                    <select
                        value={messageFilter}
                        onChange={(e) => setMessageFilter(e.target.value as MessageFilter)}
                    >
                        <option value="all">{_t("agents_viewer|all_types")}</option>
                        <option value="claude">Claude</option>
                        <option value="system">System</option>
                        <option value="result">Result</option>
                    </select>
                </div>

                <div className="mx_AgentsEventViewer_filterGroup">
                    <label>{_t("agents_viewer|agent")}</label>
                    <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
                        <option value="all">{_t("agents_viewer|all_agents")}</option>
                        {agents.map((agent) => (
                            <option key={agent} value={agent}>
                                {agent.split(":")[0].slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Events list */}
            <div className="mx_AgentsEventViewer_events">
                {loading ? (
                    <div className="mx_AgentsEventViewer_loading">{_t("common|loading")}</div>
                ) : filteredEvents.length === 0 ? (
                    <div className="mx_AgentsEventViewer_empty">{_t("agents_viewer|no_events")}</div>
                ) : (
                    filteredEvents.map((event) => <AgentEventItem key={event.getId()} event={event} />)
                )}
            </div>

            {/* Stats */}
            <div className="mx_AgentsEventViewer_stats">
                {_t("agents_viewer|showing", {
                    count: filteredEvents.length,
                    total: events.length,
                })}
            </div>
        </BaseCard>
    );
};

/**
 * Individual event item renderer
 */
const AgentEventItem: React.FC<{ event: MatrixEvent }> = ({ event }) => {
    const content = event.getContent();
    const sender = event.getSender();
    const timestamp = event.getTs();

    return (
        <div className="mx_AgentsEventViewer_event">
            <div className="mx_AgentsEventViewer_eventHeader">
                <span className="mx_AgentsEventViewer_sender">{sender?.split(":")[0].slice(1)}</span>
                <span className="mx_AgentsEventViewer_time">{new Date(timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="mx_AgentsEventViewer_eventContent">
                {content.msgtype === EZAGENT_CLAUDE_MSGTYPE ? (
                    <MClaudeBody mxEvent={event} />
                ) : (
                    <pre className="mx_AgentsEventViewer_fallback">{content.body as string}</pre>
                )}
            </div>
        </div>
    );
};

export default AgentsEventViewer;
