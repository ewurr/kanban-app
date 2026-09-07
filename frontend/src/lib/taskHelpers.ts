import type { Task as TaskType } from '../types/kanban'

/**
 * Bir task'ı, sürüklenirken oluşabilecek geçici (sadece görsel önizleme
 * amaçlı) column değişikliklerinden bağımsız olarak, sunucudaki GERÇEK
 * haliyle bulur. Çöp kutusuna atma gibi, task'ın "resmi" halinin
 * kaydedilmesi gereken senaryolarda kullanılır — aksi halde, sürükleme
 * sırasında handleDragOver'ın yazdığı geçici column bilgisi yanlışlıkla
 * kalıcı hale gelebilir (örn. geri alma sonrası task'ın yanlış kolonda
 * belirmesi).
 */
export function findOriginalTask(
  serverTasks: TaskType[] | undefined,
  fallbackTask: TaskType,
  taskId: number
): TaskType {
  return (serverTasks ?? []).find((t) => t.id === taskId) ?? fallbackTask
}

/**
 * Bir drag-drop olayının over.id'sinden (bir kolon ID'si mi yoksa başka
 * bir task'ın ID'si mi olduğunu ayırt ederek) hedef kolonun ID'sini bulur.
 * over bir task'a denk geliyorsa, o task'ın bulunduğu kolonu döner.
 * Hedef bulunamazsa (task listede yoksa) null döner.
 */
export function resolveTargetColumnId(
  overId: string,
  allTasks: TaskType[]
): number | null {
  if (overId.startsWith('column-')) {
    return Number(overId.replace('column-', ''))
  }

  const overTask = allTasks.find((t) => t.id === Number(overId))
  return overTask ? overTask.column.id : null
}

/**
 * Bir kolondaki task'ları, sürüklenen task'ın "over" olduğu task'ın
 * pozisyonuna göre yeniden sıralar. overId bir kolon ID'siyse (yani
 * sürüklenen task boş bir alana ya da kolonun kendisine bırakıldıysa),
 * mevcut sıralama (position'a göre) korunur.
 */
export function reorderColumnTasks(
  columnTasks: TaskType[],
  activeTaskId: number,
  overId: string
): TaskType[] {
  const sorted = columnTasks.slice().sort((a, b) => a.position - b.position)

  if (overId.startsWith('column-')) {
    return sorted
  }

  const overTaskIndex = sorted.findIndex((t) => t.id === Number(overId))
  const activeIndex = sorted.findIndex((t) => t.id === activeTaskId)

  if (overTaskIndex !== -1 && activeIndex !== -1) {
    const [moved] = sorted.splice(activeIndex, 1)
    sorted.splice(overTaskIndex, 0, moved)
  }

  return sorted
}