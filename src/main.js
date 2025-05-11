//main code ---------------------------------------------------

const clientId = "77456fd240024ae29f080233a70335b0";
//for load up and spotify auth --------------------
if (window.location.pathname === '/') window.history.replaceState(null, '', '/main');
if (window.location.pathname === '/main') mainHandler();


//functions ---------------------------------------------------
//-------------------------------------------------------------

//Async functions to handle top level await

async function mainHandler() {
  const savedToken = localStorage.getItem('spotify_token');
  if(savedToken){
    const profile = await fetchProfile(savedToken);
    const topTracksShort = await fetchTop(localStorage.getItem('spotify_token'), 'short_term', 'tracks');
    if(profile.error || topTracksShort.error) reAuth();
    else mainCode(profile);
  }
  else reAuth();
}

async function reAuth(){
  const savedToken = localStorage.getItem('spotify_token');
  if(savedToken) localStorage.removeItem('spotify_token');

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (!code) redirectToAuthCodeFlow(clientId);
  else{
    const accessToken = await getAccessToken(clientId, code);
    localStorage.setItem("spotify_token", accessToken); // Store the access token for later use
    const profile = await fetchProfile(accessToken);
    mainCode(profile);
  }
}

async function mainCode(profile) {
  console.log("main: ", profile);
  displayProfile(profile); // Call function to update profile section in HTML

  // Fetch top tracks for different time ranges
  const topTracksShort = await fetchTop(localStorage.getItem('spotify_token'), 'short_term', 'tracks');
  displayTopTracks('short_term', topTracksShort); // Call function to display short term tracks

  const topTracksMedium = await fetchTop(localStorage.getItem('spotify_token'), 'medium_term', 'tracks');
  displayTopTracks('medium_term', topTracksMedium); // Call function to display medium term tracks

  const topTracksLong = await fetchTop(localStorage.getItem('spotify_token'), 'long_term', 'tracks');
  displayTopTracks('long_term', topTracksLong); // Call function to display long term tracks

  setupTermNavigation(); // Add this call
}

function displayProfile(profile) {
  console.log("Displaying profile:", profile);
  // TODO: Update HTML elements with profile.display_name, profile.images[0]?.url, profile.followers.total
  if(profile.display_name){
    document.getElementById('displayName').textContent = (profile.display_name) ? profile.display_name : 'Invalid Token:(';
    document.getElementById('profileImage').src = profile.images[0]?.url || 'default-image.png';
    document.getElementById('followerCount').textContent = profile.followers.total + " followers!";
  }
  else{
    redirectToAuthCodeFlow(clientId) // If profile is invalid, re-authenticate
  }
}

function setupTermNavigation() {
  const terms = ['short_term', 'medium_term', 'long_term'];
  const token = localStorage.getItem('spotify_token');

  terms.forEach(term => {
    const songButton = document.getElementById(`${term}_song_button`);
    const albumButton = document.getElementById(`${term}_album_button`);
    const artistButton = document.getElementById(`${term}_artist_button`);

    if (songButton) {
      songButton.addEventListener('click', async () => {
        const tracks = await fetchTop(token, term, 'tracks');
        displayTopTracks(term, tracks);
      });
    }

    if (albumButton) {
      albumButton.addEventListener('click', async () => {
        const tracks = await fetchTop(token, term, 'tracks'); // Albums are derived from tracks
        displayTopAlbums(term, tracks);
      });
    }

    if (artistButton) {
      artistButton.addEventListener('click', async () => {
        const artists = await fetchTop(token, term, 'artists');
        displayTopArtists(term, artists);
      });
    }
  });
}

function displayTopAlbums(term, tracks) {
  console.log(`Displaying ${term} albums:`, tracks);
  clearAvgStats(term); // Clear average stats when displaying albums

  const trackListElement = document.getElementById(`${term}_tracks_list`);

  // Clear previous items
  trackListElement.innerHTML = '';

  const songButton = document.getElementById(`${term}_song_button`);
  const artistButton = document.getElementById(`${term}_artist_button`);
  const albumButton = document.getElementById(`${term}_album_button`);

  songButton.classList = 'nav-button';
  artistButton.classList = 'nav-button';  
  albumButton.classList = 'nav-button-active';
}

function displayTopArtists(term, artists) {
  console.log(`Displaying ${term} artists:`, artists);
  clearAvgStats(term); // Clear average stats when displaying albums

  const trackListElement = document.getElementById(`${term}_tracks_list`);

  // Clear previous items
  trackListElement.innerHTML = '';

  const songButton = document.getElementById(`${term}_song_button`);
  const artistButton = document.getElementById(`${term}_artist_button`);
  const albumButton = document.getElementById(`${term}_album_button`);

  songButton.classList = 'nav-button';
  artistButton.classList = 'nav-button-active';  
  albumButton.classList = 'nav-button';
}

