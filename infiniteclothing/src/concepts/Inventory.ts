import {db, nextId} from "../db.ts";
import { closeConversationsForTopic } from "./Messaging.ts";

type Status = "AVAILABLE" | "CLAIMED" | "COMPLETED";

export type Item = {
    name: string;
    id: number;
    description?: string;
    price?: string;
    image: string;
    seller: string;
    status: Status;
    buyer?: string;
};

export class ItemAlreadyPosted extends Error {}
export class ClaimUnknownItem extends Error {}
export class ItemNotAvailableToClaim extends Error {}
export class SellerCannotClaim extends Error {}
export class EditUnknownItem extends Error {}
export class NotSellerEdit extends Error {}
export class NoEditChanges extends Error {}
export class DeleteUnknownItem extends Error {}
export class NotSellerDelete extends Error {}
export class DeleteNotCompleted extends Error {}
export class ReleaseUnknownItem extends Error {}
export class ReleaseUnclaimed extends Error {}
export class ReleaseNotBuyer extends Error {}
export class CompleteUnknownItem extends Error {}
export class NotClaimed extends Error {}
export class NotSellerComplete extends Error {}

const items = db.collection<Item>("inventory");

export class InventoryConcept{

    async post({name, seller, image, description, price}: {name: string, seller: string, image: string, description?: string, price?: string}): Promise<{item: Item}> {

        const id = await nextId("inventory");

        const item: Item = {
            name,
            id,
            description,
            price,
            image,
            seller,
            status: "AVAILABLE"
        };

        await items.insertOne(item);
        return {item};
    }

    async claim({item, claimer}:{item: Item, claimer: string}): Promise<{}>{
        const found = await items.findOne({id: item.id});

        if(!found){
            throw new ClaimUnknownItem("There is no such item for sale.");
        }

        if(found.status !== "AVAILABLE"){
            throw new ItemNotAvailableToClaim("This item can not be claimed at this time.");
        }

        if(found.seller === claimer){
            throw new SellerCannotClaim("You can not claim your own for sale item.");
        }

        const result = await items.updateOne({id: item.id, status: "AVAILABLE"}, {$set: {status: "CLAIMED", buyer: claimer}});
        if (!result.modifiedCount){
            throw new ItemNotAvailableToClaim("This item can not be claimed at this time.");
        }

        return {};
    }

    async edit({item, user, description, price, image}: {item: Item, user: string, description?: string, price?: string, image?: string}): Promise<{}> {
        const found = await items.findOne({id: item.id});

        if(!found){
            throw new EditUnknownItem("There is no such item available to edit.");
        }

        if(found.seller !== user){
            throw new NotSellerEdit("You can not edit an item that you are not the seller of.");
        }

        const changes: Partial<Item> = {};
        if (description !== undefined){
            changes.description = description;
        }
        if (price !== undefined) {
            changes.price = price;
        }
        if (image !== undefined) {
            changes.image = image;
        }
        if (!Object.keys(changes).length) {
            throw new NoEditChanges("You must give at least a description, price, or image to edit with.");
        }

        await items.updateOne({ id: item.id }, { $set: changes });
        return {};
    }

    async delete({item, user}: {item: Item, user: string}): Promise<{}> {
        const found = await items.findOne({id: item.id});

        if (!found){
            throw new DeleteUnknownItem("This item already does not exist.");
        }

        if(found.seller !== user){
            throw new NotSellerDelete("You can not delete an item that you are not selling.");
        }

        if(found.status === "COMPLETED"){
            throw new DeleteNotCompleted("You can not delete an item with a completed transaction.");
        }

        await items.deleteOne({id: item.id});
        await closeConversationsForTopic(String(item.id));
        return {};
    }

    async releaseClaim({item, user}: {item: Item, user: string}): Promise<{}> {
        const result = await items.updateOne({id: item.id, status: "CLAIMED", buyer: user}, {$set: {status: "AVAILABLE"}, $unset: {buyer: ""}},);

        if(!result.modifiedCount){
            throw new ReleaseNotBuyer("You can not release this claim.");
        }

        return {};
    }

    async transactionCompleted({item, user}: {item: Item, user: string}): Promise<{}> {
        const found = await items.findOne({id: item.id});

        if(!found){
            throw new CompleteUnknownItem("There is no such item.");
        }

        if(found.status !== "CLAIMED"){
            throw new NotClaimed("Only a claimed item can be completed.");
        }

        if(found.seller !== user){
            throw new NotSellerComplete("Only the seller can complete this transaction.");
        }

        const result = await items.updateOne(
            {id: item.id, status: "CLAIMED", seller: user},
            {$set: {status: "COMPLETED"}},
        );

        if(!result.modifiedCount){
            throw new NotClaimed("Only a claimed item can be completed.");
        }

        return {};
    }

   async _getSeller({ item }: { item: Item }): Promise<{ seller: string }> {
    const seller = (await items.findOne({ id: item.id }))?.seller;

    if (seller === undefined) {
        throw new Error("No seller found for item.");
    }

    return { seller };
}

    async _available(): Promise<Array<{
  item: Item;
  name: string;
  description?: string;
  price?: string;
  seller: string;
  image: string;
}>> {
  const rows = await items.find({ status: "AVAILABLE" }).toArray();

  return rows.map((item) => ({
    item,
    name: item.name,
    description: item.description,
    price: item.price,
    seller: item.seller,
    image: item.image,
  }));
}

    async _claimedForUser({user}: {user: string}): Promise<Array<{
  item: Item;
  name: string;
  description?: string;
  price?: string;
  seller: string;
  image: string;
}>> {
  const rows = await items.find({
    status: "CLAIMED",
    $or: [{ buyer: user }, { seller: user }],
  }).toArray();

  return rows.map((item) => ({
    item,
    name: item.name,
    description: item.description,
    price: item.price,
    seller: item.seller,
    image: item.image,
  }));
}
}
