// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ResponsiveExplanation } from './ResponsiveExplanation'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('手机可主动展开，跨到桌面默认展开，返回手机恢复折叠', () => {
  let matches = false
  let notify = () => {}
  const remove = vi.fn()
  vi.stubGlobal('matchMedia', () => ({ matches, addEventListener: (_: string, callback: () => void) => { notify = callback }, removeEventListener: remove }))
  const view = render(<ResponsiveExplanation summary="详细分析"><p>完整原因</p></ResponsiveExplanation>)
  const details = () => screen.getByText('详细分析').closest('details')!
  expect(details().open).toBe(false)
  fireEvent.click(screen.getByText('详细分析'))
  expect(details().open).toBe(true)
  act(() => { matches = true; notify() })
  expect(details().open).toBe(true)
  act(() => { matches = false; notify() })
  expect(details().open).toBe(false)
  view.unmount()
  expect(remove).toHaveBeenCalledOnce()
})
