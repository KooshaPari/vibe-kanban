import { describe, it, expect } from '@jest/globals';
import type {
  AttemptData,
  ProcessedLine,
  ProcessedSection,
  ConversationEntryDisplayType,
} from '../lib/types';
import type {
  DiffChunkType,
  ExecutionProcess,
  ExecutionProcessSummary,
  ProcessLogsResponse,
  NormalizedEntryType,
  ActionType,
} from 'shared/types';

describe('Types', () => {
  describe('AttemptData', () => {
    it('should have correct structure', () => {
      const mockExecutionProcess: ExecutionProcess = {
        id: 'proc-1',
        task_attempt_id: 'attempt-1',
        process_type: 'codingagent',
        executor_type: 'claude',
        status: 'running',
        command: 'npm run build',
        args: null,
        working_directory: '/project',
        stdout: 'Building...',
        stderr: null,
        exit_code: null,
        started_at: '2023-01-01T00:00:00Z',
        completed_at: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockExecutionProcessSummary: ExecutionProcessSummary = {
        id: 'proc-1',
        task_attempt_id: 'attempt-1',
        process_type: 'codingagent',
        executor_type: 'claude',
        status: 'running',
        command: 'npm run build',
        args: null,
        working_directory: '/project',
        exit_code: null,
        started_at: '2023-01-01T00:00:00Z',
        completed_at: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockProcessLogsResponse: ProcessLogsResponse = {
        id: 'proc-1',
        process_type: 'codingagent',
        command: 'npm run build',
        executor_type: 'claude',
        status: 'running',
        normalized_conversation: {
          entries: [],
          session_id: 'session-1',
          executor_type: 'claude',
          prompt: 'Build the project',
          summary: 'Building project',
        },
      };

      const attemptData: AttemptData = {
        processes: [mockExecutionProcessSummary],
        runningProcessDetails: {
          'proc-1': mockExecutionProcess,
        },
        allLogs: [mockProcessLogsResponse],
      };

      expect(attemptData.processes).toHaveLength(1);
      expect(attemptData.processes[0]).toEqual(mockExecutionProcessSummary);
      expect(attemptData.runningProcessDetails['proc-1']).toEqual(
        mockExecutionProcess
      );
      expect(attemptData.allLogs).toHaveLength(1);
      expect(attemptData.allLogs[0]).toEqual(mockProcessLogsResponse);
    });

    it('should allow empty collections', () => {
      const attemptData: AttemptData = {
        processes: [],
        runningProcessDetails: {},
        allLogs: [],
      };

      expect(attemptData.processes).toHaveLength(0);
      expect(Object.keys(attemptData.runningProcessDetails)).toHaveLength(0);
      expect(attemptData.allLogs).toHaveLength(0);
    });

    it('should maintain type safety for process status', () => {
      const mockProcessSummary: ExecutionProcessSummary = {
        id: 'proc-1',
        task_attempt_id: 'attempt-1',
        process_type: 'setupscript',
        executor_type: null,
        status: 'completed',
        command: 'setup.sh',
        args: '--verbose',
        working_directory: '/project',
        exit_code: 0n,
        started_at: '2023-01-01T00:00:00Z',
        completed_at: '2023-01-01T00:05:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:05:00Z',
      };

      const attemptData: AttemptData = {
        processes: [mockProcessSummary],
        runningProcessDetails: {},
        allLogs: [],
      };

      expect(attemptData.processes[0].status).toBe('completed');
      expect(attemptData.processes[0].process_type).toBe('setupscript');
    });
  });

  describe('ProcessedLine', () => {
    it('should have correct structure for different chunk types', () => {
      const equalLine: ProcessedLine = {
        content: 'unchanged line',
        chunkType: 'Equal',
        oldLineNumber: 10,
        newLineNumber: 10,
      };

      const insertLine: ProcessedLine = {
        content: '+ added line',
        chunkType: 'Insert',
        newLineNumber: 11,
      };

      const deleteLine: ProcessedLine = {
        content: '- removed line',
        chunkType: 'Delete',
        oldLineNumber: 11,
      };

      expect(equalLine.chunkType).toBe('Equal');
      expect(equalLine.oldLineNumber).toBe(10);
      expect(equalLine.newLineNumber).toBe(10);

      expect(insertLine.chunkType).toBe('Insert');
      expect(insertLine.oldLineNumber).toBeUndefined();
      expect(insertLine.newLineNumber).toBe(11);

      expect(deleteLine.chunkType).toBe('Delete');
      expect(deleteLine.oldLineNumber).toBe(11);
      expect(deleteLine.newLineNumber).toBeUndefined();
    });

    it('should handle optional line numbers', () => {
      const lineWithoutNumbers: ProcessedLine = {
        content: 'content only',
        chunkType: 'Equal',
      };

      expect(lineWithoutNumbers.oldLineNumber).toBeUndefined();
      expect(lineWithoutNumbers.newLineNumber).toBeUndefined();
    });

    it('should validate DiffChunkType values', () => {
      const validTypes: DiffChunkType[] = ['Equal', 'Insert', 'Delete'];

      validTypes.forEach((type) => {
        const line: ProcessedLine = {
          content: `test content for ${type}`,
          chunkType: type,
        };
        expect(line.chunkType).toBe(type);
      });
    });
  });

  describe('ProcessedSection', () => {
    it('should handle context sections', () => {
      const contextSection: ProcessedSection = {
        type: 'context',
        lines: [
          {
            content: 'context line 1',
            chunkType: 'Equal',
            oldLineNumber: 1,
            newLineNumber: 1,
          },
          {
            content: 'context line 2',
            chunkType: 'Equal',
            oldLineNumber: 2,
            newLineNumber: 2,
          },
        ],
      };

      expect(contextSection.type).toBe('context');
      expect(contextSection.lines).toHaveLength(2);
      expect(contextSection.expandKey).toBeUndefined();
    });

    it('should handle change sections', () => {
      const changeSection: ProcessedSection = {
        type: 'change',
        lines: [
          {
            content: '- old line',
            chunkType: 'Delete',
            oldLineNumber: 5,
          },
          {
            content: '+ new line',
            chunkType: 'Insert',
            newLineNumber: 5,
          },
        ],
      };

      expect(changeSection.type).toBe('change');
      expect(changeSection.lines).toHaveLength(2);
      expect(changeSection.lines[0].chunkType).toBe('Delete');
      expect(changeSection.lines[1].chunkType).toBe('Insert');
    });

    it('should handle expanded sections with expand properties', () => {
      const expandedSection: ProcessedSection = {
        type: 'expanded',
        lines: [
          {
            content: 'expanded line',
            chunkType: 'Equal',
            oldLineNumber: 10,
            newLineNumber: 10,
          },
        ],
        expandedAbove: true,
        expandedBelow: false,
      };

      expect(expandedSection.type).toBe('expanded');
      expect(expandedSection.expandKey).toBeUndefined();
      expect(expandedSection.expandedAbove).toBe(true);
      expect(expandedSection.expandedBelow).toBe(false);
    });

    it('should allow empty lines array', () => {
      const emptySection: ProcessedSection = {
        type: 'context',
        lines: [],
      };

      expect(emptySection.lines).toHaveLength(0);
    });

    it('should validate section types', () => {
      const validTypes = ['context', 'change', 'expanded'] as const;

      validTypes.forEach((type) => {
        const section: ProcessedSection = {
          type,
          lines: [],
        };
        expect(section.type).toBe(type);
      });
    });
  });

  describe('ConversationEntryDisplayType', () => {
    it('should have correct structure', () => {
      const mockEntry = {
        timestamp: '2023-01-01T00:00:00Z',
        entry_type: { type: 'user_message' } as NormalizedEntryType,
        content: 'Hello, assistant!',
      };

      const mockProcess = {
        id: 'proc-1',
        status: 'running',
        executor_type: 'claude',
      };

      const conversationEntry: ConversationEntryDisplayType = {
        entry: mockEntry,
        processId: 'proc-1',
        processPrompt: 'Build the project',
        processStatus: 'running',
        processIsRunning: true,
        process: mockProcess,
        isFirstInProcess: true,
        processIndex: 0,
        entryIndex: 0,
      };

      expect(conversationEntry.entry).toEqual(mockEntry);
      expect(conversationEntry.processId).toBe('proc-1');
      expect(conversationEntry.processPrompt).toBe('Build the project');
      expect(conversationEntry.processStatus).toBe('running');
      expect(conversationEntry.processIsRunning).toBe(true);
      expect(conversationEntry.process).toEqual(mockProcess);
      expect(conversationEntry.isFirstInProcess).toBe(true);
      expect(conversationEntry.processIndex).toBe(0);
      expect(conversationEntry.entryIndex).toBe(0);
    });

    it('should handle optional processPrompt', () => {
      const conversationEntry: ConversationEntryDisplayType = {
        entry: {
          timestamp: '2023-01-01T00:00:00Z',
          entry_type: { type: 'assistant_message' } as NormalizedEntryType,
          content: 'Response from assistant',
        },
        processId: 'proc-2',
        processStatus: 'completed',
        processIsRunning: false,
        process: { id: 'proc-2', status: 'completed' },
        isFirstInProcess: false,
        processIndex: 1,
        entryIndex: 5,
      };

      expect(conversationEntry.processPrompt).toBeUndefined();
      expect(conversationEntry.processIsRunning).toBe(false);
      expect(conversationEntry.isFirstInProcess).toBe(false);
    });

    it('should handle different entry types', () => {
      const toolUseEntry: ConversationEntryDisplayType = {
        entry: {
          timestamp: '2023-01-01T00:00:00Z',
          entry_type: {
            type: 'tool_use',
            tool_name: 'file_write',
            action_type: {
              action: 'file_write',
              path: '/project/src/index.ts',
            } as ActionType,
          } as NormalizedEntryType,
          content: 'Writing file content...',
        },
        processId: 'proc-3',
        processStatus: 'running',
        processIsRunning: true,
        process: { id: 'proc-3' },
        isFirstInProcess: false,
        processIndex: 2,
        entryIndex: 10,
      };

      expect(toolUseEntry.entry.entry_type.type).toBe('tool_use');
      if (toolUseEntry.entry.entry_type.type === 'tool_use') {
        expect(toolUseEntry.entry.entry_type.tool_name).toBe('file_write');
        expect(toolUseEntry.entry.entry_type.action_type.action).toBe(
          'file_write'
        );
      }
    });

    it('should handle thinking entries', () => {
      const thinkingEntry: ConversationEntryDisplayType = {
        entry: {
          timestamp: '2023-01-01T00:00:00Z',
          entry_type: { type: 'thinking' } as NormalizedEntryType,
          content: 'Let me think about this...',
        },
        processId: 'proc-4',
        processStatus: 'running',
        processIsRunning: true,
        process: { id: 'proc-4', executor_type: 'claude' },
        isFirstInProcess: true,
        processIndex: 0,
        entryIndex: 0,
      };

      expect(thinkingEntry.entry.entry_type.type).toBe('thinking');
      expect(thinkingEntry.entry.content).toContain('think');
    });

    it('should handle system and error messages', () => {
      const systemEntry: ConversationEntryDisplayType = {
        entry: {
          timestamp: '2023-01-01T00:00:00Z',
          entry_type: { type: 'system_message' } as NormalizedEntryType,
          content: 'System initialized',
        },
        processId: 'proc-5',
        processStatus: 'completed',
        processIsRunning: false,
        process: { id: 'proc-5' },
        isFirstInProcess: true,
        processIndex: 0,
        entryIndex: 0,
      };

      const errorEntry: ConversationEntryDisplayType = {
        entry: {
          timestamp: '2023-01-01T00:00:00Z',
          entry_type: { type: 'error_message' } as NormalizedEntryType,
          content: 'An error occurred',
        },
        processId: 'proc-6',
        processStatus: 'failed',
        processIsRunning: false,
        process: { id: 'proc-6' },
        isFirstInProcess: false,
        processIndex: 1,
        entryIndex: 1,
      };

      expect(systemEntry.entry.entry_type.type).toBe('system_message');
      expect(errorEntry.entry.entry_type.type).toBe('error_message');
      expect(errorEntry.processStatus).toBe('failed');
    });

    it('should handle various action types in tool use', () => {
      const actionTypes: ActionType[] = [
        { action: 'file_read', path: '/src/index.ts' },
        { action: 'file_write', path: '/src/output.ts' },
        { action: 'command_run', command: 'npm test' },
        { action: 'search', query: 'React hooks' },
        { action: 'web_fetch', url: 'https://example.com' },
        { action: 'task_create', description: 'New subtask' },
        { action: 'plan_presentation', plan: 'Project plan' },
        { action: 'other', description: 'Custom action' },
      ];

      actionTypes.forEach((actionType, index) => {
        const entry: ConversationEntryDisplayType = {
          entry: {
            timestamp: '2023-01-01T00:00:00Z',
            entry_type: {
              type: 'tool_use',
              tool_name: 'test_tool',
              action_type: actionType,
            } as NormalizedEntryType,
            content: `Action: ${actionType.action}`,
          },
          processId: `proc-${index}`,
          processStatus: 'running',
          processIsRunning: true,
          process: { id: `proc-${index}` },
          isFirstInProcess: true,
          processIndex: index,
          entryIndex: 0,
        };

        expect(entry.entry.entry_type.type).toBe('tool_use');
        if (entry.entry.entry_type.type === 'tool_use') {
          expect(entry.entry.entry_type.action_type).toEqual(actionType);
        }
      });
    });
  });

  describe('Type integration and compatibility', () => {
    it('should work with shared types', () => {
      // Test that our custom types work well with shared types
      const processedLine: ProcessedLine = {
        content: 'test line',
        chunkType: 'Insert' as DiffChunkType,
        newLineNumber: 1,
      };

      const section: ProcessedSection = {
        type: 'change',
        lines: [processedLine],
      };

      expect(section.lines[0].chunkType).toBe('Insert');
    });

    it('should maintain type safety with complex nested structures', () => {
      const complexAttemptData: AttemptData = {
        processes: [
          {
            id: 'setup-proc',
            task_attempt_id: 'attempt-1',
            process_type: 'setupscript',
            executor_type: null,
            status: 'completed',
            command: 'setup.sh',
            args: null,
            working_directory: '/project',
            exit_code: 0n,
            started_at: '2023-01-01T00:00:00Z',
            completed_at: '2023-01-01T00:05:00Z',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:05:00Z',
          },
          {
            id: 'coding-proc',
            task_attempt_id: 'attempt-1',
            process_type: 'codingagent',
            executor_type: 'claude',
            status: 'running',
            command: 'claude',
            args: '{"prompt": "Build feature"}',
            working_directory: '/project',
            exit_code: null,
            started_at: '2023-01-01T00:05:00Z',
            completed_at: null,
            created_at: '2023-01-01T00:05:00Z',
            updated_at: '2023-01-01T00:05:00Z',
          },
        ],
        runningProcessDetails: {},
        allLogs: [],
      };

      expect(complexAttemptData.processes).toHaveLength(2);
      expect(complexAttemptData.processes[0].process_type).toBe('setupscript');
      expect(complexAttemptData.processes[1].process_type).toBe('codingagent');
      expect(complexAttemptData.processes[0].status).toBe('completed');
      expect(complexAttemptData.processes[1].status).toBe('running');
    });

    it('should handle null and undefined values correctly', () => {
      const lineWithNulls: ProcessedLine = {
        content: '',
        chunkType: 'Equal',
        oldLineNumber: undefined,
        newLineNumber: undefined,
      };

      const sectionWithOptionals: ProcessedSection = {
        type: 'context',
        lines: [lineWithNulls],
        expandKey: undefined,
        expandedAbove: undefined,
        expandedBelow: undefined,
      };

      expect(sectionWithOptionals.lines[0].oldLineNumber).toBeUndefined();
      expect(sectionWithOptionals.expandKey).toBeUndefined();
    });
  });
});
