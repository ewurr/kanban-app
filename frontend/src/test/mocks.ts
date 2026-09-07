import type { Task as TaskType } from '../types/kanban'

/**
 * Testlerde kullanılan sahte (mock) bir Task nesnesi üretir.
 * overrides ile istediğin alanı değiştirip farklı senaryolar kurabilirsin.
 */
export function createMockTask(overrides: Partial<TaskType> = {}): TaskType {
  return {
    id: 1,
    title: 'Test Task',
    description: null,
    priority: 'medium',
    position: 0,
    color: '#ffffff',
    dueDate: null,
    column: { id: 10, name: 'In Progress', board: { id: 1 } as never },
    assignments: [],
    labels: [],
    checklistItems: [],
    ...overrides,
  } as TaskType
}