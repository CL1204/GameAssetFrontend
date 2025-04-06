const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

window.onload = async () => {
    try {
        const res = await fetch(`${BASE_URL}/api/assets/approved`);
        const assets = await res.json();
        displayAssets(assets);
        setupSearch(assets);

        // Show default category
        const defaultBtn = document.querySelector(".category-btn.active");
        if (defaultBtn) showCategory("characters", defaultBtn);
    } catch (err) {
        console.error("Failed to fetch assets:", err);
    }
};

function showCategory(category, clickedElement) {
    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    clickedElement.classList.add("active");

    // Starburst animation
    clickedElement.classList.add("clicked");
    setTimeout(() => clickedElement.classList.remove("clicked"), 600);

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

// ✅ Upload logic
document.getElementById("uploadForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById("assetFile").files[0];
    const title = document.getElementById("assetName").value;
    const category = document.getElementById("assetCategory").value;
    const description = document.getElementById("assetDescription").value;
    const tags = document.getElementById("tagInput").value.split(",").map(tag => tag.trim());

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    tags.forEach(tag => formData.append("tags", tag));

    const res = await fetch(`${BASE_URL}/api/assets/upload`, {
        method: "POST",
        credentials: "include",
        body: formData
    });

    if (res.ok) {
        alert("Upload successful! Awaiting approval.");
        document.getElementById("uploadForm").reset();
        toggleUploadPanel();
    } else {
        alert("Upload failed.");
    }
});
