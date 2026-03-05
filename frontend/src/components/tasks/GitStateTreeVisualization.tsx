import { GitBranch, GitMerge, GitPullRequest, Circle } from 'lucide-react';
import type { TaskAttempt, BranchStatus } from 'shared/types';

interface GitStateTreeVisualizationProps {
  attempts: TaskAttempt[];
  branchStatuses?: Record<string, BranchStatus>;
  selectedAttemptId?: string;
  onAttemptSelect?: (attemptId: string) => void;
}

interface GitNode {
  id: string;
  type: 'branch' | 'merge' | 'pr';
  attemptId?: string;
  branch: string;
  baseBranch: string;
  position: { x: number; y: number };
  status: 'active' | 'merged' | 'failed' | 'pending';
  prUrl?: string;
  prStatus?: string;
  mergedAt?: string;
}

interface GitConnection {
  from: string;
  to: string;
  type: 'branch' | 'merge';
}

const calculateNodePositions = (attempts: TaskAttempt[]): { nodes: GitNode[]; connections: GitConnection[] } => {
  const nodes: GitNode[] = [];
  const connections: GitConnection[] = [];
  const branchLanes: Record<string, number> = {};
  let nextLaneIndex = 0;

  // Add main branch at lane 0
  branchLanes['main'] = 0;
  
  // Sort attempts by creation time
  const sortedAttempts = [...attempts].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  sortedAttempts.forEach((attempt, index) => {
    const baseBranch = attempt.base_branch || 'main';
    
    // Assign lane for this branch if not exists
    if (!branchLanes[attempt.branch]) {
      branchLanes[attempt.branch] = nextLaneIndex + 1;
      nextLaneIndex++;
    }

    const branchLane = branchLanes[attempt.branch];
    const baseLane = branchLanes[baseBranch];

    // Branch creation node
    const branchNode: GitNode = {
      id: `branch-${attempt.id}`,
      type: 'branch',
      attemptId: attempt.id,
      branch: attempt.branch,
      baseBranch: baseBranch,
      position: { x: index * 120 + 60, y: branchLane * 80 + 40 },
      status: attempt.merge_commit ? 'merged' : 'active'
    };
    
    nodes.push(branchNode);

    // Connection from base branch to new branch
    connections.push({
      from: `base-${baseBranch}-${index}`,
      to: branchNode.id,
      type: 'branch'
    });

    // Add base branch node if this is the first time we see it
    if (!nodes.find(n => n.id === `base-${baseBranch}-${index}`)) {
      nodes.push({
        id: `base-${baseBranch}-${index}`,
        type: 'branch',
        branch: baseBranch,
        baseBranch: '',
        position: { x: index * 120 + 60, y: baseLane * 80 + 40 },
        status: 'active'
      });
    }

    // Add PR node if exists
    if (attempt.pr_url) {
      const prNode: GitNode = {
        id: `pr-${attempt.id}`,
        type: 'pr',
        attemptId: attempt.id,
        branch: attempt.branch,
        baseBranch: baseBranch,
        position: { x: index * 120 + 100, y: branchLane * 80 + 40 },
        status: attempt.pr_status === 'merged' ? 'merged' : 'pending',
        prUrl: attempt.pr_url,
        prStatus: attempt.pr_status || undefined,
        mergedAt: attempt.pr_merged_at || undefined
      };
      
      nodes.push(prNode);
      
      connections.push({
        from: branchNode.id,
        to: prNode.id,
        type: 'branch'
      });
    }

    // Add merge node if merged
    if (attempt.merge_commit) {
      const mergeNode: GitNode = {
        id: `merge-${attempt.id}`,
        type: 'merge',
        attemptId: attempt.id,
        branch: attempt.branch,
        baseBranch: baseBranch,
        position: { x: index * 120 + 140, y: baseLane * 80 + 40 },
        status: 'merged'
      };
      
      nodes.push(mergeNode);
      
      connections.push({
        from: attempt.pr_url ? `pr-${attempt.id}` : branchNode.id,
        to: mergeNode.id,
        type: 'merge'
      });
    }
  });

  return { nodes, connections };
};

const getNodeIcon = (node: GitNode) => {
  switch (node.type) {
    case 'branch':
      return <GitBranch className="h-4 w-4" />;
    case 'pr':
      return <GitPullRequest className="h-4 w-4" />;
    case 'merge':
      return <GitMerge className="h-4 w-4" />;
    default:
      return <Circle className="h-4 w-4" />;
  }
};

