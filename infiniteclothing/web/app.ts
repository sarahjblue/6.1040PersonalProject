type Item = {
  id?: number;
  name: string;
  description?: string;
  price?: string;
  image: string;
  seller: string;
  status?: "AVAILABLE" | "CLAIMED" | "COMPLETED";
  buyer?: string;
  tags?: TagDefinition[];
};

type TagDefinition = {
  tag: string;
  category: string;
  label: string;
};

type Conversation = {
  conversation: number;
  topic: string;
  initiator: string;
  recipient: string;
  closedAt?: number;
  lastMessageAt: number;
  unreadCount: number;
};

type Message = {
  message: number;
  sender: string;
  content: string;
  sentAt: number;
  readStatus: "UNREAD" | "READ";
};

type AuthUser = {
  username: string;
  email: string;
};

type AuthSession = {
  id: string;
  user: AuthUser;
};

const authPanel = document.querySelector<HTMLElement>("#auth-panel");
const authStatus = document.querySelector<HTMLParagraphElement>("#auth-status");
const authenticatedApp =
  document.querySelector<HTMLDivElement>("#authenticated-app");
const signedInUser =
  document.querySelector<HTMLElement>("#signed-in-user");
const loginForm = document.querySelector<HTMLFormElement>("#login-form");
const registerForm = document.querySelector<HTMLFormElement>("#register-form");
const logoutButton =
  document.querySelector<HTMLButtonElement>("#logout-button");
const addItemLauncher =
  document.querySelector<HTMLButtonElement>("#add-item-launcher");
const addItemPanel =
  document.querySelector<HTMLElement>("#add-item-panel");
const closeAddItemButton =
  document.querySelector<HTMLButtonElement>("#close-add-item");
const sellerInput =
  document.querySelector<HTMLInputElement>('#item-form input[name="seller"]');
const form = document.querySelector<HTMLFormElement>("#item-form");
const statusMessage = document.querySelector<HTMLParagraphElement>("#status");
const inventoryContainer = document.querySelector<HTMLDivElement>("#inventory");
const currentUserInput = document.querySelector<HTMLInputElement>("#current-user");
const sizeTagSelect = document.querySelector<HTMLSelectElement>("#size-tag");
const colorTagSelect = document.querySelector<HTMLSelectElement>("#color-tag");
const sizeFilterSelect =
  document.querySelector<HTMLSelectElement>("#filter-size-tag");
const colorFilterSelect =
  document.querySelector<HTMLSelectElement>("#filter-color-tag");
const applyTagFilterButton =
  document.querySelector<HTMLButtonElement>("#apply-tag-filter");
const clearTagFilterButton =
  document.querySelector<HTMLButtonElement>("#clear-tag-filter");
const itemImageInput =
  document.querySelector<HTMLInputElement>('#item-form input[name="image"]');
const startConversationForm =
  document.querySelector<HTMLFormElement>("#start-conversation-form");
const messageRecipientInput =
  document.querySelector<HTMLInputElement>("#message-recipient");
const messageTopicInput =
  document.querySelector<HTMLInputElement>("#message-topic");
const initialMessageInput =
  document.querySelector<HTMLTextAreaElement>("#initial-message");
const conversationList =
  document.querySelector<HTMLDivElement>("#conversation-list");
const threadTitle = document.querySelector<HTMLHeadingElement>("#thread-title");
const messageList = document.querySelector<HTMLDivElement>("#message-list");
const sendMessageForm =
  document.querySelector<HTMLFormElement>("#send-message-form");
const replyContentInput =
  document.querySelector<HTMLTextAreaElement>("#reply-content");
const sendMessageButton =
  document.querySelector<HTMLButtonElement>("#send-message-button");
const messagesLauncher =
  document.querySelector<HTMLButtonElement>("#messages-launcher");
const unreadMessageBadge =
  document.querySelector<HTMLSpanElement>("#unread-message-badge");
const messagesPanel =
  document.querySelector<HTMLElement>("#messages-panel");
const closeMessagesButton =
  document.querySelector<HTMLButtonElement>("#close-messages");
const refreshMessagesButton =
  document.querySelector<HTMLButtonElement>("#refresh-messages");

if (
  !authPanel ||
  !authStatus ||
  !authenticatedApp ||
  !signedInUser ||
  !loginForm ||
  !registerForm ||
  !logoutButton ||
  !addItemLauncher ||
  !addItemPanel ||
  !closeAddItemButton ||
  !sellerInput ||
  !form ||
  !statusMessage ||
  !inventoryContainer ||
  !currentUserInput ||
  !sizeTagSelect ||
  !colorTagSelect ||
  !sizeFilterSelect ||
  !colorFilterSelect ||
  !applyTagFilterButton ||
  !clearTagFilterButton ||
  !itemImageInput ||
  !startConversationForm ||
  !messageRecipientInput ||
  !messageTopicInput ||
  !initialMessageInput ||
  !conversationList ||
  !threadTitle ||
  !messageList ||
  !sendMessageForm ||
  !replyContentInput ||
  !sendMessageButton ||
  !messagesLauncher ||
  !unreadMessageBadge ||
  !messagesPanel ||
  !closeMessagesButton ||
  !refreshMessagesButton
) {
  throw new Error("Missing frontend elements. Check the IDs in index.html.");
}

const items: Item[] = [];
const SESSION_STORAGE_KEY = "infinite-clothing-session";
const MESSAGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const CONVERSATION_REFRESH_MS = 60 * 1000;
let tagDefinitions: TagDefinition[] = [];
let visibleItemIds: Set<number> | undefined;
let conversations: Conversation[] = [];
let selectedConversation: Conversation | undefined;
let conversationExpiryTimer: number | undefined;
let conversationRefreshTimer: number | undefined;

function setMessagesOpen(open: boolean) {
  if (
    !messagesPanel ||
    !messagesLauncher ||
    !messageRecipientInput ||
    !replyContentInput
  ) {
    return;
  }

  messagesPanel.hidden = !open;
  messagesLauncher.setAttribute("aria-expanded", String(open));
  if (open) {
    if (selectedConversation) {
      replyContentInput.focus();
    } else {
      messageRecipientInput.focus();
    }
  } else {
    messagesLauncher.focus();
  }
}

