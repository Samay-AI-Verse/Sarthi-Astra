// Global state
let currentTab = "all";
let notebooks = [];
let currentUser = {};
let socket = null;
let currentChattingFriend = null; // Object: { id, name, type: 'friend'|'group', pic? }
let toastTimeout = null;
let friendsListCache = []; // Cache of user's friends { google_id, name, picture_url }
let teamSpacesDot, profileDot, notificationBadge, fabMainBtn, fabMenu;
let hasUnreadMessages = false;
let hasUnreadFriendRequests = false;
let currentGroupDetails = {}; // Will store {id, name, role} of the open group
let sharedNotebooks = [];
// --- Function to fetch notebooks from the backend ---
async function fetchNotebooks() {
  try {
    const response = await fetch("/api/notebooks");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    notebooks = await response.json();
    renderNotebooks();
  } catch (error) {
    console.error("Could not fetch Spaces:", error);
  }
}

async function fetchCurrentUser() {
  try {
    const response = await fetch("/api/user/me");
    if (!response.ok) {
      if (response.status !== 401) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return;
    }
    currentUser = await response.json();

    if (currentUser.is_authenticated) {
      if (currentUser.id) {
        connectWebSocket(currentUser.id);
        await loadFriendsIntoCache(); // Loads friends right after connecting
      } else {
        console.error(
          "User ID not found in /api/user/me response. WebSocket cannot connect."
        );
      }

      // Safely access elements that need updating
      const profileImgHeader = document.getElementById("profileImg");
      const profileGreeting = document.getElementById("profileGreetingName");
      const profileEmail = document.getElementById("profileEmail");

      const firstName = currentUser.name.split(" ")[0];

      if (profileImgHeader && currentUser.picture) {
        profileImgHeader.src = currentUser.picture;
      }
      const profilePicDiv = document.querySelector(".profile-pic");
      if (profilePicDiv && currentUser.picture) {
        profilePicDiv.style.backgroundImage = `url('${currentUser.picture}')`;
      }
      if (profileGreeting) {
        profileGreeting.textContent = `Hi, ${firstName}!`;
      }
      if (profileEmail) {
        profileEmail.textContent = currentUser.email;
      }
    }
  } catch (error) {
    console.error("Could not fetch user info:", error);
  }
}

// --- Function to delete a notebook ---
async function deleteNotebook(notebookId, event) {
  event.stopPropagation();
  if (!confirm("Are you sure you want to delete this Space?")) {
    return;
  }
  try {
    const response = await fetch(`/api/notebooks/${notebookId}`, {
      method: "DELETE",
    });
    if (response.status === 204) {
      notebooks = notebooks.filter((nb) => nb.id !== notebookId);
      renderNotebooks();
      localStorage.removeItem(`chat_${notebookId}`);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete Space");
    }
  } catch (error) {
    console.error("Error deleting Space:", error);
    alert("Could not delete the Space. Please try again.");
  }
}

// Tab switching
document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    document
      .querySelectorAll(".nav-tab")
      .forEach((t) => t.classList.remove("active"));
    this.classList.add("active");
    currentTab = this.dataset.tab;
    updateView();
  });
});

function updateView() {
  const mySpacesSection = document.getElementById("my-spaces-section");
  const sharedSpacesSection = document.getElementById("shared-spaces-section");

  // Hide all sections first
  mySpacesSection.classList.add("hidden");
  sharedSpacesSection.classList.add("hidden");

  switch (currentTab) {
    case "all":
      mySpacesSection.classList.remove("hidden");
      // REMOVED: sharedSpacesSection.classList.remove("hidden");  <-- We removed this line
      // We let the data fetching functions decide if the sections should show
      fetchNotebooks();
      fetchSharedNotebooks();
      break;
    case "my":
      mySpacesSection.classList.remove("hidden");
      fetchNotebooks();
      break;
    case "featured":
      // For the specific "Departmental" tab, we force it open (or you can keep it hidden until loaded)
      sharedSpacesSection.classList.remove("hidden");
      fetchSharedNotebooks();
      break;
  }
}
// --- Modal functions ---
function openCreateModal() {
  document.getElementById("createModal").style.display = "flex";
  document.getElementById("notebookTitle").focus();
}

function openAddFriendModal() {
  document.getElementById("addFriendModal").style.display = "flex";
  document.getElementById("modal-friend-search-input").focus();
}

// UPDATED: closeModal handles all modals
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.style.display = "none";

  if (modalId === "createModal") {
    const form = document.getElementById("createForm");
    if (form) form.reset();
  } else if (modalId === "addFriendModal") {
    const searchInput = document.getElementById("modal-friend-search-input");
    const searchResults = document.getElementById(
      "modal-friend-search-results"
    );
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
  } else if (modalId === "createGroupModal") {
    const form = document.getElementById("createGroupForm");
    if (form) form.reset();
    const list = document.getElementById("group-friend-list");
    if (list) list.innerHTML = "";
  } else if (modalId === "joinGroupModal") {
    const form = document.getElementById("joinGroupForm");
    if (form) form.reset();
  }
  // REMOVED manageGroupModal and addMemberModal else ifs
}

// --- Create notebook form submission ---
document
  .getElementById("createForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("notebookTitle").value;

    // CRITICAL CHANGE: Remove the local 'id: Date.now()' and 'date: ...' generation
    const newNotebookPayload = {
      title: title,
      sources: [],
    };

    try {
      const response = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send payload without the ID
        body: JSON.stringify(newNotebookPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdNotebook = await response.json();

      // CRITICAL: createdNotebook now contains the server-generated ID and date/owner

      // 1. Update the local list
      notebooks.unshift(createdNotebook);
      renderNotebooks();
      closeModal("createModal");

      // 2. Redirect to the newly created notebook using the SERVER'S ID
      if (createdNotebook.id) {
        window.location.href = `/document/${createdNotebook.id}`;
      } else {
        // Fallback if the server didn't return an ID (shouldn't happen)
        alert("Space created, but ID was missing. Redirecting to Spaces page.");
      }

    } catch (error) {
      console.error("Could not create notebook:", error);
      alert("Failed to create notebook. Please check the console for details.");
    }
  });

// Render notebooks
// In index.js, REPLACE the existing renderNotebooks function
function renderNotebooks() {
  const grid = document.getElementById("recent-grid");

  // Clear only the dynamic items, not the "Create New" card
  const existingCards = grid.querySelectorAll('.recent-card:not(.create-new-card)');
  existingCards.forEach(card => card.remove());

  if (notebooks.length === 0) {
    // Optional: Show a message if there are no user-created notebooks
    // You can add a <p> tag here if you want
  }

  notebooks.forEach((notebook) => {
    const card = document.createElement('div');
    card.className = 'recent-card';
    card.onclick = () => window.location.href = `/document/${notebook.id}`;
    card.innerHTML = `
        <button class="options-btn" onclick="deleteNotebook(${notebook.id}, event)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
          <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0 1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
        </svg></button>
        <div class="notebook-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
          <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
        </svg></div>
        <h3 class="notebook-title">${notebook.title}</h3>
        <div class="notebook-meta">
            <span>${notebook.date}</span>
            <span>•</span>
            <span>${notebook.sources.length} source${notebook.sources.length !== 1 ? "s" : ""}</span>
        </div>
    `;
    // Append at the end of the grid
    grid.appendChild(card);
  });
}

