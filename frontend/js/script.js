let uploadedFiles = [];
let sourceCount = 0;
let chatActive = false;
let currentNotebookId = null;
let chatHistory = [];
const CHATBOT_API_URL = "/chat";

// NEW: Global variables for Sarthi Chat
let doc_currentUser = {};
let doc_socket = null;
let doc_currentChattingFriend = null; // Object: { id, name, type: 'friend'|'group', pic? }
let doc_friendsListCache = [];
let doc_currentGroupDetails = {}; // Stores {id, name, role} for the open group
let currentSessionId = null;
let notebookChatSessions = [];
// --- TRANSLATIONS (This part remains for language features) ---
const translations = {
  en: {
    share: "Share",
    settings: "Settings",
    preferences: "Preferences",
    helpSupport: "Help & Support",
    addFriends: "Add Friends",
    signOut: "Sign out",
    vaultTitle: "Vault",
    add: "Add",
    selectAllSources: "Select all sources",
    emptyStateTitle: "Saved sources will appear here",
    emptyStateDescription:
      "Click Add source above to add PDFs, websites, text, videos,<br>or audio files. Or import a file directly from Google Drive.",
    chatTitle: "Sarthi",
    welcomeTitle: "Welcome to your notebook",
    welcomeDescription:
      "Upload a source to start chatting. Ask questions, get summaries, or create study materials based on your content.",
    uploadSource: "Upload a source",
    chatPlaceholder: "Ask a question about your sources...",
    workspaceTitle: "Workspace",
    sarthiChat: "TeamSpace",
    reportBoard: "Report Board",
    intelliAlert: "IntelliAlert",
    docMapView: "DocMap View",
    addNote: "Add note",
    addSources: "Add sources",
    uploadSourcesTitle: "Upload sources",
    uploadSourcesSubtitle:
      'Drag & drop or <span class="choose-file-link" onclick="openFileDialog(); event.stopPropagation();">choose file</span> to upload',
    supportedTypes:
      "Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)",
    link: "Link",
    pasteText: "Paste text",
    googleDrive: "Google Drive",
    sourceLimit: "📄 Source limit",
    filePreview: "File Preview",
    getSummary: "Get Summary",
    preferencesTitle: "Preferences",
    languageLabel: "Language",
    languageDescription:
      "Change the display language for the interface and the chatbot.",
    saveChanges: "Save Changes",
    open: "Open",
    rename: "Rename",
    delete: "Delete",
  },
  hi: {
    share: "शेयर करें",
    settings: "सेटिंग्स",
    preferences: "वरीयताएँ",
    helpSupport: "सहायता और समर्थन",
    addFriends: "मित्र जोड़ें",
    signOut: "साइन आउट करें",
    vaultTitle: "वॉल्ट",
    add: "जोड़ें",
    selectAllSources: "सभी स्रोत चुनें",
    emptyStateTitle: "सहेजे गए स्रोत यहां दिखाई देंगे",
    emptyStateDescription:
      "PDF, वेबसाइट, टेक्स्ट, वीडियो, या ऑडियो फ़ाइलें जोड़ने के लिए ऊपर स्रोत जोड़ें पर क्लिक करें। या सीधे Google ड्राइव से फ़ाइल आयात करें।",
    chatTitle: "सारथी",
    welcomeTitle: "आपकी नोटबुक में आपका स्वागत है",
    welcomeDescription:
      "चैटिंग शुरू करने के लिए एक स्रोत अपलोड करें। अपने कंटेंट के आधार पर प्रश्न पूछें, सारांश प्राप्त करें, या अध्ययन सामग्री बनाएं।",
    uploadSource: "स्रोत अपलोड करें",
    chatPlaceholder: "अपने स्रोतों के बारे में एक प्रश्न पूछें...",
    workspaceTitle: "कार्यक्षेत्र",
    sarthiChat: "सारथी चैट",
    reportBoard: "रिपोर्ट बोर्ड",
    intelliAlert: "इंटेलिअलर्ट",
    docMapView: "डॉकमैप व्यू",
    addNote: "नोट जोड़ें",
    addSources: "स्रोत जोड़ें",
    uploadSourcesTitle: "स्रोत अपलोड करें",
    uploadSourcesSubtitle:
      'अपलोड करने के लिए फ़ाइल खींचें और छोड़ें या <span class="choose-file-link" onclick="openFileDialog(); event.stopPropagation();">फ़ाइल चुनें</span>',
    supportedTypes:
      "समर्थित फ़ाइल प्रकार: PDF, .txt, Markdown, Audio (जैसे mp3)",
    link: "लिंक",
    pasteText: "टेक्स्ट पेस्ट करें",
    googleDrive: "गूगल ड्राइव",
    sourceLimit: "📄 स्रोत सीमा",
    filePreview: "फ़ाइल पूर्वावलोकन",
    getSummary: "सारांश प्राप्त करें",
    preferencesTitle: "वरीयताएँ",
    languageLabel: "भाषा",
    languageDescription: "इंटरफ़ेस और चैटबॉट के लिए प्रदर्शन भाषा बदलें।",
    saveChanges: "बदलाव सहेजें",
    open: "खोलें",
    rename: "नाम बदलें",
    delete: "हटाएं",
  },
  mr: {
    share: "शेअर करा",
    settings: "सेटिंग्ज",
    preferences: "प्राधान्ये",
    helpSupport: "मदत आणि समर्थन",
    addFriends: "मित्र जोडा",
    signOut: "साइन आउट करा",
    vaultTitle: "तिजोरी",
    add: "जोडा",
    selectAllSources: "सर्व स्रोत निवडा",
    emptyStateTitle: "जतन केलेले स्रोत येथे दिसतील",
    emptyStateDescription:
      "PDF, वेबसाइट, मजकूर, व्हिडिओ किंवा ऑडिओ फाइल्स जोडण्यासाठी वरील स्रोत जोडा वर क्लिक करा. किंवा थेट Google ड्राइव्हवरून फाइल आयात करा.",
    chatTitle: "सारथी",
    welcomeTitle: "तुमच्या नोटबुकमध्ये स्वागत आहे",
    welcomeDescription:
      "चॅटिंग सुरू करण्यासाठी एक स्रोत अपलोड करा. तुमच्या सामग्रीवर आधारित प्रश्न विचारा, सारांश मिळवा किंवा अभ्यास साहित्य तयार करा.",
    uploadSource: "स्रोत अपलोड करा",
    chatPlaceholder: "तुमच्या स्रोतांबद्दल प्रश्न विचारा...",
    workspaceTitle: "कार्यक्षेत्र",
    sarthiChat: "सारथी गप्पा",
    reportBoard: "अहवाल बोर्ड",
    intelliAlert: "इंटेलिअलर्ट",
    docMapView: "डॉकमॅप व्यू",
    addNote: "टीप जोडा",
    addSources: "स्रोत जोडा",
    uploadSourcesTitle: "स्रोत अपलोड करा",
    uploadSourcesSubtitle:
      'अपलोड करण्यासाठी फाइल ड्रॅग आणि ड्रॉप करा किंवा <span class="choose-file-link" onclick="openFileDialog(); event.stopPropagation();">फाइल निवडा</span>',
    supportedTypes:
      "समर्थित फाइल प्रकार: PDF, .txt, Markdown, Audio (उदा. mp3)",
    link: "लिंक",
    pasteText: "मजकूर पेस्ट करा",
    googleDrive: "गुगल ड्राइव्ह",
    sourceLimit: "📄 स्रोत मर्यादा",
    filePreview: "फाइल पूर्वावलोकन",
    getSummary: "सारांश मिळवा",
    preferencesTitle: "प्राधान्ये",
    languageLabel: "भाषा",
    languageDescription: "इंटरफेस आणि चॅटबॉटसाठी प्रदर्शन भाषा बदला.",
    saveChanges: "बदल जतन करा",
    open: "उघडा",
    rename: "नाव बदला",
    delete: "हटवा",
  },
  ml: {
    share: "പങ്കിടുക",
    settings: "ക്രമീകരണങ്ങൾ",
    preferences: "മുൻഗണനകൾ",
    helpSupport: "സഹായവും പിന്തുണയും",
    addFriends: "സുഹൃത്തുക്കളെ ചേർക്കുക",
    signOut: "സൈൻ ഔട്ട് ചെയ്യുക",
    vaultTitle: "വോൾട്ട്",
    add: "ചേർക്കുക",
    selectAllSources: "എല്ലാ ഉറവിടങ്ങളും തിരഞ്ഞെടുക്കുക",
    emptyStateTitle: "സേവ് ചെയ്ത ഉറവിടങ്ങൾ ഇവിടെ ദൃശ്യമാകും",
    emptyStateDescription:
      "PDF-കൾ, വെബ്സൈറ്റുകൾ, ടെക്സ്റ്റ്, വീഡിയോകൾ, അല്ലെങ്കിൽ ഓഡിയോ ഫയലുകൾ ചേർക്കുന്നതിന് മുകളിലുള്ള ഉറവിടം ചേർക്കുക ക്ലിക്ക് ചെയ്യുക. അല്ലെങ്കിൽ Google ഡ്രൈവിൽ നിന്ന് നേരിട്ട് ഒരു ഫയൽ ഇറക്കുമതി ചെയ്യുക.",
    chatTitle: "സാരഥി",
    welcomeTitle: "നിങ്ങളുടെ നോട്ട്ബുക്കിലേക്ക് സ്വാഗതം",
    welcomeDescription:
      "ചാറ്റിംഗ് ആരംഭിക്കുന്നതിന് ഒരു ഉറവിടം അപ്‌ലോഡ് ചെയ്യുക. നിങ്ങളുടെ ഉള്ളടക്കത്തെ അടിസ്ഥാനമാക്കി ചോദ്യങ്ങൾ ചോദിക്കുക, സംഗ്രഹങ്ങൾ നേടുക, അല്ലെങ്കിൽ പഠന സാമഗ്രികൾ സൃഷ്ടിക്കുക.",
    uploadSource: "ഉറവിടം അപ്‌ലോഡ് ചെയ്യുക",
    chatPlaceholder: "നിങ്ങളുടെ ഉറവിടങ്ങളെക്കുറിച്ച് ഒരു ചോദ്യം ചോദിക്കുക...",
    workspaceTitle: "പ്രവർത്തനമേഖല",
    sarthiChat: "സാരഥി ചാറ്റ്",
    reportBoard: "റിപ്പോർട്ട് ബോർഡ്",
    intelliAlert: "ഇന്റലിഅലെർട്ട്",
    docMapView: "ഡോക്മാപ്പ് വ്യൂ",
    addNote: "കുറിപ്പ് ചേർക്കുക",
    addSources: "ഉറവിടങ്ങൾ ചേർക്കുക",
    uploadSourcesTitle: "ഉറവിടങ്ങൾ അപ്‌ലോഡ് ചെയ്യുക",
    uploadSourcesSubtitle:
      'അപ്‌ലോഡ് ചെയ്യുന്നതിന് ഫയൽ വലിച്ചിടുക അല്ലെങ്കിൽ <span class="choose-file-link" onclick="openFileDialog(); event.stopPropagation();">ഫയൽ തിരഞ്ഞെടുക്കുക</span>',
    supportedTypes:
      "പിന്തുണയ്ക്കുന്ന ഫയൽ തരങ്ങൾ: PDF, .txt, Markdown, Audio (ഉദാ. mp3)",
    link: "ലിങ്ക്",
    pasteText: "ടെക്സ്റ്റ് ഒട്ടിക്കുക",
    googleDrive: "ഗൂഗിൾ ഡ്രൈവ്",
    sourceLimit: "📄 ഉറവിട പരിധി",
    filePreview: "ഫയൽ പ്രിവ്യൂ",
    getSummary: "സംഗ്രഹം നേടുക",
    preferencesTitle: "മുൻഗണനകൾ",
    languageLabel: "ഭാഷ",
    languageDescription:
      "ഇന്റർഫേസിനും ചാറ്റ്ബോട്ടിനുമുള്ള പ്രദർശന ഭാഷ മാറ്റുക.",
    saveChanges: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
    open: "തുറക്കുക",
    rename: "പേരുമാറ്റുക",
    delete: "ഇല്ലാതാക്കുക",
  },
};

