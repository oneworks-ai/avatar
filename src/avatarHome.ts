export const LAST_EDITOR_QUERY_STORAGE_KEY = 'oneworks-avatar-last-editor-query-v1'

export const HOME_TEMPLATE_IDS = ['dog', 'cat', 'bear', 'rabbit', 'cloud', 'sun'] as const

export type HomeTemplateId = (typeof HOME_TEMPLATE_IDS)[number]

export interface HomeTemplate {
  readonly accent: string
  readonly background: string
  readonly id: HomeTemplateId
  readonly label: string
}

export const HOME_TEMPLATES: readonly HomeTemplate[] = [
  { accent: '#241f1c', background: '#0e4fe7', id: 'dog', label: 'Dog' },
  { accent: '#08090b', background: '#ff766c', id: 'cat', label: 'Cat' },
  { accent: '#9f5f48', background: '#f2bd4f', id: 'bear', label: 'Bear' },
  { accent: '#f4f0e8', background: '#f08c46', id: 'rabbit', label: 'Rabbit' },
  { accent: '#ffffff', background: '#87bfff', id: 'cloud', label: 'Cloud' },
  { accent: '#eaa064', background: '#382641', id: 'sun', label: 'Sun' }
] as const