function extractAuthUser(data: unknown): AuthUser | undefined {
  if (!data || typeof data !== "object") return undefined;
  const value = data as Record<string, unknown>;
  if (
    typeof value.username === "string" &&
    typeof value.email === "string"
  ) {
    return { username: value.username, email: value.email };
  }

  for (const key of ["user", "result", "users"]) {
    const found = extractAuthUser(value[key]);
    if (found) return found;
  }
  if (Array.isArray(data)) {
    for (const entry of data) {
      const found = extractAuthUser(entry);
      if (found) return found;
    }
  }
  return undefined;
}

function extractAuthSession(data: unknown): AuthSession | undefined {
  if (!data || typeof data !== "object") return undefined;
  const value = data as Record<string, unknown>;
  if (typeof value.id === "string") {
    const user = extractAuthUser(value.user);
    return user ? { id: value.id, user } : undefined;
  }
  return extractAuthSession(value.session) ?? extractAuthSession(value.result);
}

function setAuthenticatedUser(session: AuthSession) {
  if (
    !currentUserInput ||
    !sellerInput ||
    !signedInUser ||
    !authPanel ||
    !authenticatedApp
  ) {
    throw new Error("Missing account controls.");
  }
  currentUserInput.value = session.user.username;
  sellerInput.value = session.user.username;
  signedInUser.textContent = session.user.username;
  authPanel.hidden = true;
  authenticatedApp.hidden = false;
}

function setAddItemOpen(open: boolean) {
  if (!addItemPanel || !addItemLauncher || !form) {
    throw new Error("Missing add item controls.");
  }
  addItemPanel.hidden = !open;
  addItemLauncher.setAttribute("aria-expanded", String(open));
  if (open) {
    form.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  } else {
    addItemLauncher.focus();
  }
}

function clearAuthenticatedUser() {
  if (
    !currentUserInput ||
    !sellerInput ||
    !signedInUser ||
    !messagesPanel ||
    !messagesLauncher ||
    !conversationList ||
    !messageList ||
    !threadTitle ||
    !sendMessageButton ||
    !replyContentInput ||
    !addItemPanel ||
    !addItemLauncher ||
    !authenticatedApp ||
    !authPanel
  ) {
    throw new Error("Missing account controls.");
  }
  selectedConversation = undefined;
  conversations = [];
  if (conversationExpiryTimer !== undefined) {
    window.clearTimeout(conversationExpiryTimer);
    conversationExpiryTimer = undefined;
  }
  if (conversationRefreshTimer !== undefined) {
    window.clearInterval(conversationRefreshTimer);
    conversationRefreshTimer = undefined;
  }
  updateUnreadMessageBadge();
  items.length = 0;
  conversationList.replaceChildren();
  messageList.replaceChildren();
  threadTitle.textContent = "Select a conversation";
  sendMessageButton.disabled = true;
  replyContentInput.value = "";
  replyContentInput.disabled = true;
  currentUserInput.value = "";
  sellerInput.value = "";
  signedInUser.textContent = "";
  messagesPanel.hidden = true;
  messagesLauncher.setAttribute("aria-expanded", "false");
  addItemPanel.hidden = true;
  addItemLauncher.setAttribute("aria-expanded", "false");
  authenticatedApp.hidden = true;
  authPanel.hidden = false;
  renderInventory();
}

async function authError(response: Response): Promise<string> {
  const detail = await readError(response);
  switch (response.status) {
    case 400:
      return "Use a valid MIT email address ending in @mit.edu.";
    case 401:
      return "The username or password is incorrect.";
    case 403:
      return "Sign-in was not allowed.";
    case 409:
      return "That username or email is already in use.";
    default:
      return detail;
  }
}

async function loadAuthenticatedData() {
  await loadTagDefinitions();
  await fetchInventory();
  await loadConversations();
  if (conversationRefreshTimer !== undefined) {
    window.clearInterval(conversationRefreshTimer);
  }
  conversationRefreshTimer = window.setInterval(() => {
    if (
      authenticatedApp &&
      !authenticatedApp.hidden &&
      document.visibilityState === "visible"
    ) {
      void loadConversations();
    }
  }, CONVERSATION_REFRESH_MS);
}

async function restoreSession() {
  if (!authStatus) return;
  let stored: string | null;
  try {
    stored = localStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    authStatus.textContent =
      error instanceof Error
        ? `Could not access saved sign-in: ${error.message}`
        : "Could not access saved sign-in.";
    return;
  }
  if (!stored) return;

  let session: AuthSession | undefined;
  try {
    session = extractAuthSession(JSON.parse(stored));
  } catch {
    session = undefined;
  }
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    authStatus.textContent = "Your saved sign-in was invalid. Please sign in.";
    return;
  }

  try {
    const response = await fetch("/api/sessioning/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    if (!response.ok) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      authStatus.textContent = "Your session expired. Please sign in again.";
      return;
    }
    const user = extractAuthUser(await response.json());
    if (
      !user ||
      user.username !== session.user.username ||
      user.email !== session.user.email
    ) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      authStatus.textContent = "Your saved sign-in was invalid. Please sign in.";
      return;
    }

    setAuthenticatedUser({ id: session.id, user });
    authStatus.textContent = "";
    void loadAuthenticatedData().catch((error: unknown) => {
      if (statusMessage) {
        statusMessage.textContent =
          error instanceof Error
            ? error.message
            : "Could not load the marketplace.";
      }
    });
  } catch (error) {
    authStatus.textContent =
      error instanceof Error
        ? `Could not restore your session: ${error.message}`
        : "Could not restore your session.";
  }
}

function getRows(data: unknown): unknown[] | undefined {
  if (!data || typeof data !== "object") return undefined;

  const value = data as Record<string, unknown>;

  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.tags)) return value.tags;
  if (Array.isArray(value.conversations)) return value.conversations;
  if (Array.isArray(value.messages)) return value.messages;
  if (Array.isArray(value.result)) return value.result;

  return (
    getRows(value.result) ??
    getRows(value.inventory) ??
    getRows(value.tags) ??
    getRows(value.data)
  );
}

function extractTags(data: unknown): TagDefinition[] | undefined {
  const rows = getRows(data);
  if (!rows) return undefined;

  return rows.map((value) => {
    if (!value || typeof value !== "object") {
      throw new Error("Unexpected tag response.");
    }
    const row = value as Record<string, unknown>;
    if (
      typeof row.tag !== "string" ||
      typeof row.category !== "string" ||
      typeof row.label !== "string"
    ) {
      throw new Error("Unexpected tag response.");
    }
    return { tag: row.tag, category: row.category, label: row.label };
  });
}

