import {
  DiffChunkType,
  ExecutionProcess,
  ExecutionProcessSummary,
  ProcessLogsResponse,
  NormalizedEntry,
} from 'shared/types.ts';

/**
 * Data structure representing a task attempt with associated processes and logs
 */
export type AttemptData = {
  /** Summary of execution processes for the attempt */
  processes: ExecutionProcessSummary[];
  /** Detailed information about currently running processes */
  runningProcessDetails: Record<string, ExecutionProcess>;
  /** All logs associated with the attempt */
  allLogs: ProcessLogsResponse[];
};

/**
 * Represents a single line in a processed diff
 */
export interface ProcessedLine {
  /** The actual content of the line */
  content: string;
  /** Type of diff chunk (added, removed, unchanged, etc.) */
  chunkType: DiffChunkType;
  /** Line number in the old file (for context and removed lines) */
  oldLineNumber?: number;
  /** Line number in the new file (for context and added lines) */
  newLineNumber?: number;
}

/**
 * Represents a section of processed diff lines
 */
export interface ProcessedSection {
  /** Type of section - context, change, or expanded */
  type: 'context' | 'change' | 'expanded';
  /** Lines contained in this section */
  lines: ProcessedLine[];
  /** Unique key for expansion functionality */
  expandKey?: string;
  /** Whether content has been expanded above this section */
  expandedAbove?: boolean;
  /** Whether content has been expanded below this section */
  expandedBelow?: boolean;
}

/**
 * Display data for a conversation entry with process context
 */
export interface ConversationEntryDisplayType {
  /** The conversation entry data */
  entry: NormalizedEntry;
  /** ID of the associated process */
  processId: string;
  /** Optional prompt text for the process */
  processPrompt?: string;
  /** Current status of the process */
  processStatus: string;
  /** Whether the process is currently running */
  processIsRunning: boolean;
  /** Full process object */
  process: ExecutionProcess;
  /** Whether this is the first entry in the process */
  isFirstInProcess: boolean;
  /** Index of the process in the sequence */
  processIndex: number;
  /** Index of the entry within the process */
  entryIndex: number;
}