// --- POP-UPS AND DROPDOWNS LOGIC ---
const settingsBtn = document.getElementById("settingsBtn");
const profileBtn = document.getElementById("profileBtn");
const teamSpacesBtn = document.getElementById("teamSpacesBtn");
const teamSpacesPanel = document.getElementById("teamSpacesPanel");
const closeTeamSpacesPanelBtn = document.getElementById("closeTeamSpacesPanel");
const body = document.body;
const profilePopup = document.getElementById("profilePopup");
const settingsDropdown = document.getElementById("settingsDropdown");
const closeProfileBtn = document.getElementById("closeProfileBtn");

if (closeProfileBtn) {
  closeProfileBtn.addEventListener("click", () => {
    profilePopup.style.display = "none";
  });
}

if (teamSpacesBtn) {
  teamSpacesBtn.addEventListener("click", () => {
    closeAllPopups();
    body.classList.toggle("panel-open");
    if (body.classList.contains("panel-open")) {
      hasUnreadMessages = false;
      updateGlobalNotificationDots();
      fetchAndRenderTeamSpaces();
      // NEW: Ensure we're on the main panel view when opening
      showTeamSpacesPanel("panel-main-content");
    }
  });
}

// Find ALL buttons that should open the add friend modal
const addFriendButtons = document.querySelectorAll(".js-add-friend-btn");

// Loop through each button and attach the click event
addFriendButtons.forEach((button) => {
  button.addEventListener("click", openAddFriendModal);
});

if (closeTeamSpacesPanelBtn) {
  closeTeamSpacesPanelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    body.classList.remove("panel-open");
  });
}

settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  profilePopup.style.display = "none";
  body.classList.remove("panel-open");
  settingsDropdown.classList.toggle("show");
});

profileBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsDropdown.classList.remove("show");
  body.classList.remove("panel-open");
  const isHidden =
    profilePopup.style.display === "none" || profilePopup.style.display === "";
  profilePopup.style.display = isHidden ? "block" : "none";
});

// UPDATED: closeAllPopups handles all modals
function closeAllPopups() {
  if (profilePopup) profilePopup.style.display = "none";
  if (settingsDropdown) settingsDropdown.classList.remove("show");
  closeModal("createModal");
  closeModal("addFriendModal");
  closeModal("createGroupModal");
  closeModal("joinGroupModal");
  // REMOVED manageGroupModal and addMemberModal

  // Also hide the new group chat dropdown
  const groupChatDropdown = document.getElementById("group-chat-dropdown");
  if (groupChatDropdown) groupChatDropdown.classList.remove("show");
}

window.addEventListener("click", function (e) {
  const isPanelOpen = body.classList.contains("panel-open");
  const mainContentWrapper = document.getElementById("mainContentWrapper");

  // Close TeamSpaces panel if clicking outside
  if (
    isPanelOpen &&
    !teamSpacesPanel.contains(e.target) &&
    !teamSpacesBtn.contains(e.target) &&
    mainContentWrapper.contains(e.target)
  ) {
    body.classList.remove("panel-open");
  }
  // Close Settings dropdown if clicking outside
  if (
    settingsDropdown &&
    settingsDropdown.classList.contains("show") &&
    !settingsBtn.contains(e.target) &&
    !settingsDropdown.contains(e.target)
  ) {
    settingsDropdown.classList.remove("show");
  }
  // Close Profile popup if clicking outside
  if (
    profilePopup &&
    profilePopup.style.display === "block" &&
    !profileBtn.contains(e.target) &&
    !profilePopup.contains(e.target)
  ) {
    profilePopup.style.display = "none";
  }
  // Close FAB menu if clicking outside
  if (
    fabMenu &&
    fabMenu.classList.contains("show") &&
    !fabMainBtn.contains(e.target) &&
    !fabMenu.contains(e.target)
  ) {
    fabMenu.classList.remove("show");
    fabMainBtn.classList.remove("active");
  }
  // Close any modal if clicking on the backdrop
  if (e.target.classList.contains("modal")) {
    closeModal(e.target.id);
  }
  // Close friend/group options menu if clicking outside
  if (!e.target.closest(".friend-options-container")) {
    document.querySelectorAll(".friend-options-menu.show").forEach((m) => {
      m.classList.remove("show");
    });
  }
  // Close group chat dropdown if clicking outside
  const groupChatDropdown = document.getElementById("group-chat-dropdown");
  if (
    groupChatDropdown &&
    groupChatDropdown.classList.contains("show") &&
    !e.target.closest(".group-chat-options-container")
  ) {
    groupChatDropdown.classList.remove("show");
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeAllPopups();
    body.classList.remove("panel-open");
  }
});

// --- THEME TOGGLE SCRIPT ---
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const applySavedTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark-mode");
  else document.body.classList.remove("dark-mode");
};
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
});


// --- CHAT PANEL LOGIC ---

// --- NEW Helper Function for Panel Navigation ---
function showTeamSpacesPanel(viewId) {
  // Hide all panel views
  document.getElementById("panel-main-content").classList.add("hidden");
  document.getElementById("panel-chat-view").classList.add("hidden");
  document.getElementById("panel-manage-group-view").classList.add("hidden");
  document.getElementById("panel-add-member-view").classList.add("hidden");

  // Show the requested one
  const viewToShow = document.getElementById(viewId);
  if (viewToShow) {
    viewToShow.classList.remove("hidden");
  }

  // Also hide the main panel header if we are not on the main list
  const mainHeader = document.querySelector("#teamSpacesPanel .panel-header");
  if (mainHeader) {
    mainHeader.classList.toggle("hidden", viewId !== "panel-main-content");
  }
}

/**
 * UPDATED: Opens any chat and handles group options button.
 * @param {object} chatTarget - An object: { id, name, type: 'friend'|'group', pic? }
 */
