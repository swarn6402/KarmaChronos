chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "src/index.html" });
});
