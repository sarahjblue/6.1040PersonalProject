type Status = "AVAILABLE" | "CLAIMED" | "COMPLETED";

type Item = {
    name: string;
    id: number;
    description?: string;
    price?: string;
    image: string;
    seller: string;
    status: Status;
    buyer?: string;
};


export class InventoryConcept{
    private readonly items: Item[] = [];
    private idCounter: number = 0;

    private find(id: number): Item | undefined {
        const found = this.items.filter((item) => (item.id === id));
        if(found){
            return found[0];
        }

        return undefined;
    }

    post(name: string, seller: string, image: string, description?: string, price?: string): Item {

        const duplicates = this.items.filter((item) => !(item.seller === seller)).filter((item) => !(item.description === description)).filter((item) => (item.name === name));
        if (duplicates.length > 0){
            throw new Error("This item already exists.");
        }

        const id = this.idCounter;
        const item: Item = {
            name,
            id,
            description,
            price,
            image,
            seller,
            status: "AVAILABLE"
        };

        this.items.push(item);

        this.idCounter++;
        return item;
    }

    claim(item: Item, claimer: string) {
        const itemID = item.id;

        const found = this.find(itemID);

        if(!found){
            throw new Error("There is no such item for sale.");
        }

        if(found.status !== "AVAILABLE"){
            throw new Error("This item can not be claimed at this time.");
        }

        if(found.seller === claimer){
            throw new Error("You can not claim your own for sale item.");
        }

        found.buyer = claimer;
        found.status = "CLAIMED";
    }

    edit(item: Item, user: string, description?: string, price?: string, image?: string) {
        const found = this.find(item.id);

        if(!found){
            throw new Error("There is no such item available to edit.");
        }

        if(found.seller !== user){
            throw new Error("You can not edit an item that you are not the seller of.");
        }

        if(!description && !price && !image){
            throw new Error("You must give at least a description, price, or image to edit with.");
        }

        if(description){
            found.description = description;
        }

        if(price){
            found.price = price;
        }

        if(image){
            found.image = image;
        }
    }

    delete(item: Item, user: string) {
        const found = this.find(item.id);

        if (!found){
            throw new Error("This item already does not exist.");
        }

        if(found.seller !== user){
            throw new Error("You can not delete an item that you are not selling.");
        }

        if(found.status === "COMPLETED"){
            throw new Error("You can not delete an item with a completed transaction.");
        }

        const index = this.items.findIndex((item) => (item.id === found.id));
        this.items.splice(0, index).concat(this.items.splice(index+1));
    }

    releaseClaim(item: Item, user: string) {
        const found = this.find(item.id);

        if(!found){
            throw new Error("There is no such item.");
        }

        if(found.status !== "CLAIMED"){
            throw new Error("You can not release an unclaimed item.");
        }

        if(found.buyer !== user){
            throw new Error("You can not release a claim that you did not make.");
        }

        found.status = "AVAILABLE";
        found.buyer = "";
    }

    transactionCompleted(item: Item) {
        const found = this.find(item.id);

        if(!found){
            throw new Error("This item does not exist.");
        }

        if(found.status !== "CLAIMED"){
            throw new Error("Only a claimed item can be completed.");
        }

        found.status = "COMPLETED";
    }

    getSeller(item: Item) : string | undefined {
        const found = this.find(item.id);
        return found?.seller
    }

    available() : Item[] {
        return this.items.filter((item) => item.status === "AVAILABLE");
    }
}