function openChatView(chatTarget) {
  currentChattingFriend = chatTarget; // Set the global state

  const chatPic = document.getElementById("chat-friend-pic");
  const chatNameEl = document.getElementById("chat-friend-name");
  const groupOptionsBtn = document.getElementById("group-chat-options-btn");

  // --- NEW: Elements for Admin Options (Defined here for scope) ---
  const manageGroupBtn = document.getElementById("manage-group-btn");
  const addMemberBtn = document.getElementById("add-member-btn");
  const divider = document.querySelector("#group-chat-dropdown .dropdown-divider");


  // Configure the chat header
  chatNameEl.textContent = chatTarget.name;
  if (chatTarget.type === 'friend' && chatTarget.pic) {
    chatPic.src = chatTarget.pic;
    chatPic.style.display = 'block';
    groupOptionsBtn.classList.add("hidden"); // Hide group button

    // Hide all admin options and the divider for 1-to-1 chat
    if (manageGroupBtn) manageGroupBtn.classList.add("hidden");
    if (addMemberBtn) addMemberBtn.classList.add("hidden");
    if (divider) divider.classList.add("hidden");

  } else {
    // It's a group
    chatPic.style.display = 'none';

    // Store current group info (we get the role from the data-attribute on the list item)
    const groupListItem = document.querySelector(`.friend-item[data-chat-id="${chatTarget.id}"][data-chat-type="group"]`);
    const userRole = groupListItem ? groupListItem.dataset.userRole : 'member';

    currentGroupDetails = {
      id: chatTarget.id,
      name: chatTarget.name,
      role: userRole
    };

    // Show the cog button for group options
    groupOptionsBtn.classList.remove("hidden");

    // --- THIS IS THE KEY CHANGE FOR THE DROPDOWN OPTIONS ---
    const isUserAdmin = userRole === 'admin';

    // Toggling visibility of ADMIN OPTIONS
    if (manageGroupBtn) manageGroupBtn.classList.toggle("hidden", !isUserAdmin);
    if (addMemberBtn) addMemberBtn.classList.toggle("hidden", !isUserAdmin);

    // Only show the divider if we are showing the admin options
    if (divider) divider.classList.toggle("hidden", !isUserAdmin);

    // The leave-group-btn is always visible for members, so no toggle is needed here
    // --- END REQUIRED CHANGES ---
  }

  // Show the chat panel
  showTeamSpacesPanel("panel-chat-view");

  // Fetch the correct message history
  fetchAndRenderMessages(chatTarget.type, chatTarget.id);

  // Mark as "seen" logic
  if (chatTarget.type === 'friend') {
    const friendElement = document.querySelector(`.friend-item[data-chat-id="${chatTarget.id}"][data-chat-type="friend"]`);
    friendElement?.querySelector(".unread-dot")?.classList.add("hidden");

    fetch(`/api/messages/mark-as-seen/${chatTarget.id}`, { method: "POST" })
      .catch((err) => console.error("Failed to mark messages as seen:", err));

  } else if (chatTarget.type === 'group') {
    const groupElement = document.querySelector(`.friend-item[data-chat-id="${chatTarget.id}"][data-chat-type="group"]`);
    groupElement?.querySelector(".unread-dot")?.classList.add("hidden");

    // Call the new endpoint to update the timestamp
    fetch(`/api/groups/mark-as-seen/${chatTarget.id}`, { method: "POST" })
      .catch((err) => console.error("Failed to mark group as seen:", err));
  }
}

function closeChatView() {
  currentChattingFriend = null;
  currentGroupDetails = {}; // Clear group details

  showTeamSpacesPanel("panel-main-content"); // UPDATED

  document.getElementById("chat-messages-panel").innerHTML = "";
  // Hide the group options button when closing any chat
  document.getElementById("group-chat-options-btn").classList.add("hidden");
}

document
  .getElementById("back-to-friends-btn")
  .addEventListener("click", closeChatView);

/**
 * Fetches messages for either a friend or a group.
 * @param {string} chatType - 'friend' or 'group'
 * @param {string} chatId - The friend's google_id or the group_id
 */