function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language "${lang}" not found. Defaulting to English.`);
    lang = "en";
  }
  const translationMap = translations[lang];
  document.querySelectorAll("[data-translate-key]").forEach((el) => {
    const key = el.dataset.translateKey;
    if (translationMap[key]) el.innerHTML = translationMap[key];
  });
  document
    .querySelectorAll("[data-translate-key-placeholder]")
    .forEach((el) => {
      const key = el.dataset.translateKeyPlaceholder;
      if (translationMap[key]) el.placeholder = translationMap[key];
    });
  document.documentElement.lang = lang;
  renderUploadedFiles();
}

function applySavedPreferences() {
  const savedLang = localStorage.getItem("userLanguage") || "en";
  setLanguage(savedLang);
  const langSelector = document.getElementById("languageSelector");
  if (langSelector) langSelector.value = savedLang;
}

// In script.js, REPLACE the existing DOMContentLoaded listener:

document.addEventListener("DOMContentLoaded", () => {
  // 1. Identify current Space/Notebook from URL
  const pathParts = window.location.pathname.split("/");
  const notebookId = pathParts[pathParts.length - 1];

  // 2. Select DOM Elements
  const historyBtn = document.getElementById("chatHistoryBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const closeHistoryBtn = document.getElementById("closeHistoryPanelBtn");
  const returnToVaultBtn = document.getElementById("returnToVaultBtn");

  // Sidebar Elements
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebar-toggle-btn");
  const logoGroup = document.querySelector('.logo-icon');

  // Workspace (Studio) Elements - NEW LOGIC
  const studioSection = document.querySelector(".studio-section");
  const studioToggleBtn = document.getElementById("studio-toggle-btn");
  const workspaceExpandBtn = document.getElementById("workspaceExpandBtn"); // The new floating button

  // Theme Elements
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const body = document.body;

  // 3. History Panel Listeners
  if (historyBtn) {
    historyBtn.addEventListener("click", toggleHistoryView);
  }
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener("click", toggleHistoryView);
  }
  if (returnToVaultBtn) {
    returnToVaultBtn.addEventListener("click", toggleHistoryView);
  }

  // 4. New Chat Listener
  if (newChatBtn) {
    newChatBtn.addEventListener("click", startNewChat);
  }

  // 5. Initial Data Load (Sources & Chat History)
  // CRITICAL FIX: Do NOT use parseInt(). Treat the ID as a string.
  if (notebookId && notebookId.match(/^\d+$/)) {
    currentNotebookId = notebookId; // Store as string global variable
    fetchAndDisplaySources(currentNotebookId);
    loadChatHistory();
  } else {
    console.error("Could not determine a valid Space ID from URL.");
  }

  // 6. General Setup Calls
  setupEventListeners();
  fetchCurrentUserDocument(); // Connects WebSocket
  applySavedPreferences();

  // 7. Sidebar Logic (Left Panel)
  const applySavedSidebarState = () => {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") sidebar.classList.add("collapsed");
  };

  if (sidebar && sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebarState",
        sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
      );
    });
  }

  // Click Logo to Expand Sidebar
  if (logoGroup && sidebar) {
    logoGroup.addEventListener('click', () => {
      if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem("sidebarState", "expanded");
      }
    });
  }
  applySavedSidebarState();


  // 8. Workspace (Studio) Logic - UPDATED FOR "HIDDEN BY DEFAULT"
  const applySavedStudioState = () => {
    const savedState = localStorage.getItem("studioState");

    // Check if previously opened (visible)
    if (savedState === "visible") {
      studioSection.classList.add("visible");
      if (workspaceExpandBtn) workspaceExpandBtn.classList.add("hidden");
    } else {
      // Default: Hidden
      studioSection.classList.remove("visible");
      if (workspaceExpandBtn) workspaceExpandBtn.classList.remove("hidden");
    }
  };

  // Logic to OPEN Workspace
  if (workspaceExpandBtn && studioSection) {
    workspaceExpandBtn.addEventListener("click", () => {
      studioSection.classList.add("visible");
      workspaceExpandBtn.classList.add("hidden");
      localStorage.setItem("studioState", "visible");
    });
  }

  // Logic to CLOSE Workspace (using the arrow inside the panel)
  if (studioToggleBtn && studioSection) {
    studioToggleBtn.addEventListener("click", () => {
      studioSection.classList.remove("visible");
      if (workspaceExpandBtn) workspaceExpandBtn.classList.remove("hidden");
      localStorage.setItem("studioState", "hidden");
    });
  }

  applySavedStudioState();


  // 9. Theme Logic
  const applySavedTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") body.classList.add("dark-mode");
    else body.classList.remove("dark-mode");
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      localStorage.setItem(
        "theme",
        body.classList.contains("dark-mode") ? "dark" : "light"
      );
    });
  }
  applySavedTheme();

  // 10. Start Universe Animation (Welcome Screen)
  initUniverseAnimation();
});
async function fetchCurrentUserDocument() {
  try {
    const response = await fetch("/api/user/me");
    if (!response.ok) {
      if (response.status !== 401)
        throw new Error(`HTTP error! status: ${response.status}`);
      return;
    }
    doc_currentUser = await response.json();
    if (doc_currentUser.is_authenticated) {
      // Populate UI
      const profileImgEl = document.getElementById("documentProfileImg");
      const popupAvatar = document.getElementById("profile-popup-avatar-img");
      const popupName = document.getElementById("profile-popup-name");
      const popupEmail = document.getElementById("profile-popup-email");
      if (profileImgEl && doc_currentUser.picture)
        profileImgEl.src = doc_currentUser.picture;
      if (popupAvatar && doc_currentUser.picture)
        popupAvatar.src = doc_currentUser.picture;
      if (popupName) popupName.textContent = doc_currentUser.name;
      if (popupEmail) popupEmail.textContent = doc_currentUser.email;

      // *** NEW: Connect WebSocket and load friends cache ***
      if (doc_currentUser.id) {
        doc_connectWebSocket(doc_currentUser.id);
        loadFriendsIntoCache();
      } else {
        console.error("User ID not found. WebSocket cannot connect.");
      }
    }
  } catch (error) {
    console.error("Could not fetch user info for document page:", error);
  }
}
function setupEventListeners() {
  // In script.js, inside setupEventListeners()

  document
    .getElementById("shareSpaceBtn")
    ?.addEventListener("click", openShareModal);

  document
    .getElementById("shareForm")
    ?.addEventListener("submit", handleShareSubmit);

  document
    .getElementById("share-search-input")
    ?.addEventListener("input", filterShareList);
  // Original event listeners
  document
    .querySelector(".add-btn")
    ?.addEventListener("click", openUploadModal);
  document
    .querySelector(".upload-btn")
    ?.addEventListener("click", openUploadModal);
  document
    .querySelector(".close-btn")
    ?.addEventListener("click", closeUploadModal);
  const modal = document.getElementById("uploadModal");
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeUploadModal();
    });
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.disabled) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatInput.addEventListener("input", autoResizeTextarea);
  }
  document.getElementById("sendBtn")?.addEventListener("click", sendMessage);
  document.querySelectorAll(".tool-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // --- NEW FIX: Ignore the Create Report button (it handles its own click) ---
      if (this.id === "btn-create-report") return;

      const toolNameKey = this.querySelector(".tool-name")?.getAttribute("data-translate-key");
      if (toolNameKey) expandToolPanel(toolNameKey);
    });
  });
  document.getElementById("closeDetailsBtn")?.addEventListener("click", () => {
    document.querySelector(".studio-section")?.classList.remove("expanded");
    document.getElementById("toolDetailsWrapper")?.classList.add("hidden");
  });
  const modalUploadZone = document.getElementById("modalUploadZone");
  if (modalUploadZone) {
    modalUploadZone.addEventListener("click", openFileDialog);
    modalUploadZone.addEventListener("drop", handleModalDrop);
    modalUploadZone.addEventListener("dragover", handleModalDragOver);
    modalUploadZone.addEventListener("dragleave", handleModalDragLeave);
  }
  document
    .getElementById("fileInput")
    ?.addEventListener("change", handleFileSelect);
  document
    .getElementById("selectAllCheckbox")
    ?.addEventListener("change", handleSelectAll);
  const uploadedFilesList = document.getElementById("uploaded-files");
  if (uploadedFilesList) {
    uploadedFilesList.addEventListener("change", (event) => {
      if (event.target.classList.contains("file-checkbox")) {
        const file = uploadedFiles.find(
          (f) => f.id == event.target.dataset.fileId
        );
        if (file) file.selected = event.target.checked;
        updateSelectAllCheckboxState();
      }
    });
    // This listener handles the three-dot menu and file action clicks
    uploadedFilesList.addEventListener("click", handleFileActions);
  }

  // === HEADER DROPDOWN TOGGLE FIX ===
  const settingsBtn = document.getElementById("settingsBtn");
  const profileBtn = document.getElementById("profileBtn");
  const settingsDropdown = document.getElementById("settingsDropdown");
  const profileDropdown = document.getElementById("profileDropdown");

  if (settingsBtn)
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Use 'show' class to display/hide
      settingsDropdown.classList.toggle("show");
      profileDropdown.classList.remove("show");
    });

  if (profileBtn)
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Use 'show' class to display/hide
      profileDropdown.classList.toggle("show");
      settingsDropdown.classList.remove("show");
    });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".file-menu-container"))
      document
        .querySelectorAll(".file-item .file-action-dropdown") // <--- NEW TARGET
        .forEach((m) => m.classList.add("hidden"));

    // 2. Close ALL header dropdowns (logic remains the same)
    if (!event.target.closest(".header-menu-container")) {
      settingsDropdown?.classList.remove("show");
      profileDropdown?.classList.remove("show");
    }

    // NEW: Close FAB menu on outside click
    const fabMenu = document.getElementById("doc-fab-menu");
    const fabMainBtn = document.getElementById("doc-fab-main-btn");
    if (
      fabMenu?.classList.contains("show") &&
      !fabMainBtn?.contains(event.target) &&
      !fabMenu.contains(event.target)
    ) {
      fabMenu.classList.remove("show");
      fabMainBtn.classList.remove("active");
    }
    // Close Modals if click on backdrop
    if (event.target.classList.contains("modal-overlay")) {
      closeModal(event.target.id);
    }
  });

  document
    .getElementById("fileViewerCloseBtn")
    ?.addEventListener("click", closeFileModal);
  document.getElementById("fileViewerModal")?.addEventListener("click", (e) => {
    if (e.target.id === "fileViewerModal") closeFileModal();
  });
  document
    .getElementById("fileViewerSummaryBtn")
    ?.addEventListener("click", handleFileViewerSummary);
  document
    .querySelector(".preferences-link")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("preferencesModal")?.classList.remove("hidden");
      settingsDropdown?.classList.remove("show"); // Close header menu when opening modal
    });
  document
    .getElementById("closePreferencesModal")
    ?.addEventListener("click", () =>
      document.getElementById("preferencesModal").classList.add("hidden")
    );
  document
    .getElementById("preferencesModal")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "preferencesModal")
        document.getElementById("preferencesModal").classList.add("hidden");
    });
  document
    .getElementById("savePreferencesBtn")
    ?.addEventListener("click", () => {
      const selectedLang = document.getElementById("languageSelector").value;
      localStorage.setItem("userLanguage", selectedLang);
      applySavedPreferences();
      document.getElementById("preferencesModal").classList.add("hidden");
    });
  document
    .getElementById("profile-add-friend-btn")
    ?.addEventListener("click", (e) => {
      e.preventDefault(); // This stops the link from jumping to the top of the page
      openModal("addFriendModal");
    });

  // *** NEW EVENT LISTENERS FOR SARTHI CHAT ***
  // FAB Menu Toggle
  document
    .getElementById("doc-fab-main-btn")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("doc-fab-menu")?.classList.toggle("show");
      e.currentTarget.classList.toggle("active");
    });

  // Group/Friend Actions (from FAB Menu)
  document
    .getElementById("doc-add-friend-btn")
    ?.addEventListener("click", () => openModal("addFriendModal"));
  document
    .getElementById("doc-create-group-btn") // NEW
    ?.addEventListener("click", () => {
      document.getElementById("doc-fab-menu")?.classList.remove("show");
      document.getElementById("doc-fab-main-btn")?.classList.remove("active");
      openModal("createGroupModal");
      loadFriendsIntoChecklist();
    });
  document
    .getElementById("doc-join-group-btn") // NEW
    ?.addEventListener("click", () => {
      document.getElementById("doc-fab-menu")?.classList.remove("show");
      document.getElementById("doc-fab-main-btn")?.classList.remove("active");
      openModal("joinGroupModal");
      document.getElementById("invite-code-input").focus();
    });

  // Modal Form Submissions
  document
    .getElementById("createGroupForm")
    ?.addEventListener("submit", handleCreateGroup); // NEW
  document
    .getElementById("joinGroupForm")
    ?.addEventListener("submit", handleJoinGroup); // NEW

  // Chat/List Navigation
  document
    .getElementById("modal-friend-search-input")
    ?.addEventListener("input", handleFriendSearch);
  document
    .getElementById("doc-back-to-friends-btn")
    ?.addEventListener("click", doc_closeChatView);
  document
    .getElementById("doc-chat-form-panel")
    ?.addEventListener("submit", doc_sendMessage);
  document
    .getElementById("doc-friend-list-search")
    ?.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      document
        .querySelectorAll("#doc-friend-list-container .friend-item")
        .forEach((el) => {
          // Check both group name and friend name
          const name =
            el.dataset.chatName?.toLowerCase() ||
            el.dataset.friendName?.toLowerCase();
          el.style.display = name?.includes(searchTerm) ? "flex" : "none";
        });
    });

  addGroupManagementEventListeners();
}






// FIND AND REPLACE THIS FUNCTION IN script.js
async function fetchAndDisplaySources(notebookId) {
  try {
    const response = await fetch(`/api/notebooks/${notebookId}`);
    if (!response.ok) throw new Error("Failed to fetch Space details.");

    const notebook = await response.json();

    const currentUserAccessLevel = notebook.access_level;
    toggleUIForPermission(currentUserAccessLevel);

    uploadedFiles = (notebook.sources || []).map((source) => ({
      ...source,
      id: source.name + source.size,
      selected: true,
    }));
    sourceCount = uploadedFiles.length;

    renderUploadedFiles();
    updateUI();

    // CRITICAL: This determines if we show "Welcome" or "Sarthi Astra"
    // and enables the input box if files are present.
    loadChatHistory();

  } catch (error) {
    console.error("Error fetching sources:", error);
    alert("Could not load sources for this Space.");
    if (error.status === 404 || error.status === 403) {
      window.location.href = "/spaces";
    }
  }
}



function openUploadModal() {
  const modal = document.getElementById("uploadModal");
  modal.classList.remove("hidden");

  // Modal खुलते ही file input को एक बार trigger करें (optional)
  // या फिर upload zone पर क्लिक करने पर trigger हो
  const uploadZone = document.getElementById("modalUploadZone");
  if (uploadZone) {
    // पुराने listeners हटाएं ताकि duplicate न हों
    uploadZone.onclick = function (e) {
      e.stopPropagation();
      openFileDialog();
    };
  }
}

function openModal(modalId) {
  document.getElementById(modalId)?.classList.remove("hidden");
}

function closeModal(modalId) {
  // Reset fields when closing the group creation modal
  if (modalId === "createGroupModal") {
    const form = document.getElementById("createGroupForm");
    if (form) form.reset();
  }
  // Reset friend search when closing the add friend modal
  if (modalId === "addFriendModal") {
    const searchInput = document.getElementById("modal-friend-search-input");
    const searchResults = document.getElementById(
      "modal-friend-search-results"
    );
    if (searchInput) searchInput.value = "";
    if (searchResults) searchResults.innerHTML = "";
  }
  // Generic close
  document.getElementById(modalId)?.classList.add("hidden");
}
function closeUploadModal() {
  document.getElementById("uploadModal")?.classList.add("hidden");
  document.getElementById("fileInput").value = "";
}
function openFileDialog() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    // पुराना listener हटाकर दुबारा attach करें (prevent duplicate)
    fileInput.onchange = null;
    fileInput.value = ""; // reset previous selection
    fileInput.click();
  }
}

// Add this code inside the setupEventListeners function in script.js

document
  .getElementById("profile-add-friend-btn")
  ?.addEventListener("click", (e) => {
    e.preventDefault(); // This stops the link from jumping to the top of the page
    openModal("addFriendModal");
  });
function showComingSoon(feature) {
  alert(`${feature} is coming soon!`);
}
function handleModalDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("modalUploadZone")?.classList.remove("drag-over");
  const files = Array.from(event.dataTransfer.files);
  Promise.all(files.map((file) => addFile(file))).then(() =>
    closeUploadModal()
  );
}
function handleModalDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("modalUploadZone")?.classList.add("drag-over");
}
function handleModalDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById("modalUploadZone")?.classList.remove("drag-over");
}
async function addFile(file) {
  const fileName = file.name;

  // Check if file already exists
  if (uploadedFiles.some((f) => f.name === fileName)) {
    alert(`A file named "${fileName}" already exists.`);
    return;
  }

  // Check if Notebook ID is valid
  if (!currentNotebookId) {
    alert("Error: No Space selected or ID is invalid.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  // NOTE: Auto-summary toggle logic has been removed from here.

  try {
    const response = await fetch(
      `/api/notebooks/${currentNotebookId}/sources`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("File upload failed response:", errorText);
      throw new Error("File upload failed.");
    }

    // Refresh the UI on success
    await fetchAndDisplaySources(currentNotebookId);
  } catch (error) {
    console.error("Error uploading file:", error);
    alert("Error uploading file. Check console for details.");
  }
}
function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  Promise.all(files.map((file) => addFile(file))).then(() =>
    closeUploadModal()
  );
}

// --- Replace this entire function in script.js ---

// --- Replace this entire function in script.js ---

function renderUploadedFiles() {
  const list = document.getElementById("uploaded-files"),
    empty = document.getElementById("empty-state"),
    header = document.querySelector(".sources-header"),
    lang = localStorage.getItem("userLanguage") || "en";

  if (!list || !empty || !header) return;

  list.innerHTML = "";

  if (uploadedFiles.length === 0) {
    empty.classList.remove("hidden");
    list.classList.add("hidden");
    header.classList.add("hidden");
  } else {
    empty.classList.add("hidden");
    list.classList.remove("hidden");
    header.classList.remove("hidden");

    uploadedFiles.forEach((f) => {
      const { iconClass, typeClass } = getFileIconDetails(f.name);
      const item = document.createElement("div");

      // --- (CHANGED) Add 'processing' or 'failed' class to the item ---
      let itemStatusClass = "";
      if (f.status === "processing") itemStatusClass = "processing";
      if (f.status === "failed") itemStatusClass = "failed";

      item.className = `file-item ${f.selected ? "selected" : ""
        } ${itemStatusClass}`;
      item.dataset.fileId = f.id;

      // --- (CHANGED) Logic to show spinner/error icon ---
      let iconHTML = "";
      let errorTitle = f.error
        ? `title="Error: ${f.error}"`
        : 'title="Processing failed"';

      if (f.status === "processing") {
        iconHTML = `<div class="file-icon processing" title="Processing..."><i class="fa-solid fa-spinner fa-spin"></i></div>`;
      } else if (f.status === "failed") {
        iconHTML = `<div class="file-icon failed" ${errorTitle}><i class="fa-solid fa-triangle-exclamation"></i></div>`;
      } else {
        // Default icon (complete or no status)
        iconHTML = `<div class="file-icon ${typeClass}"><i class="${iconClass}"></i></div>`;
      }

      // --- (CHANGED) Check if file is processing to disable menu ---
      const isProcessing = f.status === "processing";

      item.innerHTML = `
        ${iconHTML} 
        <div class="file-info">
            <div class="file-name" title="${f.name}">${f.name}</div>
            <div class="file-size">${formatFileSize(parseInt(f.size, 10))}</div>
        </div> 
        <div class="file-actions">
            <div class="file-menu-container" ${isProcessing ? 'style="display:none;"' : ""
        }>
                <button class="menu-btn" title="More options"><i class="fa-solid fa-ellipsis-v"></i></button>
                <div class="dropdown-menu file-action-dropdown hidden">
                    <a href="#" class="dropdown-item open-btn"><i class="fa-solid fa-external-link-alt"></i><span>${translations[lang].open
        }</span></a>
                    <a href="#" class="dropdown-item summary-btn"><i class="fa-solid fa-wand-magic-sparkles"></i><span>${translations[lang].getSummary
        }</span></a>
                    <a href="#" class="dropdown-item rename-btn"><i class="fa-solid fa-pencil"></i><span>${translations[lang].rename
        }</span></a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item delete-dropdown-btn"><i class="fa-solid fa-trash-can"></i><span>${translations[lang].delete
        }</span></a>
                </div>
            </div>
            <div class="checkbox-wrapper-31" ${isProcessing ? 'style="display:none;"' : ""
        }>
                <input type="checkbox" class="file-checkbox" data-file-id="${f.id
        }" ${f.selected ? "checked" : ""} />
                <svg viewBox="0 0 35.6 35.6">
                    <circle class="background" cx="17.8" cy="17.8" r="17.8"></circle>
                    <circle class="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
                    <polyline class="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
                </svg>
            </div>
        </div>`;

      list.appendChild(item);
    });
  }
  updateSelectAllCheckboxState();
}
function updateSelectAllCheckboxState() {
  const cb = document.getElementById("selectAllCheckbox");
  if (!cb) return;
  const total = uploadedFiles.length,
    selected = uploadedFiles.filter((f) => f.selected).length;
  cb.indeterminate = false;
  cb.checked = total > 0 && selected === total;
}
async function deleteFile(fileName, event) {
  event.stopPropagation();

  if (!currentNotebookId) {
    alert("Error: No Space ID found.");
    return;
  }

  try {
    const response = await fetch(
      `/api/notebooks/${currentNotebookId}/sources/${encodeURIComponent(
        fileName
      )}`,
      { method: "DELETE" }
    );

    if (!response.ok) throw new Error("Failed to delete file");

    // Remove file from local array
    uploadedFiles = uploadedFiles.filter((f) => f.name !== fileName);
    sourceCount = uploadedFiles.length;

    // If no files left, reset to Welcome State
    if (sourceCount === 0) {
      chatHistory = [];
      saveChatHistory();
      chatActive = false;
      document.getElementById("chatMessagesScroll").innerHTML = "";

      // Show Welcome Screen
      document.getElementById("welcomeState").classList.remove("hidden");
      document.getElementById("chatMessagesContainer").classList.add("hidden");

      // RESTART the Universe/Star Animation
      if (typeof initUniverseAnimation === "function") {
        initUniverseAnimation();
      }
    }
    renderUploadedFiles();
    updateUI();
  } catch (error) {
    console.error("Error deleting file:", error);
    alert("Could not delete the file. Check console.");
  }
}
// In script.js, REPLACE the entire function getFileIconDetails:
function getFileIconDetails(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  // Changed default 'fas' to 'fa-solid'
  let icon = "fa-solid fa-file",
    type = "file";

  // Update specific icons to use FA6 solid/regular prefixes
  if (ext === "pdf") {
    icon = "fa-regular fa-file-pdf";
    type = "pdf";
  } else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
    icon = "fa-solid fa-file-image";
    type = "image";
  } else if (["txt", "csv", "md"].includes(ext)) {
    icon = "fa-solid fa-file-lines"; // Fa6 equivalent of fa-file-alt is fa-file-lines
    type = "text";
  } else if (["doc", "docx"].includes(ext)) {
    icon = "fa-solid fa-file-word";
    type = "word";
  } else if (["mp3", "wav", "ogg"].includes(ext)) {
    icon = "fa-solid fa-file-audio";
    type = "audio";
  }
  return { iconClass: icon, typeClass: type };
}
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
function updateUI() {
  document.getElementById("sourceLimitCount").textContent = `${sourceCount}/50`;
}
function autoResizeTextarea() {
  const textarea = document.getElementById("chatInput");
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }
}

// In script.js, REPLACE the existing async function handleFileActions(event)

async function handleFileActions(event) {
  const target = event.target;
  // Use closest to find the .file-item, the container for all file info
  const item = target.closest(".file-item");
  if (!item) return;

  const id = item.dataset.fileId;
  const file = uploadedFiles.find((f) => f.id === id);
  if (!file) return;

  // 1. Menu Toggle Logic (CRITICAL: Targets the menu button and uses the new class)
  if (target.closest(".menu-btn")) {
    event.preventDefault();
    event.stopPropagation();

    // Get the dropdown menu specific to this file item (uses new class)
    const dd = item.querySelector(".file-action-dropdown");

    // Explicitly hide all other file menus on the page (uses new class)
    document
      .querySelectorAll("#uploaded-files .file-action-dropdown")
      .forEach((m) => {
        if (m !== dd) m.classList.add("hidden");
      });

    // Toggle the current file menu. We toggle the 'hidden' class.
    dd.classList.toggle("hidden");
  }

  // 2. Open File Logic
  if (target.closest(".open-btn")) {
    event.preventDefault();
    item.querySelector(".file-action-dropdown")?.classList.add("hidden");
    openFileModal(file);
  }

  // 3. Get Summary Logic (UPDATED)
  if (target.closest(".summary-btn")) {
    event.preventDefault();
    item.querySelector(".file-action-dropdown")?.classList.add("hidden");
    getSingleFileSummary(file.name, target.closest(".summary-btn"));
  }

  // 4. Delete File Logic
  if (target.closest(".delete-dropdown-btn")) {
    event.preventDefault();
    event.stopPropagation();
    item.querySelector(".file-action-dropdown")?.classList.add("hidden");
    deleteFile(file.name, event);
  }

  // 5. Rename File Logic
  if (target.closest(".rename-btn")) {
    event.preventDefault();
    event.stopPropagation();
    item.querySelector(".file-action-dropdown")?.classList.add("hidden");
    const nameDiv = item.querySelector(".file-name"),
      ogName = file.name;
    if (!nameDiv) return;
    nameDiv.innerHTML = `<input type="text" class="rename-input" value="${ogName}" />`;
    const input = nameDiv.querySelector("input");
    if (!input) return;
    const dotIdx = ogName.lastIndexOf("."),
      selEnd = dotIdx > -1 ? dotIdx : ogName.length;
    input.focus();
    input.setSelectionRange(0, selEnd);

    const save = async () => {
      const newName = input.value.trim();
      if (!newName || newName === ogName) {
        nameDiv.textContent = ogName;
        return;
      }

      if (!currentNotebookId) {
        alert("Error: No Space ID found.");
        nameDiv.textContent = ogName;
        return;
      }

      try {
        const res = await fetch(
          `/api/notebooks/${currentNotebookId}/sources/${encodeURIComponent(
            ogName
          )}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newName: newName }),
          }
        );
        if (!res.ok) {
          const errTxt = await res.text();
          throw new Error(JSON.parse(errTxt).detail || "Unknown error");
        }
        await fetchAndDisplaySources(currentNotebookId); // Refreshes the list
      } catch (err) {
        console.error("Error renaming:", err);
        alert(`Could not rename: ${err.message}`);
        const failItem = document.querySelector(`[data-file-id="${id}"]`);
        if (failItem) failItem.querySelector(".file-name").textContent = ogName;
      }
    };
    const handleKey = (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") {
        input.removeEventListener("blur", save);
        nameDiv.textContent = ogName;
      }
    };
    input.addEventListener("blur", save, {
      once: true,
    });
    input.addEventListener("keydown", handleKey);
  }
}

