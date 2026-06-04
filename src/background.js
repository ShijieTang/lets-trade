const GET_BOOKMARK_FOLDERS = "CRM_WORKBENCH_GET_BOOKMARK_FOLDERS";
const GET_BOOKMARK_LINKS = "CRM_WORKBENCH_GET_BOOKMARK_LINKS";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === GET_BOOKMARK_FOLDERS) {
    getBookmarkFolders()
      .then((folders) => sendResponse({ ok: true, folders }))
      .catch((error) => sendResponse({ ok: false, error: getErrorMessage(error) }));
    return true;
  }

  if (message.type === GET_BOOKMARK_LINKS) {
    getBookmarkLinks(message.folderId)
      .then((links) => sendResponse({ ok: true, links }))
      .catch((error) => sendResponse({ ok: false, error: getErrorMessage(error) }));
    return true;
  }

  return false;
});

async function getBookmarkFolders() {
  const tree = await chrome.bookmarks.getTree();
  const folders = [];

  walkBookmarkNodes(tree, (node, path) => {
    if (node.id !== "0" && Array.isArray(node.children)) {
      folders.push({
        id: node.id,
        title: node.title || "Bookmarks",
        path: path.concat(node.title || "Bookmarks").filter(Boolean).join(" / ")
      });
    }
  });

  return folders;
}

async function getBookmarkLinks(folderId) {
  if (!folderId) {
    return [];
  }

  const [folder] = await chrome.bookmarks.getSubTree(String(folderId));
  if (!folder) {
    return [];
  }

  const links = [];
  walkBookmarkNodes([folder], (node) => {
    if (node.url) {
      links.push({
        title: node.title || node.url,
        url: node.url
      });
    }
  });

  return links;
}

function walkBookmarkNodes(nodes, visitor, path = []) {
  for (const node of nodes || []) {
    visitor(node, path);
    if (Array.isArray(node.children)) {
      walkBookmarkNodes(node.children, visitor, path.concat(node.title || ""));
    }
  }
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error || "Unknown bookmark error");
}
