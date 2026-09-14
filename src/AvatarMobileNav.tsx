import { useAvatarLocale } from './avatarLocale'

export type AvatarMobileSection = 'preview' | 'build' | 'body' | 'style' | 'effects' | 'animation'

const MOBILE_NAV_ITEMS: readonly {
  readonly id: AvatarMobileSection
  readonly label: string
}[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'build', label: 'Avatar type' },
  { id: 'body', label: 'Body' },
  { id: 'style', label: 'Style' },
  { id: 'effects', label: 'Effects' },
  { id: 'animation', label: 'Animation' }
]

function MobileNavIcon({ name }: { readonly name: AvatarMobileSection }) {
  return (
    <svg className='avatar-app__mobile-nav-icon' viewBox='0 0 20 20' aria-hidden='true'>
      {name === 'preview'
        ? (
          <>
            <path d='M2.6 10C4.3 6.6 7 4.8 10 4.8s5.7 1.8 7.4 5.2c-1.7 3.4-4.4 5.2-7.4 5.2S4.3 13.4 2.6 10Z' />
            <circle cx='10' cy='10' r='2.5' />
          </>
        )
        : null}
      {name === 'build'
        ? (
          <>
            <path d='M3 5h14M3 10h14M3 15h14' />
            <circle cx='7' cy='5' r='1.6' />
            <circle cx='13' cy='10' r='1.6' />
            <circle cx='8.5' cy='15' r='1.6' />
          </>
        )
        : null}
      {name === 'body'
        ? (
          <>
            <circle cx='7.2' cy='8' r='3.7' />
            <rect x='9.5' y='8.5' width='7' height='7' rx='1.5' />
          </>
        )
        : null}
      {name === 'style'
        ? (
          <>
            <path d='M10 2.7a7.3 7.3 0 1 0 0 14.6h1.1a1.8 1.8 0 0 0 0-3.6h-.7a1.5 1.5 0 0 1 0-3h2.8A4.1 4.1 0 0 0 17.3 6.6C17.3 4.4 14 2.7 10 2.7Z' />
            <circle cx='6.2' cy='7.1' r='.8' />
            <circle cx='9.3' cy='5.4' r='.8' />
            <circle cx='13' cy='6.2' r='.8' />
          </>
        )
        : null}
      {name === 'effects'
        ? <path d='m10 2 1.3 4.2L15.5 7.5l-4.2 1.3L10 13l-1.3-4.2-4.2-1.3 4.2-1.3L10 2Zm5.2 10 .7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z' />
        : null}
      {name === 'animation'
        ? (
          <>
            <rect x='2.8' y='4' width='14.4' height='12' rx='2' />
            <path d='m8 7 5 3-5 3Z' />
          </>
        )
        : null}
    </svg>
  )
}

export function AvatarMobileNav({
  active,
  onSelect
}: {
  readonly active: AvatarMobileSection
  readonly onSelect: (section: AvatarMobileSection) => void
}) {
  const { t } = useAvatarLocale()

  return (
    <nav className='avatar-app__mobile-nav' aria-label={t('Editor modes')}>
      {MOBILE_NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className='avatar-app__mobile-nav-item'
          type='button'
          aria-current={active === item.id ? 'page' : undefined}
          aria-label={t(item.label)}
          title={t(item.label)}
          onClick={() => onSelect(item.id)}
        >
          <MobileNavIcon name={item.id} />
          <span>{t(item.label)}</span>
        </button>
      ))}
    </nav>
  )
}
