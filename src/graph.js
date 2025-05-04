import Graph from "graphology";
import Sigma from "sigma";

const hash = window.location.hash;
const params = new URLSearchParams(hash.substring(1));
const token = params.get('access_token');

if (token) {
  // Store the token for later use
  localStorage.setItem('spotify_token', token);
  // Redirect to main page
  window.location.href = '/';
} else {
  console.error('No token found in URL');
}

const graph = new Graph();

graph.addNode("1", { label: "Node 1", x: 0, y: 0, size: 10, color: "blue" });
graph.addNode("2", { label: "Node 2", x: 1, y: 1, size: 20, color: "red" });
graph.addEdge("1", "2", { size: 5, color: "purple" });

const sigmaInstance = new Sigma(graph, document.getElementById("sigma-container"));