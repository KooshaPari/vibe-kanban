import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function is_planning_executor_type(executorType: string): boolean {
  return executorType === 'claude-plan';
}