function extractConversations(data: unknown): Conversation[] | undefined {
  const rows = getRows(data);
  if (!rows) return undefined;

  const loaded: Conversation[] = [];
  for (const value of rows) {
    if (!value || typeof value !== "object") return undefined;
    const row = value as Record<string, unknown>;
    const id = Number(row.conversation);
    if (
      !Number.isFinite(id) ||
      typeof row.topic !== "string" ||
      typeof row.initiator !== "string" ||
      typeof row.recipient !== "string"
    ) {
      return undefined;
    }
    loaded.push({
      conversation: id,
      topic: row.topic,
      initiator: row.initiator,
      recipient: row.recipient,
      closedAt:
        typeof row.closedAt === "number" ? row.closedAt : undefined,
      lastMessageAt: 0,
      unreadCount: 0,
    });
  }
  return loaded;
}

function extractMessages(data: unknown): Message[] | undefined {
  const rows = getRows(data);
  if (!rows) return undefined;

  const loaded: Message[] = [];
  for (const value of rows) {
    if (!value || typeof value !== "object") return undefined;
    const row = value as Record<string, unknown>;
    const id = Number(row.message);
    if (
      !Number.isFinite(id) ||
      typeof row.sender !== "string" ||
      typeof row.content !== "string" ||
      typeof row.sentAt !== "number" ||
      (row.readStatus !== "READ" && row.readStatus !== "UNREAD")
    ) {
      return undefined;
    }
    loaded.push({
      message: id,
      sender: row.sender,
      content: row.content,
      sentAt: row.sentAt,
      readStatus: row.readStatus,
    });
  }
  return loaded;
}

function extractItems(data: unknown): Item[] | undefined {
  const rows = getRows(data);
  if (!rows) return undefined;

  return rows.map((value) => {
    const row = value as Record<string, unknown>;
    const nested =
      row.item && typeof row.item === "object"
        ? (row.item as Record<string, unknown>)
        : {};

    return {
      id: Number(nested.id ?? row.id),
      name: String(row.name ?? nested.name ?? ""),
      description: (row.description ?? nested.description) as string | undefined,
      price: (row.price ?? nested.price) as string | undefined,
      image: String(row.image ?? nested.image ?? ""),
      seller: String(row.seller ?? nested.seller ?? ""),
      status: (row.status ?? nested.status) as Item["status"],
      buyer: (row.buyer ?? nested.buyer) as string | undefined,
    };
  });
}

function setTagSelectOptions(
  select: HTMLSelectElement,
  category: string,
  placeholder: string,
) {
  select.replaceChildren(new Option(placeholder, ""));
  for (const tag of tagDefinitions.filter((definition) => definition.category === category)) {
    select.add(new Option(tag.label, tag.tag));
  }
}

