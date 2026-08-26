export interface Sponsor {
  name: string
  img: string
  url: string
}

export const autojoin: Sponsor = {
  name: 'Autojoin',
  img: '/sponsors/autojoin.svg',
  url: 'https://autojoin.app/?utm_source=laravel-tackle&utm_medium=docs&utm_campaign=sponsor',
}

export const homeSponsors = [
  {
    tier: 'Sponsors',
    size: 'medium' as const,
    items: [autojoin],
  },
]

export const asideSponsors = [
  {
    tier: 'Sponsor',
    size: 'small' as const,
    items: [autojoin],
  },
]
