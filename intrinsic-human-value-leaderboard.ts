import {
  getElementById,
  getProfile,
  getSocialMetrics,
  type Profile,
  type SocialMetric,
} from "./utils.js";

// @ts-expect-error: google
google.charts.load("current", { packages: ["corechart"] });
// @ts-expect-error: google
google.charts.setOnLoadCallback(onLoad);

const divLoading = getElementById("loading");
const divProgress = getElementById("progress");
const tableBody = getElementById("tableBody");
const textAreaHandles = getElementById("textAreaHandles");
const buttonSubmitHandles = getElementById("buttonSubmitHandles");
const divFollowersChart = getElementById("divFollowersChart");
const inputLogScale = getElementById("inputLogScale");
const inputPointSize = getElementById("inputPointSize");
const divHandleChecks = getElementById("divHandleChecks");

buttonSubmitHandles.addEventListener("click", submitHandles);
inputLogScale.addEventListener("change", drawChart);
inputPointSize.addEventListener("change", drawChart);

let handles: string[];
let days: number | undefined;

let chart: unknown;
let chartData: (string | number | undefined)[][];

let loadedHandles;
let allItems: SocialMetric[];

async function onLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  handles = urlParams.get("handles")?.split(";") || [];

  days = parseInt(urlParams.get('days') || '30');

  if (!handles?.length) {
    handles = [
      "alexglow.bsky.social",
      "alpenglow.bsky.social",
      "architeuthisflux.bsky.social",
      "athousandprojects.com",
      "bhencke.bsky.social",
      "blenster.com",
      "chipperdoodles.bsky.social",
      "clomads.bsky.social",
      "desertember.bsky.social",
      "eka.hn",
      "evilgeniuslabs.org",
      "flashingjanet.bsky.social",
      "geekmomprojects.com",
      "grenlabs.com",
      "guydupont.bsky.social",
      "ishotjr.bsky.social",
      "joeycastillo.bsky.social",
      "lasermistress.bsky.social",
      "leeborg.bsky.social",
      "straithe.com",
    ];
  }

  // @ts-expect-error: google
  chart = new google.visualization.LineChart(divFollowersChart);

  await loadTable();

  await fetchChartData();
}

async function loadTable() {
  divLoading.style.display = "block";
  tableBody.innerHTML = "";

  const profiles: Profile[] = [];
  let i = 1;

  for (const handle of handles) {
    divProgress.innerText = `Getting profile ${i} of ${handles.length}: ${handle}`;
    const profile = await getProfile(handle);
    if (profile) {
      profile.handle = handle;
      profiles.push(profile);
    }
    i++;
  }

  profiles.sort((a, b) => (b.followersCount ?? 0) - (a.followersCount ?? 0));

  i = 1;

  for (const profile of profiles) {
    const followersPerFollow =
      (profile.followersCount ?? 0) / (profile.followsCount ?? 0);
    const followersPerPost =
      (profile.followersCount ?? 0) / (profile.postsCount ?? 0);

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

function submitHandles() {
  const value = textAreaHandles.value as string;
  let newHandles = value.split("\n");
  newHandles = newHandles
    .map((handle) => handle.trim())
    .filter((handle) => !!handle);
  window.location.href = `/bsky-metrics/intrinsic-human-value-leaderboard.htm?handles=${newHandles.join(
    ";"
  )}`;
}

async function fetchChartData() {
  divLoading.style.display = "block";
  getElementById("divChartControls").style.display = "block";

  let i = 1;

  loadedHandles = [];
  allItems = [];

  for (const currentHandle of handles) {
    divProgress.innerText = `Getting followers chart data for profile ${i} of ${handles.length}: ${currentHandle}`;

    const items = await getSocialMetrics(currentHandle);

    if (items?.length < 1) continue;

    loadedHandles.push(currentHandle);

    items.sort((a, b) => a.date.localeCompare(b.date));

    allItems.push(...items);

    loadChartData(loadedHandles);

    drawChart();

    i++;
  }

  createHandleCheckboxes();

  divLoading.style.display = "none";
  divProgress.innerHTML = "";
}

function loadChartData(loadedHandles: string[]) {
  const checkedHandles = loadedHandles.filter((handle) => {
    const checkbox = document.getElementById(
      `input${handle}`
    ) as HTMLFormElement;
    if (!checkbox) return true;
    return checkbox.checked;
  });

  const items = allItems.filter((item) => checkedHandles.includes(item.handle));

  const allDates = getAllDates(items);

  const sortedHandles = getSortedHandles(loadedHandles);

  const filteredHandles = sortedHandles.filter((handle) =>
    checkedHandles.includes(handle)
  );

  chartData = [
    [
      "Date",
      ...filteredHandles.map((handle) => handle.replace(".bsky.social", "")),
    ],
  ];

  for (const date of allDates) {
    const row: (string | number | undefined)[] = [date];
    for (const handle of filteredHandles) {
      const r =
        items.find((i) => i.handle === handle && i.date === date)?.followers ||
        undefined;

      row.push(r);
    }

    chartData.push(row);
  }
}

function getSortedHandles(handles: string[]) {
  const latestTotals = handles.map((handle) => {
    const sorted = allItems
      .filter((i) => i.handle === handle)
      .sort((a, b) => a.date.localeCompare(b.date));
    const latestTotal = sorted[sorted.length - 1]?.followers;
    // console.log({ handle, sorted, latestTotal });
    return { handle, latestTotal };
  });

  const sortedHandles = latestTotals
    .sort((a, b) => (b.latestTotal ?? 0) - (a.latestTotal ?? 0))
    .map((h) => h.handle);

  return sortedHandles;
}

function createHandleCheckboxes() {
  const sortedHandles = getSortedHandles(handles);

  divHandleChecks.innerHTML = "";

  for (const handle of sortedHandles) {
    const handleCheck = document.createElement("div");
    handleCheck.setAttribute("class", "form-check");
    handleCheck.innerHTML = `<input class="form-check-input" type="checkbox" id="input${handle}" checked>
            <label class="form-check-label" for="input${handle}">
              ${handle}
            </label>`;

    divHandleChecks.appendChild(handleCheck);

    const input = getElementById(`input${handle}`);
    input.addEventListener("change", reloadChart);
  }
}

function reloadChart() {
  loadChartData(handles);

  drawChart();
}

function getAllDates(items: SocialMetric[]) {
  const allDates: string[] = [];

  const date = new Date();
  date.setDate(date.getDate() - (days ?? 30));
  const startDate = date.toISOString();

  for (const item of items) {
    if (allDates.includes(item.date)) {
      continue;
    }

    if (item.date < startDate) {
      continue;
    }

    allDates.push(item.date);
  }

  allDates.sort();

  return allDates;
}

function drawChart() {
  const logScale = inputLogScale.checked;
  const pointSize = inputPointSize.value;

  // @ts-expect-error: google
  const data = google.visualization.arrayToDataTable(chartData);

  // @ts-expect-error: google
  chart.draw(data, {
    title: `Followers over time`,
    pointSize,
    vAxis: {
      format: "short", // "#,###",
      logScale,
      viewWindowMode: "maximized",
    },
  });
}
