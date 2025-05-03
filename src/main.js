import Graph from 'graphology';
import Sigma from 'sigma';

const clientId = '77456fd240024ae29f080233a70335b0';
const redirectUri = window.location.origin;
const scopes = 'user-read-private';

function getAccessToken() {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  return params.get('access_token');
}

function redirectToSpotifyAuth() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = authUrl;
}

const token = getAccessToken();

function getSpotifyProfile(token) {
  return fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  }).then(res => res.json())
}

if (!token){redirectToSpotifyAuth();} 
else {
  getSpotifyProfile(token).then(userData => {
    // You can use userData here
    console.log('Email:', userData.email);
  });
}

const graph = new Graph();

graph.addNode("1", { label: "Node 1", x: 0, y: 0, size: 10, color: "blue" });
graph.addNode("2", { label: "Node 2", x: 1, y: 1, size: 20, color: "red" });
graph.addEdge("1", "2", { size: 5, color: "purple" });

const sigmaInstance = new Sigma(graph, document.getElementById("sigma-container"));