function activateChat() {
  chatActive = true;
  const welcome = document.getElementById("welcomeState"),
    container = document.getElementById("chatMessagesContainer"),
    input = document.getElementById("chatInput"),
    send = document.getElementById("sendBtn");

  // Hiding the welcome state automatically stops the star animation loop
  welcome?.classList.add("hidden");
  container?.classList.remove("hidden");

  if (input) {
    input.disabled = false;
    input.focus();
  }
  if (send) send.disabled = false;
}
function openFileModal(file) {
  const modal = document.getElementById("fileViewerModal"),
    title = document.getElementById("fileViewerTitle"),
    content = document.getElementById("fileViewerContent"),
    summary = document.getElementById("fileViewerSummaryBtn");
  if (!modal || !title || !content || !summary) return;
  title.textContent = file.name;
  content.innerHTML = "";
  const ext = file.name.split(".").pop().toLowerCase(),
    imgExts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
  summary.classList.toggle("hidden", ext !== "pdf");
  if (ext === "pdf") {
    summary.dataset.filePath = file.path;
    summary.dataset.fileName = file.name;
  }
  if (imgExts.includes(ext)) {
    content.innerHTML = `<img src="${file.path}" alt="${file.name}">`;
  } else if (ext === "pdf") {
    content.innerHTML = `<embed src="${file.path}" type="application/pdf" style="width:100%; height:100%;">`;
  } else {
    content.innerHTML = `<div class="unsupported-file-view"><h4>Preview not available.</h4><p>Download the file to view it.</p><br><a href="${file.path}" download="${file.name}" class="upload-btn">Download</a></div>`;
  }
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeFileModal() {
  const modal = document.getElementById("fileViewerModal");
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "";
}
function handleFileViewerSummary() {
  const btn = document.getElementById("fileViewerSummaryBtn");
  if (btn) alert(`"Get Summary" for "${btn.dataset.fileName}" coming soon!`);
}
function appendMessage(container, type, content) {
  appendMessageToDOM(container, type, content);
  chatHistory.push({ type: type, content: content });
  saveChatHistory();
}
function appendTypingIndicator(container) {
  const indicator = document.createElement("div");
  indicator.className = "message ai typing-indicator";
  indicator.innerHTML = `<div class="message-content"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  container.appendChild(indicator);
  return indicator;
}
function scrollToBottom(container) {
  if (container) container.scrollTop = container.scrollHeight;
}







// FIND AND REPLACE THIS FUNCTION IN script.js
function loadChatHistory() {
  const container = document.getElementById("chatMessagesScroll");
  const chatInput = document.getElementById("chatInput"); // Get Input
  const sendBtn = document.getElementById("sendBtn");     // Get Send Button

  if (!container) return;

  container.innerHTML = "";
  const saved = localStorage.getItem(`chat_${currentNotebookId}`);

  if (saved) {
    chatHistory = JSON.parse(saved);
    chatHistory.forEach((msg) =>
      appendMessageToDOM(container, msg.type, msg.content)
    );
    scrollToBottom(container);
  } else {
    chatHistory = [];
  }

  const welcome = document.getElementById("welcomeState");
  const chatContainer = document.getElementById("chatMessagesContainer");

  // Elements to update text
  const title = welcome.querySelector(".welcome-title");
  const desc = welcome.querySelector(".welcome-description");
  const uploadBtn = welcome.querySelector(".upload-btn");
  const icon = welcome.querySelector(".welcome-icon");

  // --- LOGIC START ---
  if (chatHistory.length === 0) {
    // STATE: No Chat History
    if (welcome && chatContainer) {
      welcome.classList.remove("hidden");
      chatContainer.classList.add("hidden");
      chatActive = false;

      if (uploadedFiles.length > 0) {
        // SCENARIO: Files exist (Sarthi Astra Mode)
        if (title) title.textContent = "Sarthi Astra";
        if (desc) desc.textContent = "I am ready. Ask me anything about your documents.";

        // Hide upload button, Show Icon
        if (uploadBtn) uploadBtn.classList.add("hidden");
        if (icon) icon.style.display = "block";

        // CRITICAL FIX: Enable Input so user can type to start
        if (chatInput) {
          chatInput.disabled = false;
          chatInput.placeholder = "Ask a question about your sources...";
        }
        if (sendBtn) sendBtn.disabled = false;

      } else {
        // SCENARIO: No files (Standard Welcome)
        if (title) title.textContent = "Welcome to your notebook";
        if (desc) desc.textContent = "Upload a source to start chatting, get summaries, or create study materials.";

        // Show upload button
        if (uploadBtn) uploadBtn.classList.remove("hidden");

        // Disable input until file is added
        if (chatInput) {
          chatInput.disabled = true;
          chatInput.placeholder = "Upload a file to start chatting...";
        }
        if (sendBtn) sendBtn.disabled = true;
      }

      // Start Animation
      if (typeof initUniverseAnimation === "function") {
        initUniverseAnimation();
      }
    }
  } else {
    // STATE: History Exists -> Show Chat
    activateChat();
  }
}











function saveChatHistory() {
  localStorage.setItem(
    `chat_${currentNotebookId}`,
    JSON.stringify(chatHistory)
  );
}
// REPLACE existing appendMessageToDOM in script.js
function appendMessageToDOM(container, type, content) {
  const msgWrapper = document.createElement("div");
  msgWrapper.className = `message ${type}`; // 'user' or 'ai'

  // 1. WhatsApp Style Wrapper
  const bubble = document.createElement("div");
  const bubbleClass = type === 'user' ? 'message-bubble sent' : 'message-bubble received';
  bubble.className = bubbleClass;

  // 2. NEW LOGIC: Directly display the full content without truncation.
  // Convert newlines to breaks for display
  const formattedContent = content.replace(/\n/g, "<br>");

  // NOTE: If you have rich text (Markdown/Code/Math) rendering, ensure 
  // it is applied to 'formattedContent' before setting innerHTML.
  // For now, we use the basic formatted text.
  bubble.innerHTML = formattedContent;

  msgWrapper.appendChild(bubble);
  container.appendChild(msgWrapper);

  container.scrollTop = container.scrollHeight;
}
function handleSelectAll(e) {
  const isChecked = e.target.checked;
  uploadedFiles.forEach((f) => (f.selected = isChecked));
  renderUploadedFiles();
}

// FIND THIS FUNCTION IN script.js AND REPLACE IT
async function sendMessage() {
  // --- NEW: Trigger chat view immediately when user sends a message ---
  const welcome = document.getElementById("welcomeState");
  if (welcome && !welcome.classList.contains("hidden")) {
    activateChat();
  }
  // ------------------------------------------------------------------

  const chatInput = document.getElementById("chatInput"),
    sendBtn = document.getElementById("sendBtn");
  if (!chatInput || !sendBtn || chatInput.disabled) return;

  const userMessage = chatInput.value.trim();
  if (userMessage === "") return;
  const chatContainer = document.getElementById("chatMessagesScroll");
  if (!chatContainer) return;

  // --- 1. Check for Notebook ID ---
  if (!currentNotebookId) {
    alert("Error: No Notebook ID found. Cannot send message.");
    return;
  }

  // --- 2. Get Selected Files ---
  const selectedFiles = uploadedFiles
    .filter((f) => f.selected)
    .map((f) => f.name);

  if (selectedFiles.length === 0) {
    alert("Please select at least one file in the Vault (left sidebar) to chat with.");
    return;
  }

  // Disable input, show user message
  chatInput.disabled = true;
  sendBtn.disabled = true;
  chatInput.value = "";
  autoResizeTextarea();
  appendMessage(chatContainer, "user", userMessage);
  scrollToBottom(chatContainer);
  const typingIndicator = appendTypingIndicator(chatContainer);
  scrollToBottom(chatContainer);

  try {
    const response = await fetch("/chat_with_documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: userMessage,
        notebook_id: currentNotebookId,
        selected_files: selectedFiles,
        session_id: currentSessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data.session_id && data.session_id !== currentSessionId) {
      currentSessionId = data.session_id;
      loadChatSessions();
    }

    appendMessage(chatContainer, "ai", data.reply || "Could not generate a response.");

  } catch (error) {
    console.error("Chatbot API critical error:", error);
    appendMessage(chatContainer, "ai", "⚠️ Connection issue. Please try again.");
  } finally {
    typingIndicator.remove();
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
    scrollToBottom(chatContainer);
  }
}
function expandToolPanel(toolNameKey) {
  const studioSection = document.querySelector(".studio-section");
  if (!studioSection) return;
  studioSection.classList.add("expanded");

  const toolDetailsWrapper = document.getElementById("toolDetailsWrapper");
  const toolDetailsTitle = document.querySelector(".tool-details-title");

  // Title Mapping
  const titles = {
    sarthiChat: "TeamSpace",
    reportBoard: "Report Board",
    intelliAlert: "IntelliAlert",
    docMapView: "DocMap View",
    docVerify: "DocVerify"
  };

  // ID Mapping
  const viewMap = {
    sarthiChat: "sarthiChatStudioView",
    reportBoard: "reportBoardView",
    intelliAlert: "intelliAlertView",
    docMapView: "docMapView",
    docVerify: "docVerifyView"
  };

  if (!toolDetailsWrapper || !toolDetailsTitle) return;

  toolDetailsWrapper.classList.remove("hidden");
  toolDetailsTitle.textContent = titles[toolNameKey] || "Tool";

  // Hide all, Show selected
  Object.values(viewMap).forEach((id) => document.getElementById(id)?.classList.add("hidden"));
  const selectedViewId = viewMap[toolNameKey];
  if (selectedViewId) document.getElementById(selectedViewId)?.classList.remove("hidden");

  // --- AUTO-INIT LOGIC ---
  if (toolNameKey === "sarthiChat") doc_fetchAndRenderTeamSpaces();
  if (toolNameKey === "intelliAlert") loadIntelliAlert(); // <--- Auto-load Alerts
  if (toolNameKey === "docVerify") loadDocVerifyList();
}
async function loadFriendsIntoCache() {
  try {
    const response = await fetch("/api/friends/list");
    if (!response.ok) throw new Error("Could not fetch friends for cache");
    doc_friendsListCache = await response.json();
  } catch (error) {
    console.error(error);
  }
}

function doc_connectWebSocket(userId) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  doc_socket = new WebSocket(
    `${protocol}//${window.location.host}/ws/${userId}`
  );

  doc_socket.onopen = () => console.log("Doc WebSocket connected for user:", userId);

  doc_socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WS Message:", data);

      const chatMessagesContainer = document.getElementById("doc-chat-messages-panel");

      // --- 1. Real-time List Synchronization ---
      if (data.type === "refresh_teamspaces" || data.type === "group_update") {
        if (document.getElementById("sarthiChatStudioView")?.offsetParent !== null) {
          doc_fetchAndRenderTeamSpaces();
        }
        return;
      }

      // --- 2. Handle 1-on-1 Messages ---
      if (data.type === "new_message") {
        const isChatOpen = doc_currentChattingFriend &&
          doc_currentChattingFriend.type === "friend" &&
          doc_currentChattingFriend.id === data.from;

        if (isChatOpen) {
          doc_appendMessage(data.content, "received");
          // Mark as seen immediately if chat is open
          fetch(`/api/messages/mark-as-seen/${data.from}`, { method: "POST" });
        } else {
          // Refresh list to show unread dot
          if (document.getElementById("sarthiChatStudioView")?.offsetParent !== null) {
            doc_fetchAndRenderTeamSpaces();
          }
        }
      }

      // --- 3. Handle Group Messages ---
      else if (data.type === "new_group_message") {
        const isGroupOpen = doc_currentChattingFriend &&
          doc_currentChattingFriend.type === "group" &&
          doc_currentChattingFriend.id === data.from_group_id;

        if (isGroupOpen) {
          doc_appendMessage(data.content, "received", data.from_sender_name);
        } else {
          if (document.getElementById("sarthiChatStudioView")?.offsetParent !== null) {
            doc_fetchAndRenderTeamSpaces();
          }
        }
      }

      // --- 4. Handle Friend Requests ---
      else if (data.type === "friend_request") {
        // Simple alert or toast
        alert(`New friend request from ${data.from_user}`);
      }

      // --- 5. Handle Notebook Share ---
      else if (data.type === "notebook_share") {
        // (Your existing share logic here - optional to keep full detail)
        alert(`${data.shared_by_name} shared "${data.notebook_title}" with you.`);
        doc_fetchAndRenderTeamSpaces();
      }

      // --- 6. Handle File Processing Updates (CRITICAL FOR REPORT) ---
      else if (data.type === "processing_update") {
        if (data.notebook_id == currentNotebookId) {
          // Update file list status
          const file = uploadedFiles.find((f) => f.name === data.file_name);
          if (file) {
            file.status = data.status;
            if (data.status === "failed") file.error = data.error;
            renderUploadedFiles();
          }

          // === NEW LOGIC: AUTO-REFRESH REPORT BOARD ===
          // If a file finished processing ("complete") and the Report Board is visible, refresh it.
          if (data.status === "complete") {
            const reportView = document.getElementById("reportBoardView");
            if (reportView && !reportView.classList.contains("hidden")) {
              console.log("New file processed. Refreshing Executive Report...");
              generateExecutiveReport();
            }
          }
        }
      }

      // --- 7. Handle AI Summaries ---
      else if (data.type === "notebook_summary" || data.type === "manual_summary") {
        displayAutoSummary(data.file_name, data.summary);
      }

    } catch (e) {
      console.error("Error processing WebSocket message:", e);
    }
  };

  doc_socket.onclose = () => {
    // Reconnect logic
    setTimeout(() => doc_connectWebSocket(userId), 5000);
  };
}

