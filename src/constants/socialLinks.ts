/**
 * Greyon social profile URLs shared by the site footer and Contact page.
 */
export type SocialNetwork = "facebook" | "youtube" | "tiktok";

export type SocialLink = {
  id: SocialNetwork;
  label: string;
  /** Absolute URL opened in a new tab. */
  url: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: "facebook",
    label: "Facebook",
    url: "https://www.facebook.com/greyonapartmentandhotel"
  },
  {
    id: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/@greyonapartmentandhotel"
  },
  {
    id: "tiktok",
    label: "TikTok",
    url: "https://www.tiktok.com/@greyon2023"
  }
] as const;
