import { fireEvent, screen } from '@testing-library/react'

export function openCatalog() {
  fireEvent.click(screen.getByText(/^卷[壹贰叁肆伍陆] · /, { selector: 'summary' }))
  fireEvent.click(screen.getByRole('button', { name: '全部卷目' }))
}
