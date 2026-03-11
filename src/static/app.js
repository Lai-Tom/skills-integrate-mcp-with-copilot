document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupModal = document.getElementById("signup-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelModalBtn = document.getElementById("cancel-modal");
  const activityHiddenField = document.getElementById("activity-hidden");
  
  let selectedActivity = null;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list as cards
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        
        const isFull = spotsLeft === 0;

        // Create participants HTML
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants (${details.participants.length}/${details.max_participants}):</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        const statusColor = isFull ? "#ff9800" : "#4caf50";
        const statusText = isFull ? "FULL" : `${spotsLeft} spots`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Capacity:</strong> <span class="details-text" style="color: ${statusColor};">${statusText}</span></p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="button-group">
            <button class="btn-signup" data-activity="${name}" ${isFull ? 'disabled' : ''}>Sign Up</button>
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to signup buttons
      document.querySelectorAll(".btn-signup").forEach((button) => {
        button.addEventListener("click", handleSignupClick);
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

  // Handle signup button click - open modal
  function handleSignupClick(event) {
    event.preventDefault();
    selectedActivity = event.target.getAttribute("data-activity");
    activityHiddenField.textContent = selectedActivity;
    signupModal.showModal();
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    
    if (!selectedActivity || !email) {
      messageDiv.textContent = "Please select an activity and enter your email";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(selectedActivity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          signupModal.close();
          messageDiv.classList.add("hidden");
        }, 1500);

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
    } catch (error) {
      messageDiv.textContent = "Error: " + error.message;
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle unregister functionality
  async function handleUnregister(event) {
    event.preventDefault();
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
    } catch (error) {
      messageDiv.textContent = "Error: " + error.message;
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Modal close handlers
  closeModalBtn.addEventListener("click", () => {
    signupModal.close();
  });

  cancelModalBtn.addEventListener("click", () => {
    signupModal.close();
  });

  // Close modal when clicking outside
  signupModal.addEventListener("click", (event) => {
    if (event.target === signupModal) {
      signupModal.close();
    }
  });

  // Initial load
  fetchActivities();
});
