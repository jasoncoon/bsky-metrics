import { getElementById, getProfile, getSocialMetrics, } from "./utils.js";
// @ts-expect-error: google
google.charts.load("current", { packages: ["corechart"] });
// @ts-expect-error: google
google.charts.setOnLoadCallback(onLoad);
const buttonGo = getElementById("buttonGo");
const divCreated = getElementById("divCreated");
const divDescription = getElementById("divDescription");
const divDisplayName = getElementById("divDisplayName");
const divFollowers = getElementById("divFollowers");
const divFollowersChart = getElementById("divFollowersChart");
const divFollows = getElementById("divFollows");
const divHandle = getElementById("divHandle");
const divPosts = getElementById("divPosts");
const imgAvatar = getElementById("imgAvatar");
const imgBanner = getElementById("imgBanner");
const inputUsername = getElementById("inputUsername");
const link = getElementById("link");
const loading = getElementById("loading");
const spanStatus = getElementById("status");
const divProgress = getElementById("progress");
let displayName;
buttonGo.onclick = () => {
    const username = inputUsername?.value;
    const url = new URL(window.location.href);
    url.searchParams.set("username", username);
    window.location.href = url.toString();
    return false;
};
async function updateProfileDisplay(profile) {
    displayName = profile.displayName || profile.handle;
    if (profile?.avatar && !imgAvatar.src) {
        imgAvatar.src = profile.avatar;
    }
    if (profile?.banner && !imgBanner.src) {
        imgBanner.src = profile.banner;
    }
    divDescription.innerText = profile.description ?? "";
    divDisplayName.innerText = displayName;
    divHandle.innerText = profile.handle;
    divFollows.innerText = `Following: ${profile.followsCount.toLocaleString()}`;
    divFollowers.innerText = `Followers: ${profile.followersCount.toLocaleString()}`;
    divPosts.innerText = `Posts: ${profile.postsCount.toLocaleString()}`;
    divCreated.innerText = `Member since: ${new Date(profile.createdAt).toLocaleString()}`;
    link.href = `https://bsky.app/profile/${profile.handle}`;
    link.innerText = `https://bsky.app/profile/${profile.handle}`;
}
function drawChart(chartData) {
    // @ts-expect-error: google
    var chart = new google.visualization.LineChart(divFollowersChart);
    // @ts-expect-error: google
    var data = google.visualization.arrayToDataTable([
        ["Date", "Followers"],
        ...chartData,
    ]);
    chart.draw(data, {
        title: `${displayName}'s followers`,
        legend: "none",
    });
}
async function onLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    inputUsername.value = username;
    if (username) {
        spanStatus.innerText = "Getting profile...";
        const profile = await getProfile(username);
        if (profile) {
            await updateProfileDisplay(profile);
            await loadFollowersChart(profile);
        }
    }
}
async function loadFollowersChart(profile) {
    loading.style.display = "block";
    spanStatus.innerText = "Getting follower count history...";
    const socialMetrics = await getSocialMetrics(profile.handle);
    const chartData = [];
    for (const item of socialMetrics) {
        chartData.push([new Date(item.date), item.followers]);
    }
    drawChart(chartData);
    loading.style.display = "none";
    divProgress.innerHTML = "";
}
