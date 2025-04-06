const API_BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044/api"
    : "https://gameasset-backend-aj1g.onrender.com/api";

// Auth check
(async function init() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/check-auth`, {
            credentials: "include",
        });
        const auth = await res.json();

        if (!res.ok || !auth.isAdmin) {
            window.location.href = "dashboard.html";
            return;
        }

        document.getElementById("userLabel").textContent = auth.username;
        loadPendingAssets();
    } catch (err) {
        console.error("Auth error:", err);
        window.location.href = "login.html";
    }
})();

// Logout
function logout() {
    fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include"
    }).then(() => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

// Load pending assets
async function loadPendingAssets() {
    try {
        const res = await fetch(`${API_BASE_URL}/assets/pending`, {
            credentials: "include"
        });

        const assets = await res.json();
        renderPendingAssets(assets);
    } catch (err) {
        console.error("Failed to load pending assets:", err);
    }
}

function renderPendingAssets(assets) {
    const tbody = document.getElementById("pendingAssets");
    tbody.innerHTML = "";

    if (!assets.length) {
        tbody.innerHTML = `<tr><td colspan="5">No pending assets</td></tr>`;
        return;
    }

    assets.forEach(asset => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${asset.title}</td>
            <td>${asset.category}</td>
            <td>${asset.username || "Unknown"}</td>
            <td>${new Date(asset.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn approve-btn" onclick="approveAsset(${asset.id})">Approve</button>
                <button class="action-btn reject-btn" onclick="rejectAsset(${asset.id})">Reject</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Approve / Reject asset
async function approveAsset(id) {
    if (!confirm("Approve this asset?")) return;

    const res = await fetch(`${API_BASE_URL}/assets/${id}/approve`, {
        method: "POST",
        credentials: "include"
    });

    if (res.ok) {
        alert("Asset approved!");
        loadPendingAssets();
    } else {
        alert("Failed to approve asset.");
    }
}

async function rejectAsset(id) {
    if (!confirm("Reject this asset? This cannot be undone.")) return;

    const res = await fetch(`${API_BASE_URL}/assets/${id}/reject`, {
        method: "DELETE",
        credentials: "include"
    });

    if (res.ok) {
        alert("Asset rejected.");
        loadPendingAssets();
    } else {
        alert("Failed to reject asset.");
    }
}
