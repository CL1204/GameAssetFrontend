const BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:7044"
    : "https://gameasset-backend-aj1g.onrender.com";

async function injectBottomNav() {
    const res = await fetch(`${BASE_URL}/api/auth/check-auth`, {
        credentials: "include"
    });

    if (!res.ok) {
        window.location.href = "login.html";
        return;
    }

    const user = await res.json();

    // Highlight current page
    const currentPath = window.location.pathname.split("/").pop();

    const navHTML = `
        <nav class="bottom-nav" id="bottomNav">
            <button ${currentPath === "dashboard.html" ? 'class="active"' : ""} onclick="location.href='dashboard.html'">
                <span>🏠</span><span>Home</span>
            </button>
            <button ${currentPath === "assets.html" ? 'class="active"' : ""} onclick="location.href='assets.html'">
                <span>📂</span><span>Explore</span>
            </button>
            <button class="plus-btn" onclick="toggleUploadPanel()">+</button>
            <button ${currentPath === "profile.html" ? 'class="active"' : ""} onclick="location.href='profile.html'">
                <span>👤</span><span>Me</span>
            </button>
            ${user.isAdmin ? `
            <button ${currentPath === "admin.html" ? 'class="active"' : ""} onclick="location.href='admin.html'">
                <span>🛠️</span><span>Actions</span>
            </button>` : ""}
        </nav>
    `;

    document.getElementById("bottomNavContainer").innerHTML = navHTML;

    // Optional: mark admin badge if available
    if (user.isAdmin && document.getElementById("adminBadge")) {
        document.getElementById("adminBadge").style.display = "inline";
    }
}

injectBottomNav();
