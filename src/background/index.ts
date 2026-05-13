chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("bookmark-manager-daily-backup", {
    periodInMinutes: 60 * 24
  });
});

