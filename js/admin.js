const API_BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044/api"
    : "https://gameasset-backend-aj1g.onrender.com/api";

// Initial auth check and load
(async function init() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/check-auth`, {
            credentials: "include"
        });

        const auth = await res.json();
        if (!res.ok || !auth.isAdmin) {
            window.location.href = "dashboard.html";
            return;
        }

        loadUsers();
    } catch (err) {
        console.error("Auth error:", err);
        window.location.href = "login.html";
    }
})();

// Logout handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        localStorage.clear();
        window.location.href = "login.html";
    });
}

// Fetch and render all users
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

// Render user rows with new features
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
            <td>—</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>${user.is_banned ? "Banned" : "Active"}</td>
            <td>${actions.join(' ')}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ban/unban/promotion
async function banUser(id) {
    if (!confirm("Are you sure you want to ban this user?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/ban/${id}`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadUsers(); else alert("Failed to ban user.");
}

async function unbanUser(id) {
    if (!confirm("Unban this user?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/unban/${id}`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadUsers(); else alert("Failed to unban user.");
}

async function promoteUser(id) {
    if (!confirm("Promote this user to admin?")) return;
    const res = await fetch(`${API_BASE_URL}/admin/promote/${id}`, {
        method: "POST",
        credentials: "include"
    });
    if (res.ok) loadUsers(); else alert("Failed to promote user.");
}

// Search
function searchUsers() {
    const query = document.getElementById("userSearch").value.toLowerCase();
    const rows = document.querySelectorAll("#usersList tr");

    rows.forEach(row => {
        const username = row.children[0].textContent.toLowerCase();
        row.style.display = username.includes(query) ? "" : "none";
    });
}

// Modal: user details
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