async function fetchAndRenderMessages(chatType, chatId) {
  const messagesContainer = document.getElementById("chat-messages-panel");
  messagesContainer.innerHTML = ""; // Clear old messages

  const endpoint = chatType === 'friend'
    ? `/api/messages/${chatId}`
    : `/api/groups/messages/${chatId}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch messages");

    const messages = await response.json();

    if (messages.length === 0) {
      messagesContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No messages yet. Say hi!</p>';
    } else {
      messages.forEach((msg) => {
        const type = msg.sender_id === currentUser.id ? "sent" : "received";
        appendMessage(msg.content, type, msg.sender_name);
      });
    }

  } catch (error) {
    console.error("Error fetching messages:", error);
    messagesContainer.innerHTML =
      '<p style="text-align:center; color: red;">Could not load messages.</p>';
  }
}

/**
 * Appends a message, showing sender's name for group chats.
 * @param {string} content - The message text
 * @param {string} type - 'sent' or 'received'
 * @param {string | null} senderName - The name of the sender (for group chats)
 */
function appendMessage(content, type, senderName = null) {
  const messagesContainer = document.getElementById("chat-messages-panel");
  const messageBubble = document.createElement("div");
  messageBubble.classList.add("message-bubble", type);

  let messageContent = "";

  if (type === 'received' && currentChattingFriend && currentChattingFriend.type === 'group' && senderName) {
    messageContent = `<strong class="sender-name" style="font-weight: 600; display: block; margin-bottom: 2px;">${senderName}</strong><br>${content}`;
    messageBubble.innerHTML = messageContent;
  } else {
    messageBubble.textContent = content;
  }

  messagesContainer.appendChild(messageBubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Chat form submission handles both friends and groups
document.getElementById("chat-form-panel").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("chat-input-panel");
  const message = input.value.trim();

  if (message && currentChattingFriend && socket) {

    let payload;

    if (currentChattingFriend.type === 'friend') {
      payload = {
        type: "chat_message",
        to: currentChattingFriend.id,
        content: message,
      };
    } else {
      payload = {
        type: "group_message",
        to_group_id: currentChattingFriend.id,
        content: message,
      };
    }

    socket.send(JSON.stringify(payload));
    appendMessage(message, "sent");
    input.value = "";
  }
});

/**
 * Fetches both groups and friends and renders them in the TeamSpaces panel.
 */
// In index.js

/**
 * Fetches both groups and friends and renders them in the TeamSpaces panel.
 */
async function fetchAndRenderTeamSpaces() {
  const listContainer = document.getElementById("friend-list-container");
  if (!listContainer) return;

  listContainer.innerHTML = '<p style="padding: 10px; text-align: center; color: var(--text-secondary);">Loading...</p>';

  try {
    const [groupsResponse, friendsResponse] = await Promise.all([
      fetch("/api/groups/list"),
      fetch("/api/friends/list")
    ]);

    if (!groupsResponse.ok || !friendsResponse.ok) {
      throw new Error("Failed to fetch TeamSpaces data");
    }

    const groups = await groupsResponse.json();
    const friends = await friendsResponse.json();

    // Update global cache (only friends needed for now)
    friendsListCache = friends;

    let html = "";

    // --- Render Groups ---
    if (groups.length > 0) {
      html += `<h4 class="chat-list-section-title">Groups</h4>`;
      groups.forEach(group => {
        html += `
          <div class="friend-item"
               data-chat-type="group"
               data-chat-id="${group.group_id}"
               data-chat-name="${group.name}"
               data-user-role="${group.role}"> 

              <div class="profile-icon team-icon" style="background-color: var(--border-color); color: var(--text-primary); font-size: 18px; font-weight: 600; width: 40px; height: 40px; margin-right: 12px;">
                ${group.name.charAt(0).toUpperCase()}
              </div>

              <div class="friend-item-info" style="flex-grow: 1;">
                  <div class="name">${group.name}</div>
              </div>

              <span class="unread-dot ${group.unread_count > 0 ? '' : 'hidden'}"></span>

              ${group.role === 'admin' ? `
              <div class="friend-options-container">
                  <button class="friend-options-btn" title="Options"><i class="fa fa-ellipsis-v"></i></button>
                  <div class="friend-options-menu">
                      <button class="remove-friend-btn delete-group-btn"
                              data-group-id="${group.group_id}"
                              data-group-name="${group.name}">
                          Delete Group
                      </button>
                  </div>
              </div>
              ` : ''}
              </div>`;
      });
    }

    // --- Render Friends ---
    if (friends.length > 0) {
      html += `<h4 class="chat-list-section-title">Friends</h4>`;

      friends.sort((a, b) => {
        const hasUnreadA = a.unread_count > 0;
        const hasUnreadB = b.unread_count > 0;
        if (hasUnreadA && !hasUnreadB) return -1;
        if (!hasUnreadA && hasUnreadB) return 1;
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return timeB - timeA;
      });

      friends.forEach(friend => {
        html += `
          <div class="friend-item"
               data-chat-type="friend"
               data-chat-id="${friend.google_id}"
               data-chat-name="${friend.name}"
               data-chat-pic="${friend.picture_url}">

              <img src="${friend.picture_url}" alt="${friend.name}" referrerpolicy="no-referrer">
              <div class="friend-item-info" style="flex-grow: 1;">
                  <div class="name">${friend.name}</div>
              </div>
              <span class="unread-dot ${friend.unread_count > 0 ? '' : 'hidden'}"></span>

              <div class="friend-options-container">
                  <button class="friend-options-btn" title="Options"><i class="fa fa-ellipsis-v"></i></button>
                  <div class="friend-options-menu">
                      <button class="remove-friend-btn"
                              data-friend-id="${friend.google_id}"
                              data-friend-name="${friend.name}">
                          Remove Friend
                      </button>
                  </div>
              </div>
          </div>`;
      });
    }

    if (html === "") {
      listContainer.innerHTML = '<p style="padding: 10px; color: var(--text-secondary); text-align: center;">Add friends or join groups to start chatting.</p>';
    } else {
      listContainer.innerHTML = html;
    }

  } catch (error) {
    console.error("Error fetching TeamSpaces:", error);
    listContainer.innerHTML = '<p style="padding: 10px; color: red; text-align: center;">Could not load chat list.</p>';
  }
}

// Friend list search
const friendListSearchInput = document.getElementById("friend-list-search");
if (friendListSearchInput) {
  friendListSearchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    document
      .querySelectorAll("#friend-list-container .friend-item")
      .forEach((itemEl) => {
        const itemName = itemEl.dataset.chatName.toLowerCase();
        itemEl.style.display = itemName.includes(searchTerm)
          ? "flex"
          : "none";
      });
  });
}

// --- WebSocket Connection ---
// --- WebSocket Connection ---
function showChatToast(sender) {
  const toast = document.getElementById("chatToastNotification");
  if (!toast) return;

  if (toastTimeout) clearTimeout(toastTimeout);

  document.getElementById("toast-sender-pic").src = sender.pic;
  document.getElementById("toast-sender-name").textContent = sender.name;
  document.getElementById("toast-message-preview").textContent = sender.message;

  toast.dataset.friendId = sender.id;
  toast.dataset.friendName = sender.name;
  toast.dataset.friendPic = sender.pic;

  toast.classList.remove("hide");
  toast.classList.add("show");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, 5000);
}

// In index.js, REPLACE the existing connectWebSocket function entirely
// In index.js, REPLACE the existing connectWebSocket function entirely

function connectWebSocket(userId) {
  // Prevent multiple connection attempts
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    console.log("WebSocket already connecting or open.");
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/${userId}`;
  console.log(`Attempting WebSocket connection to: ${wsUrl}`); // Log line ~808

  try {
    socket = new WebSocket(wsUrl); // Assign to global `socket`

    // --- Attach ALL handlers IMMEDIATELY ---

    socket.onopen = () => {
      console.log("WebSocket connection established for user:", userId); // Log line ~815
      // Any logic specific to *after* connection opens can go here.
      // Handler assignment is now done outside.
    };

    socket.onmessage = (event) => { // Line ~1652
      // Optional: Add a safety check, though it shouldn't be needed now
      if (!socket) {
        console.warn("onmessage called but socket is unexpectedly null.");
        return;
      }
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        // --- Your existing message handling logic ---
        if (data.type === "friend_request") {
          hasUnreadFriendRequests = true;
          updateGlobalNotificationDots();
          if (notificationListContainer && notificationListContainer.style.display !== 'none') {
            fetchAndRenderNotifications(); // Refresh if notifications panel is open
          }
          // Consider adding a toast notification here
          alert(`New friend request from ${data.from_user}`); // Simple alert for now
        } else if (data.type === "new_message") {
          const isChatOpenPanel = currentChattingFriend &&
            currentChattingFriend.type === 'friend' &&
            currentChattingFriend.id === data.from;

          if (isChatOpenPanel) {
            appendMessage(data.content, "received");
            fetch(`/api/messages/mark-as-seen/${data.from}`, { method: "POST" });
          } else {
            hasUnreadMessages = true;
            updateGlobalNotificationDots();
            if (body.classList.contains('panel-open')) {
              fetchAndRenderTeamSpaces(); // Refresh list if panel is open
            }
            const sender = friendsListCache.find(f => f.google_id === data.from);
            if (sender) {
              showChatToast({
                id: sender.google_id,
                name: sender.name,
                pic: sender.picture_url,
                message: data.content,
                type: 'friend' // Assuming toast needs type
              });
            }
          }
        } else if (data.type === "new_group_message") {
          const isGroupChatOpenPanel = currentChattingFriend &&
            currentChattingFriend.type === 'group' &&
            currentChattingFriend.id === data.from_group_id;

          if (isGroupChatOpenPanel) {
            appendMessage(data.content, "received", data.from_sender_name);
            const groupItem = document.querySelector(`.friend-item[data-chat-id="${data.from_group_id}"][data-chat-type="group"]`);
            groupItem?.querySelector('.unread-dot')?.classList.add('hidden');
            // Optional: Call mark-as-seen API immediately
          } else {
            hasUnreadMessages = true;
            updateGlobalNotificationDots();
            if (body.classList.contains('panel-open')) {
              fetchAndRenderTeamSpaces();
            }
            // Optional: Show group toast notification
          }
        } else if (data.type === "refresh_teamspaces" || data.type === "group_update") {
          // Refresh friend/group list if panel is open
          if (body.classList.contains('panel-open')) {
            fetchAndRenderTeamSpaces();
          }
          // Reload the friend cache as friendships/groups might have changed
          loadFriendsIntoCache();
        }
        // --- Handle Notebook Share (If using this file) ---
        else if (data.type === "notebook_share") {
          // This logic might belong in script.js depending on where notifications appear
          console.log("Notebook share notification received:", data);
          // Add logic to display this notification (e.g., toast, append to group chat if open)
        }
        // --- End of message handling ---

      } catch (parseError) {
        console.error("Error parsing WebSocket message:", parseError, event.data);
      }
    }; // End of onmessage

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Attempt to close if socket exists and is not already closed
      // This prevents errors if onerror fires after onclose
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        try { socket.close(); } catch (e) { /* Ignore error during close */ }
      }
      // Let onclose handle setting socket to null and reconnecting
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed. Code: ${event.code}, Reason: "${event.reason}". Reconnecting in 5 seconds...`);
      socket = null; // Clear the global variable *only* on close
      // Avoid reconnect loops if the server closes cleanly (code 1000) or browser navigates away
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => connectWebSocket(userId), 5000);
      } else {
        console.log("WebSocket closed cleanly or due to navigation. Not reconnecting automatically.");
      }
    };

    // Remove the potentially problematic separate error listener
    // socket.addEventListener('error', (event) => { ... });

  } catch (error) {
    console.error("Error creating WebSocket object:", error);
    socket = null; // Ensure socket is null if constructor throws
    setTimeout(() => connectWebSocket(userId), 5000); // Attempt reconnect
  }
}
// --- Friend Search & Requests (in Modal) ---
const modalSearchInput = document.getElementById("modal-friend-search-input");
if (modalSearchInput) {
  modalSearchInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
      document.getElementById("modal-friend-search-results").innerHTML = "";
      return;
    }
    const response = await fetch(
      `/api/users/search?email=${encodeURIComponent(query)}`
    );
    if (response.ok) {
      const users = await response.json();
      renderSearchResults(
        users,
        document.getElementById("modal-friend-search-results")
      );
    }
  });
}

function renderSearchResults(users, container) {
  container.innerHTML = "";
  if (users.length === 0) {
    container.innerHTML =
      '<p style="padding: 10px; color: var(--text-secondary);">No users found.</p>';
    return;
  }
  users.forEach((user) => {
    container.innerHTML += `
            <div class="search-result-item">
                <img src="${user.picture_url}" alt="${user.name}" referrerpolicy="no-referrer">
                <div class="search-result-info">
                    <div class="name">${user.name}</div>
                    <div class="email">${user.email}</div>
                </div>
                <button class="add-friend-btn" data-email="${user.email}" onclick="sendFriendRequest(this)">Add</button>
            </div>`;
  });
}

async function sendFriendRequest(button) {
  const email = button.dataset.email;
  button.textContent = "Sending...";
  button.disabled = true;

  try {
    const response = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressee_email: email }),
    });
    if (response.ok) {
      button.textContent = "Sent";
    } else {
      const error = await response.json();
      alert(`Error: ${error.detail}`);
      button.textContent = "Add";
      button.disabled = false;
    }
  } catch (err) {
    console.error("Failed to send friend request:", err);
    alert("An error occurred. Please try again.");
    button.textContent = "Add";
    button.disabled = false;
  }
}

// --- Notifications ---
const notificationsBtn = document.getElementById("notifications-btn");
const notificationListContainer = document.getElementById(
  "notification-list-container"
);

if (notificationsBtn) {
  notificationsBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    hasUnreadFriendRequests = false;
    updateGlobalNotificationDots();
    const isHidden = notificationListContainer.style.display === "none";
    if (isHidden) {
      await fetchAndRenderNotifications();
      notificationListContainer.style.display = "block";
    } else {
      notificationListContainer.style.display = "none";
    }
  });
}

async function fetchAndRenderNotifications() {
  notificationListContainer.innerHTML =
    '<p style="padding:12px; text-align:center;">Loading...</p>';
  try {
    const response = await fetch("/api/friends/requests");
    if (!response.ok) throw new Error("Could not load requests");
    const requests = await response.json();
    document
      .getElementById("notification-badge")
      .classList.toggle("hidden", requests.length === 0);

    if (requests.length === 0) {
      notificationListContainer.innerHTML =
        '<p style="padding:12px; text-align:center; color: var(--text-secondary);">No new friend requests.</p>';
      return;
    }
    notificationListContainer.innerHTML = "";
    requests.forEach((req) => {
      notificationListContainer.innerHTML += `
              <div class="notification-item" id="req-${req.requester_id}">
                  <img src="${req.picture_url}" alt="${req.name}" referrerpolicy="no-referrer">
                  <div class="notification-text"><b>${req.name}</b> sent you a request.</div>
                  <div class="notification-actions">
                      <button class="accept-btn" onclick="respondToRequest('${req.requester_id}', 'accepted')">Accept</button>
                      <button class="decline-btn" onclick="respondToRequest('${req.requester_id}', 'declined')">Decline</button>
                  </div>
              </div>`;
    });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    notificationListContainer.innerHTML =
      '<p style="padding:12px; text-align:center; color:red;">An error occurred.</p>';
  }
}

async function respondToRequest(requesterId, action) {
  try {
    const response = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requester_id: requesterId, action: action }),
    });
    if (response.ok) {
      document.getElementById(`req-${requesterId}`).remove();
      if (notificationListContainer.children.length === 0)
        fetchAndRenderNotifications();
      if (
        action === "accepted" &&
        document.body.classList.contains("panel-open")
      ) {
        fetchAndRenderTeamSpaces();
      }
    } else {
      alert("Failed to respond to request.");
    }
  } catch (err) {
    console.error("Failed to respond to request:", err);
    alert("An error occurred. Please try again.");
  }
}

// --- Event delegation for friend list actions ---
const friendListContainer = document.getElementById("friend-list-container");

if (friendListContainer) {
  friendListContainer.addEventListener("click", async (e) => {
    const optionsBtn = e.target.closest(".friend-options-btn");
    const removeBtn = e.target.closest(".remove-friend-btn");
    const friendItem = e.target.closest(".friend-item");
    const deleteGroupBtn = e.target.closest(".delete-group-btn");

    // 1. Logic for clicking the three-dot button (options menu toggle)
    if (optionsBtn) {
      e.stopPropagation();
      const menu = optionsBtn.nextElementSibling;
      document.querySelectorAll(".friend-options-menu.show").forEach((m) => {
        if (m !== menu) m.classList.remove("show");
      });
      menu.classList.toggle("show");
      return;
    }

    // Close any open menus if clicking outside
    if (!e.target.closest(".friend-options-container")) {
      document.querySelectorAll(".friend-options-menu.show").forEach((m) => {
        m.classList.remove("show");
      });
    }

    // --- 2. Logic for clicking the "Remove Friend" button ---
    if (removeBtn) {
      e.stopPropagation();
      const friendId = removeBtn.dataset.friendId;
      const friendName = removeBtn.dataset.friendName;

      if (
        confirm(
          `Are you sure you want to remove ${friendName} from your friends?`
        )
      ) {
        try {
          const response = await fetch(`/api/friends/remove/${friendId}`, {
            method: "DELETE",
          });

          if (response.ok || response.status === 204) {
            // SUCCESS: Re-render the whole list for consistency
            fetchAndRenderTeamSpaces();

            if (
              currentChattingFriend &&
              currentChattingFriend.id === friendId
            ) {
              closeChatView();
            }
          } else {
            const error = await response.json();
            alert(`Failed to remove friend: ${error.detail}`);
          }
        } catch (err) {
          console.error("Error removing friend:", err);
          alert("An error occurred. Please try again.");
        }
      }
      removeBtn.closest(".friend-options-menu").classList.remove("show");
      return;
    }

    // --- 3. Logic for clicking "Delete Group" button (THE CRITICAL FIX) ---
    if (deleteGroupBtn) {
      e.stopPropagation();
      const groupId = deleteGroupBtn.dataset.groupId;
      const groupName = deleteGroupBtn.dataset.groupName;

      if (confirm(`Are you sure you want to permanently delete the group "${groupName}"? This cannot be undone.`)) {
        try {
          const response = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });

          // CHECK for success status codes 200 (OK) or 204 (No Content)
          if (response.ok || response.status === 204) {
            // SUCCESS: Re-render the whole list for consistency
            fetchAndRenderTeamSpaces();

            // If the deleted group chat was open, close it
            if (currentChattingFriend && currentChattingFriend.type === 'group' && currentChattingFriend.id === groupId) {
              closeChatView();
            }
          } else {
            const err = await response.json();
            alert(`Error deleting group: ${err.detail}`);
          }
        } catch (err) {
          console.error(err);
          alert("An error occurred while deleting the group. Check console.");
        }
      }
      deleteGroupBtn.closest(".friend-options-menu").classList.remove("show");
      return;
    }

    // 4. Logic for clicking a chat item (FRIENDS OR GROUPS)
    if (friendItem && !e.target.closest(".friend-options-container")) {

      const chatTarget = {
        type: friendItem.dataset.chatType,
        id: friendItem.dataset.chatId,
        name: friendItem.dataset.chatName,
        pic: friendItem.dataset.chatPic
      };

      openChatView(chatTarget);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  fetchNotebooks();
  fetchSharedNotebooks();
  applySavedTheme();
  fetchCurrentUser().then(() => {
    if (currentUser && currentUser.is_authenticated) {
      checkInitialNotificationState();
    }
  });

  fabMainBtn = document.getElementById("fab-main-btn");
  fabMenu = document.getElementById("fab-menu");
  const createGroupBtn = document.getElementById("create-group-btn");
  const createOrgBtn = document.getElementById("create-org-btn");

  if (fabMainBtn) {
    fabMainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fabMenu.classList.toggle("show");
      fabMainBtn.classList.toggle("active");
    });
  }

  // Placeholder action for "New Organization"
  if (createOrgBtn) {
    createOrgBtn.addEventListener("click", () => {
      alert('"New Organization" feature is coming soon!');
      fabMenu.classList.remove("show");
      fabMainBtn.classList.remove("active");
    });
  }

  teamSpacesDot = document.querySelector("#teamSpacesBtn .notification-dot");
  profileDot = document.querySelector("#profileBtn .notification-dot");
  notificationBadge = document.getElementById("notification-badge");
  const toast = document.getElementById("chatToastNotification");
  const toastCloseBtn = document.getElementById("toast-close-btn");

  const hideToast = () => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    if (toastTimeout) clearTimeout(toastTimeout);
  };

  if (toast) {
    toast.addEventListener("click", (e) => {
      if (e.target === toastCloseBtn) return;

      if (!document.body.classList.contains("panel-open")) {
        document.body.classList.add("panel-open");
        fetchAndRenderTeamSpaces();
      }

      const chatTarget = {
        id: toast.dataset.friendId,
        name: toast.dataset.friendName,
        pic: toast.dataset.friendPic,
        type: 'friend'
      };
      openChatView(chatTarget);
      hideToast();
    });
  }

  if (toastCloseBtn) {
    toastCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hideToast();
    });
  }


  // --- Logic for Group Modals and Buttons ---

  const groupChatOptionsBtn = document.getElementById("group-chat-options-btn");
  const groupChatDropdown = document.getElementById("group-chat-dropdown");
  const manageGroupBtn = document.getElementById("manage-group-btn");
  const addMemberBtn = document.getElementById("add-member-btn");

  // Toggle for the group chat options dropdown in the header
  groupChatOptionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    groupChatDropdown.classList.toggle("show");
  });

  // Open "Manage Group" panel
  manageGroupBtn.addEventListener("click", () => {
    groupChatDropdown.classList.remove("show");
    openManageGroupPanel(); // UPDATED
  });

  // Open "Add Member" panel
  addMemberBtn.addEventListener("click", () => {
    groupChatDropdown.classList.remove("show");
    openAddMemberPanel(); // UPDATED
  });

  // --- NEW: Handle clicks on the "Back to Chat" buttons ---
  document.querySelectorAll(".js-back-to-chat").forEach(button => {
    button.addEventListener("click", () => {
      showTeamSpacesPanel("panel-chat-view");
    });
  });

  // --- REFACTORED: Logic for "Manage Group" Panel ---
  const memberListContainerPanel = document.getElementById("group-member-list-panel");

  async function openManageGroupPanel() {
    // Use currentGroupDetails which is set when opening the chat
    if (!currentGroupDetails.id) return;

    // --- NEW SECURITY CHECK ---
    if (currentGroupDetails.role !== 'admin') {
      console.error("Access Denied: Only admins can manage groups.");
      return;
    }

    document.getElementById("manage-group-panel-title").textContent = `Manage "${currentGroupDetails.name}"`;
    memberListContainerPanel.innerHTML = "<p>Loading members...</p>";
    showTeamSpacesPanel("panel-manage-group-view"); // UPDATED

    try {
      const response = await fetch(`/api/groups/${currentGroupDetails.id}/members`);
      if (!response.ok) throw new Error("Failed to load members");

      const members = await response.json();
      renderGroupMembers(members);
    } catch (err) {
      memberListContainerPanel.innerHTML = `<p style="color: red;">${err.message}</p>`;
    }
  }

  function renderGroupMembers(members) {
    memberListContainerPanel.innerHTML = ""; // UPDATED to use panel list
    // Check if the current user is an admin (using currentGroupDetails)
    const isCurrentUserAdmin = currentGroupDetails.role === 'admin';

    members.forEach(member => {
      memberListContainerPanel.innerHTML += ` <div class="search-result-item" id="member-${member.google_id}">
                  <img src="${member.picture_url}" alt="${member.name}" referrerpolicy="no-referrer">
                  <div class="search-result-info">
                      <div class="name">${member.name} ${member.google_id === currentUser.id ? '(You)' : ''}</div>
                      <div class="email">${member.role}</div>
                  </div>
                  ${(isCurrentUserAdmin && member.google_id !== currentUser.id) ? `
                  <button class="add-friend-btn remove-member-btn" style="background-color: #ff3b30;"
                          data-user-id="${member.google_id}"
                          data-user-name="${member.name}">
                      Remove
                  </button>
                  ` : ''}
              </div>
          `;
    });
  }

  // Event delegation for removing a member
  // UPDATED to listen on the new panel list
  memberListContainerPanel.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".remove-member-btn");
    if (!removeBtn || !currentGroupDetails.id) return;

    const userId = removeBtn.dataset.userId;
    const userName = removeBtn.dataset.userName;

    if (confirm(`Are you sure you want to remove ${userName} from the group?`)) {
      removeBtn.textContent = "Removing...";
      removeBtn.disabled = true; // Prevent double clicks
      try {
        const response = await fetch(`/api/groups/${currentGroupDetails.id}/remove-member/${userId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          document.getElementById(`member-${userId}`).remove();
        } else {
          const err = await response.json();
          alert(`Error: ${err.detail}`);
          removeBtn.textContent = "Remove";
          removeBtn.disabled = false;
        }
      } catch (err) {
        alert("An error occurred.");
        removeBtn.textContent = "Remove";
        removeBtn.disabled = false;
      }
    }
  });

  // --- REFACTORED: Logic for "Add Member" Panel ---
  const addMemberSearchInputPanel = document.getElementById("add-member-search-input-panel");
  const addMemberResultsContainerPanel = document.getElementById("add-member-search-results-panel");
  const inviteCodeDisplayPanel = document.getElementById("group-invite-code-display-panel");

  async function openAddMemberPanel() {
    if (!currentGroupDetails.id) return;

    // --- NEW SECURITY CHECK ---
    if (currentGroupDetails.role !== 'admin') {
      console.error("Access Denied: Only admins can add members.");
      return;
    }

    // Reset fields
    addMemberSearchInputPanel.value = "";
    addMemberResultsContainerPanel.innerHTML = "";
    inviteCodeDisplayPanel.value = "Loading code...";

    showTeamSpacesPanel("panel-add-member-view"); // UPDATED
    addMemberSearchInputPanel.focus();

    // Fetch and display the invite code
    try {
      const response = await fetch(`/api/groups/${currentGroupDetails.id}/details`);
      if (!response.ok) throw new Error("Failed to load group details");
      const group = await response.json();
      inviteCodeDisplayPanel.value = group.invite_code;
    } catch (err) {
      inviteCodeDisplayPanel.value = "Could not load code";
    }
  }

  // Search by name as user types
  // UPDATED to listen on the new panel input
  addMemberSearchInputPanel.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
      addMemberResultsContainerPanel.innerHTML = ""; // UPDATED
      return;
    }

    try {
      const response = await fetch(`/api/users/search-by-name?name=${encodeURIComponent(query)}`);
      if (response.ok) {
        const users = await response.json();
        renderAddMemberResults(users);
      } else {
        addMemberResultsContainerPanel.innerHTML = "<p style='padding: 10px; color: red;'>Search failed.</p>"; // UPDATED
      }
    } catch (err) {
      addMemberResultsContainerPanel.innerHTML = "<p style='padding: 10px; color: red;'>An error occurred during search.</p>"; // UPDATED
    }
  });

  function renderAddMemberResults(users) {
    addMemberResultsContainerPanel.innerHTML = ""; // UPDATED
    if (users.length === 0) {
      addMemberResultsContainerPanel.innerHTML = "<p style='padding: 10px; color: var(--text-secondary);'>No users found.</p>"; // UPDATED
      return;
    }
    users.forEach(user => {
      addMemberResultsContainerPanel.innerHTML += ` <div class="search-result-item">
                  <img src="${user.picture_url}" alt="${user.name}" referrerpolicy="no-referrer">
                  <div class="search-result-info">
                      <div class="name">${user.name}</div>
                      <div class="email">${user.email}</div>
                  </div>
                  <button class="add-friend-btn add-member-to-group-btn" data-user-id="${user.google_id}">Add</button>
              </div>`;
    });
  }

  // Event delegation for adding a member
  // UPDATED to listen on the new panel results container
  addMemberResultsContainerPanel.addEventListener("click", async (e) => {
    const addBtn = e.target.closest(".add-member-to-group-btn");
    if (!addBtn || !currentGroupDetails.id) return;

    const userId = addBtn.dataset.userId;
    addBtn.textContent = "Adding...";
    addBtn.disabled = true;

    try {
      const response = await fetch(`/api/groups/${currentGroupDetails.id}/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id_to_add: userId })
      });
      if (response.ok) {
        addBtn.textContent = "Added";
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`); // e.g., "User is already in this group"
        addBtn.textContent = "Add";
        addBtn.disabled = false;
      }
    } catch (err) {
      alert("An error occurred.");
      addBtn.textContent = "Add";
      addBtn.disabled = false;
    }
  });

  // Copy invite code to clipboard
  // UPDATED to listen on the new panel display
  inviteCodeDisplayPanel.addEventListener("click", () => {
    try {
      navigator.clipboard.writeText(inviteCodeDisplayPanel.value);
      // Simple visual feedback
      const originalValue = inviteCodeDisplayPanel.value;
      inviteCodeDisplayPanel.value = "Copied!";
      inviteCodeDisplayPanel.style.backgroundColor = 'var(--accent-color)';
      inviteCodeDisplayPanel.style.color = 'var(--accent-text)';
      setTimeout(() => {
        inviteCodeDisplayPanel.value = originalValue; // Restore original code
        inviteCodeDisplayPanel.style.backgroundColor = ''; // Restore style
        inviteCodeDisplayPanel.style.color = '';
      }, 1500);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Could not copy invite code.');
    }
  });

  // --- Logic for "Join Group" ---
  const joinGroupBtn = document.getElementById("join-group-btn");
  const joinGroupForm = document.getElementById("joinGroupForm");

  if (joinGroupBtn) {
    joinGroupBtn.addEventListener("click", () => {
      closeAllPopups();
      fabMenu.classList.remove("show"); // Close FAB menu
      fabMainBtn.classList.remove("active");
      document.getElementById("joinGroupModal").style.display = "flex";
      document.getElementById("invite-code-input").focus();
    });
  }

  if (joinGroupForm) {
    joinGroupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inviteCode = document.getElementById("invite-code-input").value;
      const btn = joinGroupForm.querySelector("button[type='submit']");
      btn.textContent = "Joining...";
      btn.disabled = true; // Prevent double clicks

      try {
        const response = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invite_code: inviteCode })
        });

        if (response.ok) {
          closeModal('joinGroupModal');
          fetchAndRenderTeamSpaces(); // Refresh the list
        } else {
          const err = await response.json();
          alert(`Error: ${err.detail}`);
        }
      } catch (err) {
        alert("An error occurred. Please try again.");
      } finally {
        btn.textContent = "Join";
        joinGroupForm.reset();
        btn.disabled = false;
      }
    });
  }

  // --- Logic for "Create Group" ---
  const createGroupModal = document.getElementById("createGroupModal");
  const createGroupForm = document.getElementById("createGroupForm");
  const groupFriendList = document.getElementById("group-friend-list");

  if (createGroupBtn) {
    createGroupBtn.addEventListener("click", () => {
      closeAllPopups();
      fabMenu.classList.remove("show");
      fabMainBtn.classList.remove("active");
      createGroupModal.style.display = "flex";
      document.getElementById("group-name-input").focus();
      loadFriendsIntoChecklist();
    });
  }

  async function loadFriendsIntoChecklist() {
    groupFriendList.innerHTML = "<p>Loading friends...</p>";
    if (friendsListCache.length === 0) {
      await loadFriendsIntoCache();
    }

    if (friendsListCache.length === 0) {
      groupFriendList.innerHTML = "<p>No friends to add.</p>";
      return;
    }

    let friendHtml = "";
    friendsListCache.forEach(friend => {
      friendHtml += `
        <label class="friend-checklist-item" style="display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 6px;">
          <input type="checkbox" value="${friend.google_id}" style="margin-right: 10px; transform: scale(1.2); margin-left: 5px;">
          <img src="${friend.picture_url}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 8px;" referrerpolicy="no-referrer">
          <span>${friend.name}</span>
        </label>
      `;
    });
    groupFriendList.innerHTML = friendHtml;

    document.querySelectorAll('.friend-checklist-item').forEach(item => {
      item.onmouseenter = () => item.style.backgroundColor = 'var(--bg-primary)';
      item.onmouseleave = () => item.style.backgroundColor = 'transparent';
    });
  }

  if (createGroupForm) {
    createGroupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const groupName = document.getElementById("group-name-input").value;
      const selectedFriends = [];
      document.querySelectorAll("#group-friend-list input[type='checkbox']:checked").forEach(input => {
        selectedFriends.push(input.value);
      });

      const btn = createGroupForm.querySelector("button[type='submit']");
      btn.textContent = "Creating...";
      btn.disabled = true;

      try {
        const response = await fetch("/api/groups/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName, friend_ids: selectedFriends })
        });

        if (response.ok) {
          closeModal('createGroupModal');
          fetchAndRenderTeamSpaces(); // Refresh list
        } else {
          const err = await response.json();
          alert(`Error: ${err.detail}`);
        }
      } catch (err) {
        alert("An error occurred.");
      } finally {
        btn.textContent = "Create Group";
        createGroupForm.reset();
        btn.disabled = false;
      }
    });
  }


  // --- NEW: Logic for "Leave Group" ---
  const leaveGroupBtn = document.getElementById("leave-group-btn");

  if (leaveGroupBtn) {
    leaveGroupBtn.addEventListener("click", async () => {
      if (!currentGroupDetails.id) return;

      const groupName = currentGroupDetails.name;
      if (confirm(`Are you sure you want to leave the group "${groupName}"?`)) {
        try {
          const response = await fetch(`/api/groups/${currentGroupDetails.id}/leave`, {
            method: 'POST'
          });

          if (response.ok) {
            closeChatView();
            fetchAndRenderTeamSpaces(); // Refresh the list
          } else {
            const err = await response.json();
            alert(`Error leaving group: ${err.detail}`);
          }
        } catch (err) {
          alert("An error occurred while leaving the group.");
        }
      }
    });
  }



}); // <-- End of DOMContentLoaded

