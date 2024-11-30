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
const spanStatus = document.getElementById('status');
const divProgress = document.getElementById('progress');
const tableBodyFollowers = document.getElementById('followersTableBody');

let displayName;
let chartData;

buttonGo.onclick = (e) => {
  const username = inputUsername.value;
  const url = new URL(window.location.href);
  url.searchParams.set("username", username);
  console.log({ url });
  window.location.href = url;
  return false;
};

async function getProfile(username) {
  try {
    spanStatus.innerText = 'Getting profile...'
    let response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`
    );
    const profile = await response.json();
    console.log({ profile, response });
    return profile;  
  } catch (error) {
    console.error("error getting profile: ", error);
  }
}

async function updateProfileDisplay(profile) {
    displayName = profile.displayName;
    if (profile?.avatar && !imgAvatar.src) {
      imgAvatar.src = profile.avatar;
    }
    if (profile?.banner && !imgBanner.src) {
      imgBanner.src = profile.banner;
    }
    divDescription.innerText = profile.description;
    divDisplayName.innerText = profile.displayName;
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

async function getAllFollowers(username) {
  loading.style.display = "block";
  spanStatus.innerText = 'Getting followers...'
  const allFollowers = [];
  chartData = [];
  let subject = undefined;
  let cursor = undefined;

  const valuesByDate = {};

  do {
    const page = await getFollowersPage(username, cursor);
    allFollowers.push(...page.followers);
    cursor = page.cursor;
    for (const follower of page.followers) {
      let date = new Date(follower.createdAt);
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let value = valuesByDate[date.toISOString()] ?? 0;
      value += 1;
      valuesByDate[date.toISOString()] = value;
    }
    for (const dateString of Object.keys(valuesByDate)) {
      chartData.push([new Date(dateString), valuesByDate[dateString]]);
    }
    console.log({ chartData });
    drawChart();
  } while (cursor !== undefined);

  console.log({ subject, allFollowers });
  loading.style.display = "none";

  return allFollowers;
}

async function getFollowersPage(username, cursor) {
  const getFollowersUrl = `https://public.api.bsky.app/xrpc/app.bsky.graph.getFollowers?actor=${username}&limit=100&cursor=${
    cursor ?? ""
  }`;
  try {
    console.log(getFollowersUrl);
    let response = await fetch(getFollowersUrl);
    const json = await response.json();
    console.log({ json, response });
    return json;
  } catch (error) {
    console.error("error getting followers page: ", error);
  }
}

function drawChart() {
  var chart = new google.visualization.LineChart(divFollowersChart);

  chartData.sort((a, b) => a[0] - b[0]);

  var data = google.visualization.arrayToDataTable([
    ["Date", "Joined Bluesky"],
    ...chartData,
  ]);

  chart.draw(data, {
    title: `When ${displayName}'s followers joined Bluesky`,
    legend: "none",
  });
}

async function onLoad() {
  console.log({ location: window.location });
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  inputUsername.value = username;
  if (username) {
    const profile = await getProfile(username);
    await updateProfileDisplay(profile);
    const allFollowers = await getAllFollowers(username);
    await getFollowerProfiles(allFollowers);
  }
}

async function getFollowerProfiles(allFollowers) {
  loading.style.display = "block";
  const followerProfiles = [];
  tableBodyFollowers.innerHTML = '';

  let i = 1;

  let topFollower;

  for (const follower of allFollowers) {
    divProgress.innerText = `Getting follower profile ${i} of ${allFollowers.length}`;
    const profile = await getProfile(follower.handle);
    followerProfiles.push(profile);
    if (!topFollower) topFollower = profile;
    if (profile.followersCount > topFollower.followersCount) topFollower = profile;
    i++;
  }

  followerProfiles.sort((a, b) => b.followersCount - a.followersCount);

  for (const profile of followerProfiles) {
    const row = tableBodyFollowers.insertRow();
    let cell;
    
    cell = row.insertCell();
    cell.innerHTML = `<a href="https://bsky.app/profile/${profile.handle}">${profile.displayName}</a>`;
    
    cell = row.insertCell();
    cell.innerHTML = profile.followersCount?.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = profile.followsCount.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = (profile.followsCount ?? 0 / profile.followersCount ?? 1).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:0});
    
    cell = row.insertCell();
    cell.innerHTML = profile.postsCount.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = new Date(profile.createdAt).toLocaleString();
  }

  loading.style.display = "none";
  divProgress.innerHTML = '';

  console.log({followerProfiles});
}