async function loadTagDefinitions() {
  if (
    !sizeTagSelect ||
    !colorTagSelect ||
    !sizeFilterSelect ||
    !colorFilterSelect
  ) {
    throw new Error("Missing tag controls. Check the IDs in index.html.");
  }

  const response = await fetch("/api/tagging/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new Error(await readError(response));

  const loadedTags = extractTags(await response.json());
  if (!loadedTags) throw new Error("Unexpected predefined-tags response.");

  tagDefinitions = loadedTags;
  setTagSelectOptions(sizeTagSelect, "size", "No size");
  setTagSelectOptions(colorTagSelect, "color", "No color");
  setTagSelectOptions(sizeFilterSelect, "size", "Any size");
  setTagSelectOptions(colorFilterSelect, "color", "Any color");
}

function renderInventory() {
    if(inventoryContainer === null){
        return {};
    }
  if (
    !messageRecipientInput ||
    !messageTopicInput ||
    !initialMessageInput ||
    !startConversationForm
  ) {
    return;
  }
  inventoryContainer.replaceChildren();
  if(currentUserInput === null){
    return {};
  }
  const currentUser = currentUserInput.value.trim();

  for (const item of items) {
    if (
      visibleItemIds &&
      (item.id === undefined || !visibleItemIds.has(item.id))
    ) {
      continue;
    }

    const card = document.createElement("article");
    card.className = "card";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;

    const title = document.createElement("h3");
    title.textContent = item.name;

    const details = document.createElement("p");
    details.textContent = `Seller: ${item.seller} · Price: ${item.price ?? "Not listed"}`;
    const cardHeader: HTMLElement[] = [image, title, details];
    if (
      item.status === "CLAIMED" &&
      item.seller === currentUser &&
      item.buyer
    ) {
      const claimDetails = document.createElement("p");
      claimDetails.className = "claim-details";
      claimDetails.textContent = `Claimed by: ${item.buyer}`;
      cardHeader.push(claimDetails);
    }

    const description = document.createElement("p");
    description.textContent = item.description ?? "";

    const tagsList = document.createElement("div");
    tagsList.className = "tags-list";
    for (const tag of item.tags ?? []) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = `${tag.category}: ${tag.label}`;
      tagsList.appendChild(chip);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const isCurrentSeller =
      currentUser !== "" && item.seller === currentUser;
    const claimButton = document.createElement("button");
    claimButton.type = "button";
    claimButton.textContent = "Claim item";
    const canClaim =
      currentUser !== "" &&
      !isCurrentSeller &&
      item.status === "AVAILABLE" &&
      item.id !== undefined;
    claimButton.hidden = !canClaim;
    const isClaimedByCurrentUser =
      currentUser !== "" &&
      item.status === "CLAIMED" &&
      item.buyer === currentUser;
    const isClaimedByCurrentSeller =
      isCurrentSeller && item.status === "CLAIMED";
    claimButton.addEventListener("click", () => void claimItem(item, claimButton));

    const messageSellerButton = document.createElement("button");
    messageSellerButton.type = "button";
    messageSellerButton.textContent = "Message seller";
    messageSellerButton.hidden =
      !currentUser ||
      isCurrentSeller ||
      item.status === "COMPLETED" ||
      item.id === undefined;
    messageSellerButton.addEventListener("click", () =>
      void messageSellerAboutItem(item),
    );

    const releaseButton = document.createElement("button");
    releaseButton.type = "button";
    releaseButton.textContent = "Release claim";
    releaseButton.hidden =
      !isClaimedByCurrentUser || item.id === undefined;
    releaseButton.addEventListener("click", () =>
      void releaseClaim(item, releaseButton),
    );

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.textContent = "Mark completed";
    completeButton.hidden =
      !isClaimedByCurrentSeller || item.id === undefined;
    completeButton.addEventListener("click", () =>
      void completeTransaction(item, completeButton),
    );

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.hidden = !isCurrentSeller || item.id === undefined;
    editButton.addEventListener("click", () => void editItem(item));

    const replaceImageButton = document.createElement("button");
    replaceImageButton.type = "button";
    replaceImageButton.textContent = "Upload new image";
    replaceImageButton.hidden = !isCurrentSeller || item.id === undefined;
    const replaceImageInput = document.createElement("input");
    replaceImageInput.type = "file";
    replaceImageInput.accept = ".jpg,.jpeg,.png,image/jpeg,image/png";
    replaceImageInput.hidden = true;
    replaceImageInput.addEventListener("change", () => {
      const file = replaceImageInput.files?.[0];
      if (file) void replaceItemImage(item, file, replaceImageButton);
      replaceImageInput.value = "";
    });
    replaceImageButton.addEventListener("click", () => replaceImageInput.click());

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.hidden =
      !isCurrentSeller ||
      item.id === undefined ||
      item.status === "COMPLETED";
    deleteButton.addEventListener("click", () => void deleteItem(item, deleteButton));

    const tagEditor = document.createElement("details");
    tagEditor.className = "tag-editor";
    tagEditor.hidden = !isCurrentSeller || item.id === undefined;

    const tagEditorSummary = document.createElement("summary");
    tagEditorSummary.textContent = "Edit tags";
    const tagEditorFields = document.createElement("div");
    tagEditorFields.className = "tags";
    const itemSizeSelect = document.createElement("select");
    const itemColorSelect = document.createElement("select");
    setTagSelectOptions(itemSizeSelect, "size", "No size");
    setTagSelectOptions(itemColorSelect, "color", "No color");
    itemSizeSelect.value =
      item.tags?.find((tag) => tag.category === "size")?.tag ?? "";
    itemColorSelect.value =
      item.tags?.find((tag) => tag.category === "color")?.tag ?? "";
    const saveTagsButton = document.createElement("button");
    saveTagsButton.type = "button";
    saveTagsButton.textContent = "Save tags";
    saveTagsButton.addEventListener("click", () =>
      void saveItemTags(
        item,
        [itemSizeSelect.value, itemColorSelect.value].filter(Boolean),
        saveTagsButton,
      ),
    );
    const clearTagsButton = document.createElement("button");
    clearTagsButton.type = "button";
    clearTagsButton.textContent = "Clear tags";
    clearTagsButton.disabled = !item.tags?.length;
    clearTagsButton.addEventListener("click", () =>
      void clearItemTags(item, clearTagsButton),
    );
    tagEditorFields.append(itemSizeSelect, itemColorSelect);
    tagEditor.append(
      tagEditorSummary,
      tagEditorFields,
      saveTagsButton,
      clearTagsButton,
    );

    actions.append(
      claimButton,
      messageSellerButton,
      releaseButton,
      completeButton,
      editButton,
      replaceImageButton,
      replaceImageInput,
      deleteButton,
    );
    card.append(
      ...cardHeader,
      description,
      tagsList,
      actions,
      tagEditor,
    );
    inventoryContainer.appendChild(card);
  }
}

function extractSearchIds(data: unknown): Set<number> | undefined {
  const rows = getRows(data);
  if (!rows) return undefined;

  const ids = new Set<number>();
  for (const value of rows) {
    const row =
      value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : undefined;
    const id = Number(row?.item ?? value);
    if (Number.isFinite(id)) ids.add(id);
  }
  return ids;
}

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `Request failed (${response.status}).`;

  try {
    const body = JSON.parse(text) as { error?: string; message?: string };
    return body.message ?? body.error ?? text;
  } catch {
    return text;
  }
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

async function readUploadedImage(file: File): Promise<string> {
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Choose a non-empty image that is 5 MB or smaller.");
  }

  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  if (!isPng && !isJpeg) {
    throw new Error("Choose a valid JPEG or PNG image.");
  }
  const imageType = isPng ? "image/png" : "image/jpeg";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read the selected image."));
        return;
      }
      resolve(reader.result.replace(/^data:[^;,]*/, `data:${imageType}`));
    });
    reader.addEventListener("error", () =>
      reject(new Error("Could not read the selected image.")),
    );
    reader.readAsDataURL(new Blob([file], { type: imageType }));
  });
}

async function fetchItemTags(item: Item): Promise<TagDefinition[]> {
  if (item.id === undefined) {
    throw new Error(`Item "${item.name}" has no ID, so its tags cannot be loaded.`);
  }

  const response = await fetch("/api/tagging/itemTags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item: String(item.id) }),
  });
  if (!response.ok) throw new Error(await readError(response));

  const tags = extractTags(await response.json());
  if (!tags) throw new Error("Unexpected item-tags response.");
  return tags;
}

function renderConversations() {
  if (!conversationList || !currentUserInput || !unreadMessageBadge) return;
  conversationList.replaceChildren();
  const user = currentUserInput.value.trim();

  if (!user) {
    conversationList.textContent = "Enter your username to view messages.";
    updateUnreadMessageBadge();
    return;
  }
  if (!conversations.length) {
    conversationList.textContent = "No conversations yet.";
    updateUnreadMessageBadge();
    return;
  }

  for (const conversation of conversations) {
    const button = document.createElement("button");
    button.type = "button";
    const otherUser =
      conversation.initiator === user
        ? conversation.recipient
        : conversation.initiator;
    const itemName = getConversationItemName(conversation);
    const label = document.createElement("span");
    label.textContent = `${otherUser} · ${itemName}${
      conversation.closedAt === undefined ? "" : " · Closed"
    }`;
    button.appendChild(label);
    if (conversation.unreadCount > 0) {
      const badge = document.createElement("span");
      badge.className = "unread-badge";
      badge.textContent = String(conversation.unreadCount);
      badge.setAttribute(
        "aria-label",
        `${conversation.unreadCount} unread message${conversation.unreadCount === 1 ? "" : "s"}`,
      );
      button.appendChild(badge);
    }
    button.setAttribute(
      "aria-current",
      selectedConversation?.conversation === conversation.conversation
        ? "true"
        : "false",
    );
    if (conversation.unreadCount > 0) {
      button.setAttribute(
        "aria-label",
        `${otherUser}, ${itemName}, ${conversation.unreadCount} unread message${conversation.unreadCount === 1 ? "" : "s"}`,
      );
    }
    button.addEventListener("click", () => void openConversation(conversation));
    conversationList.appendChild(button);
  }
  updateUnreadMessageBadge();
}

