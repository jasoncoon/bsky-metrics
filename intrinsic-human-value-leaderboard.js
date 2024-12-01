const handles = [
  "alexglow.bsky.social",
  "alpenglow.bsky.social",
  "blenster.bsky.social",
  "lasermistress.bsky.social",
  "desertember.bsky.social",
  "evilgeniuslabs.org",
  "geekmomprojects.com",
  "ishotjr.bsky.social",
  "architeuthisflux.bsky.social",
  "leeborg.bsky.social",
  "straithe.bsky.social",
];

const divLoading = document.getElementById("loading");
const divProgress = document.getElementById('progress');
const tableBody = document.getElementById('tableBody');

loadTable();

async function getProfile(username) {
  try {
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

async function loadTable() {
  divLoading.style.display = "block";
  tableBody.innerHTML = '';
  
  const profiles = [];
  let i = 1;

  for (const handle of handles) {
    divProgress.innerText = `Getting profile ${i} of ${handles.length}`;
    const profile = await getProfile(handle);
    profiles.push(profile);
    i++;
  }

  profiles.sort((a, b) => b.followersCount - a.followersCount);

  i = 1;

  for (const profile of profiles) {
    const row = tableBody.insertRow();
    let cell;
    
    cell = row.insertCell();
    cell.innerHTML = i.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = `<a href="https://bsky.app/profile/${profile.handle}">${profile.displayName || profile.handle}</a>`;
    
    cell = row.insertCell();
    cell.innerHTML = profile.followersCount?.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = profile.followsCount.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = ((profile.followsCount ?? 0) / (profile.followersCount ?? 1)).toLocaleString(undefined,{style: 'percent', minimumFractionDigits:0});
    
    cell = row.insertCell();
    cell.innerHTML = profile.postsCount.toLocaleString();
    
    cell = row.insertCell();
    cell.innerHTML = new Date(profile.createdAt).toLocaleString();

    i++;
  }

  divLoading.style.display = "none";
  divProgress.innerHTML = '';

  console.log({profiles});
}