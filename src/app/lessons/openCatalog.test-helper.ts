import { fireEvent, screen } from '@testing-library/react'

export function openCatalog() {
  const toggle = screen.getByText(/^卷[壹贰叁肆伍陆] · /, { selector: 'summary' })
  if (!toggle.closest('details')?.open) fireEvent.click(toggle)
  fireEvent.click(screen.getByRole('button', { name: '全部卷目' }))
}

export function openLessonCheck(lesson: string, check: string) {
  fireEvent.click(screen.getByRole('button', { name: lesson }))
  fireEvent.click(screen.getByText(/^卷[贰叁] · /, { selector: 'summary' }))
  fireEvent.click(screen.getByRole('button', { name: `自己试试 ${check}` }))
}
