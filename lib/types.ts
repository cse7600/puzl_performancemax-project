export interface AdImage {
  src: string;
  alt: string;
  landingUrl: string;
}

export interface AdSubLink {
  text: string;
  landingUrl: string;
}

export interface Ad {
  rank: number;
  advertiser: string;
  displayDomain: string;
  title: string;
  description: string;
  landingUrl: string;
  subLinks: AdSubLink[];
  images: AdImage[];
}

export interface AdSnapshot {
  id: string;
  query: string;
  platform: 'pc' | 'mobile';
  monitored_at: string;
  ads: Ad[];
  ad_count: number;
  created_at: string;
}

export interface RankChange {
  advertiser: string;
  prev_rank: number | null;
  curr_rank: number | null;
  change_type: 'new' | 'removed' | 'up' | 'down' | 'same';
}

export interface ScrapeResult {
  query: string;
  monitoredAt: string;
  pc: { count: number; ads: Ad[] };
  mobile: { count: number; ads: Ad[] };
}