async function loadFriendsIntoCache() {
  try {
    const response = await fetch("/api/friends/list");
    if (!response.ok) throw new Error("Could not fetch friends for cache");
    friendsListCache = await response.json();
    console.log("Friends list cached successfully.");
  } catch (error) {
    console.error(error);
  }
}

function updateGlobalNotificationDots() {
  if (!teamSpacesDot || !notificationBadge) return;

  teamSpacesDot.classList.toggle("hidden", !hasUnreadMessages);
  notificationBadge.classList.toggle("hidden", !hasUnreadFriendRequests);
}

async function checkInitialNotificationState() {
  try {
    const [friendsResponse, requestsResponse] = await Promise.all([
      fetch("/api/friends/list"),
      fetch("/api/friends/requests"),
    ]);

    if (!friendsResponse.ok || !requestsResponse.ok) {
      console.error("Failed to fetch initial notification state.");
      return;
    }

    const friends = await friendsResponse.json();
    const requests = await requestsResponse.json();

    const unreadMessagesExist = friends.some(
      (friend) => friend.unread_count > 0
    );
    if (unreadMessagesExist) {
      hasUnreadMessages = true;
    }

    if (requests.length > 0) {
      hasUnreadFriendRequests = true;
    }

    updateGlobalNotificationDots();
  } catch (error) {
    console.error("Error checking initial notification state:", error);
  }
}




