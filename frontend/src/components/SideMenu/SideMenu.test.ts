import { describe, it, expect } from 'vitest'
import { getColumnOrder, getColumnColor } from './SideMenu'

describe('getColumnOrder', () => {
  it('bilinen kolon isimlerini doğru sıraya koyar', () => {
    expect(getColumnOrder('To Do')).toBe(0)
    expect(getColumnOrder('In Progress')).toBe(1)
    expect(getColumnOrder('Done')).toBe(2)
  })

  it('büyük/küçük harf farkını görmezden gelir', () => {
    expect(getColumnOrder('to do')).toBe(0)
    expect(getColumnOrder('TO DO')).toBe(0)
    expect(getColumnOrder('tO dO')).toBe(0)
  })

  it('bilinmeyen bir kolon ismi için 3 (en sona) döner', () => {
    expect(getColumnOrder('Backlog')).toBe(3)
    expect(getColumnOrder('')).toBe(3)
  })
})

describe('getColumnColor', () => {
  it('bilinen kolonlar için doğru rengi döner', () => {
    expect(getColumnColor('To Do')).toBe('#FF6B6B')
    expect(getColumnColor('In Progress')).toBe('#FFD93D')
    expect(getColumnColor('Done')).toBe('#6BCB77')
  })

  it('büyük/küçük harf farkını görmezden gelir', () => {
    expect(getColumnColor('DONE')).toBe('#6BCB77')
  })

  it('bilinmeyen bir kolon ismi için varsayılan mavi rengi döner', () => {
    expect(getColumnColor('Backlog')).toBe('#4A90E2')
    expect(getColumnColor('')).toBe('#4A90E2')
  })
})