google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(onLoad);

const divLoading = document.getElementById("loading");
const divProgress = document.getElementById("progress");
const tableBody = document.getElementById("tableBody");
const textAreaHandles = document.getElementById("textAreaHandles");
const buttonSubmitHandles = document.getElementById("buttonSubmitHandles");

buttonSubmitHandles.addEventListener("click", submitHandles);

let handles;

let chart;

async function onLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  handles = urlParams.get("handles")?.split(";");

  if (!handles?.length) {
    handles = [
      "alexglow.bsky.social",
      "alpenglow.bsky.social",
      "architeuthisflux.bsky.social",
      "athousandprojects.com",
      "bhencke.bsky.social",
      "blenster.bsky.social",
      "chipperdoodles.bsky.social",
      "clomads.bsky.social",
      "desertember.bsky.social",
      "eka.hn",
      "evilgeniuslabs.org",
      "geekmomprojects.com",
      "guydupont.bsky.social",
      "ishotjr.bsky.social",
      "joeycastillo.bsky.social",
      "lasermistress.bsky.social",
      "leeborg.bsky.social",
      "settinger.net",
      "straithe.com",
    ];
  }

  chart = new google.visualization.LineChart(divFollowersChart);

  await loadTable();

  await loadChart();
}

async function loadTable() {
  divLoading.style.display = "block";
  tableBody.innerHTML = "";

  const profiles = [];
  let i = 1;

  for (const handle of handles) {
    divProgress.innerText = `Getting profile ${i} of ${handles.length}: ${handle}`;
    const profile = await getProfile(handle);
    profile.handle = handle;
    profiles.push(profile);
    i++;
  }

  profiles.sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0));

  i = 1;

  for (const profile of profiles) {
    const followersPerFollow = (
      (profile.followersCount ?? 0) / (profile.followsCount ?? 0)
    ).toLocaleString(undefined, { style: "percent", minimumFractionDigits: 0 });
    const followersPerPost = (
      (profile.followersCount ?? 0) / (profile.postsCount ?? 0)
    ).toLocaleString(undefined, { style: "percent", minimumFractionDigits: 0 });

    const row = tableBody.insertRow();
    let cell;

    cell = row.insertCell();
    cell.innerHTML = i.toLocaleString();

    cell = row.insertCell();
    cell.innerHTML = `<a href="https://bsky.app/profile/${profile.handle}">${
      profile.displayName || profile.handle
    }</a>`;

    cell = row.insertCell();
    cell.innerHTML = profile.followersCount?.toLocaleString();

    cell = row.insertCell();
    cell.innerHTML = profile.followsCount?.toLocaleString();

    cell = row.insertCell();
    cell.title = "Followers per Follow";
    cell.innerHTML = followersPerFollow.toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 0,
    });

    cell = row.insertCell();
    cell.innerHTML = profile.postsCount?.toLocaleString();

    cell = row.insertCell();
    cell.title = "Followers per Post";
    cell.innerHTML = followersPerPost.toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 0,
    });

    cell = row.insertCell();
    cell.innerHTML = new Date(profile.createdAt).toLocaleString();

    i++;
  }

  divLoading.style.display = "none";
  divProgress.innerHTML = "";

  // console.log({profiles});
}

async function getProfile(username) {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${username}`
    );
    const profile = await response.json();
    if (!response.ok) {
      console.error(`Error getting profile ${username}: `, {
        profile,
        response,
      });
    }
    return profile;
  } catch (error) {
    console.error("error getting profile: ", error);
  }
}

function submitHandles() {
  const value = textAreaHandles.value;
  let newHandles = value.split("\n");
  newHandles = newHandles
    .map((handle) => handle.trim())
    .filter((handle) => !!handle);
  console.log(newHandles);
  window.location = `/bsky-metrics/intrinsic-human-value-leaderboard.htm?handles=${newHandles.join(
    ";"
  )}`;
}

async function loadChart() {
  divLoading.style.display = "block";

  let i = 1;

  // need to build a two-dimensional array like this:
  // const sampleData = [
  //   // ["Date", "handle1", "handle2", "..."],
  //   [new Date("2024-01-23"), 0, 1],
  //   [new Date("2024-01-24"), 1, 2],
  // ];

  // will start by building a map of dates to handle follower count:
  // const sampleDates = {
  //   "2024-01-23": [
  //     {
  //       handle: "handle1",
  //       followers: 0,
  //     },
  //     {
  //       handle: "handle2",
  //       followers: 1,
  //     },
  //   ],
  // };

  const dateItems = {};
  const loadedHandles = [];

  for (const handle of handles) {
    divProgress.innerText = `Getting followers chart data for profile ${i} of ${handles.length}: ${handle}`;

    const response = await fetch(
      `https://social-metrics.evilgeniuslabs.org/query?social=Bluesky&handle=${handle}`
    );

    const body = await response.json();

    const items = body.Items;

    items.sort((a, b) => a.date - b.date);

    for (const item of items) {
      let dateItem = dateItems[item.date];
      if (!dateItem) {
        dateItem = [];
        dateItems[item.date] = dateItem;
      }

      dateItem.push({ handle, followers: item.followers });
    }

    loadedHandles.push(handle);

    // build an array out of the dateItems
    const chartData = [["Date", ...loadedHandles]];

    for (const date of Object.keys(dateItems)) {
      const dateItem = dateItems[date];

      chartData.push([date, ...dateItem.map((item) => item.followers)]);
    }

    console.log({ chartData });

    drawChart(chartData);

    i++;
  }

  divLoading.style.display = "none";
  divProgress.innerHTML = "";
}

function drawChart(chartData) {
  // const testData = [
  //   [new Date("2024-01-23"), 0, 1],
  //   [new Date("2024-01-24"), 1, 2],
  // ];

  var data = google.visualization.arrayToDataTable(chartData);

  chart.draw(data, {
    title: `Followers over time`,
  });
}