/**
 * Fetches both groups and friends and renders them in the TeamSpaces Studio panel.
 */
async function doc_fetchAndRenderTeamSpaces() {
  const container = document.getElementById("doc-friend-list-container");
  if (!container) return;

  container.innerHTML =
    '<p style="padding: 10px; text-align: center; color: var(--text-secondary);">Loading...</p>';

  try {
    const [groupsResponse, friendsResponse] = await Promise.all([
      fetch("/api/groups/list"),
      fetch("/api/friends/list"),
    ]);

    if (!groupsResponse.ok || !friendsResponse.ok) {
      throw new Error("Failed to fetch TeamSpaces data");
    }

    const groups = await groupsResponse.json();
    const friends = await friendsResponse.json();

    // Update global cache (for group creation checklist and toast notifications)
    doc_friendsListCache = friends;

    let html = "";
    let allItems = [];

    // Map Groups
    groups.forEach((group) => {
      allItems.push({
        id: group.group_id,
        name: group.name,
        type: "group",
        role: group.role,
        unread_count: group.unread_count,
        last_message_time: group.last_message_time,
      });
    });

    // Map Friends
    friends.forEach((friend) => {
      allItems.push({
        id: friend.google_id,
        name: friend.name,
        type: "friend",
        pic: friend.picture_url,
        unread_count: friend.unread_count,
        last_message_time: friend.last_message_time,
      });
    });

    // Sort by unread status and then by last message time
    allItems.sort((a, b) => {
      const hasUnreadA = a.unread_count > 0;
      const hasUnreadB = b.unread_count > 0;
      if (hasUnreadA && !hasUnreadB) return -1;
      if (!hasUnreadA && hasUnreadB) return 1;
      const timeA = a.last_message_time
        ? new Date(a.last_message_time).getTime()
        : 0;
      const timeB = b.last_message_time
        ? new Date(b.last_message_time).getTime()
        : 0;
      return timeB - timeA;
    });

    let groupHtml = "";
    let friendHtml = "";

    allItems.forEach((item) => {
      if (item.type === "group") {
        groupHtml += `
                <div class="friend-item"
                    data-chat-type="group"
                    data-chat-id="${item.id}"
                    data-chat-name="${item.name}"
                    data-user-role="${item.role}">
                    
                    <div class="profile-icon team-icon"">
                      ${item.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="friend-item-info">
                        <div class="name">${item.name}</div>
                    </div>
                    <span class="unread-dot ${item.unread_count > 0 ? "" : "hidden"
          }" style="right: 12px;"></span>
                </div>`;
      } else {
        friendHtml += `
                <div class="friend-item"
                    data-chat-type="friend"
                    data-chat-id="${item.id}"
                    data-chat-name="${item.name}"
                    data-chat-pic="${item.pic}">

                    <img src="${item.pic}" alt="${item.name
          }" referrerpolicy="no-referrer">
                    <div class="friend-item-info">
                        <div class="name">${item.name}</div>
                    </div>
                    <span class="unread-dot ${item.unread_count > 0 ? "" : "hidden"
          }" style="right: 12px;"></span>
                </div>`;
      }
    });

    if (groupHtml)
      html += `<h4 class="chat-list-section-title">Groups</h4>` + groupHtml;
    if (friendHtml)
      html += `<h4 class="chat-list-section-title">Friends</h4>` + friendHtml;
    if (html === "") {
      container.innerHTML =
        '<p style="padding: 10px; color: var(--text-secondary); text-align: center;">Add friends or join groups to start chatting.</p>';
    } else {
      container.innerHTML = html;
      // Add click listeners to newly rendered items
      container.querySelectorAll(".friend-item").forEach((item) => {
        item.addEventListener("click", function () {
          const chatTarget = {
            id: this.dataset.chatId,
            name: this.dataset.chatName,
            type: this.dataset.chatType,
            pic: this.dataset.chatPic,
          };
          doc_openChatView(chatTarget);
        });
      });
    }
  } catch (error) {
    console.error("Error fetching TeamSpaces:", error);
    container.innerHTML =
      '<p style="padding: 10px; color: red; text-align: center;">Could not load chat list.</p>';
  }
}
// Renaming the old friend function to the new teamSpaces function
window.doc_fetchAndRenderFriends = doc_fetchAndRenderTeamSpaces;

