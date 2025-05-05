import Graph from "graphology";
import Sigma from "sigma";

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
  if(savedToken) mainCode(savedToken);
  else{
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) redirectToAuthCodeFlow(clientId);
    else{
      const accessToken = await getAccessToken(clientId, code);
      localStorage.setItem("spotify_token", accessToken); // Store the access token for later use
      mainCode(accessToken);
    }
  }
}

async function mainCode(token) {
  const profile = await fetchProfile(token);
  console.log("main: ", profile);

  let container = document.getElementById("sigma-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "sigma-container";
    container.style.width = "100%";
    container.style.height = "100vh";
    container.style.background = "white";
    document.body.appendChild(container);
  }

  const graph = new Graph();
  
  graph.addNode("1", { label: profile.display_name, x: 0, y: 0, size: 10, color: "blue" });
  graph.addNode("2", { label: "Node 2", x: 1, y: 1, size: 20, color: "red" });
  graph.addEdge("1", "2", { size: 5, color: "purple" });
  
  const sigmaInstance = new Sigma(graph, document.getElementById("sigma-container"));
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
  const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}