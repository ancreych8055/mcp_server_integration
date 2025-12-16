document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Authentication elements
  const userIconBtn = document.getElementById("user-icon-btn");
  const userMenuDropdown = document.getElementById("user-menu-dropdown");
  const loginBtn = document.getElementById("login-btn");
  const loginModal = document.getElementById("login-modal");
  const closeBtn = document.querySelector(".close");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const loggedOutMenu = document.getElementById("logged-out-menu");
  const loggedInMenu = document.getElementById("logged-in-menu");
  const logoutBtn = document.getElementById("logout-btn");
  const loggedInUsername = document.getElementById("logged-in-username");

  let currentUser = null;

  // User menu toggle
  userIconBtn.addEventListener("click", () => {
    userMenuDropdown.classList.toggle("hidden");
  });

  // Close user menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
      userMenuDropdown.classList.add("hidden");
    }
  });

  // Login button click
  loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
    userMenuDropdown.classList.add("hidden");
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.classList.add("hidden");
    }
  });

  // Login form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );

      if (response.ok) {
        const result = await response.json();
        currentUser = result.username;
        loginMessage.textContent = result.message;
        loginMessage.className = "success";
        loginMessage.classList.remove("hidden");
        loginForm.reset();

        // Update UI
        updateAuthUI();

        setTimeout(() => {
          loginModal.classList.add("hidden");
          loginMessage.classList.add("hidden");
        }, 1500);
      } else {
        loginMessage.textContent = "Invalid credentials. Please try again.";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Login failed. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
      console.error("Login error:", error);
    }
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch(
        `/auth/logout?username=${encodeURIComponent(currentUser)}`,
        { method: "POST" }
      );
      currentUser = null;
      updateAuthUI();
      userMenuDropdown.classList.add("hidden");
    } catch (error) {
      console.error("Logout error:", error);
    }
  });

  // Update authentication UI
  function updateAuthUI() {
    if (currentUser) {
      loggedOutMenu.classList.add("hidden");
      loggedInMenu.classList.remove("hidden");
      loggedInUsername.textContent = `Logged in as: ${currentUser}`;
      userIconBtn.textContent = "✅";
    } else {
      loggedOutMenu.classList.remove("hidden");
      loggedInMenu.classList.add("hidden");
      userIconBtn.textContent = "👤";
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${currentUser ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ""}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!currentUser) {
      messageDiv.textContent = "Teachers must be logged in to unregister students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  updateAuthUI();
  fetchActivities();
});