const getNodeColor = (node: GitNode) => {
  switch (node.status) {
    case 'active':
      return 'bg-blue-500 border-blue-600 text-white';
    case 'merged':
      return 'bg-green-500 border-green-600 text-white';
    case 'failed':
      return 'bg-red-500 border-red-600 text-white';
    case 'pending':
      return 'bg-yellow-500 border-yellow-600 text-white';
    default:
      return 'bg-gray-400 border-gray-500 text-white';
  }
};

const getConnectionPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} Q ${midX} ${from.y} ${to.x} ${to.y}`;
};

export function GitStateTreeVisualization({
  attempts,
  selectedAttemptId,
  onAttemptSelect
}: GitStateTreeVisualizationProps) {
  const { nodes, connections } = calculateNodePositions(attempts);
  
  if (attempts.length === 0) {
    return (
      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-lg border text-center">
        <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No branches created yet</p>
      </div>
    );
  }

  const maxX = Math.max(...nodes.map(n => n.position.x)) + 60;
  const maxY = Math.max(...nodes.map(n => n.position.y)) + 60;

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-lg border">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-lg font-semibold">🌳 Git State Tree</div>
        <div className="text-sm text-muted-foreground">
          Visualize branching, PRs, and merges
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={Math.max(600, maxX)}
          height={Math.max(300, maxY)}
          className="border rounded bg-white dark:bg-gray-950"
        >
          {/* Render connections */}
          {connections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            return (
              <path
                key={`${connection.from}-${connection.to}-${index}`}
                d={getConnectionPath(fromNode.position, toNode.position)}
                stroke={connection.type === 'merge' ? '#10b981' : '#3b82f6'}
                strokeWidth="2"
                fill="none"
                strokeDasharray={connection.type === 'branch' ? '5,5' : 'none'}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const isSelected = node.attemptId === selectedAttemptId;
            
            return (
              <g key={node.id}>
                {/* Node circle */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={isSelected ? 20 : 16}
                  className={`cursor-pointer transition-all duration-200 ${getNodeColor(node)} ${
                    isSelected ? 'stroke-4 stroke-blue-300' : 'stroke-2'
                  }`}
                  onClick={() => node.attemptId && onAttemptSelect?.(node.attemptId)}
                />
                
                {/* Node icon */}
                <foreignObject
                  x={node.position.x - 8}
                  y={node.position.y - 8}
                  width="16"
                  height="16"
                  className="pointer-events-none"
                >
                  <div className="flex items-center justify-center text-white">
                    {getNodeIcon(node)}
                  </div>
                </foreignObject>
                
                {/* Node label */}
                <text
                  x={node.position.x}
                  y={node.position.y + 35}
                  textAnchor="middle"
                  className="text-xs fill-current text-gray-700 dark:text-gray-300 font-medium"
                >
                  {node.branch.length > 12 ? `${node.branch.slice(0, 12)}...` : node.branch}
                </text>
                
                {/* PR info */}
                {node.type === 'pr' && (
                  <text
                    x={node.position.x}
                    y={node.position.y + 50}
                    textAnchor="middle"
                    className="text-xs fill-current text-blue-600 dark:text-blue-400"
                  >
                    {node.prStatus === 'merged' ? '✅ Merged' : '🔄 Open'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <GitBranch className="h-2 w-2 text-white" />
            </div>
            <span>Branch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <GitPullRequest className="h-2 w-2 text-white" />
            </div>
            <span>Pull Request</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <GitMerge className="h-2 w-2 text-white" />
            </div>
            <span>Merged</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="20" height="8" className="text-blue-500">
              <path d="M 0 4 L 20 4" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
            </svg>
            <span>Branch connection</span>
          </div>
        </div>
      </div>

      {/* Branch info panel */}
      {selectedAttemptId && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          {(() => {
            const selectedAttempt = attempts.find(a => a.id === selectedAttemptId);
            if (!selectedAttempt) return null;
            
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{selectedAttempt.branch}</span>
                  {selectedAttempt.pr_url && (
                    <a
                      href={selectedAttempt.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <GitPullRequest className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Base: {selectedAttempt.base_branch || 'main'}
                </div>
                {selectedAttempt.merge_commit && (
                  <div className="text-sm text-green-600">
                    ✅ Merged: {selectedAttempt.merge_commit.slice(0, 8)}
                  </div>
                )}
                {selectedAttempt.pr_merged_at && (
                  <div className="text-sm text-muted-foreground">
                    Merged: {new Date(selectedAttempt.pr_merged_at).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}