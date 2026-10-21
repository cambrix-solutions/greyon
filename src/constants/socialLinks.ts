/**
 * Official Greyon social profile URLs.
 *
 * TODO(client): Replace empty strings with the real Facebook, YouTube, and
 * TikTok profile URLs once the client confirms them. Do not invent URLs.
 * Icons whose URL is empty are hidden in the footer.
 */
export type SocialNetwork = "facebook" | "youtube" | "tiktok";

export type SocialLink = {
  id: SocialNetwork;
  label: string;
  /** Absolute profile URL, or empty until confirmed by the client. */
  url: string;
};

export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    id: "facebook",
    label: "Facebook",
    // TODO(client): set official Facebook URL
    url: ""
  },
  {
    id: "youtube",
    label: "YouTube",
    // TODO(client): set official YouTube URL
    url: ""
  },
  {
    id: "tiktok",
    label: "TikTok",
    // TODO(client): set official TikTok URL
    url: ""
  }
] as const;

/** Links that have a non-empty URL and should be shown. */
export function visibleSocialLinks(
  links: readonly SocialLink[] = SOCIAL_LINKS
): SocialLink[] {
  return links.filter(link => Boolean(link.url.trim()));
}