function getConversationItemName(conversation: Conversation): string {
  const itemId = Number(conversation.topic);
  return (
    items.find((item) => item.id === itemId)?.name ??
    "Item name unavailable"
  );
}

function updateUnreadMessageBadge() {
  if (!unreadMessageBadge || !messagesLauncher) return;
  const unreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );
  unreadMessageBadge.hidden = unreadCount === 0;
  unreadMessageBadge.textContent =
    unreadCount > 99 ? "99+" : String(unreadCount);
  messagesLauncher.setAttribute(
    "aria-label",
    unreadCount === 0
      ? "Messages"
      : `Messages, ${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`,
  );
}

function removeExpiredConversations() {
  const now = Date.now();
  const expiredIds = new Set(
    conversations
      .filter(
        (conversation) =>
          conversation.closedAt !== undefined &&
          conversation.closedAt + MESSAGE_RETENTION_MS <= now,
      )
      .map((conversation) => conversation.conversation),
  );
  if (expiredIds.size === 0) return;

  conversations = conversations.filter(
    (conversation) => !expiredIds.has(conversation.conversation),
  );
  if (
    selectedConversation &&
    expiredIds.has(selectedConversation.conversation)
  ) {
    selectedConversation = undefined;
    messageList?.replaceChildren();
    if (threadTitle) threadTitle.textContent = "Select a conversation";
    if (sendMessageButton) sendMessageButton.disabled = true;
    if (replyContentInput) {
      replyContentInput.value = "";
      replyContentInput.disabled = true;
    }
  }
  renderConversations();
}

async function messageSellerAboutItem(item: Item) {
  if (
    item.id === undefined ||
    !currentUserInput ||
    !messageRecipientInput ||
    !messageTopicInput ||
    !initialMessageInput ||
    !startConversationForm
  ) {
    return;
  }

  const user = currentUserInput.value.trim();
  if (!user) return;

  if (!await loadConversations()) return;
  const existing = conversations.find(
    (conversation) =>
      conversation.topic === String(item.id) &&
      ((conversation.initiator === user &&
        conversation.recipient === item.seller) ||
        (conversation.initiator === item.seller &&
          conversation.recipient === user)),
  );
  if (existing) {
    await openConversation(existing);
    return;
  }

  messageRecipientInput.value = item.seller;
  messageTopicInput.value = String(item.id);
  messageTopicInput.readOnly = true;
  setMessagesOpen(true);
  const composeDetails = startConversationForm.closest("details");
  if (!composeDetails) {
    throw new Error("Missing start-conversation panel.");
  }
  composeDetails.open = true;
  initialMessageInput.focus();
}

async function loadConversations(): Promise<boolean> {
  if (
    !statusMessage ||
    !currentUserInput ||
    !conversationList ||
    !messageList ||
    !threadTitle ||
    !sendMessageButton ||
    !replyContentInput
  ) {
    return false;
  }
  removeExpiredConversations();
  const user = currentUserInput.value.trim();
  if (!user) {
    conversations = [];
    selectedConversation = undefined;
    conversationList.replaceChildren();
    messageList.replaceChildren();
    threadTitle.textContent = "Select a conversation";
    sendMessageButton.disabled = true;
    replyContentInput.disabled = true;
    renderConversations();
    return false;
  }

  try {
    const response = await fetch("/api/messaging/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    if (!response.ok) throw new Error(await readError(response));

    const loaded = extractConversations(await response.json());
    if (!loaded) throw new Error("Unexpected conversations response.");
    await Promise.all(
      loaded.map(async (conversation) => {
        const messagesResponse = await fetch("/api/messaging/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: conversation.conversation, reader: user }),
        });
        if (!messagesResponse.ok) {
          throw new Error(await readError(messagesResponse));
        }
        const threadMessages = extractMessages(await messagesResponse.json());
        if (!threadMessages) {
          throw new Error("Unexpected messages response.");
        }
        conversation.lastMessageAt = threadMessages.reduce(
          (latest, message) => Math.max(latest, message.sentAt),
          0,
        );
        conversation.unreadCount = threadMessages.filter(
          (message) =>
            message.sender !== user && message.readStatus === "UNREAD",
        ).length;
      }),
    );
    loaded.sort(
      (first, second) =>
        second.lastMessageAt - first.lastMessageAt ||
        second.conversation - first.conversation,
    );
    if (conversationExpiryTimer !== undefined) {
      window.clearTimeout(conversationExpiryTimer);
      conversationExpiryTimer = undefined;
    }
    const nextExpiry = loaded.reduce(
      (earliest, conversation) =>
        conversation.closedAt === undefined
          ? earliest
          : Math.min(earliest, conversation.closedAt + MESSAGE_RETENTION_MS),
      Number.POSITIVE_INFINITY,
    );
    if (Number.isFinite(nextExpiry)) {
      conversationExpiryTimer = window.setTimeout(
        () => {
          removeExpiredConversations();
          void loadConversations();
        },
        Math.max(0, nextExpiry - Date.now()),
      );
    }
    conversations = loaded;
    selectedConversation = selectedConversation
      ? loaded.find(
          (conversation) =>
            conversation.conversation === selectedConversation?.conversation,
        )
      : undefined;
    renderConversations();
    if (selectedConversation) {
      await loadMessages(selectedConversation, false);
    } else {
      messageList.replaceChildren();
      threadTitle.textContent = "Select a conversation";
      sendMessageButton.disabled = true;
      replyContentInput.value = "";
      replyContentInput.disabled = true;
    }
    return true;
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not load conversations.";
    return false;
  }
}

