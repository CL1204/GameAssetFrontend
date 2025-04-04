const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

// Auth check on load
window.onload = async function () {
    const auth = await fetch(`${BASE_URL}/api/auth/check-auth`, { credentials: "include" });
    if (!auth.ok) return (window.location.href = "login.html");

    const data = await auth.json();
    localStorage.setItem("username", data.username);
    document.getElementById("logout-btn").style.display = "block";
    if (data.isAdmin) {
        document.getElementById("adminBadge").style.display = "inline";
        document.getElementById("adminLink").style.display = "inline";
    }
    loadAssets();
};

document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
    localStorage.clear();
    window.location.href = "login.html";
});

async function loadAssets() {
    const res = await fetch(`${BASE_URL}/api/assets/approved`);
    const data = await res.json();
    displayAssets(data);
}

function displayAssets(assets) {
    const grids = {
        characters: document.getElementById("characters"),
        environment: document.getElementById("environment"),
        soundtracks: document.getElementById("soundtracks"),
    };
    Object.values(grids).forEach(grid => (grid.innerHTML = ""));

    assets.forEach(asset => {
        const card = document.createElement("div");
        card.className = "asset-card";
        card.innerHTML = `
            <button class="favorite-btn" onclick="likeAsset(${asset.id}, event)">
                ♥ <span class="favorite-count">${asset.likes}</span>
            </button>
            <img src="${asset.imageUrl}" alt="${asset.title}" onerror="this.src='placeholder.jpg'" />
            <h4>${asset.title}</h4>
            <p>${asset.description}</p>
            <small>Tags: ${asset.tags ? asset.tags.join(", ") : "None"}</small>
        `;

        const category = asset.description.toLowerCase().includes("sound")
            ? "soundtracks"
            : asset.description.toLowerCase().includes("forest") || asset.description.toLowerCase().includes("environment")
                ? "environment"
                : "characters";

        grids[category].appendChild(card);
    });
}

async function likeAsset(id, event) {
    event.stopPropagation();
    const res = await fetch(`${BASE_URL}/api/assets/${id}/like`, {
        method: "POST",
        credentials: "include",
    });
    if (res.ok) loadAssets();
}

document.getElementById("uploadForm").addEventListener("submit", async e => {
    e.preventDefault();
    const file = document.getElementById("assetFile").files[0];
    const title = document.getElementById("assetName").value;
    const category = document.getElementById("assetCategory").value;
    const description = document.getElementById("assetDescription").value;
    const tags = document.getElementById("tagInput").value.split(",").map(tag => tag.trim()).filter(Boolean);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    tags.forEach(tag => formData.append("tags", tag));

    const res = await fetch(`${BASE_URL}/api/assets/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
    });

    if (res.ok) {
        alert("Upload successful!");
        loadAssets();
        toggleUploadPanel();
        e.target.reset();
    } else {
        alert("Upload failed.");
    }
});

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

function openUserSettings() {
    document.getElementById("settingsModal").style.display = "block";
}

function closeUserSettings() {
    document.getElementById("settingsModal").style.display = "none";
}

document.getElementById("settingsForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const newUsername = document.getElementById("newUsername").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();

    const payload = {};
    if (newUsername) payload.username = newUsername;
    if (newPassword) payload.password = newPassword;

    const res = await fetch(`${BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("Profile updated successfully!");
        closeUserSettings();
    } else {
        alert("Failed to update profile.");
    }
});