function displayTopTracks(term, tracks) {
  console.log(`Displaying ${term} tracks:`, tracks);
  const trackListElement = document.getElementById(`${term}_tracks_list`);
  if (!trackListElement) {
    console.error(`Element with ID ${term}_tracks_list not found.`);
    return;
  }
  // Clear previous items
  trackListElement.innerHTML = '';

  const songButton = document.getElementById(`${term}_song_button`);
  const artistButton = document.getElementById(`${term}_artist_button`);
  const albumButton = document.getElementById(`${term}_album_button`);

  songButton.classList = 'nav-button-active';
  artistButton.classList = 'nav-button';  
  albumButton.classList = 'nav-button';

  if (tracks && tracks.items && tracks.items.length > 0) {
    for (let i = 0; i < tracks.items.length; i++) {
      const track = tracks.items[i];
      const trackItem = document.createElement('li');
      trackItem.classList.add('list-item');



      // Create image element for album cover
      const albumCoverImg = document.createElement('img');
      albumCoverImg.classList.add('album-cover');
      albumCoverImg.src = track.album.images[2]?.url || track.album.images[0]?.url || 'src/default-image.png';
      albumCoverImg.alt = track.album.name;



      // Create a div for track information (name and artist)
      const trackInfoDiv = document.createElement('div');
      trackInfoDiv.classList.add('track-info');
      trackInfoDiv.textContent = `${track.name} by ${track.artists.map(artist => artist.name).join(', ')}`;



      // Create a div for track stats (duration and popularity)
      const trackStatsDiv = document.createElement('div');
      trackStatsDiv.classList.add('track-stats');

      const durationSpan = document.createElement('span');
      durationSpan.classList.add('track-duration');
      durationSpan.textContent = formatDuration(track.duration_ms);

      trackStatsDiv.appendChild(durationSpan);



      // Append elements to the list item
      trackItem.appendChild(albumCoverImg);
      trackItem.appendChild(trackInfoDiv);
      trackItem.appendChild(trackStatsDiv); // Add stats to the right
      trackListElement.appendChild(trackItem);
    }
  } else {
    const noTracksItem = document.createElement('li');
    noTracksItem.textContent = 'No tracks available for this period.';
    noTracksItem.classList.add('list-item-empty');
    trackListElement.appendChild(noTracksItem);
  }

  displayAvgStats(term, tracks); // Call function to display average stats
}

// Function to display average stats for a given time range
function displayAvgStats(term, tracks){
  console.log(`Displaying ${term} stats:`, tracks);
  const avgLenElement = document.getElementById(`${term}_avg_len`);
  const avgPopElement = document.getElementById(`${term}_avg_pop`);

  if (!avgLenElement || !avgPopElement) {
    console.error(`Element with ID ${term}_avg_len or ${term}_avg_pop not found.`);
    return;
  }

  // Clear previous items
  avgLenElement.innerHTML = '';
  avgPopElement.innerHTML = '';

  if (tracks && tracks.items && tracks.items.length > 0) {
    const totalDuration = tracks.items.reduce((acc, track) => acc + track.duration_ms, 0);
    const avgDuration = totalDuration / tracks.items.length;
    const avgPopularity = Math.round(tracks.items.reduce((acc, track) => acc + track.popularity, 0) / tracks.items.length);
    avgLenElement.textContent = formatDuration(avgDuration);
    avgPopElement.textContent = avgPopularity;
  }
}

// Function to clear/hide average stats when not displaying tracks
function clearAvgStats(term) {
  const avgLenElement = document.getElementById(`${term}_avg_len`);
  const avgPopElement = document.getElementById(`${term}_avg_pop`);
  if (avgLenElement) avgLenElement.textContent = '-';
  if (avgPopElement) avgPopElement.textContent = '-';
}

// Helper function to format duration in mm:ss
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/*

Spotifty API functions Spotifty API functions Spotifty API functions Spotifty API functions
Spotifty API functions Spotifty API functions Spotifty API functions Spotifty API functions
Spotifty API functions Spotifty API functions Spotifty API functions Spotifty API functions
Spotifty API functions Spotifty API functions Spotifty API functions Spotifty API functions
Spotifty API functions Spotifty API functions Spotifty API functions Spotifty API functions

*/
//Spotifty API functions

async function fetchTop(token, timeRange, type) {
  // timeRange can be 'short_term', 'medium_term', or 'long_term'
  const limit = 50;
  try {
    // Construct the URL for fetching top tracks
    const result = await fetch(`https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=${limit}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    if (!result.ok) {
      console.error(`Error fetching top ${type} (${timeRange}): ${result.status} ${result.statusText}`);
      const errorBody = await result.text();
      console.error("Spotify API response body:", errorBody);
      return { error: { status: result.status, message: `Error fetching top ${type} (${timeRange})` } };
    }
    return await result.json(); // Returns object like { items: [...] }
  } catch (err) {
    console.error(`Network error fetching top ${type} (${timeRange}):`, err);
    return { error: { status: 0, message: `Network error fetching top tracks (${timeRange})` } };
  }
}

export async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", 'https://effulgent-narwhal-d486fb.netlify.app/main');
  params.append("scope", "user-read-private user-read-email user-top-read");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "https://effulgent-narwhal-d486fb.netlify.app/main");
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    // Check if the response was successful (status code 200-299)
    if (!result.ok) {
      // Log the error status and try to read the response body as text for debugging
      console.error(`Error fetching profile: ${result.status} ${result.statusText}`);
      const errorBody = await result.text(); // Read the raw response body
      console.error("Spotify API response body (non-JSON):", errorBody);
      // Return an error object that your mainHandler can check
      // This mimics the structure of other Spotify API errors
      return { error: { status: result.status, message: `Spotify API Error: ${result.statusText}. Response: ${errorBody.substring(0, 100)}...` } };
    }

    // If the response is OK, *then* parse it as JSON
    return await result.json();

  } catch (err) {
    // Catch network errors or other unexpected issues
    console.error("Network error during fetchProfile:", err);
    return { error: { status: 0, message: "Network error fetching profile." } };
  }
}