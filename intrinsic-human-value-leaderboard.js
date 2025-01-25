// eslint-disable-next-line no-undef
google.charts.load("current", { packages: ["corechart"] });
// eslint-disable-next-line no-undef
google.charts.setOnLoadCallback(onLoad);

const divLoading = document.getElementById("loading");
const divProgress = document.getElementById("progress");
const tableBody = document.getElementById("tableBody");
const textAreaHandles = document.getElementById("textAreaHandles");
const buttonSubmitHandles = document.getElementById("buttonSubmitHandles");
const divFollowersChart = document.getElementById("divFollowersChart");

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
      "gdotc.bsky.social",
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

  // eslint-disable-next-line no-undef
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
  window.location = `/bsky-metrics/intrinsic-human-value-leaderboard.htm?handles=${newHandles.join(
    ";"
  )}`;
}

async function loadChart() {
  divLoading.style.display = "block";

  let i = 1;

  const loadedHandles = [];
  const allItems = [];

  for (const currentHandle of handles) {
    divProgress.innerText = `Getting followers chart data for profile ${i} of ${handles.length}: ${currentHandle}`;

    const response = await fetch(
      `https://social-metrics.evilgeniuslabs.org/query?social=Bluesky&handle=${currentHandle}`
    );
    const body = await response.json();
    const items = body.Items;
    if (!items) {
      continue;
    }

    loadedHandles.push(currentHandle);

    items.sort((a, b) => a.date - b.date);

    allItems.push(...items);

    const allDates = getAllDates(allItems);

    const latestTotals = loadedHandles.map((handle) => {
      const sorted = allItems
        .filter((i) => i.handle === handle)
        .sort((a, b) => a.date - b.date);
      const latestTotal = sorted[sorted.length - 1]?.followers;
      console.log({ handle, sorted, latestTotal });
      return { handle, latestTotal };
    });

    const sortedHandles = latestTotals
      .sort((a, b) => b.latestTotal - a.latestTotal)
      .map((h) => h.handle);

    const chartData = [["Date", ...sortedHandles]];

    for (const date of allDates) {
      const row = [date];
      for (const loadedHandle of sortedHandles) {
        row.push(
          allItems.find((i) => i.handle === loadedHandle && i.date === date)
            ?.followers ?? undefined
        );
      }

      chartData.push(row);
    }

    drawChart(chartData);

    i++;
  }

  divLoading.style.display = "none";
  divProgress.innerHTML = "";
}

function getAllDates(items) {
  const allDates = [];

  for (const item of items) {
    if (allDates.includes(item.date)) {
      continue;
    }

    allDates.push(item.date);
  }

  allDates.sort();

  return allDates;
}

function drawChart(chartData) {
  // eslint-disable-next-line no-undef
  var data = google.visualization.arrayToDataTable(chartData);

  chart.draw(data, {
    title: `Followers over time`,
  });
}