// *** REPLACED THIS FUNCTION ***
function doc_openChatView(chatTarget) {
  doc_currentChattingFriend = chatTarget;

  // Get all header elements
  const groupOptionsBtn = document.getElementById("doc-group-chat-options-btn");
  const friendPicEl = document.getElementById("doc-chat-friend-pic");
  const friendNameEl = document.getElementById("doc-chat-friend-name");

  // Get dropdown items
  const manageGroupBtn = document.getElementById("doc-manage-group-btn");
  const addMemberBtn = document.getElementById("doc-add-member-btn");
  const divider = document.querySelector(
    "#doc-group-chat-dropdown .dropdown-divider"
  );

  friendNameEl.textContent = chatTarget.name;

  if (chatTarget.type === "group") {
    const groupListItem = document.querySelector(
      `.friend-item[data-chat-id="${chatTarget.id}"][data-chat-type="group"]`
    );
    const userRole = groupListItem ? groupListItem.dataset.userRole : "member";

    doc_currentGroupDetails = {
      id: chatTarget.id,
      name: chatTarget.name,
      role: userRole,
    };

    friendPicEl.style.display = "none"; // Hide pic for groups
    groupOptionsBtn.classList.remove("hidden"); // Show cog button

    // Check user role to show/hide admin buttons
    const isUserAdmin = userRole === "admin";
    manageGroupBtn.classList.toggle("hidden", !isUserAdmin);
    addMemberBtn.classList.toggle("hidden", !isUserAdmin);
    divider.classList.toggle("hidden", !isUserAdmin);
  } else {
    // It's a friend
    doc_currentGroupDetails = {};
    friendPicEl.style.display = "block"; // Show pic
    friendPicEl.src = chatTarget.pic;
    groupOptionsBtn.classList.add("hidden"); // Hide cog button
  }

  // Show the chat panel (and correct header)
  doc_showTeamSpacesPanel("doc-panel-chat-view");

  // Fetch and mark messages as seen
  doc_fetchAndRenderMessages(chatTarget.type, chatTarget.id);

  const chatItemEl = document.querySelector(
    `.friend-item[data-chat-id="${chatTarget.id}"][data-chat-type="${chatTarget.type}"]`
  );
  chatItemEl?.querySelector(".unread-dot")?.classList.add("hidden");

  if (chatTarget.type === "friend") {
    fetch(`/api/messages/mark-as-seen/${chatTarget.id}`, { method: "POST" });
  } else if (chatTarget.type === "group") {
    fetch(`/api/groups/mark-as-seen/${chatTarget.id}`, { method: "POST" });
  }
}

// *** REPLACED THIS FUNCTION ***
function doc_closeChatView() {
  doc_currentChattingFriend = null;
  doc_currentGroupDetails = {};

  // Use the helper function to return to the main list
  doc_showTeamSpacesPanel("doc-panel-main-content");

  document.getElementById("doc-chat-messages-panel").innerHTML = "";
}

/**
 * Fetches messages for either a friend or a group.
 * @param {string} chatType - 'friend' or 'group'
 * @param {string} chatId - The friend's google_id or the group_id
 */
async function doc_fetchAndRenderMessages(chatType, chatId) {
  const container = document.getElementById("doc-chat-messages-panel");
  container.innerHTML = "";

  const endpoint =
    chatType === "friend"
      ? `/api/messages/${chatId}`
      : `/api/groups/messages/${chatId}`;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch messages");

    const messages = await response.json();

    if (messages.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">No messages yet. Say hi!</p>';
    } else {
      messages.forEach((msg) =>
        doc_appendMessage(
          msg.content,
          msg.sender_id === doc_currentUser.id ? "sent" : "received",
          msg.sender_name
        )
      );
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    container.innerHTML =
      '<p style="text-align:center; color: red;">Could not load messages.</p>';
  }
}

// REPLACE existing doc_appendMessage in script.js

function doc_appendMessage(content, type, senderName = null) {
  const container = document.getElementById("doc-chat-messages-panel");
  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble", type);

  // Limit for "Read More" (e.g., 350 characters)
  const CHAR_LIMIT = 350;
  let finalHtml = "";

  // 1. Add Sender Name if Group Chat
  if (type === "received" && doc_currentChattingFriend && doc_currentChattingFriend.type === "group" && senderName) {
    finalHtml += `<span class="sender-name">${senderName}</span>`;
  }

  // 2. Handle Text Truncation
  if (content.length > CHAR_LIMIT) {
    const shortText = content.substring(0, CHAR_LIMIT);
    const remainingText = content.substring(CHAR_LIMIT);

    // Use a unique ID for toggling
    const toggleId = "toggle-" + Math.random().toString(36).substr(2, 9);

    finalHtml += `
            <span class="short-text">${shortText}...</span>
            <span id="${toggleId}" class="chat-hidden-content">${remainingText}</span>
            <br>
            <span class="chat-read-more" onclick="toggleChatReadMore('${toggleId}', this)">Read more</span>
        `;
  } else {
    finalHtml += content;
  }

  bubble.innerHTML = finalHtml;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// --- ADD THIS HELPER FUNCTION TO script.js ---
function toggleChatReadMore(elementId, btn) {
  const hiddenSpan = document.getElementById(elementId);
  if (!hiddenSpan) return;

  if (hiddenSpan.style.display === "inline") {
    hiddenSpan.style.display = "none";
    btn.textContent = "Read more";
    // Optional: Scroll back up slightly if needed
  } else {
    hiddenSpan.style.display = "inline";
    btn.textContent = "Read less";
  }
}

function doc_sendMessage(e) {
  e.preventDefault();
  const input = document.getElementById("doc-chat-input-panel");
  const message = input.value.trim();

  if (message && doc_currentChattingFriend && doc_socket) {
    let payload;

    if (doc_currentChattingFriend.type === "friend") {
      payload = {
        type: "chat_message",
        to: doc_currentChattingFriend.id,
        content: message,
      };
    } else if (doc_currentChattingFriend.type === "group") {
      payload = {
        type: "group_message",
        to_group_id: doc_currentChattingFriend.id,
        content: message,
      };
    } else {
      return;
    }

    doc_socket.send(JSON.stringify(payload));
    doc_appendMessage(message, "sent");
    input.value = "";
  }
}

// *** ADDED THIS NEW HELPER FUNCTION ***
// NEW: Panel Navigation for Sarthi Chat
function doc_showTeamSpacesPanel(viewId) {
  // Hide all panel views
  document.getElementById("doc-panel-main-content").classList.add("hidden");
  document.getElementById("doc-panel-chat-view").classList.add("hidden");
  document
    .getElementById("doc-panel-manage-group-view")
    .classList.add("hidden");
  document.getElementById("doc-panel-add-member-view").classList.add("hidden");

  // Show the requested one
  document.getElementById(viewId)?.classList.remove("hidden");

  // Toggle the headers
  const isChatView = viewId === "doc-panel-chat-view";
  const isMainView = viewId === "doc-panel-main-content";

  document
    .getElementById("doc-header-main")
    .classList.toggle("hidden", !isMainView);
  document
    .getElementById("doc-header-chat")
    .classList.toggle("hidden", isMainView);

  // Special case: if we are in manage/add, we still want the chat header
  if (
    viewId === "doc-panel-manage-group-view" ||
    viewId === "doc-panel-add-member-view"
  ) {
    document.getElementById("doc-header-chat").classList.remove("hidden");
  }
}

async function handleFriendSearch(e) {
  const query = e.target.value.trim();
  const resultsContainer = document.getElementById(
    "modal-friend-search-results"
  );
  if (query.length < 2) {
    resultsContainer.innerHTML = "";
    return;
  }
  const response = await fetch(
    `/api/users/search?email=${encodeURIComponent(query)}`
  );
  if (response.ok) {
    const users = await response.json();
    resultsContainer.innerHTML =
      users.length === 0
        ? '<p style="padding: 10px; color: var(--text-secondary);">No users found.</p>'
        : "";
    users.forEach((user) => {
      resultsContainer.innerHTML += `
            <div class="search-result-item">
                <img src="${user.picture_url}" alt="${user.name}" referrerpolicy="no-referrer">
                <div class="search-result-info">
                    <div class="name">${user.name}</div>
                    <div class="email">${user.email}</div>
                </div>
                <button class="add-friend-btn" data-email="${user.email}">Add</button>
            </div>`;
    });
    // Add listeners to new buttons
    resultsContainer
      .querySelectorAll(".add-friend-btn")
      .forEach((btn) =>
        btn.addEventListener("click", (e) => sendFriendRequest(e.currentTarget))
      );
  }
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
    alert("An error occurred.");
    button.textContent = "Add";
    button.disabled = false;
  }
}

// --- NEW GROUP CHAT UTILITY FUNCTIONS ---

async function loadFriendsIntoChecklist() {
  const groupFriendList = document.getElementById("group-friend-list");
  if (!groupFriendList) return;

  groupFriendList.innerHTML = "<p>Loading friends...</p>";

  // Ensure friends cache is loaded
  if (doc_friendsListCache.length === 0) {
    await loadFriendsIntoCache();
  }

  if (doc_friendsListCache.length === 0) {
    groupFriendList.innerHTML = "<p>No friends to add.</p>";
    return;
  }

  let friendHtml = "";
  doc_friendsListCache.forEach((friend) => {
    friendHtml += `
      <label class="friend-checklist-item" style="display: flex; align-items: center; padding: 5px; cursor: pointer; border-radius: 6px;">
        <input type="checkbox" value="${friend.google_id}" style="margin-right: 10px; transform: scale(1.2);">
        <img src="${friend.picture_url}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 8px;" referrerpolicy="no-referrer">
        <span>${friend.name}</span>
      </label>
    `;
  });
  groupFriendList.innerHTML = friendHtml;
}

async function handleCreateGroup(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const groupName = document.getElementById("group-name-input").value;
  const selectedFriends = [];
  document
    .querySelectorAll("#group-friend-list input[type='checkbox']:checked")
    .forEach((input) => {
      selectedFriends.push(input.value);
    });

  const btn = form.querySelector("button[type='submit']");
  btn.textContent = "Creating...";
  btn.disabled = true;

  try {
    const response = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, friend_ids: selectedFriends }),
    });

    if (response.ok) {
      closeModal("createGroupModal");
      doc_fetchAndRenderTeamSpaces(); // Refresh friend/group list
    } else {
      const err = await response.json();
      alert(`Error: ${err.detail}`);
    }
  } catch (err) {
    alert("An error occurred during group creation.");
  } finally {
    btn.textContent = "Create Group";
    form.reset();
    btn.disabled = false;
  }
}

async function handleJoinGroup(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const inviteCode = document.getElementById("invite-code-input").value;
  const btn = form.querySelector("button[type='submit']");
  btn.textContent = "Joining...";
  btn.disabled = true;

  try {
    const response = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: inviteCode }),
    });

    if (response.ok) {
      closeModal("joinGroupModal");
      doc_fetchAndRenderTeamSpaces(); // Refresh friend/group list
    } else {
      const err = await response.json();
      alert(`Error: ${err.detail}`);
    }
  } catch (err) {
    alert("An error occurred while joining the group.");
  } finally {
    btn.textContent = "Join";
    form.reset();
    btn.disabled = false;
  }
}

// --- START: Added Group Management Logic ---

// --- Helper functions to open panels ---
async function doc_openManageGroupPanel() {
  if (!doc_currentGroupDetails.id || doc_currentGroupDetails.role !== "admin")
    return;

  document.getElementById(
    "doc-manage-group-panel-title"
  ).textContent = `Manage "${doc_currentGroupDetails.name}"`;
  const memberListContainer = document.getElementById(
    "doc-group-member-list-panel"
  );
  memberListContainer.innerHTML = "<p>Loading members...</p>";

  doc_showTeamSpacesPanel("doc-panel-manage-group-view");

  try {
    const response = await fetch(
      `/api/groups/${doc_currentGroupDetails.id}/members`
    );
    if (!response.ok) throw new Error("Failed to load members");
    const members = await response.json();
    doc_renderGroupMembers(members);
  } catch (err) {
    memberListContainer.innerHTML = `<p style="color: red;">${err.message}</p>`;
  }
}

function doc_renderGroupMembers(members) {
  const container = document.getElementById("doc-group-member-list-panel");
  container.innerHTML = "";
  const isCurrentUserAdmin = doc_currentGroupDetails.role === "admin";

  members.forEach((member) => {
    container.innerHTML += `
          <div class="search-result-item" id="doc-member-${member.google_id}">
            <img src="${member.picture_url}" alt="${member.name
      }" referrerpolicy="no-referrer">
            <div class="search-result-info">
                <div class="name">${member.name} ${member.google_id === doc_currentUser.id ? "(You)" : ""
      }</div>
                <div class="email">${member.role}</div>
            </div>
            ${isCurrentUserAdmin && member.google_id !== doc_currentUser.id
        ? `
            <button class="add-friend-btn remove-member-btn" style="background-color: #ff3b30;"
                    data-user-id="${member.google_id}"
                    data-user-name="${member.name}">
                Remove
            </button>
            `
        : ""
      }
        </div>
        `;
  });
}

async function doc_openAddMemberPanel() {
  if (!doc_currentGroupDetails.id || doc_currentGroupDetails.role !== "admin")
    return;

  document.getElementById("doc-add-member-search-input-panel").value = "";
  document.getElementById("doc-add-member-search-results-panel").innerHTML = "";
  const inviteCodeDisplay = document.getElementById(
    "doc-group-invite-code-display-panel"
  );
  inviteCodeDisplay.value = "Loading code...";

  doc_showTeamSpacesPanel("doc-panel-add-member-view");
  document.getElementById("doc-add-member-search-input-panel").focus();

  try {
    const response = await fetch(
      `/api/groups/${doc_currentGroupDetails.id}/details`
    );
    if (!response.ok) throw new Error("Failed to load group details");
    const group = await response.json();
    inviteCodeDisplay.value = group.invite_code;
  } catch (err) {
    inviteCodeDisplay.value = "Could not load code";
  }
}

