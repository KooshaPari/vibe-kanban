import { useContext, useState } from 'react';
import { TaskDetailsContext, TaskAttemptsContext, TaskAttemptDataContext } from '@/components/context/taskDetailsContext.ts';
import { AgentProgressRaceVisualization } from '../AgentProgressRaceVisualization';
import { GitStateTreeVisualization } from '../GitStateTreeVisualization';

export function VisualizationsTab() {
  const { task } = useContext(TaskDetailsContext);
  const { taskAttempts } = useContext(TaskAttemptsContext);
  const { attemptData } = useContext(TaskAttemptDataContext);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | undefined>();

  if (!task || !taskAttempts || taskAttempts.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <div className="space-y-4">
          <div className="text-lg">📊 No visualizations available</div>
          <p>Create task attempts to see agent progress and git state visualizations</p>
        </div>
      </div>
    );
  }

  // Group activities by attempt ID - simplified approach
  const activitiesByAttempt = taskAttempts.reduce((acc, attempt) => {
    acc[attempt.id] = attemptData.activities.filter(activity => 
      // Match activities to attempts based on execution process IDs from the attempt's processes
      attemptData.processes.some(process => 
        process.task_attempt_id === attempt.id && 
        process.id === activity.execution_process_id
      )
    );
    return acc;
  }, {} as Record<string, typeof attemptData.activities>);

  return (
    <div className="space-y-8 p-4">
      {/* Agent Progress Race */}
      <AgentProgressRaceVisualization
        attempts={taskAttempts}
        activities={activitiesByAttempt}
        selectedAttemptId={selectedAttemptId}
        onAttemptSelect={setSelectedAttemptId}
      />

      {/* Git State Tree */}
      <GitStateTreeVisualization
        attempts={taskAttempts}
        selectedAttemptId={selectedAttemptId}
        onAttemptSelect={setSelectedAttemptId}
      />
    </div>
  );
}