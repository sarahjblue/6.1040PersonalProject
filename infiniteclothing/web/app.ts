type Item = {
  id?: number;
  name: string;
  description?: string;
  price?: string;
  image: string;
  seller: string;
  status?: "AVAILABLE" | "CLAIMED" | "COMPLETED";
  buyer?: string;
};

const form = document.querySelector<HTMLFormElement>("#item-form");
const statusMessage = document.querySelector<HTMLParagraphElement>("#status");
const inventoryContainer = document.querySelector<HTMLDivElement>("#inventory");
const currentUserInput = document.querySelector<HTMLInputElement>("#current-user");

if (!form || !statusMessage || !inventoryContainer || !currentUserInput) {
  throw new Error("Missing frontend elements. Check the IDs in index.html.");
}

const items: Item[] = [];

function getRows(data: unknown): unknown[] | undefined {
  if (!data || typeof data !== "object") return undefined;

  const value = data as Record<string, unknown>;

  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.result)) return value.result;

  return (
    getRows(value.result) ??
    getRows(value.inventory) ??
    getRows(value.data)
  );
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

function renderInventory() {
    if(inventoryContainer === null){
        return {};
    }
  inventoryContainer.replaceChildren();
  if(currentUserInput === null){
    return {};
  }
  const currentUser = currentUserInput.value.trim();

  for (const item of items) {
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

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const claimButton = document.createElement("button");
    claimButton.type = "button";
    claimButton.textContent = "Claim item";
    claimButton.disabled =
      item.id === undefined || !currentUser || item.seller === currentUser;
    claimButton.addEventListener("click", () => void claimItem(item, claimButton));

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

    actions.append(claimButton, editButton, deleteButton);
    card.append(image, title, details, description, actions);
    inventoryContainer.appendChild(card);
  }
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

async function fetchInventory() {
    if(statusMessage === null){
        return {};
    }
  try {
    const response = await fetch("/api/inventory/available", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) throw new Error(await readError(response));

    const loadedItems = extractItems(await response.json());
    if (!loadedItems) throw new Error("Unexpected inventory response.");

    items.splice(0, items.length, ...loadedItems);
    statusMessage.textContent = "";
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not load inventory.";
  }

  renderInventory();
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

  try {
    const response = await fetch("/api/inventory/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await readError(response));

    statusMessage.textContent = "Item posted successfully.";
    form.reset();
    await fetchInventory();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "Could not post item.";
  }
});

currentUserInput.addEventListener("input", renderInventory);
void fetchInventory();