function doc_renderAddMemberResults(users) {
  const container = document.getElementById(
    "doc-add-member-search-results-panel"
  );
  container.innerHTML = "";
  if (users.length === 0) {
    container.innerHTML =
      "<p style='padding: 10px; color: var(--text-secondary);'>No users found.</p>";
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
            <button class="add-friend-btn doc-add-member-to-group-btn" data-user-id="${user.google_id}">Add</button>
        </div>
        `;
  });
}

// --- Add Event Listeners (Must be run *after* DOM is loaded) ---
// We add this to the existing setupEventListeners function

function addGroupManagementEventListeners() {
  // Toggle for the group chat options dropdown
  document
    .getElementById("doc-group-chat-options-btn")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      document
        .getElementById("doc-group-chat-dropdown")
        .classList.toggle("show");
    });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("doc-group-chat-dropdown");
    if (
      dropdown &&
      dropdown.classList.contains("show") &&
      !e.target.closest(".group-chat-options-container")
    ) {
      dropdown.classList.remove("show");
    }
  });

  // Panel navigation buttons
  document
    .getElementById("doc-manage-group-btn")
    ?.addEventListener("click", () => {
      document
        .getElementById("doc-group-chat-dropdown")
        .classList.remove("show");
      doc_openManageGroupPanel();
    });

  document
    .getElementById("doc-add-member-btn")
    ?.addEventListener("click", () => {
      document
        .getElementById("doc-group-chat-dropdown")
        .classList.remove("show");
      doc_openAddMemberPanel();
    });

  document
    .getElementById("doc-leave-group-btn")
    ?.addEventListener("click", async () => {
      if (!doc_currentGroupDetails.id) return;
      const groupName = doc_currentGroupDetails.name;
      if (confirm(`Are you sure you want to leave the group "${groupName}"?`)) {
        try {
          const response = await fetch(
            `/api/groups/${doc_currentGroupDetails.id}/leave`,
            { method: "POST" }
          );
          if (response.ok) {
            doc_closeChatView();
            doc_fetchAndRenderTeamSpaces(); // Refresh list
          } else {
            alert(`Error leaving group: ${(await response.json()).detail}`);
          }
        } catch (err) {
          alert("An error occurred while leaving.");
        }
      }
    });

  // "Back to Chat" buttons
  document.querySelectorAll(".js-doc-back-to-chat").forEach((button) => {
    button.addEventListener("click", () => {
      doc_showTeamSpacesPanel("doc-panel-chat-view");
    });
  });

  // --- Logic for "Manage Group" panel ---
  document
    .getElementById("doc-group-member-list-panel")
    ?.addEventListener("click", async (e) => {
      const removeBtn = e.target.closest(".remove-member-btn");
      if (!removeBtn || !doc_currentGroupDetails.id) return;

      const userId = removeBtn.dataset.userId;
      const userName = removeBtn.dataset.userName;

      if (
        confirm(`Are you sure you want to remove ${userName} from the group?`)
      ) {
        removeBtn.textContent = "Removing...";
        removeBtn.disabled = true;
        try {
          const response = await fetch(
            `/api/groups/${doc_currentGroupDetails.id}/remove-member/${userId}`,
            { method: "DELETE" }
          );
          if (response.ok) {
            document.getElementById(`doc-member-${userId}`).remove();
          } else {
            alert(`Error: ${(await response.json()).detail}`);
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

  // --- Logic for "Add Member" panel ---
  document
    .getElementById("doc-add-member-search-input-panel")
    ?.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      const container = document.getElementById(
        "doc-add-member-search-results-panel"
      );
      if (query.length < 2) {
        container.innerHTML = "";
        return;
      }
      try {
        const response = await fetch(
          `/api/users/search-by-name?name=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          doc_renderAddMemberResults(await response.json());
        } else {
          container.innerHTML =
            "<p style='padding: 10px; color: red;'>Search failed.</p>";
        }
      } catch (err) {
        container.innerHTML =
          "<p style='padding: 10px; color: red;'>An error occurred.</p>";
      }
    });

  document
    .getElementById("doc-add-member-search-results-panel")
    ?.addEventListener("click", async (e) => {
      const addBtn = e.target.closest(".doc-add-member-to-group-btn");
      if (!addBtn || !doc_currentGroupDetails.id) return;

      addBtn.textContent = "Adding...";
      addBtn.disabled = true;
      try {
        const response = await fetch(
          `/api/groups/${doc_currentGroupDetails.id}/add-member`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id_to_add: addBtn.dataset.userId }),
          }
        );
        if (response.ok) {
          addBtn.textContent = "Added";
        } else {
          alert(`Error: ${(await response.json()).detail}`);
          addBtn.textContent = "Add";
          addBtn.disabled = false;
        }
      } catch (err) {
        alert("An error occurred.");
        addBtn.textContent = "Add";
        addBtn.disabled = false;
      }
    });

  document
    .getElementById("doc-group-invite-code-display-panel")
    ?.addEventListener("click", (e) => {
      const input = e.currentTarget;
      navigator.clipboard.writeText(input.value);
      const originalValue = input.value;
      input.value = "Copied!";
      setTimeout(() => {
        input.value = originalValue;
      }, 1500);
    });
}

async function openShareModal() {
  openModal("shareModal");
  const container = document.getElementById("share-list-container");

  // Pretty loading state
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
        <span style="font-size: 13px;">Loading your contacts...</span>
    </div>`;

  try {
    const [groupsResponse, friendsResponse] = await Promise.all([
      fetch("/api/groups/list"),
      fetch("/api/friends/list"),
    ]);

    if (!groupsResponse.ok || !friendsResponse.ok) {
      throw new Error("Failed to fetch TeamSpaces data");
    }

    const groups = await groupsResponse.json();
    const friends = await friendsResponse.json();
    let html = "";

    // Helper to generate the Dropdown HTML
    const accessDropdown = `
          <select class="share-access-select" onclick="event.stopPropagation()">
              <option value="viewer" selected>Viewer</option>
              <option value="editor">Editor</option>
          </select>`;

    // --- Render Groups ---
    if (groups.length > 0) {
      html += `<div class="share-list-label" style="margin-top: 10px;">Groups</div>`;
      groups.forEach((group) => {
        html += `
                <div class="share-user-item" onclick="this.querySelector('.share-checkbox').click()">
                    
                    <div class="share-avatar-wrapper">
                        <div class="share-avatar team-icon">
                            ${group.name.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div class="share-user-info">
                        <div class="share-user-name">${group.name}</div>
                        <div class="share-user-email">${group.role} • ${group.unread_count || 0} members</div>
                    </div>

                    ${accessDropdown}

                    <div class="share-checkbox-wrapper">
                        <input type="checkbox" class="share-checkbox" name="group_ids" value="${group.group_id}" onclick="event.stopPropagation()">
                    </div>
                </div>`;
      });
    }

    // --- Render Friends ---
    if (friends.length > 0) {
      html += `<div class="share-list-label" style="margin-top: 15px;">Friends</div>`;
      friends.forEach((friend) => {
        html += `
                <div class="share-user-item" onclick="this.querySelector('.share-checkbox').click()">
                    
                    <div class="share-avatar-wrapper">
                        <img src="${friend.picture_url}" class="share-avatar" referrerpolicy="no-referrer" alt="${friend.name}">
                    </div>

                    <div class="share-user-info">
                        <div class="share-user-name">${friend.name}</div>
                        <div class="share-user-email">${friend.email}</div>
                    </div>

                    ${accessDropdown}

                    <div class="share-checkbox-wrapper">
                        <input type="checkbox" class="share-checkbox" name="friend_ids" value="${friend.google_id}" onclick="event.stopPropagation()">
                    </div>
                </div>`;
      });
    }

    if (html === "") {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
            <i class="fas fa-user-friends" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
            <p style="font-size: 13px;">No friends or groups found.</p>
        </div>`;
    } else {
      container.innerHTML = html;

      // Add simple click visual feedback
      container.querySelectorAll('.share-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const row = e.target.closest('.share-user-item');
          if (e.target.checked) row.classList.add('selected');
          else row.classList.remove('selected');
        });
      });
    }
  } catch (error) {
    console.error("Error populating share modal:", error);
    container.innerHTML = '<p style="color: var(--destructive-red); padding: 20px; text-align: center;">Could not load list.</p>';
  }
}
/**
 * Filters the friend/group list in the share modal.
 */
function filterShareList(e) {
  const query = e.target.value.toLowerCase();
  const items = document.querySelectorAll(
    "#share-list-container .friend-checklist-item"
  );
  items.forEach((item) => {
    const name = item.dataset.name;
    item.style.display = name.includes(query) ? "flex" : "none";
  });
}

// In script.js

