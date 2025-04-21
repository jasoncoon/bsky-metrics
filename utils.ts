export function getElementById(id: string): HTMLFormElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Unable to get element by id ${id}`);
  return element as HTMLFormElement;
}

export interface Profile {
  did: string;
  handle: string;
  displayName: string;
  avatar: string;
  labels: any[];
  createdAt: string;
  description: string;
  indexedAt: string;
  banner: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
}

export async function getProfile(
  username: string
): Promise<Profile | undefined> {
  try {
    let response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`
    );
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error("error getting profile: ", error);
    return undefined;
  }
}

export interface SocialMetric {
  date: string;
  followers: number;
  handle: string;
}

export async function getSocialMetrics(handle: string) {
  const response = await fetch(
    `https://social-metrics.evilgeniuslabs.org/query?social=Bluesky&handle=${handle}`
  );

  const body = (await response.json()) as { Items: SocialMetric[] };

  return body.Items;
}
