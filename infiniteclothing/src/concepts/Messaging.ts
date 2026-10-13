const PURGE_AFTER = 24 * 60 * 60 * 1000;

type ReadStatus = "UNREAD" | "READ";

type Message = {
    message: number;
    sender: string;
    content: string;
    sentAt: number;
    readStatus: ReadStatus;
};

type Conversation = {
    conversation: number;
    topic: string;
    initiator: string;
    recipient: string;
    messages: number[];
    closedAt?: number;
};

export class MessagingConcept{
    private readonly conversations = new Map<number, Conversation>();
    private readonly messages = new Map<number, Message>();

    private messageId: number = 0;

    private isMember(conversation: Conversation, user: string): boolean {
        return conversation.initiator === user || conversation.recipient === user;
    }

    private addMessage(sender: string, content: string): Message {
        const message: Message = {
            message: this.messageId,
            sender,
            content,
            sentAt: Date.now(),
            readStatus: "UNREAD"
        };
        this.messageId++;
        this.messages.set(message.message, message);
        return message;
    }

    startConversation({initiator, recipient, topic, content}: {initiator: string, recipient: string, topic: string, content: string}) {
        if (initiator === recipient) {
            throw new Error("You can not message yourself.");
        }

        const exists = [...this.conversations.values()].some((existing) => existing.topic === topic && ((existing.initiator === initiator && existing.recipient === recipient) || (existing.initiator === recipient && existing.recipient === initiator)));
        if(exists){
            throw new Error("You already have a conversation about this item.");
        }

        const first = this.addMessage(initiator, content);

        const conversation = this.messageId;
        this.messageId ++;
        this.conversations.set(conversation, {
            conversation,
            topic,
            initiator,
            recipient,
            messages: [first.message],
        });
        return {conversation};
    }

    sendMessage({conversation, sender, content}: {conversation: number, sender: string, content: string}){
        const found = this.conversations.get(conversation);
        if (found === undefined){
            throw new Error("There is no such conversation");
        }

        if(!this.isMember(found, sender)){
            throw new Error("You are not a member of this conversation");
        }

        const message = this.addMessage(sender, content);
        found.messages.push(message.message);
        return {message: message.message};
    }

    markRead({conversation, reader} : {conversation: number, reader: string}){
        const found = this.conversations.get(conversation);
        if(found === undefined){
            throw new Error("There is no conversation.");
        }

        if(!this.isMember(found, reader)){
            throw new Error("You are not a member of this conversation.");
        }

        for (const id of found.messages){
            const message = this.messages.get(id);
            if (message !== undefined && message.sender !== reader) {
                message.readStatus = "READ";
            }
        }
    }

    closeConversation({topic}: {topic: string}){
        const closedAt = Date.now();

        for(const conversation of this.conversations.values()){
            if(conversation.topic === topic && conversation.closedAt === undefined){
                conversation.closedAt = closedAt;
            }
        }
    }

    purgeClosed(input: Record<string, never>){
        const cutoff = Date.now() - PURGE_AFTER;

        for(const [id, conversation] of this.conversations){
            if(conversation.closedAt !== undefined && conversation.closedAt < cutoff){
                for (const messageId of conversation.messages){
                    this.messages.delete(messageId);
                }
                this.conversations.delete(id);
            }
        }
    }

    _messages({conversation, reader}: {conversation: number; reader: string}): Array<{message: number; sender: string; content: string; sentAt: string; readStatus: ReadStatus}> {
        const found = this.conversations.get(conversation);
        if(found === undefined || !this.isMember(found, reader)){
            return [];
        }

        return found.messages.flatMap((id) => {
            const message = this.messages.get(id);
            if (message === undefined){
                return [];
            }
            return [{
                message: message.message,
                sender: message.sender,
                content: message.content,
                sentAt: new Date(message.sentAt).toISOString(),
                readStatus: message.readStatus,
            }];
        });
    }

    _conversationsOf({user}: {user: string}): Array<{conversation: number; topic: string; initiator: string; recipient: string; closedAt?: string}> {
        return [...this.conversations.values()].filter((conversation) => this.isMember(conversation, user)).map(({conversation, topic, initiator, recipient, closedAt}) => ({
            conversation,
            topic,
            initiator,
            recipient,
            closedAt: closedAt === undefined ? undefined : new Date(closedAt).toISOString(),
        }));
    }
}
