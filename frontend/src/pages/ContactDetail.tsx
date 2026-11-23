import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Linkedin, Mail, Pencil, Phone, Users } from 'lucide-react'
import { PersonAvatar } from '@/components/common/avatars'
import { BackLink, PropertyList, RecordHeader, RecordLayout } from '@/components/common/record'
import { DeleteRecordButton, RecordNotFound } from '@/components/common/record-actions'
import { PageSkeleton } from '@/components/common/states'
import { Button } from '@/components/ui/button'
import { Composer } from '@/features/activities/Composer'
import { Timeline } from '@/features/activities/Timeline'
import { DealsListCard } from '@/features/deals/DealsListCard'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { useCrm } from '@/hooks/useData'
import { fullName, shortDate } from '@/lib/utils'

const link = 'text-primary hover:underline'

export default function ContactDetailPage() {
  const { id = '' } = useParams()
  const { isLoading, contactById, companyById, deals, activities } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()

  if (isLoading) return <PageSkeleton />
  const contact = contactById.get(id)
  if (!contact) return <RecordNotFound icon={Users} label={t('entity.contact')} backTo="/contacts" />

  const name = fullName(contact)
  const company = contact.company_id ? companyById.get(contact.company_id) : undefined

  return (
    <>
      <BackLink to="/contacts" label={t('nav.contacts')} />
      <RecordHeader
        media={<PersonAvatar name={name} size="lg" />}
        title={name}
        subtitle={<>{contact.title}{company && <> {t('contacts.at')} <Link to={`/companies/${company.id}`} className="font-medium text-foreground hover:underline">{company.name}</Link></>}</>}
        actions={
          <>
            <Button variant="success" onClick={() => openModal({ kind: 'call', initial: { contact_id: id, company_id: contact.company_id } })}><Phone /> {t('contacts.call')}</Button>
            {contact.email && <Button variant="outline" asChild><a href={`mailto:${contact.email}`}><Mail /> {t('contacts.email')}</a></Button>}
            <Button variant="outline" onClick={() => openModal({ kind: 'contact', initial: contact })}><Pencil /> {t('common.edit')}</Button>
            <DeleteRecordButton table="contacts" id={id} title={t('contacts.deleteTitle', { name })} description={t('contacts.deleteDesc')} redirectTo="/contacts" />
          </>
        }
      />
      <RecordLayout
        side={
          <PropertyList
            title={t('contacts.about')}
            items={[
              [t('fields.email'), contact.email && <a href={`mailto:${contact.email}`} className={link}>{contact.email}</a>],
              [t('fields.phone'), contact.phone],
              [t('fields.jobTitle'), contact.title],
              [t('fields.company'), company && <Link to={`/companies/${company.id}`} className="hover:underline">{company.name}</Link>],
              ['LinkedIn', contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 ${link}`}><Linkedin className="size-3.5" /> {t('contacts.profile')}</a>],
              [t('contacts.created'), shortDate(contact.created_at)],
            ]}
          />
        }
        main={
          <>
            <DealsListCard deals={deals.filter((d) => d.contact_id === id)} onAdd={() => openModal({ kind: 'deal', initial: { contact_id: id, company_id: contact.company_id } })} />
            <Composer links={{ contact_id: id, company_id: contact.company_id }} />
            <Timeline activities={activities.filter((a) => a.contact_id === id)} showDeal />
          </>
        }
      />
    </>
  )
}
