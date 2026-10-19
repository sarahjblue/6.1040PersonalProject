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
};

type Message = {
  message: number;
  sender: string;
  content: string;
  sentAt: number;
  readStatus: "UNREAD" | "READ";
};

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

if (
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
  !startConversationForm ||
  !messageRecipientInput ||
  !messageTopicInput ||
  !initialMessageInput ||
  !conversationList ||
  !threadTitle ||
  !messageList ||
  !sendMessageForm ||
  !replyContentInput ||
  !sendMessageButton
) {
  throw new Error("Missing frontend elements. Check the IDs in index.html.");
}

const items: Item[] = [];
let tagDefinitions: TagDefinition[] = [];
let visibleItemIds: Set<number> | undefined;
let conversations: Conversation[] = [];
let selectedConversation: Conversation | undefined;

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

    const claimButton = document.createElement("button");
    claimButton.type = "button";
    claimButton.textContent = "Claim item";
    claimButton.disabled =
      item.id === undefined ||
      !currentUser ||
      item.seller === currentUser ||
      item.status !== "AVAILABLE";
    const isClaimedByCurrentUser =
      item.status === "CLAIMED" && item.buyer === currentUser;
    const isClaimedByCurrentSeller =
      item.status === "CLAIMED" && item.seller === currentUser;
    claimButton.hidden = isClaimedByCurrentUser;
    claimButton.addEventListener("click", () => void claimItem(item, claimButton));

    const messageSellerButton = document.createElement("button");
    messageSellerButton.type = "button";
    messageSellerButton.textContent = "Message seller";
    messageSellerButton.hidden =
      !currentUser || item.seller === currentUser || item.status === "COMPLETED";
    messageSellerButton.addEventListener("click", () => {
      messageRecipientInput.value = item.seller;
      messageTopicInput.value =
        item.id === undefined ? "" : String(item.id);
      messageTopicInput.readOnly = item.id !== undefined;
      initialMessageInput.focus();
      startConversationForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const releaseButton = document.createElement("button");
    releaseButton.type = "button";
    releaseButton.textContent = "Release claim";
    releaseButton.hidden = !isClaimedByCurrentUser;
    releaseButton.disabled = !isClaimedByCurrentUser || item.id === undefined;
    releaseButton.addEventListener("click", () =>
      void releaseClaim(item, releaseButton),
    );

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.textContent = "Mark completed";
    completeButton.hidden = !isClaimedByCurrentSeller;
    completeButton.disabled =
      !isClaimedByCurrentSeller || item.id === undefined;
    completeButton.addEventListener("click", () =>
      void completeTransaction(item, completeButton),
    );

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.disabled = !currentUser || item.seller !== currentUser;
    editButton.addEventListener("click", () => void editItem(item));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = !currentUser || item.seller !== currentUser;
    deleteButton.addEventListener("click", () => void deleteItem(item, deleteButton));

    const tagEditor = document.createElement("details");
    tagEditor.className = "tag-editor";
    tagEditor.hidden = !currentUser || item.seller !== currentUser;

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
      deleteButton,
    );
    card.append(image, title, details, description, tagsList, actions, tagEditor);
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
  if (!conversationList || !currentUserInput) return;
  conversationList.replaceChildren();
  const user = currentUserInput.value.trim();

  if (!user) {
    conversationList.textContent = "Enter your username to view messages.";
    return;
  }
  if (!conversations.length) {
    conversationList.textContent = "No conversations yet.";
    return;
  }

  for (const conversation of conversations) {
    const button = document.createElement("button");
    button.type = "button";
    const otherUser =
      conversation.initiator === user
        ? conversation.recipient
        : conversation.initiator;
    button.textContent = `${otherUser} · Item ${conversation.topic}${
      conversation.closedAt === undefined ? "" : " · Closed"
    }`;
    button.setAttribute(
      "aria-current",
      selectedConversation?.conversation === conversation.conversation
        ? "true"
        : "false",
    );
    button.addEventListener("click", () => void openConversation(conversation));
    conversationList.appendChild(button);
  }
}

async function loadConversations() {
  if (
    !statusMessage ||
    !currentUserInput ||
    !conversationList ||
    !messageList ||
    !threadTitle ||
    !sendMessageButton
  ) {
    return;
  }
  const user = currentUserInput.value.trim();
  if (!user) {
    conversations = [];
    selectedConversation = undefined;
    conversationList.replaceChildren();
    messageList.replaceChildren();
    threadTitle.textContent = "Select a conversation";
    sendMessageButton.disabled = true;
    renderConversations();
    return;
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
    }
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not load conversations.";
  }
}

async function loadMessages(conversation: Conversation, markRead: boolean) {
  if (
    !statusMessage ||
    !currentUserInput ||
    !sendMessageButton ||
    !threadTitle ||
    !messageList
  ) {
    return;
  }
  const reader = currentUserInput.value.trim();
  selectedConversation = conversation;
  renderConversations();
  sendMessageButton.disabled = conversation.closedAt !== undefined;

  const otherUser =
    conversation.initiator === reader
      ? conversation.recipient
      : conversation.initiator;
  threadTitle.textContent = `Conversation with ${otherUser} · Item ${conversation.topic}${
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
    if(currentUserInput === null){
        return {};
    }
  const user = currentUserInput.value.trim();
  if (!user || item.id === undefined) return;

  const description = window.prompt("Edit description:", item.description ?? "");
  if (description === null) return;

  const price = window.prompt("Edit price:", item.price ?? "");
  if (price === null) return;

  const image = window.prompt("Edit image URL:", item.image);
  if (image === null) return;

  try {
    const response = await fetch("/api/inventory/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, user, description, price, image }),
    });

    if (!response.ok) throw new Error(await readError(response));

    if(statusMessage === null){
        return {};
    }
    statusMessage.textContent = "Item updated.";
    await fetchInventory();
  } catch (error) {
    if(statusMessage === null){
        return {};
    }
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not edit item.";
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

    statusMessage.textContent = "Item deleted successfully.";
    renderInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not delete item.";
    button.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    seller: String(formData.get("seller") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: String(formData.get("price") ?? "").trim(),
  };
  const selectedTags = [sizeTagSelect.value, colorTagSelect.value].filter(
    Boolean,
  );

  try {
    const response = await fetch("/api/inventory/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

    form.reset();
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
    await loadMessages(conversation, false);
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not send the message.";
  } finally {
    sendMessageButton.disabled = conversation.closedAt !== undefined;
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
currentUserInput.addEventListener("change", () => {
  void fetchInventory();
  void loadConversations();
});
void loadTagDefinitions()
  .then(async () => {
    await fetchInventory();
    await loadConversations();
  })
  .catch((error: unknown) => {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not load tags.";
  });