async function loadMessages(conversation: Conversation, markRead: boolean) {
  if (
    !statusMessage ||
    !currentUserInput ||
    !sendMessageButton ||
    !threadTitle ||
    !messageList ||
    !replyContentInput
  ) {
    return;
  }
  if (
    conversation.closedAt !== undefined &&
    conversation.closedAt + MESSAGE_RETENTION_MS <= Date.now()
  ) {
    removeExpiredConversations();
    void loadConversations();
    return;
  }
  const reader = currentUserInput.value.trim();
  selectedConversation = conversation;
  renderConversations();
  const canReply =
    conversation.closedAt === undefined &&
    (conversation.initiator === reader || conversation.recipient === reader);
  sendMessageButton.disabled = !canReply;
  replyContentInput.disabled = !canReply;

  const otherUser =
    conversation.initiator === reader
      ? conversation.recipient
      : conversation.initiator;
  threadTitle.textContent = `Conversation with ${otherUser} · ${getConversationItemName(conversation)}${
    conversation.closedAt === undefined ? "" : " · Closed"
  }`;

  try {
    if (markRead) {
      const readResponse = await fetch("/api/messaging/markRead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: conversation.conversation,
          reader,
        }),
      });
      if (!readResponse.ok) throw new Error(await readError(readResponse));
      conversation.unreadCount = 0;
      renderConversations();
    }

    const response = await fetch("/api/messaging/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation: conversation.conversation,
        reader,
      }),
    });
    if (!response.ok) throw new Error(await readError(response));

    const loaded = extractMessages(await response.json());
    if (!loaded) throw new Error("Unexpected messages response.");
    messageList.replaceChildren();
    for (const message of loaded) {
      const bubble = document.createElement("article");
      bubble.className = `message${message.sender === reader ? " mine" : ""}`;
      const content = document.createElement("p");
      content.textContent = message.content;
      const meta = document.createElement("small");
      meta.className = "message-meta";
      meta.textContent = `${message.sender} · ${new Date(message.sentAt).toLocaleString()}`;
      bubble.append(content, meta);
      messageList.appendChild(bubble);
    }
    messageList.scrollTop = messageList.scrollHeight;
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not load messages.";
  }
}

async function openConversation(conversation: Conversation) {
  setMessagesOpen(true);
  await loadMessages(conversation, true);
}

async function fetchInventory() {
  if (!statusMessage || !currentUserInput) return;
  try {
    visibleItemIds = undefined;
    const response = await fetch("/api/inventory/available", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) throw new Error(await readError(response));

    const availableItems = extractItems(await response.json());
    if (!availableItems) throw new Error("Unexpected inventory response.");

    const user = currentUserInput.value.trim();
    let claimedItems: Item[] = [];
    if (user) {
      const claimedResponse = await fetch("/api/inventory/claimed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });

      if (!claimedResponse.ok) {
        throw new Error(await readError(claimedResponse));
      }

      const loadedClaimedItems = extractItems(await claimedResponse.json());
      if (!loadedClaimedItems) {
        throw new Error("Unexpected claimed-items response.");
      }
      claimedItems = loadedClaimedItems;
    }

    const loadedItems = [...availableItems, ...claimedItems];
    const tagsByItem = await Promise.all(
      loadedItems.map(async (item) => [item, await fetchItemTags(item)] as const),
    );
    for (const [item, tags] of tagsByItem) item.tags = tags;
    items.splice(0, items.length, ...loadedItems);
    statusMessage.textContent = "";
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not load inventory.";
  }

  renderInventory();
}

async function saveItemTags(
  item: Item,
  selectedTags: string[],
  button: HTMLButtonElement,
) {
  if (!statusMessage || !currentUserInput || item.id === undefined) {
    if (statusMessage) statusMessage.textContent = "This item has no ID to tag.";
    return;
  }

  const user = currentUserInput.value.trim();
  if (item.seller !== user) {
    statusMessage.textContent = "Only the seller can edit this item's tags.";
    return;
  }

  button.disabled = true;
  try {
    for (const category of ["size", "color"]) {
      const current = item.tags?.find((tag) => tag.category === category);
      const selectedTagId = selectedTags.find((tagId) =>
        tagId.startsWith(`${category}:`),
      );
      if (current?.tag === selectedTagId) continue;

      if (current) {
        const untagResponse = await fetch("/api/tagging/untag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: String(item.id), tag: current.tag }),
        });
        if (!untagResponse.ok) throw new Error(await readError(untagResponse));
        item.tags = item.tags?.filter((tag) => tag.tag !== current.tag) ?? [];
      }

      if (selectedTagId) {
        const tagResponse = await fetch("/api/tagging/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: String(item.id), tag: selectedTagId }),
        });
        if (!tagResponse.ok) throw new Error(await readError(tagResponse));
        const definition = tagDefinitions.find((tag) => tag.tag === selectedTagId);
        if (definition) item.tags = [...(item.tags ?? []), definition];
      }
    }

    statusMessage.textContent = "Item tags updated.";
    renderInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not update item tags.";
    await fetchInventory();
  } finally {
    button.disabled = false;
  }
}

async function clearItemTags(item: Item, button: HTMLButtonElement) {
  if (!statusMessage || !currentUserInput || item.id === undefined) {
    if (statusMessage) statusMessage.textContent = "This item has no ID to tag.";
    return;
  }

  if (item.seller !== currentUserInput.value.trim()) {
    statusMessage.textContent = "Only the seller can edit this item's tags.";
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch("/api/tagging/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: String(item.id) }),
    });
    if (!response.ok) throw new Error(await readError(response));

    item.tags = [];
    statusMessage.textContent = "Item tags cleared.";
    renderInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not clear item tags.";
  } finally {
    button.disabled = false;
  }
}

async function applyTagFilters() {
  if (
    !statusMessage ||
    !sizeFilterSelect ||
    !colorFilterSelect ||
    !applyTagFilterButton
  ) {
    return;
  }

  const selectedTags = [sizeFilterSelect.value, colorFilterSelect.value].filter(
    Boolean,
  );
  if (!selectedTags.length) {
    visibleItemIds = undefined;
    renderInventory();
    statusMessage.textContent = "Showing all inventory.";
    return;
  }

  applyTagFilterButton.disabled = true;
  try {
    const response = await fetch("/api/tagging/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedTags }),
    });
    if (!response.ok) throw new Error(await readError(response));

    const matchedIds = extractSearchIds(await response.json());
    if (!matchedIds) throw new Error("Unexpected tag-search response.");
    visibleItemIds = matchedIds;
    renderInventory();
    statusMessage.textContent = `Showing ${matchedIds.size} matching item(s).`;
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not filter by tags.";
  } finally {
    applyTagFilterButton.disabled = false;
  }
}

async function claimItem(item: Item, button: HTMLButtonElement) {
    if (currentUserInput === null){
        return {};
    }
  const claimer = currentUserInput.value.trim();

  if(statusMessage === null){
        return {};
    }
  if (!claimer) {
    statusMessage.textContent = "Enter your username before claiming an item.";
    currentUserInput.focus();
    return;
  }

  if (item.id === undefined) {
    statusMessage.textContent = "This item has no ID and cannot be claimed.";
    return;
  }

  button.disabled = true;
  statusMessage.textContent = "Claiming item…";

  try {
    const response = await fetch("/api/inventory/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, claimer }),
    });

    if (!response.ok) throw new Error(await readError(response));

    const index = items.findIndex((candidate) => candidate.id === item.id);
    if (index !== -1) items.splice(index, 1);

    statusMessage.textContent = "Item claimed successfully.";
    renderInventory();
    void fetchInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not claim item.";
    button.disabled = false;
  }
}