async function handleShareSubmit(e) {
  e.preventDefault();

  if (!currentNotebookId) {
    alert("Error: No notebook ID found.");
    return;
  }

  const form = e.currentTarget;
  const btn = form.querySelector("button[type='submit']");

  // 1. Reset button state
  const originalBtnText = btn.innerHTML;
  btn.textContent = "Sharing...";
  btn.disabled = true;

  const friends = [];
  const groups = [];

  // 2. Build Payload (FIXED CLASS NAME: share-access-select)
  form.querySelectorAll("input[name='friend_ids']:checked").forEach((input) => {
    const item = input.closest(".share-user-item"); // Changed to match your HTML class
    // CRITICAL FIX: Changed '.share-access-level' to '.share-access-select'
    const level = item.querySelector(".share-access-select").value;
    friends.push({ id: input.value, access_level: level });
  });

  form.querySelectorAll("input[name='group_ids']:checked").forEach((input) => {
    const item = input.closest(".share-user-item"); // Changed to match your HTML class
    // CRITICAL FIX: Changed '.share-access-level' to '.share-access-select'
    const level = item.querySelector(".share-access-select").value;
    groups.push({ id: input.value, access_level: level });
  });

  // 3. Validation: Stop if nothing is selected
  if (friends.length === 0 && groups.length === 0) {
    alert("Please select at least one friend or group to share with.");
    btn.innerHTML = originalBtnText; // Restore button text
    btn.disabled = false;
    return;
  }

  const payload = { friends: friends, groups: groups };

  try {
    const response = await fetch(`/api/notebooks/${currentNotebookId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // 4. Success Feedback
      const result = await response.json();
      alert("Space shared successfully!"); // Or use a toast if you have one
      closeModal("shareModal");
      form.reset(); // Clear selections

      // Remove 'selected' class from visual items
      document.querySelectorAll('.share-user-item.selected').forEach(el => el.classList.remove('selected'));
    } else {
      const err = await response.json();
      throw new Error(err.detail || "Failed to share");
    }
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
  } finally {
    // 5. Restore Button
    if (btn) {
      btn.innerHTML = `<span>Share</span><i class="fas fa-paper-plane"></i>`;
      btn.disabled = false;
    }
  }
}

/**
 * Hides or shows UI elements based on the user's permission level.
 * @param {string} level - The user's access level ('owner', 'editor', 'viewer')
 */
function toggleUIForPermission(level) {
  const isFullAccess = level === "owner" || level === "editor";
  const isOwner = level === "owner";
  const sidebarContent = document.querySelector(".sidebar-content"); // Get parent element

  // --- NEW: Add/Remove class based on access level ---
  if (sidebarContent) {
    if (isFullAccess) {
      sidebarContent.classList.remove("role-viewer");
      // Optional: Add a class for editor/owner if needed for other styles
      // sidebarContent.classList.add('role-editor');
    } else {
      // User is a viewer
      sidebarContent.classList.add("role-viewer");
      // sidebarContent.classList.remove('role-editor');
    }
    // Optional: Add/remove owner class specifically if needed
    // if(isOwner) sidebarContent.classList.add('role-owner');
    // else sidebarContent.classList.remove('role-owner');
  }
  // --- END NEW ---

  // 1. Hide "Add" button in Vault
  const addBtn = document.querySelector(".sidebar .add-btn");
  if (addBtn) {
    addBtn.style.display = isFullAccess ? "flex" : "none";
  }

  // 2. Hide "..." menu on all file items
  document
    .querySelectorAll(".file-item .file-menu-container")
    .forEach((menu) => {
      menu.style.display = isFullAccess ? "block" : "none";
    });

  // 3. Only allow the Owner to share
  const shareBtn = document.getElementById("shareSpaceBtn");
  if (shareBtn) {
    shareBtn.style.display = isOwner ? "flex" : "none";
  }

  // 4. Disable drag/drop upload for viewers
  const uploadZone = document.getElementById("modalUploadZone");
  if (uploadZone) {
    if (isFullAccess) {
      uploadZone.style.pointerEvents = "auto";
      uploadZone.style.opacity = "1";
    } else {
      uploadZone.style.pointerEvents = "none";
      uploadZone.style.opacity = "0.5";
    }
  }
}

/**
 * Creates the HTML string for a notebook share notification message.
 * @param {object} data - The WebSocket message data.
 * @returns {string} HTML string for the message.
 */
function createShareMessageHTML(data) {
  const sharerName = data.shared_by_name || "Someone";
  const notebookTitle = data.notebook_title || "Untitled Notebook";
  const notebookId = data.notebook_id;

  // Returns a clickable card layout instead of plain text
  return `
    <div class="message system-share" style="background: transparent; border: none; box-shadow: none; padding: 0; width: 100%; display: flex; justify-content: center;">
       <div class="shared-notebook-card" onclick="window.location.href='/document/${notebookId}'">
          
          <div class="sn-icon-box">
            <i class="fas fa-book-open"></i>
          </div>
          
          <div class="sn-info">
            <span class="sn-label">${sharerName} shared a notebook</span>
            <span class="sn-title">${notebookTitle}</span>
          </div>
          
          <div class="sn-arrow">
            <i class="fas fa-chevron-right"></i>
          </div>

       </div>
    </div>`;
}

function toggleHistoryView() {
  // We are now targeting the inner div that holds the Vault content
  const vaultContent = document.getElementById("vaultContent");
  const historyPanel = document.getElementById("simpleHistoryPanel");

  if (!vaultContent || !historyPanel) return;

  // Toggle the 'hidden' class on the History panel
  const isHistoryHidden = historyPanel.classList.contains("hidden");

  // Simple toggle between the two main content blocks
  if (isHistoryHidden) {
    // ACTION: Show History Panel, Hide Vault Content
    vaultContent.classList.add("hidden");
    historyPanel.classList.remove("hidden");

    // --- NEW: Load sessions only when opening ---
    loadChatSessions();
  } else {
    // ACTION: Show Vault Content, Hide History Panel
    vaultContent.classList.remove("hidden");
    historyPanel.classList.add("hidden");
  }
}

// FIND THIS FUNCTION IN script.js AND REPLACE IT
async function startNewChat() {
  if (!currentNotebookId) {
    alert("Error: Cannot start new chat without a valid Notebook ID.");
    return;
  }

  // --- NEW CHECK: PREVENT EMPTY CHAT CREATION ---
  // If the user hasn't sent any messages yet (history is empty), 
  // simply return. This keeps them on the current "Sarthi Astra" screen 
  // without creating a duplicate blank session in the database.
  if (chatHistory.length === 0) {
    console.log("Chat is already empty. No new session needed.");
    return;
  }
  // ----------------------------------------------

  try {
    const response = await fetch(`/api/notebook/${currentNotebookId}/new_chat`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error("Failed to create new chat session.");

    const data = await response.json();
    const newSessionId = data.session_id;

    // Clear current chat state
    currentSessionId = newSessionId;
    chatHistory = [];
    document.getElementById("chatMessagesScroll").innerHTML = '';

    // Remove the previous chat data from local storage so it doesn't reload
    localStorage.removeItem(`chat_${currentNotebookId}`);

    // Reset UI to "Sarthi Astra" Mode
    chatActive = false;
    loadChatHistory();

    // Refresh the sidebar list (the previous chat will now appear in the list)
    loadChatSessions();

  } catch (error) {
    console.error("Error creating new chat session:", error);
    alert("Failed to start a new chat. Please try again.");
  }
}
/**
 * Fetches and renders the list of chat sessions for the current notebook.
 */
/**
 * Fetches and renders the list of chat sessions for the current notebook.
 */
async function loadChatSessions() {
  const listContainer = document.getElementById("chatHistoryList");

  if (!listContainer || !currentNotebookId) return;

  listContainer.innerHTML = `<p class="text-secondary loading-spinner" style="padding: 15px; text-align: center;">Loading chat history...</p>`;

  try {
    // Note: We assume the backend API is updated to return the first message
    // as the session title, or we rely on the existing 'title' property.
    const response = await fetch(`/api/notebook/${currentNotebookId}/chats`);
    if (!response.ok) throw new Error("Failed to load sessions.");

    notebookChatSessions = await response.json();
    listContainer.innerHTML = ""; // Clear loading message

    if (notebookChatSessions.length === 0) {
      listContainer.innerHTML = `<p class="text-secondary" style="padding: 15px; text-align: center;">No previous chats found.</p>`;
      return;
    }

    notebookChatSessions.forEach((session) => {
      const item = document.createElement("div");
      item.className = `chat-session-item ${session.session_id === currentSessionId ? "active" : ""
        }`;
      item.dataset.sessionId = session.session_id;

      // *** CHANGE: Use the session title, which should contain the first user message ***
      // We truncate the title (first message) for display purposes if it's too long
      const rawTitle = session.title || "Untitled Chat";
      const displayTitle = rawTitle.length > 50 ? rawTitle.substring(0, 47) + '...' : rawTitle;

      // *** REMOVED: Date rendering ***

      item.innerHTML = `
                <div class="session-info">
                    <div class="session-title" title="${rawTitle}">${displayTitle}</div>
                    </div>
                <button class="delete-history-btn" title="Delete Chat">
                   <i class="fas fa-trash-can"></i>
                </button>
            `;

      // 1. Click listener to load session (on the whole item)
      item.addEventListener("click", (e) => {
        // Only load if the delete button wasn't clicked
        if (!e.target.closest(".delete-history-btn")) {
          loadSession(session.session_id);
        }
      });

      // 2. Click listener specifically for the delete button
      item
        .querySelector(".delete-history-btn")
        .addEventListener("click", (e) => {
          e.stopPropagation(); // Prevents loading the session
          // Note: deleteChatSession must be defined elsewhere in script.js
          deleteChatSession(session.session_id, item);
        });

      listContainer.appendChild(item);
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    listContainer.innerHTML = `<p class="text-secondary" style="color: var(--destructive-red); padding: 15px; text-align: center;">Failed to load history.</p>`;
  }
}
/**
 * Loads messages for a specific session ID into the main chat area.
 */
async function loadSession(sessionId) {
  if (sessionId === currentSessionId) {
    toggleHistoryView(); // Close the panel if clicking the current session
    return;
  }

  const chatContainer = document.getElementById("chatMessagesScroll");
  if (!chatContainer) return;

  chatContainer.innerHTML = `<div class="loading-spinner" style="text-align: center; padding: 20px;">Loading messages...</div>`;

  try {
    const response = await fetch(`/api/chat/session/${sessionId}`);
    if (!response.ok) throw new Error("Failed to load messages.");

    const messages = await response.json();

    // --- Update Global State ---
    currentSessionId = sessionId;
    chatHistory = []; // Clear current history in memory
    chatContainer.innerHTML = ""; // Clear loading

    // --- Render Messages ---
    messages.forEach((msg) => {
      // Note: The API returns 'role' (user/ai), which matches your appendMessage structure
      appendMessage(chatContainer, msg.role, msg.content);
    });

    // --- Update History Panel UI (active class) ---
    document.querySelectorAll(".chat-session-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.sessionId === sessionId);
    });

    // Activate the chat view (in case it was showing welcome state)
    activateChat();
    scrollToBottom(chatContainer);
    toggleHistoryView(); // Close the history panel
  } catch (error) {
    console.error("Error loading chat session:", error);
    chatContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--destructive-red);">Failed to load chat history.</div>`;
  }
}





/**
 * Deletes a chat session by calling the backend API and updates the UI.
 * @param {string} sessionId - The ID of the session to delete.
 * @param {HTMLElement} itemElement - The UI element for the session item.
 */
async function deleteChatSession(sessionId, itemElement) {
  const sessionTitle = itemElement.dataset.sessionTitle || "this chat";

  if (!confirm(`Are you sure you want to delete "${sessionTitle}"? This cannot be undone.`)) {
    return;
  }

  try {
    // Show a loading/disabling state on the button
    const deleteBtn = itemElement.querySelector('.delete-history-btn');
    deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    deleteBtn.disabled = true;

    const response = await fetch(`/api/chat/session/${sessionId}`, {
      method: "DELETE", // New DELETE endpoint in backend
    });

    if (!response.ok) {
      const errorDetail = await response.json();
      throw new Error(errorDetail.detail || "Failed to delete chat.");
    }

    // 1. Remove the item from the UI immediately
    itemElement.remove();

    // 2. If the deleted session was the currently active one, reset the chat view
    if (sessionId === currentSessionId) {
      currentSessionId = null;
      document.getElementById("chatMessagesScroll").innerHTML = '';
      chatHistory = []; // Clear in-memory history
      // Optionally show the welcome state or start a new chat
    }

    // 3. Refresh the full list (optional, but good for cleanup)
    loadChatSessions();

  } catch (error) {
    console.error("Error deleting chat session:", error);
    alert(`Could not delete chat: ${error.message}`);

    // Restore the button on failure
    const deleteBtn = itemElement.querySelector('.delete-history-btn');
    if (deleteBtn) {
      deleteBtn.innerHTML = '<i class="fas fa-trash-can"></i>';
      deleteBtn.disabled = false;
    }
  }
}


// ADD THIS FUNCTION IN script.js
function displayAutoSummary(fileName, summary) {
  const chatContainer = document.getElementById("chatMessagesScroll");
  if (!chatContainer) return;

  activateChat(); // Show chat if hidden

  const html = `
    <div class="message ai">
      <div class="message-avatar">AI</div>
      <div class="message-bubble">
        <div class="message-content">
          <strong>Summary of "${fileName}"</strong>
          <div style="margin-top: 10px; line-height: 1.7;">
            ${marked.parse(summary)}
          </div>
        </div>
      </div>
    </div>
  `;
  chatContainer.insertAdjacentHTML("beforeend", html);
  scrollToBottom(chatContainer);
}


// ADD THIS NEW FUNCTION TO script.js
async function getSingleFileSummary(fileName, button) {
  // Use the passed button element (from handleFileActions) or find it again if necessary
  const btn = button || event.target.closest("a");
  const originalHTML = btn.innerHTML;

  // Disable button and show loading state
  btn.innerHTML = 'Generating... <i class="fa-solid fa-spinner fa-spin"></i>';
  btn.style.pointerEvents = 'none';

  // Close the dropdown menu immediately
  btn.closest(".file-action-dropdown")?.classList.add("hidden");

  try {
    const res = await fetch("/api/generate_summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notebook_id: currentNotebookId,
        file_name: fileName
      })
    });

    if (res.ok) {
      // Success: Summary will arrive via WebSocket, just give a quick confirmation
      // alert(`Summary generation for "${fileName}" started. Check the chat panel shortly.`);
    } else {
      const errorDetail = await res.json();
      alert(`Failed to generate summary: ${errorDetail.detail || "Unknown error."}`);
    }
  } catch (e) {
    alert("Error communicating with the server: " + e.message);
  } finally {
    // Restore the button state
    btn.innerHTML = originalHTML;
    btn.style.pointerEvents = 'auto';
  }
}

// ADD THIS NEW FUNCTION TO script.js
function displayAutoSummary(fileName, summary) {
  const chatContainer = document.getElementById("chatMessagesScroll");
  if (!chatContainer) return;

  // Activate chat if not already
  activateChat();

  const html = `
    <div class="message ai">
      <div class="message-content">
        <div class="message-text">
          <strong>Summary of "${fileName}"</strong>
          <div style="margin-top: 10px; line-height: 1.7;">
            ${marked.parse(summary)}
          </div>
        </div>
      </div>
    </div>
  `;

  // We append to DOM directly instead of using appendMessage to bypass chatHistory save for summaries
  chatContainer.insertAdjacentHTML("beforeend", html);
  scrollToBottom(chatContainer);
}



let animationId = null;

function initUniverseAnimation() {
  const canvas = document.getElementById('universeCanvas');
  const container = document.getElementById('welcomeState');

  // Guard clause: stop if elements don't exist or welcome state is hidden
  if (!canvas || !container || container.classList.contains('hidden')) {
    if (animationId) cancelAnimationFrame(animationId);
    return;
  }

  const ctx = canvas.getContext('2d');
  let width, height;

  // Configuration
  const starCount = 100; // Number of stars
  const stars = [];

  // Star Class
  class Star {
    constructor() {
      this.reset();
      // Start at random y (so they don't all start at bottom)
      this.y = Math.random() * height;
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 100; // Start just below screen
      this.size = Math.random() * 2 + 0.5; // Random size 0.5 to 2.5px
      this.speed = Math.random() * 0.5 + 0.2; // Random speed
      this.opacity = Math.random() * 0.5 + 0.3;
    }

    update() {
      this.y -= this.speed; // Move Upwards

      // Reset if it goes off top of screen
      if (this.y < -10) {
        this.reset();
      }
    }

    draw() {
      const isDarkMode = document.body.classList.contains('dark-mode');

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

      // Theme Aware Colors
      if (isDarkMode) {
        // White/Blueish stars for Dark Mode
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      } else {
        // Dark Grey stars for Light Mode (so they are visible on beige)
        ctx.fillStyle = `rgba(80, 80, 80, ${this.opacity})`;
      }

      ctx.fill();
    }
  }

  // Resize Handler
  function resize() {
    // Match the container's size, not the window
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
  }

  // Initialize Stars
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }
  }

  // Animation Loop
  function animate() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update and Draw stars
    stars.forEach(star => {
      star.update();
      star.draw();
    });

    // Continue loop if Welcome State is still visible
    if (!container.classList.contains('hidden')) {
      animationId = requestAnimationFrame(animate);
    }
  }

  // Setup
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });

  // Check for theme changes (Optional: usually handled by css classes in draw loop)
  const observer = new MutationObserver(() => {
    // Just ensures the loop keeps running with correct colors
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  resize();
  initStars();
  animate();
}








// Function to generate specific report
async function generateReport(type) {
  if (!currentNotebookId) return alert("Open a Space first.");

  // UI: Show Loading, Hide Grid
  document.getElementById("report-selection-grid").classList.add("hidden");
  document.getElementById("report-loading").classList.remove("hidden");
  document.getElementById("loading-text").innerText = "Generating " + type.replace('_', ' ') + "...";

  try {
    const response = await fetch("/api/report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebook_id: currentNotebookId, report_type: type })
    });

    const data = await response.json();

    // Render the Dynamic Content
    const container = document.getElementById("generated-report-content");
    let html = `
            <div class="report-block highlight-block">
                <h2 style="font-size:20px; color:var(--text-primary); margin-bottom:10px;">${data.title}</h2>
                <div class="stats-grid-compact">`;

    // Render Metrics dynamically
    if (data.metrics) {
      for (const [key, value] of Object.entries(data.metrics)) {
        html += `
                <div class="stat-box">
                    <span class="stat-label">${key}</span>
                    <div class="stat-value-text">${value}</div>
                </div>`;
      }
    }

    html += `</div></div>`; // Close stats div

    // Render Sections
    data.sections.forEach(section => {
      html += `
            <div class="report-block">
                <h5 class="block-title">${section.heading.toUpperCase()}</h5>
                <div class="synthesis-text" style="white-space: pre-line;">${section.content}</div>
            </div>`;
    });

    container.innerHTML = html;

    // UI: Show Result
    document.getElementById("report-loading").classList.add("hidden");
    document.getElementById("report-result-area").classList.remove("hidden");
    document.getElementById("back-to-formats-btn").classList.remove("hidden");

  } catch (e) {
    console.error(e);
    alert("Failed to generate report.");
    showReportFormats();
  }
}

function openReportCreationModal(event) {
  if (event) event.stopPropagation(); // Stop any other listeners
  if (!currentNotebookId) {
    alert("Please open a Space first.");
    return;
  }
  openModal("reportCreationModal");
  // Note: We do NOT call expandToolPanel here.
}
function getSelectedFileNames() {
  return uploadedFiles
    .filter(f => f.selected) // Only check items where .selected is true
    .map(f => f.name);
}
// In script.js

