const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

let allAssets = [];
let allUsernames = [];

window.onload = async function () {
    const auth = await fetch(`${BASE_URL}/api/auth/check-auth`, { credentials: "include" });
    if (!auth.ok) return (window.location.href = "login.html");

    const data = await auth.json();
    localStorage.setItem("username", data.username);
    document.getElementById("userLabel").textContent = data.username;

    if (data.isAdmin) {
        document.getElementById("adminBadge").style.display = "inline";
        const nav = document.querySelector(".bottom-nav");
        const btn = document.createElement("button");
        btn.innerHTML = `<span>🛠️</span><span>Actions</span>`;
        btn.onclick = () => location.href = "admin.html";
        nav.insertBefore(btn, nav.querySelector(".plus-btn").nextSibling);
    }

    loadAssets();
    fetchAllUsernames();
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
        toggleUploadPanel();
        e.target.reset();
        loadAssets();
    } else {
        alert("Upload failed.");
    }
});

async function loadAssets() {
    const res = await fetch(`${BASE_URL}/api/assets/approved`);
    const assets = await res.json();
    allAssets = assets;
    displayTopRated(assets);
    displayDiscover(assets);
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

// Fetch all usernames for search suggestions
async function fetchAllUsernames() {
    try {
        const res = await fetch(`${BASE_URL}/admin/users`, { credentials: "include" });
        const users = await res.json();
        allUsernames = users.map(u => u.username.toLowerCase());
    } catch (err) {
        console.error("Could not fetch users:", err);
    }
}

// Search bar functionality
document.getElementById("searchBar").addEventListener("input", () => {
    const query = document.getElementById("searchBar").value.toLowerCase().trim();
    const discover = document.getElementById("discoverSection");
    const topRated = document.getElementById("topRatedSection");

    discover.innerHTML = "";
    topRated.innerHTML = "";

    if (query === "") {
        displayTopRated(allAssets);
        displayDiscover(allAssets);
        return;
    }

    // Search assets by title or tag
    const filteredAssets = allAssets.filter(asset =>
        asset.title.toLowerCase().includes(query) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(query))
    );

    filteredAssets.forEach(asset => {
        discover.appendChild(createAssetCard(asset));
    });

    // Search usernames
    const matchedUser = allUsernames.find(u => u.includes(query));
    if (matchedUser) {
        const userResult = document.createElement("div");
        userResult.className = "asset-card";
        userResult.style.textAlign = "center";
        userResult.style.cursor = "pointer";
        userResult.innerHTML = `
            <h4>🔍 View @${matchedUser}'s uploads</h4>
            <p>Click to explore their assets</p>
        `;
        userResult.onclick = () => {
            window.location.href = `profile.html?username=${encodeURIComponent(matchedUser)}`;
        };
        discover.prepend(userResult);
    }
});
