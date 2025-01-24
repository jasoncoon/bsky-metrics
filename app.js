google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(onLoad);

const buttonGo = document.getElementById("buttonGo");
const divCreated = document.getElementById("divCreated");
const divDescription = document.getElementById("divDescription");
const divDisplayName = document.getElementById("divDisplayName");
const divFollowers = document.getElementById("divFollowers");
const divFollowersChart = document.getElementById("divFollowersChart");
const divFollows = document.getElementById("divFollows");
const divHandle = document.getElementById("divHandle");
const divPosts = document.getElementById("divPosts");
const imgAvatar = document.getElementById("imgAvatar");
const imgBanner = document.getElementById("imgBanner");
const inputUsername = document.getElementById("inputUsername");
const link = document.getElementById("link");
const loading = document.getElementById("loading");
const spanStatus = document.getElementById("status");
const divProgress = document.getElementById("progress");
const tableBodyFollowers = document.getElementById("followersTableBody");

let displayName;

buttonGo.onclick = (e) => {
  const username = inputUsername.value;
  const url = new URL(window.location.href);
  url.searchParams.set("username", username);
  window.location.href = url;
  return false;
};

async function getProfile(username) {
  try {
    spanStatus.innerText = "Getting profile...";
    let response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`
    );
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error("error getting profile: ", error);
  }
}

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
  document.getElementById(
    "divFollows"
  ).innerText = `Following: ${profile.followsCount.toLocaleString()}`;
  divFollowers.innerText = `Followers: ${profile.followersCount.toLocaleString()}`;
  divPosts.innerText = `Posts: ${profile.postsCount.toLocaleString()}`;
  divCreated.innerText = `Member since: ${new Date(
    profile.createdAt
  ).toLocaleString()}`;
  link.href = `https://bsky.app/profile/${profile.handle}`;
  link.innerText = `https://bsky.app/profile/${profile.handle}`;
}

function drawChart(chartData) {
  var chart = new google.visualization.LineChart(divFollowersChart);

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
    const profile = await getProfile(username);
    await updateProfileDisplay(profile);
    await loadFollowersChart(profile);
  }
}

async function loadFollowersChart(profile) {
  loading.style.display = "block";
  spanStatus.innerText = "Getting follower count history...";

  const response = await fetch(
    `https://social-metrics.evilgeniuslabs.org/query?social=Bluesky&handle=${profile.handle}`
  );

  const body = await response.json();

  console.log({ response, body });

  const chartData = [];

  for (const item of body.Items) {
    chartData.push([new Date(item.date), item.followers]);
  }

  drawChart(chartData);

  loading.style.display = "none";
  divProgress.innerHTML = "";
}
