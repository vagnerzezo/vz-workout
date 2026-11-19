import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { formatPhone, phoneDigits, StudentProfileEdit, type StudentDetail } from '@workspace/core'
import { Button } from '@workspace/ui/components/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@workspace/ui/components/drawer'
import { cn } from '@workspace/ui/lib/utils'
import { ApiError } from '../../../shared/api/client'
import { Chips, field, fieldLabel, Hint } from '../../../shared/components/form-parts'
import { usePhoneOwner } from '../../new-student/api/queries'
import { useUpdateStudentProfile } from '../api/queries'

type EditStudentDrawerProps = {
  detail: StudentDetail
  open: boolean
  onClose: () => void
}

/** "Editar dados": corrige o cadastro do aluno. Plano e cobrança ficam no Financeiro. */
export function EditStudentDrawer({ detail, open, onClose }: EditStudentDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-[560px] rounded-t-[26px] pb-[env(safe-area-inset-bottom)]">
        {/* key: reabrir depois de salvar começa dos dados novos */}
        {open && <EditStudentForm key={detail.student.id} detail={detail} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  )
}

const toForm = (d: StudentDetail): StudentProfileEdit => ({
  fullName: d.student.fullName,
  phone: d.phone ? formatPhone(d.phone) : '',
  email: d.student.email ?? '',
  birthDate: d.birthDate,
  sex: d.sex,
  heightCm: d.heightCm,
  city: d.city,
})

const emptyToNull = (v: unknown) => (v === '' || v === null || v === undefined ? null : v)

function EditStudentForm({ detail: d, onClose }: { detail: StudentDetail; onClose: () => void }) {
  const id = d.student.id
  const update = useUpdateStudentProfile(id)
  const { register, control, handleSubmit, setValue, setError, formState } = useForm<StudentProfileEdit>({
    resolver: zodResolver(StudentProfileEdit),
    mode: 'onTouched',
    defaultValues: toForm(d),
  })
  const { errors, isDirty } = formState
  const phone = useWatch({ control, name: 'phone' })
  const found = usePhoneOwner(phone).data ?? null
  const owner = found && found.id !== id ? found : null // o próprio número não conta

  const submit = handleSubmit((form) => {
    if (owner) return
    update.mutate(form, {
      onSuccess: () => {
        toast.success('Dados do aluno salvos')
        onClose()
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) setError('phone', { message: 'Este número já é de outro aluno.' })
        else setError('root', { message: 'Não foi possível salvar. Tente de novo.' })
      },
    })
  })

  return (
    <form noValidate onSubmit={submit} aria-label="Editar dados do aluno" className="flex min-h-0 flex-col">
      <DrawerHeader className="gap-0.5 pt-5 group-data-[swipe-axis=y]/drawer-popup:text-left">
        <DrawerTitle className="text-[17px] font-extrabold">Editar dados</DrawerTitle>
        <DrawerDescription className="text-xs">Plano e cobrança mudam no Financeiro.</DrawerDescription>
      </DrawerHeader>

      <div className="flex min-h-0 flex-col gap-3.5 overflow-y-auto px-4 pt-2 pb-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="editar-nome" className={fieldLabel}>
            Nome completo
          </label>
          <input {...register('fullName')} id="editar-nome" autoComplete="off" aria-invalid={!!errors.fullName} aria-describedby="editar-nome-ajuda" className={field} />
          <Hint id="editar-nome-ajuda" tone={errors.fullName ? 'error' : 'muted'}>
            {errors.fullName?.message ?? 'Aparece assim no app, nos PDFs e nas cobranças'}
          </Hint>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="editar-whats" className={fieldLabel}>
            WhatsApp
          </label>
          <input
            {...register('phone', { onBlur: (e) => setValue('phone', formatPhone(e.target.value)) })}
            id="editar-whats"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(51) 99999-9999"
            aria-invalid={!!errors.phone || !!owner}
            aria-describedby="editar-whats-ajuda"
            className={cn(field, owner && 'border-warning')}
          />
          {owner ? (
            <Hint id="editar-whats-ajuda" tone="warning">
              Este número já é de{' '}
              <Link to={`/alunos/${owner.id}`} className="font-bold underline underline-offset-2">
                {owner.fullName}
              </Link>
              .
            </Hint>
          ) : (
            <Hint id="editar-whats-ajuda" tone={errors.phone ? 'error' : 'muted'}>
              {errors.phone?.message ?? (phoneDigits(phone) !== phoneDigits(d.phone ?? '') ? 'É o login do aluno: avise que mudou' : 'É o login do aluno no app')}
            </Hint>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="editar-email" className={fieldLabel}>
            E-mail <span className="font-semibold text-muted-foreground">· opcional, usado para recuperar a senha</span>
          </label>
          <input {...register('email')} id="editar-email" type="email" inputMode="email" autoComplete="off" placeholder="aluno@email.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'editar-email-erro' : undefined} className={field} />
          {errors.email && (
            <Hint id="editar-email-erro" tone="error">
              {errors.email.message}
            </Hint>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="editar-nascimento" className={fieldLabel}>
              Nascimento
            </label>
            <input {...register('birthDate', { setValueAs: emptyToNull })} id="editar-nascimento" type="date" aria-invalid={!!errors.birthDate} className={cn(field, 'min-w-0 px-2.5 text-sm [color-scheme:dark]')} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="editar-altura" className={fieldLabel}>
              Altura (cm)
            </label>
            <input
              {...register('heightCm', { setValueAs: (v) => (emptyToNull(v) === null ? null : Number(v)) })}
              id="editar-altura"
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              aria-invalid={!!errors.heightCm}
              aria-describedby={errors.heightCm ? 'editar-altura-erro' : undefined}
              className={cn(field, 'min-w-0')}
            />
          </div>
        </div>
        {(errors.birthDate || errors.heightCm) && (
          <Hint id="editar-altura-erro" tone="error">
            {errors.birthDate?.message ?? errors.heightCm?.message}
          </Hint>
        )}

        <Controller
          control={control}
          name="sex"
          render={({ field: f }) => (
            <Chips
              label="Sexo"
              value={f.value}
              onChange={f.onChange}
              options={[
                { value: 'female', label: 'Feminino' },
                { value: 'male', label: 'Masculino' },
                { value: null, label: 'Não informar' },
              ]}
            />
          )}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="editar-cidade" className={fieldLabel}>
            Cidade
          </label>
          <input {...register('city', { setValueAs: (v) => emptyToNull(typeof v === 'string' ? v.trim() : v) })} id="editar-cidade" autoComplete="off" placeholder="Porto Alegre, RS" aria-invalid={!!errors.city} className={field} />
          {errors.city && (
            <Hint id="editar-cidade-erro" tone="error">
              {errors.city.message}
            </Hint>
          )}
        </div>

        {errors.root && (
          <p role="alert" className="text-sm font-bold text-destructive">
            {errors.root.message}
          </p>
        )}
      </div>

      <DrawerFooter className="flex-row gap-2">
        <Button type="button" variant="outline" size="lg" className="grow" onClick={onClose} disabled={update.isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="grow" disabled={!isDirty || !!owner || update.isPending}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </DrawerFooter>
    </form>
  )
}
