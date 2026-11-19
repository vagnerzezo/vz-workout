import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pencil } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { ActionIconButton, ResourceActionMenu } from './resource-actions'
import { ResourceConfirmDialog } from './resource-confirm-dialog'

describe('ResourceActionMenu', () => {
  it('mostra rótulos padrão com ícone, esconde as ações com when=false e põe as destrutivas no fim', async () => {
    const user = userEvent.setup()
    const onArchive = vi.fn()
    render(
      <ResourceActionMenu
        name="Ficha A"
        actions={[
          { kind: 'archive', onSelect: onArchive },
          { kind: 'edit', onSelect: () => {} },
          { kind: 'restore', onSelect: () => {}, when: false },
          { kind: 'view', label: 'Ver perfil', onSelect: () => {} },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Mais ações para Ficha A' }))
    const items = await screen.findAllByRole('menuitem')
    expect(items.map((i) => i.textContent)).toEqual(['Editar', 'Ver perfil', 'Arquivar'])
    expect(items.every((i) => i.querySelector('svg'))).toBe(true)
    expect(screen.getByRole('separator')).toBeInTheDocument()

    await user.click(items[2]!)
    expect(onArchive).toHaveBeenCalledOnce()
  })
})

describe('ActionIconButton', () => {
  it('usa o rótulo como nome acessível', () => {
    render(<ActionIconButton label="Editar exercício" icon={Pencil} />)
    expect(screen.getByRole('button', { name: 'Editar exercício' })).toBeInTheDocument()
  })
})

describe('ResourceConfirmDialog', () => {
  it('troca o texto do botão enquanto salva e trava os botões', () => {
    render(<ResourceConfirmDialog intent="delete" open title="Excluir item?" description="Não dá para desfazer." pending onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('alertdialog', { name: 'Excluir item?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluindo…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled()
  })
})