// In index.js, find your connectWebSocket() function
// Modify the socket.onmessage handler to include the new event
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("WebSocket message received:", data);

  if (data.type === "friend_request") {
    // ... existing code ...
  } else if (data.type === "new_message") {
    // ... existing code ...
  } else if (data.type === "new_group_message") {
    // ... existing code ...

    // --- ADD THIS NEW BLOCK ---
  }
  // --- END OF NEW BLOCK ---
};


// Add these functions at the end of index.js

async function fetchSharedNotebooks() {
  try {
    const response = await fetch("/api/notebooks/shared-with-me");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    sharedNotebooks = await response.json();
    renderSharedNotebooks();
  } catch (error) {
    console.error("Could not fetch shared Spaces:", error);
  }
}

function renderSharedNotebooks() {
  const grid = document.getElementById("shared-grid");
  const section = document.getElementById("shared-spaces-section");

  if (!grid || !section) return;

  // Hide section if empty
  if (sharedNotebooks.length === 0) {
    section.classList.add("hidden");
    grid.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");

  let html = "";

  sharedNotebooks.forEach((notebook) => {
    html += `
        <div class="recent-card" onclick="window.location.href='/document/${notebook.id}'">
            <button class="options-btn" onclick="removeSharedNotebook(${notebook.id}, event)" title="Remove from list">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0 1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                </svg>
            </button>

            <div class="notebook-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                  <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1z"/>
                </svg>
            </div>
            <h3 class="notebook-title">${notebook.title}</h3>
            <div class="notebook-meta">
                <span>Shared by ${notebook.owner_name}</span>
                <span>•</span>
                <span>${notebook.sources.length} source${notebook.sources.length !== 1 ? "s" : ""}</span>
            </div>
        </div>
    `;
  });
  grid.innerHTML = html;
}



// --- Function to remove a shared notebook ---
async function removeSharedNotebook(notebookId, event) {
  event.stopPropagation(); // Stop the click from opening the notebook

  if (!confirm("Remove this shared Space from your list?")) {
    return;
  }

  try {
    const response = await fetch(`/api/notebooks/shared/${notebookId}`, {
      method: "DELETE",
    });

    if (response.status === 204) {
      // Success: Remove from local array and re-render
      sharedNotebooks = sharedNotebooks.filter((nb) => nb.id !== notebookId);
      renderSharedNotebooks();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to remove shared Space");
    }
  } catch (error) {
    console.error("Error removing shared Space:", error);
    alert("Could not remove the Space. (Note: You cannot remove Spaces shared via a Group here).");
  }
}