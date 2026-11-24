import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Mail, Pencil, Phone, Users } from 'lucide-react'
import { BackLink } from '@/components/common/record'
import { DeleteRecordButton, RecordNotFound } from '@/components/common/record-actions'
import { RecordSkeleton } from '@/components/common/states'
import { IconButton } from '@/components/common/icon-button'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { DealsListCard } from '@/features/deals/DealsListCard'
import { useEntityModal } from '@/features/entity-modal/EntityModalProvider'
import { ContactInfo } from '@/features/record/ClientInfo'
import { InfoHeader, RecordCard } from '@/features/record/RecordCard'
import { useCrm } from '@/hooks/useData'
import { fullName } from '@/lib/utils'

/** A person: details on the left, everything that happened with them in the middle, their deals on the right. */
export default function ContactDetailPage() {
  const { id = '' } = useParams()
  const { isLoading, contactById, companyById, deals, activities } = useCrm()
  const openModal = useEntityModal()
  const { t } = useTranslation()

  if (isLoading) return <RecordSkeleton />
  const contact = contactById.get(id)
  if (!contact) return <RecordNotFound icon={Users} label={t('entity.contact')} backTo="/contacts" />

  const name = fullName(contact)
  const company = contact.company_id ? companyById.get(contact.company_id) : undefined
  const links = { contact_id: id, company_id: contact.company_id }

  return (
    <RecordCard
      link="contact_id"
      recordId={id}
      activities={activities.filter((a) => a.contact_id === id)}
      links={links}
      info={
        <>
          <InfoHeader back={<BackLink to="/contacts" label={t('nav.contacts')} />} title={name} shortId={id.slice(0, 8).toUpperCase()}
            actions={
              <>
                <IconButton label={t('contacts.call')} onClick={() => openModal({ kind: 'call', initial: links })}><Phone className="text-emerald-500" /></IconButton>
                {contact.email && <Tooltip content={t('contacts.email')}><Button variant="ghost" size="icon" asChild><a href={`mailto:${contact.email}`} aria-label={t('contacts.email')}><Mail /></a></Button></Tooltip>}
                <IconButton label={t('common.edit')} onClick={() => openModal({ kind: 'contact', initial: contact })}><Pencil /></IconButton>
                <DeleteRecordButton table="contacts" id={id} title={t('contacts.deleteTitle', { name })} description={t('contacts.deleteDesc')} redirectTo="/contacts" />
              </>
            }>
            {company && <p className="text-sm text-muted-foreground">{contact.title} {t('contacts.at')} <span className="font-medium text-foreground">{company.name}</span></p>}
          </InfoHeader>
          <ContactInfo contact={contact} />
        </>
      }
      widgets={<DealsListCard deals={deals.filter((d) => d.contact_id === id)} onAdd={() => openModal({ kind: 'deal', initial: links })} />}
    />
  )
}
