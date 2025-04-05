const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

// Load assets on page load
window.onload = async () => {
    try {
        const res = await fetch(`${BASE_URL}/api/assets/approved`);
        const assets = await res.json();
        displayAssets(assets);
        setupSearch(assets);
        showCategory("characters", document.querySelector(".category-btn.active"));
    } catch (err) {
        console.error("Failed to fetch assets:", err);
    }
};

// Show category section
function showCategory(category, clickedElement) {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    clickedElement.classList.add("active");

    document.querySelectorAll(".asset-section").forEach(section => {
        section.classList.remove("active");
    });
    document.getElementById(`${category}-section`).classList.add("active");

    document.getElementById("searchBar").value = "";
    searchAssets(category);
}

// Populate grid by category
function displayAssets(assets) {
    const categories = {
        characters: document.getElementById("characters"),
        environment: document.getElementById("environment"),
        soundtracks: document.getElementById("soundtracks")
    };

    Object.values(categories).forEach(el => el.innerHTML = "");

    assets.forEach(asset => {
        const card = document.createElement("div");
        card.className = "asset-card";
        card.innerHTML = `
            <button class="favorite-btn" onclick="likeAsset(${asset.id}, this)">
                ♥ <span class="favorite-count">${asset.likes}</span>
            </button>
            <img src="${asset.imageUrl}" alt="${asset.title}" onerror="this.src='placeholder.jpg'" />
            <h4>${asset.title}</h4>
            <p>${asset.description}</p>
            <small>Tags: ${asset.tags?.join(", ") || "None"}</small>
            <a class="download-btn" href="#" onclick="downloadAsset(${asset.id}, '${asset.fileUrl}'); return false;">Download</a>
        `;
        if (categories[asset.category]) {
            categories[asset.category].appendChild(card);
        }
    });
}

// Search assets by title and tag
function setupSearch(assets) {
    const searchInput = document.getElementById("searchBar");
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const active = document.querySelector(".asset-section.active");
        const category = active.id.replace("-section", "");

        const filtered = assets.filter(a =>
            a.category === category &&
            (a.title.toLowerCase().includes(query) ||
                a.tags?.some(tag => tag.toLowerCase().includes(query)))
        );

        const container = document.getElementById(category);
        container.innerHTML = "";

        if (filtered.length === 0) {
            container.innerHTML = "<p>No matching assets found.</p>";
            return;
        }

        filtered.forEach(asset => {
            const card = document.createElement("div");
            card.className = "asset-card";
            card.innerHTML = `
                <button class="favorite-btn" onclick="likeAsset(${asset.id}, this)">
                    ♥ <span class="favorite-count">${asset.likes}</span>
                </button>
                <img src="${asset.imageUrl}" alt="${asset.title}" onerror="this.src='placeholder.jpg'" />
                <h4>${asset.title}</h4>
                <p>${asset.description}</p>
                <small>Tags: ${asset.tags?.join(", ") || "None"}</small>
                <a class="download-btn" href="#" onclick="downloadAsset(${asset.id}, '${asset.fileUrl}'); return false;">Download</a>
            `;
            container.appendChild(card);
        });
    });
}

// Handle Like action
async function likeAsset(id, button) {
    try {
        const res = await fetch(`${BASE_URL}/api/assets/${id}/like`, {
            method: "POST",
            credentials: "include"
        });

        if (res.ok) {
            const data = await res.json();
            button.querySelector(".favorite-count").textContent = data.likes;
        } else {
            console.error("Failed to like:", await res.text());
        }
    } catch (err) {
        console.error("Error liking asset:", err);
    }
}

// Handle Download action
async function downloadAsset(id, fileUrl) {
    try {
        await fetch(`${BASE_URL}/api/assets/${id}/download`, {
            method: "POST",
            credentials: "include"
        });
        window.open(fileUrl, "_blank");
    } catch (err) {
        console.error("Download error:", err);
    }
}
