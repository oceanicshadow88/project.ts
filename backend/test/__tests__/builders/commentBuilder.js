import * as Comment from '../../../src/app/model/comment';
import db from '../../setup/db';
import BaseBuilder from './baseBuilder';
import TicketBuilder from './ticketBuilder';

export default class CommentBuilder extends BaseBuilder {
    constructor(defaultValues = true) {
        super(defaultValues);
    }

    withTicket(ticket) {
        this.properties.ticket = ticket._id || ticket;
        return this;
    }

    withSender(sender) {
        this.properties.sender = sender._id || sender;
        return this;
    }

    withContent(content) {
        this.properties.content = content;
        return this;
    }

    async buildDefault() {
        const ticket = await new TicketBuilder().save();
        return {
            ticket: ticket._id,
            sender: db.defaultUser._id,
            content: 'Default comment content',
        };
    }

    build() {
        return {
            ticket: this.properties.ticket,
            sender: this.properties.sender,
            content: this.properties.content,
        };
    }

    async save() {
        return super.save(Comment.getModel(db.dbConnection));
    }
}

