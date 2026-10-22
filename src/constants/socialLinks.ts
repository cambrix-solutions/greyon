/**
 * Greyon social profile URLs for the site footer.
 *
 * Icons are always shown. Until the client confirms official profile URLs,
 * each entry uses the platform home page as a TODO placeholder.
 */
export type SocialNetwork = "facebook" | "youtube" | "tiktok";

export type SocialLink = {
  id: SocialNetwork;
  label: string;
  /** Absolute URL opened in a new tab from the footer. */
  url: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: "facebook",
    label: "Facebook",
    // TODO(client): replace with official Greyon Facebook profile URL
    url: "https://www.facebook.com"
  },
  {
    id: "youtube",
    label: "YouTube",
    // TODO(client): replace with official Greyon YouTube channel URL
    url: "https://www.youtube.com"
  },
  {
    id: "tiktok",
    label: "TikTok",
    // TODO(client): replace with official Greyon TikTok profile URL
    url: "https://www.tiktok.com"
  }
] as const;
