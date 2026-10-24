const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];

function showPanel(id) {
  const activeId = panels.some((panel) => panel.id === id) ? id : "spec";
  for (const panel of panels) panel.hidden = panel.id !== activeId;
  for (const tab of tabs) {
    const selected = tab.getAttribute("aria-controls") === activeId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
}

function selectTab(tab) {
  const id = tab.getAttribute("aria-controls");
  showPanel(id);
  // Preserve back/forward navigation without jumping past the tab controls.
  if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
  tab.focus({ preventScroll: true });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectTab(tab);
  });
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (event.key === " ") next = index;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next]);
  });
});

const followHash = () => showPanel(location.hash.slice(1));
window.addEventListener("hashchange", followHash);
window.addEventListener("popstate", followHash);
followHash();
