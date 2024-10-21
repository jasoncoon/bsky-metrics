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
const spinner = document.getElementById("spinner");

let chartData = [["Date", "Followers"]];

buttonGo.onclick = () => {
  const username = inputUsername.value;
  window.location.href = `/?username=${username}`;
};

async function getProfile(username) {
  try {
    let response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`
    );
    const profile = await response.json();
    console.log({ profile, response });
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
    link.href = `https://bsky.app/profile/${username}`;
    link.innerText = `https://bsky.app/profile/${username}`;
  } catch (error) {
    console.error("error getting profile: ", error);
  }
}

async function getAllFollowers(username) {
  spinner.style.display = "block";
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
  spinner.style.display = "none";
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
    ["Date", "Followers"],
    ...chartData,
  ]);

  chart.draw(data, {
    title: "Followers",
    legend: "none",
  });
}

async function onLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  inputUsername.value = username;
  if (username) {
    await getProfile(username);
    await getAllFollowers(username);
  }
}