async function releaseClaim(item: Item, button: HTMLButtonElement) {
  if (!currentUserInput || !statusMessage) return;

  const user = currentUserInput.value.trim();
  if (!user) {
    statusMessage.textContent = "Enter your username before releasing a claim.";
    currentUserInput.focus();
    return;
  }

  if (item.id === undefined) {
    statusMessage.textContent = "This item has no ID and cannot be released.";
    return;
  }

  if (item.buyer !== user || item.status !== "CLAIMED") {
    statusMessage.textContent = "Only the buyer can release this claim.";
    return;
  }

  if (
    !window.confirm(
      `Release your claim on "${item.name}"? It will become available to other buyers.`,
    )
  ) {
    return;
  }

  button.disabled = true;
  statusMessage.textContent = "Releasing claim…";

  try {
    const response = await fetch("/api/inventory/releaseClaim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, user }),
    });

    if (!response.ok) throw new Error(await readError(response));

    statusMessage.textContent = "Claim released successfully.";
    void fetchInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not release claim.";
    button.disabled = false;
  }
}

async function completeTransaction(item: Item, button: HTMLButtonElement) {
  if (!currentUserInput || !statusMessage) return;

  const user = currentUserInput.value.trim();
  if (!user) {
    statusMessage.textContent =
      "Enter your username before completing a transaction.";
    currentUserInput.focus();
    return;
  }

  if (item.id === undefined) {
    statusMessage.textContent =
      "This item has no ID and cannot be marked completed.";
    return;
  }

  if (item.seller !== user || item.status !== "CLAIMED") {
    statusMessage.textContent =
      "Only the seller can complete this transaction.";
    return;
  }

  if (
    !window.confirm(
      `Mark the transaction for "${item.name}" as completed? This cannot be undone.`,
    )
  ) {
    return;
  }

  button.disabled = true;
  statusMessage.textContent = "Completing transaction…";

  try {
    const response = await fetch("/api/inventory/transactionCompleted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, user }),
    });

    if (!response.ok) throw new Error(await readError(response));

    const index = items.findIndex((candidate) => candidate.id === item.id);
    if (index !== -1) items.splice(index, 1);

    statusMessage.textContent = "Transaction completed successfully.";
    renderInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error
        ? error.message
        : "Could not complete the transaction.";
    button.disabled = false;
  }
}

async function editItem(item: Item) {
  if (!currentUserInput || !statusMessage) return;

  const user = currentUserInput.value.trim();
  if (!user || item.id === undefined) return;

  const description = window.prompt("Edit description:", item.description ?? "");
  if (description === null) return;

  const price = window.prompt("Edit price:", item.price ?? "");
  if (price === null) return;

  try {
    const response = await fetch("/api/inventory/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item,
        user,
        description,
        price,
        image: item.image,
      }),
    });

    if (!response.ok) throw new Error(await readError(response));

    statusMessage.textContent = "Item updated.";
    await fetchInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not edit item.";
  }
}

async function replaceItemImage(
  item: Item,
  file: File,
  button: HTMLButtonElement,
) {
  if (!currentUserInput || !statusMessage) return;

  const user = currentUserInput.value.trim();
  if (!user || item.id === undefined) {
    statusMessage.textContent =
      "Enter your username before replacing an item image.";
    currentUserInput.focus();
    return;
  }

  button.disabled = true;
  try {
    const image = await readUploadedImage(file);
    const response = await fetch("/api/inventory/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item,
        user,
        description: item.description ?? "",
        price: item.price ?? "",
        image,
      }),
    });
    if (!response.ok) throw new Error(await readError(response));

    statusMessage.textContent = "Item image updated.";
    await fetchInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not update the item image.";
    button.disabled = false;
  }
}

async function deleteItem(item: Item, button: HTMLButtonElement) {
  if (!currentUserInput || !statusMessage) return;

  const user = currentUserInput.value.trim();
  if (!user) {
    statusMessage.textContent = "Enter your username before deleting an item.";
    currentUserInput.focus();
    return;
  }

  if (item.id === undefined) {
    statusMessage.textContent = "This item has no ID and cannot be deleted.";
    return;
  }

  if (item.seller !== user) {
    statusMessage.textContent = "Only the seller can delete this item.";
    return;
  }

  if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

  button.disabled = true;
  statusMessage.textContent = "Deleting item…";

  try {
    const response = await fetch("/api/inventory/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, user }),
    });

    if (!response.ok) throw new Error(await readError(response));

    const index = items.findIndex((candidate) => candidate.id === item.id);
    if (index !== -1) items.splice(index, 1);

    await loadConversations();
    statusMessage.textContent = "Item deleted successfully.";
    renderInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not delete item.";
    button.disabled = false;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(loginForm);
  const username = String(values.get("username") ?? "").trim();
  const password = String(values.get("password") ?? "");
  const button = loginForm.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  if (!button) throw new Error("Missing sign-in button.");

  button.disabled = true;
  authStatus.textContent = "Signing in…";
  try {
    const response = await fetch("/api/users/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error(await authError(response));

    const user = extractAuthUser(await response.json());
    if (!user || user.username !== username) {
      throw new Error("Unexpected sign-in response.");
    }

    const sessionResponse = await fetch("/api/sessioning/sessionOpen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    if (!sessionResponse.ok) {
      throw new Error(await readError(sessionResponse));
    }
    const session = extractAuthSession(await sessionResponse.json());
    if (!session || session.user.username !== user.username) {
      throw new Error("Unexpected session response.");
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setAuthenticatedUser(session);
    loginForm.reset();
    authStatus.textContent = "";
    void loadAuthenticatedData().catch((error: unknown) => {
      statusMessage.textContent =
        error instanceof Error ? error.message : "Could not load the marketplace.";
    });
  } catch (error) {
    authStatus.textContent =
      error instanceof Error ? error.message : "Could not sign in.";
  } finally {
    button.disabled = false;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(registerForm);
  const username = String(values.get("username") ?? "").trim();
  const email = String(values.get("email") ?? "").trim();
  const password = String(values.get("password") ?? "");
  const button = registerForm.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );
  if (!button) throw new Error("Missing registration button.");

  button.disabled = true;
  authStatus.textContent = "Creating account…";
  try {
    const response = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    if (!response.ok) throw new Error(await authError(response));

    const user = extractAuthUser(await response.json());
    if (!user || user.username !== username) {
      throw new Error("Unexpected registration response.");
    }
    const loginUsername =
      loginForm.querySelector<HTMLInputElement>('input[name="username"]');
    if (loginUsername) loginUsername.value = username;
    authStatus.textContent =
      "Account created. You can now sign in with your username and password.";
    loginForm.querySelector<HTMLInputElement>(
      'input[name="password"]',
    )?.focus();
    registerForm.reset();
  } catch (error) {
    authStatus.textContent =
      error instanceof Error ? error.message : "Could not create the account.";
  } finally {
    button.disabled = false;
  }
});

logoutButton.addEventListener("click", () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    authStatus.textContent =
      error instanceof Error
        ? `Could not clear the saved session: ${error.message}`
        : "Could not clear the saved session.";
  }
  clearAuthenticatedUser();
});

