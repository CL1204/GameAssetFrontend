// ✅ Modified dashboard.js with Top Rated and Discover sections
const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

window.onload = async function () {
    const auth = await fetch(`${BASE_URL}/api/auth/check-auth`, { credentials: "include" });
    if (!auth.ok) return (window.location.href = "login.html");

    const data = await auth.json();
    localStorage.setItem("username", data.username);
    document.getElementById("userLabel").textContent = data.username;

    if (data.isAdmin) {
        document.getElementById("adminBadge").style.display = "inline";
    }

    loadAssets();
};

document.getElementById("uploadForm").addEventListener("submit", async e => {
    e.preventDefault();
    const file = document.getElementById("assetFile").files[0];
    const title = document.getElementById("assetName").value;
    const category = document.getElementById("assetCategory").value;
    const description = document.getElementById("assetDescription").value;
    const tags = document.getElementById("tagInput").value.split(",").map(t => t.trim()).filter(Boolean);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    tags.forEach(tag => formData.append("tags", tag));

    const res = await fetch(`${BASE_URL}/api/assets/upload`, {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    if (res.ok) {
        alert("Upload successful! Awaiting approval.");
        loadAssets();
        toggleUploadPanel();
        e.target.reset();
    } else {
        alert("Upload failed.");
    }
});

async function loadAssets() {
    const res = await fetch(`${BASE_URL}/api/assets/approved`);
    const assets = await res.json();
    displayAssets(assets);
    displayTopRated(assets);
    displayDiscover(assets);
}

function displayAssets(assets) {
    const grids = {
        characters: document.getElementById("characters"),
        environment: document.getElementById("environment"),
        soundtracks: document.getElementById("soundtracks")
    };
    Object.values(grids).forEach(g => g.innerHTML = "");

    assets.forEach(asset => {
        const card = createAssetCard(asset);
        const category = asset.category.toLowerCase();
        if (grids[category]) grids[category].appendChild(card);
    });
}

function displayTopRated(assets) {
    const top = assets.reduce((max, a) => a.likes > max.likes ? a : max, assets[0]);
    const section = document.getElementById("topRatedSection");
    section.innerHTML = "";
    if (top) section.appendChild(createAssetCard(top));
}

function displayDiscover(assets) {
    const shuffled = [...assets].sort(() => 0.5 - Math.random()).slice(0, 10);
    const container = document.getElementById("discoverSection");
    container.innerHTML = "";
    shuffled.forEach(asset => container.appendChild(createAssetCard(asset)));
}

function createAssetCard(asset) {
    const card = document.createElement("div");
    card.className = "asset-card";
    card.innerHTML = `
        <button class="favorite-btn" onclick="likeAsset(${asset.id}, event)">
            ♥ <span class="favorite-count">${asset.likes}</span>
        </button>
        <img src="${asset.imageUrl}" alt="${asset.title}" onerror="this.src='placeholder.jpg'" />
        <h4>${asset.title}</h4>
        <p>${asset.description}</p>
        <small>Tags: ${asset.tags?.join(", ") || "None"}</small>
    `;
    return card;
}

async function likeAsset(id, event) {
    event.stopPropagation();
    const res = await fetch(`${BASE_URL}/api/assets/${id}/like`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadAssets();
}

function toggleUploadPanel() {
    const panel = document.getElementById("uploadPanel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function showCategory(category, el) {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    el.classList.add("active");
    document.querySelectorAll(".asset-section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${category}-section`).classList.add("active");
}

function searchAssets() {
    const query = document.getElementById("searchBar").value.toLowerCase();
    const activeGrid = document.querySelector(".asset-section.active .assets-grid");
    if (!activeGrid) return;
    activeGrid.querySelectorAll(".asset-card").forEach(card => {
        const name = card.querySelector("h4").textContent.toLowerCase();
        card.style.display = name.includes(query) ? "flex" : "none";
    });
}