async function startReportGeneration(type) {
  // 1. Get Selected Files (The inputs for the design decision)
  const selectedFiles = uploadedFiles
    .filter(f => f.selected)
    .map(f => f.name);

  if (selectedFiles.length === 0) {
    alert("Please select the source files (maps, surveys, docs) to analyze.");
    return;
  }

  // 2. Get Language
  const languageSelect = document.getElementById("report-language-select");
  const selectedLanguage = languageSelect ? languageSelect.value : "English";

  // 3. Close Popup & Open Panel
  closeModal("reportCreationModal");
  expandToolPanel('reportBoard');

  // 4. UI Loading State
  document.getElementById("report-loading").classList.remove("hidden");
  document.getElementById("report-result-area").classList.add("hidden");

  // --- UPDATED LOADING TEXTS ---
  const texts = {
    executive: "Synthesizing executive brief...",
    design_decision: "Evaluating design options & proposing best route...", // <--- NEW
    roadmap: "Drafting implementation timeline...",
    safety: "Analyzing safety protocols & hazards...",
    budget: "Calculating financial estimates...",
    citizen_impact: "Assessing public impact..."
  };

  const statusMsg = texts[type] || "Analyzing documents...";
  const langMsg = selectedLanguage === "English" ? "" : ` in ${selectedLanguage}`;
  document.getElementById("loading-text").innerText = `${statusMsg} ${langMsg}`;

  try {
    const response = await fetch("/api/report/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notebook_id: currentNotebookId,
        report_type: type,
        language: selectedLanguage,
        selected_files: selectedFiles
      })
    });

    if (!response.ok) throw new Error("Analysis failed");
    const data = await response.json();
    renderReportResult(data);

  } catch (e) {
    console.error(e);
    document.getElementById("report-loading").innerHTML = "<p style='color:red; text-align:center;'>Failed to generate report.</p>";
  }
}
// --- 1. HELPER: Generate Full Text for Sharing/Copying ---
function generateFullReportText(data) {
  if (!data) return "";

  let text = `📄 *${data.title}*\n\n`;

  // Metrics Line
  if (data.metrics) {
    text += Object.entries(data.metrics)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
    text += "\n\n";
  }

  // Sections (Summary, etc.)
  if (data.sections) {
    data.sections.forEach(sec => {
      // Convert HTML breaks to newlines if necessary, or just use content
      text += `🔹 *${sec.heading.toUpperCase()}*\n${sec.content}\n\n`;
    });
  }

  // Control Center Lists (Actions, Deadlines, Risks)
  const cc = data.control_center_data;
  if (cc) {
    if (cc.deadlines && cc.deadlines.length > 0) {
      text += `📅 *DEADLINES:*\n`;
      text += cc.deadlines.map(d => `• ${d.task} (${d.date})`).join('\n') + "\n\n";
    }

    if (cc.risks && cc.risks.length > 0) {
      text += `🚨 *RISKS & ALERTS:*\n`;
      text += cc.risks.map(r => `! ${r}`).join('\n') + "\n";
      if (cc.missing_info && cc.missing_info.length > 0) {
        text += cc.missing_info.map(m => `? ${m}`).join('\n') + "\n";
      }
      text += "\n";
    }

    if (cc.action_items && cc.action_items.length > 0) {
      text += `✅ *ACTION ITEMS:*\n`;
      text += cc.action_items.map(a => `[ ] ${a}`).join('\n') + "\n\n";
    }
  }

  text += `_Generated by Sarthi Astra_`;
  return text;
}

// --- 2. RENDER FUNCTION (Clean Design + Footer Buttons) ---
let currentReportData = null; // Global store

function renderReportResult(data) {
  currentReportData = data;
  const container = document.getElementById("generated-report-content");
  if (!container) return;

  // A. Clean Header (Title + Inline Metrics)
  let html = `
        <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; font-family: var(--font-sans);">
                ${data.title || "Intelligence Report"}
            </h2>`;

  // Metrics as simple text line (No boxes)
  if (data.metrics) {
    let metricText = [];
    for (const [key, value] of Object.entries(data.metrics)) {
      // Highlight 'High' or 'Critical' in red
      let valColor = "var(--text-primary)";
      if (String(value).toLowerCase().includes("high") || String(value).toLowerCase().includes("critical")) {
        valColor = "#ef4444";
      }
      metricText.push(`<span style="color:var(--text-secondary); font-size:12px;">${key}: <strong style="color:${valColor}">${value}</strong></span>`);
    }

    html += `
            <div style="display:flex; flex-wrap:wrap; gap:15px; align-items:center;">
                ${metricText.join('<span style="color:var(--border-color)">|</span>')}
            </div>
        </div>`;
  }

  // B. Report Body (Clean Text)
  if (data.sections) {
    data.sections.forEach(section => {
      let content = typeof marked !== 'undefined' ? marked.parse(section.content) : section.content;
      html += `
            <div style="margin-bottom: 20px;">
                <h4 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing:0.5px;">
                    ${section.heading}
                </h4>
                <div class="synthesis-text" style="font-size: 14px; line-height: 1.6; color: var(--text-primary);">
                    ${content}
                </div> 
            </div>`;
    });
  }

  // C. Control Center Grid (Actions/Risks - Kept as clean lists)
  if (data.control_center_data) {
    const cc = data.control_center_data;

    // Deadlines
    if (cc.deadlines && cc.deadlines.length > 0) {
      html += `<div style="margin-top:20px; margin-bottom:20px;">
                <h4 style="color:#f59e0b; font-size:13px; font-weight:700; text-transform:uppercase; margin-bottom:10px;">
                    <i class="fas fa-clock"></i> Critical Deadlines
                </h4>
                <ul style="list-style:none; padding:0; margin:0;">
                    ${cc.deadlines.map(d => `
                        <li style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed var(--border-color); font-size:14px; color:var(--text-primary);">
                            <span>${d.task}</span>
                            <span style="font-family:monospace; font-weight:600;">${d.date}</span>
                        </li>`).join('')}
                </ul>
            </div>`;
    }

    // Risks
    if (cc.risks && cc.risks.length > 0) {
      html += `<div style="margin-bottom:20px;">
                <h4 style="color:#ef4444; font-size:13px; font-weight:700; text-transform:uppercase; margin-bottom:10px;">
                    <i class="fas fa-exclamation-triangle"></i> Attention Required
                </h4>
                <div style="background:rgba(239, 68, 68, 0.05); border-left:3px solid #ef4444; padding:10px; border-radius:4px;">
                    ${cc.risks.map(r => `<div style="font-size:13px; color:#b91c1c; margin-bottom:6px;">• ${r}</div>`).join('')}
                </div>
            </div>`;
    }

    // Actions
    if (cc.action_items && cc.action_items.length > 0) {
      html += `<div style="margin-bottom:20px;">
                <h4 style="color:var(--text-secondary); font-size:13px; font-weight:700; text-transform:uppercase; margin-bottom:10px;">
                    <i class="fas fa-check-circle"></i> Action Items
                </h4>
                <div>
                    ${cc.action_items.map(a => `
                        <div style="display:flex; align-items:flex-start; gap:10px; padding:6px 0; font-size:14px; color:var(--text-primary);">
                            <input type="checkbox" style="margin-top:4px;">
                            <span>${a}</span>
                        </div>`).join('')}
                </div>
            </div>`;
    }
  }

  // D. Footer Actions (Buttons at Bottom)
  html += `
        <div class="report-actions-footer">
            <button class="secondary-action-btn" onclick="copyReport()">
                <i class="far fa-copy"></i> Copy Text
            </button>
            <button class="upload-btn" onclick="openReportSharePopup()" style="padding: 8px 25px;">
                <i class="fas fa-share-alt"></i> Share Report
            </button>
        </div>
    `;

  container.innerHTML = html;

  document.getElementById("report-loading")?.classList.add("hidden");
  document.getElementById("report-result-area")?.classList.remove("hidden");
  const statusText = document.getElementById("report-status-text");
  if (statusText) statusText.innerText = "Complete";
}

// --- 3. ACTIONS ---

function copyReport() {
  if (!currentReportData) return;
  const fullText = generateFullReportText(currentReportData);
  navigator.clipboard.writeText(fullText).then(() => {
    // Optional: Tooltip/Toast feedback could go here
    alert("Full report copied to clipboard!");
  });
}

function sendReportToUser(userId, userName) {
  if (!currentReportData || !doc_socket) return;

  // Generate the FULL text using the helper
  const fullMessage = generateFullReportText(currentReportData);

  doc_socket.send(JSON.stringify({
    type: "chat_message",
    to: userId,
    content: fullMessage
  }));

  alert(`Report sent to ${userName}`);
  closeModal("reportShareModal");
}

// --- Helper: Render Top Metrics ---
function renderMetrics(metrics) {
  if (!metrics) return "";
  return Object.entries(metrics).map(([k, v]) => {
    let color = "var(--text-secondary)";
    if (v.toString().includes("High")) color = "#ef4444";
    return `<span style="margin-right:15px; font-size:12px; color:${color}"><strong>${k}:</strong> ${v}</span>`;
  }).join("");
}

// --- ACTION: COPY REPORT ---


// --- ACTION: SHARE REPORT (Popup Logic) ---
async function openReportSharePopup() {
  const modal = document.getElementById("reportShareModal");
  const list = document.getElementById("report-share-list");
  modal.classList.remove("hidden");
  list.innerHTML = '<p style="padding:10px;">Loading friends...</p>';

  // Fetch friends list (using your existing API)
  try {
    const response = await fetch("/api/friends/list");
    const friends = await response.json();

    list.innerHTML = "";
    friends.forEach(friend => {
      const item = document.createElement("div");
      item.className = "friend-item";
      item.innerHTML = `
                <img src="${friend.picture_url}" style="width:30px; height:30px; border-radius:50%; margin-right:10px;">
                <div style="flex:1; font-size:14px;">${friend.name}</div>
                <button class="secondary-action-btn" style="padding:4px 10px; font-size:11px;">Send</button>
            `;
      // Add click event to SEND the report
      item.querySelector("button").onclick = () => sendReportToUser(friend.google_id, friend.name);
      list.appendChild(item);
    });
  } catch (e) {
    list.innerHTML = "<p>Error loading friends.</p>";
  }
}



// 3. NEW: IntelliAlert Logic
async function loadIntelliAlert() {
  const container = document.getElementById("intelliAlertView");
  if (!container) return;

  container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-satellite-dish fa-spin"></i>
            <p>Scanning for deadlines & risks...</p>
        </div>`;

  const selectedFiles = getSelectedFileNames();
  if (selectedFiles.length === 0) {
    container.innerHTML = "<p style='padding:20px; text-align:center;'>Please select files to scan.</p>";
    return;
  }

  try {
    const response = await fetch("/api/intellialert/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notebook_id: currentNotebookId,
        selected_files: selectedFiles
      })
    });

    const data = await response.json();
    renderIntelliAlerts(data.alerts);

  } catch (e) {
    container.innerHTML = "<p style='color:red; text-align:center;'>Scan failed.</p>";
  }
}

function renderIntelliAlerts(alerts) {
  const container = document.getElementById("intelliAlertView");
  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-secondary);">
                <i class="fas fa-check-circle" style="font-size:32px; color:#10b981; margin-bottom:10px;"></i>
                <p>No critical deadlines or risks found.</p>
            </div>`;
    return;
  }

  let html = `<div class="alert-feed">`;

  alerts.forEach(alert => {
    let icon = "fa-info-circle";
    let colorClass = "info";

    if (alert.type === "deadline") { icon = "fa-hourglass-half"; colorClass = "warning"; }
    if (alert.type === "warning" || alert.severity === "high") { icon = "fa-exclamation-triangle"; colorClass = "danger"; }
    if (alert.type === "financial") { icon = "fa-coins"; colorClass = "financial"; }

    html += `
            <div class="alert-card ${colorClass}">
                <div class="alert-icon"><i class="fas ${icon}"></i></div>
                <div class="alert-content">
                    <div class="alert-header">
                        <span class="alert-title">${alert.title}</span>
                        ${alert.date ? `<span class="alert-date">${alert.date}</span>` : ''}
                    </div>
                    <div class="alert-desc">${alert.description}</div>
                </div>
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// =================================================================
// QUICK NOTES MANAGEMENT (Using localStorage for persistence)
// =================================================================
const NOTES_STORAGE_KEY = 'quickNotesList';

// Helper to load notes from local storage
function loadNotes() {
  try {
    const notes = localStorage.getItem(NOTES_STORAGE_KEY);
    return notes ? JSON.parse(notes) : [];
  } catch (e) {
    console.error("Error loading notes from storage:", e);
    return [];
  }
}

// Helper to save notes to local storage
function saveNotes(notes) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

// 1. Render the List of Notes (The "See Notes" feature)
function renderNotes() {
  const container = document.getElementById('notes-list-container');
  const emptyState = document.getElementById('notesEmptyState');
  const notes = loadNotes();

  container.innerHTML = '';

  if (notes.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Render notes (newest first)
  notes.slice().reverse().forEach((note, index) => {
    // We use the original index for deletion, not the reversed index
    const originalIndex = notes.length - 1 - index;

    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';

    // Format date and time
    const date = new Date(note.timestamp);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    noteCard.innerHTML = `
            <div class="note-content">${note.content.trim()}</div>
            <div class="note-meta">
                <span>${formattedDate}</span>
                <button class="note-actions-btn" onclick="deleteNote(${originalIndex})" title="Delete Note">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    container.appendChild(noteCard);
  });
}

// 2. Toggle View (Switches between Add/View)
function toggleNotesView(showAddView = true) {
  const addView = document.getElementById('addNoteView');
  const listView = document.getElementById('notesListView');
  const toggleBtn = document.getElementById('toggleNotesViewBtn');
  const title = document.getElementById('quickNotesView').querySelector('.studio-title');

  if (showAddView) {
    // Show Add View
    addView.classList.remove('hidden');
    listView.classList.add('hidden');
    toggleBtn.innerHTML = '<i class="fas fa-list-ul"></i>';
    toggleBtn.title = 'View Notes';
    title.textContent = 'Add Note';
  } else {
    // Show List View
    addView.classList.add('hidden');
    listView.classList.remove('hidden');
    toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
    toggleBtn.title = 'Add Note';
    title.textContent = 'Quick Notes';
    renderNotes(); // Refresh list when switching to view mode
  }
}

// 3. Save Note (The "Add Note" feature)
function saveNote() {
  const textarea = document.getElementById('noteTextarea');
  const content = textarea.value.trim();

  if (!content) {
    alert("Note content cannot be empty.");
    return;
  }

  const notes = loadNotes();
  const newNote = {
    content: content,
    timestamp: new Date().toISOString()
  };

  notes.push(newNote);
  saveNotes(notes);

  textarea.value = ''; // Clear textarea

  // Switch back to list view after saving
  toggleNotesView(false);
}

// 4. Delete Note
function deleteNote(index) {
  if (confirm("Are you sure you want to delete this note?")) {
    const notes = loadNotes();
    notes.splice(index, 1); // Remove note at index
    saveNotes(notes);
    renderNotes(); // Re-render the list
  }
}