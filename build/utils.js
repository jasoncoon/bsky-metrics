export function getElementById(id) {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Unable to get element by id ${id}`);
    return element;
}
export async function getProfile(username) {
    try {
        let response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`);
        const profile = await response.json();
        return profile;
    }
    catch (error) {
        console.error("error getting profile: ", error);
        return undefined;
    }
}
export async function getSocialMetrics(handle) {
    const response = await fetch(`https://social-metrics.evilgeniuslabs.org/query?social=Bluesky&handle=${handle}`);
    const body = (await response.json());
    return body.Items;
}
