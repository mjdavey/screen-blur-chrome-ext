document.addEventListener("DOMContentLoaded", function () {
  const offButton = document.getElementById("offMode");
  const onButton = document.getElementById("onMode");
  const editButton = document.getElementById("editMode");
  const statusMessage = document.getElementById("statusMessage");
  const allButtons = [offButton, onButton, editButton];

  function updateUI(mode, message = "") {
    allButtons.forEach((button) => button.classList.remove("active"));
    document.getElementById(`${mode}Mode`).classList.add("active");
    statusMessage.textContent = message;
  }

  function setMode(mode) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];

      if (
        activeTab.url.startsWith("chrome://") ||
        activeTab.url.startsWith("chrome-extension://")
      ) {
        updateUI("off", "Blur mode cannot be used on this page.");
        return;
      }

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ["content.js"],
        },
        function () {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            updateUI("off", "Cannot use blur mode on this page.");
          } else {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "setMode",
              mode: mode,
            });
            updateUI(mode);
          }
        }
      );
    });
  }

  offButton.addEventListener("click", () => setMode("off"));
  onButton.addEventListener("click", () => setMode("on"));
  editButton.addEventListener("click", () => setMode("edit"));

  // Set initial state
  chrome.storage.local.get("blurMode", function (data) {
    if (data.blurMode) {
      updateUI(data.blurMode);
    } else {
      updateUI("off");
    }
  });
});
