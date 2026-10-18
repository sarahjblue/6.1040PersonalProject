type Item = {
  id?: number;
  name: string;
  description?: string;
  price: string;
  image: string;
  seller: string;
  status?: "AVAILABLE";
  tags?: string[];
};

const form = document.querySelector<HTMLFormElement>("#item-form");
const status = document.querySelector<HTMLParagraphElement>("#status");
const inventoryContainer = document.querySelector<HTMLDivElement>("#inventory");

if (!form || !status || !inventoryContainer) {
  throw new Error("Missing frontend elements");
}

const items: Item[] = [
  {
    id: 1,
    name: "Desk lamp",
    description: "Working desk lamp",
    price: "$25",
    image: "https://placehold.co/240x180",
    seller: "alice",
    status: "AVAILABLE",
    tags: ["size", "item"],
  },
  {
    id: 2,
    name: "Blue jacket",
    description: "Lightweight blue jacket",
    price: "$40",
    image: "https://placehold.co/240x180",
    seller: "brian",
    status: "AVAILABLE",
    tags: ["color", "item"],
  },
];

function renderInventory() {
   if(inventoryContainer === null){
    return {};
   }
  inventoryContainer.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;

    const title = document.createElement("h3");
    title.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span>Seller: ${item.seller}</span>
      <span>Price: ${item.price}</span>
    `;

    const desc = document.createElement("p");
    desc.textContent = item.description ?? "";

    const tags = document.createElement("div");
    tags.className = "tags-list";
    (item.tags ?? []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = tag;
      tags.appendChild(chip);
    });

    card.append(img, title, meta, desc, tags);
    inventoryContainer.appendChild(card);
  });
}

async function fetchInventory() {
  try {
    const response = await fetch("/api/inventory/available", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Inventory endpoint unavailable");
    }

    const data = await response.json().catch(() => ({}));
    if (Array.isArray(data.items)) {
      items.splice(0, items.length, ...data.items);
    }
  } catch {
  }

  renderInventory();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const selectedTags = formData.getAll("tags").map(String);

  const payload: Item = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    image: String(formData.get("image") ?? ""),
    seller: String(formData.get("seller") ?? ""),
    status: "AVAILABLE",
    tags: selectedTags,
  };

  try {
    const response = await fetch("/api/inventory/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Post failed");
    }

    status.textContent = "Item posted successfully.";
    form.reset();
    await fetchInventory();
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not post item.";
  }
});

renderInventory();
fetchInventory();
