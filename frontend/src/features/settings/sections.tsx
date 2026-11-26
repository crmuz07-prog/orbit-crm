import type { ReactNode } from 'react'
import {
  Ban, Database, Instagram, ListChecks, Phone, ShieldCheck, SlidersHorizontal, UserCircle, Users, UsersRound, type LucideIcon,
} from 'lucide-react'
import { AccessRolesCard } from '@/features/access/AccessRolesCard'
import { SalesTeamsCard } from '@/features/access/SalesTeamsCard'
import { useAccessConfig } from '@/features/access/useAccessConfig'
import { CustomFieldsCard } from '@/features/fields/CustomFieldsCard'
import { LostReasonsCard } from '@/features/fields/LostReasonsCard'
import { InstagramCard } from '@/features/instagram/InstagramCard'
import { TeamCard } from '@/features/team/TeamCard'
import { TelephonyCard } from '@/features/telephony/TelephonyCard'
import { ProfileSection } from './ProfileSection'
import { DataCard } from './DataCard'
import { StageEditor } from './StageEditor'
import type { setup } from '@/i18n/locales/en/setup'

export const GROUPS = ['personal', 'team', 'sales', 'integrations', 'data'] as const
export type Group = (typeof GROUPS)[number]

/** A section id is a key of `setup.nav`, so every menu entry has its label in all three languages. */
export type SectionId = keyof typeof setup.setup.nav

export interface Section {
  id: SectionId
  group: Group
  icon: LucideIcon
  /** Workspace configuration: owners and admins only (mirrors the API); the demo shows it to everyone. */
  admin?: boolean
  render: (isAdmin: boolean) => ReactNode
}

function Members({ isAdmin }: { isAdmin: boolean }) {
  const access = useAccessConfig(isAdmin)
  return <TeamCard access={isAdmin ? access.config : undefined} />
}

function Roles() {
  return <AccessRolesCard actions={useAccessConfig(true)} />
}

function Teams() {
  return <SalesTeamsCard actions={useAccessConfig(true)} />
}

/** Every settings section, in menu order: one job per section, grouped the way the menu shows them. */
export const SECTIONS: Section[] = [
  { id: 'profile', group: 'personal', icon: UserCircle, render: () => <ProfileSection /> },
  { id: 'members', group: 'team', icon: Users, render: (isAdmin) => <Members isAdmin={isAdmin} /> },
  { id: 'roles', group: 'team', icon: ShieldCheck, admin: true, render: () => <Roles /> },
  { id: 'teams', group: 'team', icon: UsersRound, admin: true, render: () => <Teams /> },
  { id: 'pipelines', group: 'sales', icon: SlidersHorizontal, admin: true, render: () => <StageEditor /> },
  { id: 'fields', group: 'sales', icon: ListChecks, admin: true, render: () => <CustomFieldsCard /> },
  { id: 'lostReasons', group: 'sales', icon: Ban, admin: true, render: () => <LostReasonsCard /> },
  { id: 'telephony', group: 'integrations', icon: Phone, admin: true, render: () => <TelephonyCard /> },
  { id: 'instagram', group: 'integrations', icon: Instagram, admin: true, render: () => <InstagramCard /> },
  { id: 'data', group: 'data', icon: Database, admin: true, render: () => <DataCard /> },
]
