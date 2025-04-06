const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

window.onload = async () => {
    try {
        const res = await fetch(`${BASE_URL}/api/assets/approved`);
        const assets = await res.json();
        displayAssets(assets);
        setupSearch(assets);
        const defaultBtn = document.querySelector(".category-btn.active");
        if (defaultBtn) showCategory("characters", defaultBtn);
    } catch (err) {
        console.error("Failed to fetch assets:", err);
    }
};

function showCategory(category, clickedElement) {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    clickedElement.classList.add("active");

    // Add clicked animation
    clickedElement.classList.add("clicked");
    setTimeout(() => clickedElement.classList.remove("clicked"), 600); // match animation duration

    document.querySelectorAll(".asset-section").forEach(section => section.classList.remove("active"));
    const section = document.getElementById(`${category}-section`);
    if (section) section.classList.add("active");

    document.getElementById("searchBar").value = "";
}


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
        categories[asset.category]?.appendChild(card);
    });
}

function setupSearch(assets) {
    const input = document.getElementById("searchBar");
    input.addEventListener("input", () => {
        const query = input.value.toLowerCase();
        const active = document.querySelector(".asset-section.active");
        const category = active.id.replace("-section", "");

        const filtered = assets.filter(a =>
            a.category === category &&
            (a.title.toLowerCase().includes(query) ||
                a.tags?.some(tag => tag.toLowerCase().includes(query)))
        );

        const container = document.getElementById(category);
        container.innerHTML = filtered.length
            ? ""
            : "<p>No matching assets found.</p>";

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

function toggleUploadPanel() {
    const panel = document.getElementById("uploadPanel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}
