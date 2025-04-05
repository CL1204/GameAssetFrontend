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
        loadUsers();
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

// Load users
async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            credentials: "include"
        });

        const users = await res.json();
        renderUserTable(users);
    } catch (err) {
        console.error("Failed to load users:", err);
        alert("Failed to load users.");
    }
}

function renderUserTable(users) {
    const tbody = document.getElementById("usersList");
    tbody.innerHTML = "";

    users.forEach(user => {
        const tr = document.createElement("tr");

        const actions = [];
        if (user.is_banned) {
            actions.push(`<button class="action-btn" onclick="unbanUser(${user.id})">Unban</button>`);
        } else {
            actions.push(`<button class="action-btn ban-btn" onclick="banUser(${user.id})">Ban</button>`);
        }

        if (!user.is_admin) {
            actions.push(`<button class="action-btn" onclick="promoteUser(${user.id})">Promote</button>`);
        }

        actions.push(`<button class="action-btn" onclick="showUserDetails(${encodeURIComponent(JSON.stringify(user))})">Details</button>`);

        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>${user.is_banned ? "Banned" : "Active"}</td>
            <td>${user.is_admin ? "Admin" : "User"}</td>
            <td>${actions.join(" ")}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ban / Unban / Promote
async function banUser(id) {
    if (!confirm("Ban this user?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/ban/${id}`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadUsers();
    else alert("Failed to ban user.");
}

async function unbanUser(id) {
    if (!confirm("Unban this user?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/unban/${id}`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadUsers();
    else alert("Failed to unban user.");
}

async function promoteUser(id) {
    if (!confirm("Promote this user to admin?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/promote/${id}`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadUsers();
    else alert("Failed to promote user.");
}

// Search filter
function searchUsers() {
    const query = document.getElementById("userSearch").value.toLowerCase();
    const rows = document.querySelectorAll("#usersList tr");

    rows.forEach(row => {
        const username = row.children[0].textContent.toLowerCase();
        row.style.display = username.includes(query) ? "" : "none";
    });
}

// User modal
function showUserDetails(userJson) {
    const user = JSON.parse(decodeURIComponent(userJson));
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
        <div class="modal-content" style="background: #222; color: #fff; position: relative;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>User Details</h2>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> ${user.is_banned ? "Banned" : "Active"}</p>
            <p><strong>Role:</strong> ${user.is_admin ? "Admin" : "User"}</p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = "block";
}

// Tab toggle
function toggleAdminTab(tab) {
    const pendingSection = document.getElementById("pendingSection");
    const usersSection = document.getElementById("usersSection");

    if (tab === "pending") {
        pendingSection.style.display = "block";
        usersSection.style.display = "none";
    } else {
        usersSection.style.display = "block";
        pendingSection.style.display = "none";
    }
}
