import { CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import type { 
  TaskAttempt, 
  ExecutionState,
  TaskAttemptActivityWithPrompt 
} from 'shared/types';

interface AgentProgressRaceVisualizationProps {
  attempts: TaskAttempt[];
  activities: Record<string, TaskAttemptActivityWithPrompt[]>;
  selectedAttemptId?: string;
  onAttemptSelect?: (attemptId: string) => void;
}

interface RacePosition {
  attemptId: string;
  position: number; // 0-100 percentage
  status: 'running' | 'success' | 'failed' | 'pending';
  executor: string;
  branch: string;
}

const EXECUTION_STATES_ORDER: ExecutionState[] = [
  'NotStarted',
  'SetupRunning', 
  'SetupComplete',
  'CodingAgentRunning',
  'CodingAgentComplete',
  'Complete'
];

const getExecutionStateFromActivities = (activities: TaskAttemptActivityWithPrompt[]): ExecutionState => {
  if (activities.length === 0) return 'NotStarted';
  
  const latestActivity = activities[activities.length - 1];
  
  switch (latestActivity.status) {
    case 'setuprunning': return 'SetupRunning';
    case 'setupcomplete': return 'SetupComplete';
    case 'setupfailed': return 'SetupFailed';
    case 'executorrunning': return 'CodingAgentRunning';
    case 'executorcomplete': return 'CodingAgentComplete';
    case 'executorfailed': return 'CodingAgentFailed';
    default: return 'NotStarted';
  }
};

const calculateRacePosition = (state: ExecutionState): number => {
  const index = EXECUTION_STATES_ORDER.indexOf(state);
  if (index === -1) {
    // Handle failed states
    if (state === 'SetupFailed') return 25; // Failed during setup
    if (state === 'CodingAgentFailed') return 75; // Failed during coding
    return 0;
  }
  return (index / (EXECUTION_STATES_ORDER.length - 1)) * 100;
};

const getStatusFromState = (state: ExecutionState): RacePosition['status'] => {
  if (state.includes('Failed')) return 'failed';
  if (state === 'Complete') return 'success';
  if (state.includes('Running')) return 'running';
  return 'pending';
};

const getExecutorIcon = (executor: string | null) => {
  switch (executor) {
    case 'claude': return '🧠';
    case 'amp': return '⚡';
    case 'gemini': return '💎';
    case 'echo': return '📢';
    default: return '🤖';
  }
};

const getStatusIcon = (status: RacePosition['status']) => {
  switch (status) {
    case 'running': return <Play className="h-4 w-4 text-blue-500" />;
    case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

export function AgentProgressRaceVisualization({
  attempts,
  activities,
  selectedAttemptId,
  onAttemptSelect
}: AgentProgressRaceVisualizationProps) {
  const racePositions: RacePosition[] = attempts.map(attempt => {
    const attemptActivities = activities[attempt.id] || [];
    const state = getExecutionStateFromActivities(attemptActivities);
    
    return {
      attemptId: attempt.id,
      position: calculateRacePosition(state),
      status: getStatusFromState(state),
      executor: attempt.executor || 'unknown',
      branch: attempt.branch
    };
  });

  // Sort by position (furthest first for display)
  const sortedPositions = [...racePositions].sort((a, b) => b.position - a.position);

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg border">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-lg font-semibold">🏁 Agent Progress Race</div>
        <div className="text-sm text-muted-foreground">
          Track agents from start to finish line
        </div>
      </div>

      {/* Race Track */}
      <div className="relative">
        {/* Track background */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 relative">
          {/* Progress markers */}
          {[0, 25, 50, 75, 100].map(percent => (
            <div
              key={percent}
              className="absolute top-0 h-2 w-0.5 bg-gray-400"
              style={{ left: `${percent}%` }}
            />
          ))}
          
          {/* Finish line */}
          <div className="absolute -top-1 -right-1 h-4 w-0.5 bg-green-500 border-2 border-green-400">
            <div className="absolute -top-2 -left-2 text-xs">🏁</div>
          </div>
        </div>

        {/* Track labels */}
        <div className="flex justify-between text-xs text-muted-foreground mb-6 -mt-4">
          <span>Start</span>
          <span>Setup</span>
          <span>Setup ✓</span>
          <span>Coding</span>
          <span>Finish</span>
        </div>

        {/* Agent lanes */}
        <div className="space-y-4">
          {sortedPositions.map((position) => {
            const isSelected = position.attemptId === selectedAttemptId;
            
            return (
              <div
                key={position.attemptId}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded p-2'
                }`}
                onClick={() => onAttemptSelect?.(position.attemptId)}
              >
                {/* Lane track */}
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-full relative overflow-hidden">
                  {/* Progress bar */}
                  <div
                    className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
                      position.status === 'success' ? 'bg-green-400' :
                      position.status === 'failed' ? 'bg-red-400' :
                      position.status === 'running' ? 'bg-blue-400' :
                      'bg-gray-300'
                    }`}
                    style={{ width: `${position.position}%` }}
                  />
                  
                  {/* Agent avatar */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center text-xs transition-all duration-1000 ease-out ${
                      position.status === 'running' ? 'animate-pulse border-blue-500' :
                      position.status === 'success' ? 'border-green-500' :
                      position.status === 'failed' ? 'border-red-500' :
                      'border-gray-400'
                    }`}
                    style={{ 
                      left: `${Math.max(2, Math.min(96, position.position))}%`,
                      transform: 'translateX(-50%) translateY(-50%)'
                    }}
                  >
                    {getExecutorIcon(position.executor)}
                  </div>
                </div>
                
                {/* Lane info */}
                <div className="flex items-center justify-between mt-2 px-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(position.status)}
                    <span className="text-sm font-medium">
                      {position.executor}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {position.branch}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(position.position)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Play className="h-3 w-3 text-blue-500" />
              <span>Running</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Complete</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>Failed</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-gray-400" />
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}