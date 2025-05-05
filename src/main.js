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
    if(profile.error) reAuth();
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

  let container = document.getElementById("sigma-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "sigma-container";
    container.style.width = "100%";
    container.style.height = "100vh";
    container.style.background = "red";
    document.body.appendChild(container);
  }
}

//Spotifty API functions

export async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", 'https://effulgent-narwhal-d486fb.netlify.app/main');
  params.append("scope", "user-read-private user-read-email");
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