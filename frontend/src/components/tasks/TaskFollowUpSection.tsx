import { AlertCircle, Send, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSearchTextarea } from '@/components/ui/file-search-textarea';
import { useContext, useMemo, useState } from 'react';
import { attemptsApi, makeRequest } from '@/lib/api.ts';
import {
  TaskAttemptDataContext,
  TaskDetailsContext,
  TaskSelectedAttemptContext,
} from '@/components/context/taskDetailsContext.ts';
import { Loader } from '@/components/ui/loader';
import type {
  ExecutionProcessSummary,
  TaskAttemptActivity,
} from 'shared/types';

export function TaskFollowUpSection() {
  const { task, projectId } = useContext(TaskDetailsContext);
  const { selectedAttempt } = useContext(TaskSelectedAttemptContext);
  const { attemptData, fetchAttemptData, isAttemptRunning } = useContext(
    TaskAttemptDataContext
  );

  const [followUpMessage, setFollowUpMessage] = useState('');
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const canSendFollowUp = useMemo(() => {
    if (
      !selectedAttempt ||
      attemptData.activities.length === 0 ||
      isAttemptRunning ||
      isSendingFollowUp
    ) {
      return false;
    }

    const codingAgentActivities = attemptData.activities.filter(
      (activity: TaskAttemptActivity) => activity.status === 'executorcomplete'
    );

    return codingAgentActivities.length > 0;
  }, [
    selectedAttempt,
    attemptData.activities,
    isAttemptRunning,
    isSendingFollowUp,
  ]);

  // Check if plan approval is needed - only show when task is in InReview status and has claudeplan process
  const planApprovalData = useMemo(() => {
    const claudePlanProcess = attemptData.processes.find(
      (process: ExecutionProcessSummary) =>
        process.executor_type === 'claudeplan'
    );
    return {
      needed: task?.status === 'inreview' && !!claudePlanProcess,
      process: claudePlanProcess,
    };
  }, [task?.status, attemptData.processes]);

  const onSendFollowUp = async () => {
    if (!task || !selectedAttempt || !followUpMessage.trim()) return;

    try {
      setIsSendingFollowUp(true);
      setFollowUpError(null);
      await attemptsApi.followUp(
        projectId!,
        selectedAttempt.task_id,
        selectedAttempt.id,
        {
          prompt: followUpMessage.trim(),
        }
      );
      setFollowUpMessage('');
      fetchAttemptData(selectedAttempt.id, selectedAttempt.task_id);
    } catch (error: unknown) {
      // @ts-expect-error it is type ApiError
      setFollowUpError(`Failed to start follow-up execution: ${error.message}`);
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handlePlanAction = async (approve: boolean, feedback?: string) => {
    if (!task || !selectedAttempt || !planApprovalData.process) return;

    setIsApproving(true);
    try {
      const response = await makeRequest(
        `/api/projects/${projectId}/tasks/${task.id}/attempts/${selectedAttempt.id}/approve-plan`,
        {
          method: 'POST',
          body: JSON.stringify({
            approve,
            feedback:
              feedback || (approve ? undefined : 'Please revise the plan.'),
          }),
        }
      );

      if (response.ok) {
        if (approve) {
          const result = await response.json();
          if (result.success) {
            console.log('Plan approved successfully:', result.message);
          } else {
            setFollowUpError(`Failed to approve plan: ${result.message}`);
            return;
          }
        } else {
          setFollowUpMessage('');
          setShowFeedback(false);
        }
        fetchAttemptData(selectedAttempt.id, selectedAttempt.task_id);
      } else {
        setFollowUpError(`Failed to ${approve ? 'approve' : 'decline'} plan`);
      }
    } catch (error) {
      setFollowUpError(
        `Error ${approve ? 'approving' : 'declining'} plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsApproving(false);
    }
  };

  return (
    selectedAttempt && (
      <div className="border-t p-4">
        <div className="space-y-2">
          {followUpError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{followUpError}</AlertDescription>
            </Alert>
          )}

          {planApprovalData.needed ? (
            // Plan approval interface
            <div className="space-y-2">
              <div className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                Plan Approval Required
              </div>

              {showFeedback ? (
                <div className="space-y-2">
                  <FileSearchTextarea
                    placeholder="Provide feedback for plan revision..."
                    value={followUpMessage}
                    onChange={(value) => {
                      setFollowUpMessage(value);
                      if (followUpError) setFollowUpError(null);
                    }}
                    className="flex-1 min-h-[40px] resize-none"
                    disabled={isApproving}
                    projectId={projectId}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handlePlanAction(false, followUpMessage.trim())
                      }
                      disabled={isApproving}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-3 w-3" />
                      {isApproving
                        ? 'Starting retry...'
                        : 'Retry with Feedback'}
                    </Button>
                    <Button
                      onClick={() => setShowFeedback(false)}
                      variant="outline"
                      size="sm"
                      disabled={isApproving}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePlanAction(true)}
                    disabled={isApproving}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-3 w-3" />
                    {isApproving ? 'Approving...' : 'Approve & Create Task'}
                  </Button>
                  <Button
                    onClick={() => setShowFeedback(true)}
                    disabled={isApproving}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                    Decline & Provide Feedback
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Normal follow-up interface
            <div className="flex gap-2 items-start">
              <FileSearchTextarea
                placeholder="Ask a follow-up question... Type @ to search files."
                value={followUpMessage}
                onChange={(value) => {
                  setFollowUpMessage(value);
                  if (followUpError) setFollowUpError(null);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (
                      canSendFollowUp &&
                      followUpMessage.trim() &&
                      !isSendingFollowUp
                    ) {
                      onSendFollowUp();
                    }
                  }
                }}
                className="flex-1 min-h-[40px] resize-none"
                disabled={!canSendFollowUp}
                projectId={projectId}
                rows={1}
              />
              <Button
                onClick={onSendFollowUp}
                disabled={
                  !canSendFollowUp ||
                  !followUpMessage.trim() ||
                  isSendingFollowUp
                }
                size="sm"
              >
                {isSendingFollowUp ? (
                  <Loader size={16} className="mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  );
}
