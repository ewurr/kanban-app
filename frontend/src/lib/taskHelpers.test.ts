import { describe, it, expect } from 'vitest'
import { findOriginalTask, reorderColumnTasks, resolveTargetColumnId } from './taskHelpers'
import { createMockTask } from '../test/mocks'

describe('findOriginalTask', () => {
  it('sunucu listesinde task bulunursa, onun gerçek halini döner', () => {
    const realTask = createMockTask({ id: 5, column: { id: 10, name: 'In Progress', board: { id: 1 } as never } })
    const staleTask = createMockTask({ id: 5, column: { id: 20, name: 'Done', board: { id: 1 } as never } })

    const result = findOriginalTask([realTask], staleTask, 5)

    expect(result.column.id).toBe(10)
  })

  it('sunucu listesi undefined ise, fallback dönülür', () => {
    const staleTask = createMockTask({ id: 5, column: { id: 20, name: 'Done', board: { id: 1 } as never } })

    const result = findOriginalTask(undefined, staleTask, 5)

    expect(result).toBe(staleTask)
  })

  it('task sunucu listesinde yoksa, fallback dönülür', () => {
    const otherTask = createMockTask({ id: 99 })
    const staleTask = createMockTask({ id: 5, column: { id: 20, name: 'Done', board: { id: 1 } as never } })

    const result = findOriginalTask([otherTask], staleTask, 5)

    expect(result).toBe(staleTask)
  })
})

describe('resolveTargetColumnId', () => {
  it('overId bir kolon ID\'si ise (column- ön ekiyle), o ID\'yi sayıya çevirip döner', () => {
    const result = resolveTargetColumnId('column-42', [])
    expect(result).toBe(42)
  })

  it('overId bir task ID\'si ise, o task\'ın bulunduğu kolonu döner', () => {
    const task = createMockTask({ id: 7, column: { id: 15, name: 'Done', board: { id: 1 } as never } })
    const result = resolveTargetColumnId('7', [task])
    expect(result).toBe(15)
  })

  it('overId bir task ID\'si ama task listede yoksa, null döner', () => {
    const result = resolveTargetColumnId('999', [])
    expect(result).toBeNull()
  })
})

describe('reorderColumnTasks', () => {
  it('overId bir kolon ID\'si ise, mevcut position sıralamasını korur', () => {
    const t1 = createMockTask({ id: 1, position: 0 })
    const t2 = createMockTask({ id: 2, position: 1 })
    const t3 = createMockTask({ id: 3, position: 2 })

    const result = reorderColumnTasks([t3, t1, t2], 1, 'column-10')

    expect(result.map((t) => t.id)).toEqual([1, 2, 3])
  })

  it('overId bir task ID\'si ise, sürüklenen task o task\'ın yerine geçer', () => {
    const t1 = createMockTask({ id: 1, position: 0 })
    const t2 = createMockTask({ id: 2, position: 1 })
    const t3 = createMockTask({ id: 3, position: 2 })

    // task 3'ü, task 1'in yerine sürüklüyoruz
    const result = reorderColumnTasks([t1, t2, t3], 3, '1')

    expect(result.map((t) => t.id)).toEqual([3, 1, 2])
  })

  it('over task listede yoksa, sıralamayı position\'a göre olduğu gibi döner', () => {
    const t1 = createMockTask({ id: 1, position: 0 })
    const t2 = createMockTask({ id: 2, position: 1 })

    const result = reorderColumnTasks([t2, t1], 1, '999')

    expect(result.map((t) => t.id)).toEqual([1, 2])
  })
})