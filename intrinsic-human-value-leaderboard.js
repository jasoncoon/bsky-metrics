const urlParams = new URLSearchParams(window.location.search);
let handles = urlParams.get("handles")?.split(";");

console.log({ handles });

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
    "straithe.bsky.social",
  ];
}

const divLoading = document.getElementById("loading");
const divProgress = document.getElementById("progress");
const tableBody = document.getElementById("tableBody");
const textAreaHandles = document.getElementById("textAreaHandles");
const buttonSubmitHandles = document.getElementById("buttonSubmitHandles");

buttonSubmitHandles.addEventListener("click", submitHandles);

loadTable();

async function loadTable() {
  divLoading.style.display = "block";
  tableBody.innerHTML = "";

  const profiles = [];
  let i = 1;

  for (const handle of handles) {
    divProgress.innerText = `Getting profile ${i} of ${handles.length}`;
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
    let response = await fetch(
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