addItemLauncher.addEventListener("click", () => {
  setAddItemOpen(addItemPanel.hidden === true);
});
closeAddItemButton.addEventListener("click", () => setAddItemOpen(false));

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    statusMessage.textContent = "Choose a JPEG or PNG image to post.";
    itemImageInput.focus();
    return;
  }

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    seller: String(formData.get("seller") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: String(formData.get("price") ?? "").trim(),
  };
  const selectedTags = [sizeTagSelect.value, colorTagSelect.value].filter(
    Boolean,
  );

  try {
    const image = await readUploadedImage(imageFile);
    const response = await fetch("/api/inventory/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, image }),
    });

    if (!response.ok) throw new Error(await readError(response));

    await fetchInventory();
    const postedItem = items.find(
      (item) =>
        item.name === payload.name &&
        item.seller === payload.seller &&
        item.description === payload.description,
    );
    if (selectedTags.length && (!postedItem || postedItem.id === undefined)) {
      statusMessage.textContent =
        "Item posted, but its ID could not be found to apply the selected tags.";
      return;
    }

    try {
      if (postedItem?.id !== undefined) {
        for (const tag of selectedTags) {
          const tagResponse = await fetch("/api/tagging/tag", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ item: String(postedItem.id), tag }),
          });
          if (!tagResponse.ok) throw new Error(await readError(tagResponse));
        }
      }
    } catch (error) {
      statusMessage.textContent =
        `Item posted, but tags could not be applied: ${
          error instanceof Error ? error.message : "tagging failed."
        }`;
      await fetchInventory();
      return;
    }

    const seller = sellerInput.value;
    form.reset();
    sellerInput.value = seller;
    await fetchInventory();
    statusMessage.textContent = "Item posted successfully.";
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not post item.";
  }
});

startConversationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!statusMessage) return;

  const initiator = currentUserInput.value.trim();
  const recipient = messageRecipientInput.value.trim();
  const topic = messageTopicInput.value.trim();
  const content = initialMessageInput.value.trim();
  if (!initiator) {
    statusMessage.textContent = "Enter your username before messaging.";
    currentUserInput.focus();
    return;
  }
  if (!recipient || !topic || !content) {
    statusMessage.textContent =
      "Enter a recipient, item ID, and first message.";
    return;
  }
  if (initiator === recipient) {
    statusMessage.textContent = "You cannot start a conversation with yourself.";
    return;
  }

  const submitButton =
    startConversationForm.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
  if (!submitButton) throw new Error("Missing start-conversation button.");
  submitButton.disabled = true;
  try {
    const response = await fetch("/api/messaging/startConversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initiator, recipient, topic, content }),
    });
    if (!response.ok) throw new Error(await readError(response));

    const result = (await response.json()) as { conversation?: unknown };
    const conversationId = Number(result.conversation);
    if (!Number.isFinite(conversationId)) {
      throw new Error("Unexpected start-conversation response.");
    }

    initialMessageInput.value = "";
    statusMessage.textContent = "Conversation started.";
    await loadConversations();
    const created = conversations.find(
      (conversation) => conversation.conversation === conversationId,
    );
    if (created) await loadMessages(created, false);
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error
        ? error.message
        : "Could not start the conversation.";
  } finally {
    submitButton.disabled = false;
  }
});

sendMessageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!statusMessage) return;

  const conversation = selectedConversation;
  const sender = currentUserInput.value.trim();
  const content = replyContentInput.value.trim();
  if (!conversation || conversation.closedAt !== undefined) {
    statusMessage.textContent =
      "Select an open conversation before replying.";
    return;
  }
  if (conversation.initiator !== sender && conversation.recipient !== sender) {
    statusMessage.textContent =
      "Your username is not a participant in this conversation.";
    return;
  }
  if (!sender || !content) {
    statusMessage.textContent = "Enter your username and a message.";
    return;
  }

  sendMessageButton.disabled = true;
  try {
    const response = await fetch("/api/messaging/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation: conversation.conversation,
        sender,
        content,
      }),
    });
    if (!response.ok) throw new Error(await readError(response));

    replyContentInput.value = "";
    statusMessage.textContent = "Message sent.";
    await loadConversations();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not send the message.";
  } finally {
    const user = currentUserInput.value.trim();
    const isMember =
      conversation.initiator === user || conversation.recipient === user;
    sendMessageButton.disabled =
      conversation.closedAt !== undefined || !isMember;
    replyContentInput.disabled =
      conversation.closedAt !== undefined || !isMember;
  }
});

messagesLauncher.addEventListener("click", () => {
  const open = messagesPanel.hidden === true;
  setMessagesOpen(open);
  if (open) void loadConversations();
});
closeMessagesButton.addEventListener("click", () => setMessagesOpen(false));
refreshMessagesButton.addEventListener("click", () => void loadConversations());
document.addEventListener("visibilitychange", () => {
  if (
    document.visibilityState === "visible" &&
    authenticatedApp &&
    !authenticatedApp.hidden
  ) {
    void loadConversations();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !addItemPanel.hidden) {
    setAddItemOpen(false);
  }
  if (event.key === "Escape" && !messagesPanel.hidden) {
    setMessagesOpen(false);
  }
});

applyTagFilterButton.addEventListener("click", () => void applyTagFilters());
clearTagFilterButton.addEventListener("click", () => {
  sizeFilterSelect.value = "";
  colorFilterSelect.value = "";
  visibleItemIds = undefined;
  renderInventory();
  statusMessage.textContent = "Showing all inventory.";
});
currentUserInput.addEventListener("input", renderInventory);
void restoreSession();
