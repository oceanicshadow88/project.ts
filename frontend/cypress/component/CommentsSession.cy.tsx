/* eslint-disable import/extensions */
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CommentsSession from '../../src/components/TicketDetailCard/@components/CommentsSession/CommentsSession';
import { mentionUsers, BRAND_PURPLE, MOD_ENTER } from '../fixtures/mentionUsers';

const TICKET_ID = 'ticket-1';
const [alice, , , , , , jerry] = mentionUsers;

const paragraph = (...content: object[]) => ({ type: 'paragraph', content });
const text = (value: string) => ({ type: 'text', text: value });
const mention = (id: string | null, label: string) => ({ type: 'mention', attrs: { id, label } });
const doc = (...content: object[]) => JSON.stringify({ type: 'doc', content });

const comments = [
  {
    id: 'c1',
    ticket: TICKET_ID,
    sender: jerry,
    content: doc(
      paragraph(text('Hi '), mention('u-alice', 'Alice Wang'), text(' can you check the login API?')),
      paragraph(text('It returns 500 when the password is empty.'))
    ),
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    // Saved before TS-21: the mention has no id.
    id: 'c2',
    ticket: TICKET_ID,
    sender: alice,
    content: doc(paragraph(mention(null, 'Jerry Huang'), text(' fixed in PR #142, please review.'))),
    createdAt: '2026-10-01T11:00:00.000Z',
    updatedAt: '2026-10-01T12:30:00.000Z'
  }
];

const mountSession = () => {
  // checkAccess() lets a super user do everything; Cypress clears localStorage before each test.
  localStorage.setItem('is_superUser', 'true');
  cy.mount(
    <div style={{ width: 700, padding: 20 }}>
      <ToastContainer />
      <CommentsSession userId="u-jerry" users={mentionUsers} ticketId={TICKET_ID} projectId="p1" />
    </div>
  );
};

const contentOf = (body: { content: string }) => JSON.parse(body.content);
const findMention = (json) =>
  json.content.flatMap((node) => node.content ?? []).find((node) => node.type === 'mention');

describe('TS-21 CommentsSession', () => {
  beforeEach(() => {
    cy.intercept('GET', `**/comments/${TICKET_ID}`, { statusCode: 200, body: comments }).as(
      'getComments'
    );
  });

  it('AC7 (#11): shows mentions as chips, old ones too, and keeps paragraphs', () => {
    mountSession();
    cy.wait('@getComments');

    cy.get('[data-testid="comment-content"] span[data-type="mention"]')
      .should('have.length', 2)
      .each(($chip) => {
        expect(getComputedStyle($chip[0]).color).to.equal(BRAND_PURPLE);
        expect(getComputedStyle($chip[0]).backgroundColor).to.equal('rgb(233, 213, 255)');
      });
    cy.get('[data-testid="comment-content"]').eq(1).find('span[data-type="mention"]')
      .should('not.have.attr', 'data-id');

    cy.get('[data-testid="comment-content"]').eq(0).find('p').should('have.length', 2);
    // innerText follows the layout: the two paragraphs are on separate lines.
    cy.get('[data-testid="comment-content"]').eq(0).should(($content) => {
      expect($content[0].innerText).not.to.contain('API?It');
    });
  });

  it('#13: marks edited comments', () => {
    mountSession();
    cy.get('[data-testid="comment-item"]').eq(0).find('[data-testid="comment-edited"]').should('not.exist');
    cy.get('[data-testid="comment-item"]').eq(1).find('[data-testid="comment-edited"]').should('contain', 'edited');
  });

  it('#13: shows a loading state, then an empty state', () => {
    cy.intercept('GET', `**/comments/${TICKET_ID}`, { statusCode: 200, body: [], delay: 800 }).as(
      'getEmpty'
    );
    mountSession();
    cy.get('[data-testid="comments-loading"]').should('be.visible');
    cy.wait('@getEmpty');
    cy.get('[data-testid="comments-loading"]').should('not.exist');
    cy.get('[data-testid="comments-empty"]').should('contain', 'No comments yet.');
  });

  it('#12/AC6: the input opens the editor; the posted mention has the user id', () => {
    cy.intercept('POST', '**/comments', { statusCode: 201, body: {} }).as('postComment');
    mountSession();
    cy.get('[data-testid="add-comment"]').should('contain', 'Type @ to mention').click();
    cy.get('[data-testid="editor-placeholder"]').should('be.visible');

    cy.get('.ProseMirror').click().type('Hi @ali{enter}please check');
    cy.get('.ProseMirror').type(MOD_ENTER);

    cy.wait('@postComment').then(({ request }) => {
      expect(request.body).to.include({ ticket: TICKET_ID, sender: 'u-jerry' });
      expect(findMention(contentOf(request.body)).attrs).to.include({
        id: 'u-alice',
        label: 'Alice Wang'
      });
    });
    cy.wait('@getComments');
    cy.get('[data-testid="add-comment"]').should('be.visible');
  });

  it('#13: keeps the text and shows an error when posting fails', () => {
    cy.intercept('POST', '**/comments', { statusCode: 500, body: {} }).as('postComment');
    mountSession();
    cy.get('[data-testid="add-comment"]').click();
    cy.get('.ProseMirror').click().type('Do not lose me');
    cy.contains('button', 'Submit').click();

    cy.wait('@postComment');
    cy.contains('Failed to post comment. Please try again.').should('be.visible');
    cy.get('.ProseMirror').should('have.text', 'Do not lose me');
  });

  it('#13: asks before deleting; Cancel keeps the comment', () => {
    cy.intercept('DELETE', '**/comments/c1', { statusCode: 200, body: {} }).as('deleteComment');
    mountSession();
    cy.get('[data-testid="comment-item"]').eq(0).find('[data-testid="delete-comment"]').click();
    cy.get('[data-testid="delete-comment-confirm"]')
      .should('contain', 'Delete this comment?')
      .contains('button', 'Cancel')
      .click();
    cy.get('[data-testid="delete-comment-confirm"]').should('not.exist');
    cy.get('@deleteComment.all').should('have.length', 0);

    cy.get('[data-testid="comment-item"]').eq(0).find('[data-testid="delete-comment"]').click();
    cy.get('[data-testid="confirm-delete-comment"]').click();
    cy.wait('@deleteComment');
    cy.wait('@getComments');
  });

  it('AC8 (#14): editing keeps the mention and does not close the new comment editor', () => {
    cy.intercept('PUT', '**/comments/c1', { statusCode: 200, body: {} }).as('updateComment');
    mountSession();

    cy.get('[data-testid="add-comment"]').click();
    cy.get('.ProseMirror').first().click().type('My draft');

    cy.get('[data-testid="comment-item"]').eq(0).contains('button', 'Edit').click();
    cy.get('[data-testid="comment-item"]').eq(0).find('.ProseMirror')
      .find('span[data-type="mention"]')
      .should('have.attr', 'data-id', 'u-alice');
    cy.get('[data-testid="comment-item"]').eq(0).find('.ProseMirror').click().type(' Thanks!');
    cy.get('[data-testid="comment-item"]').eq(0).contains('button', 'Update').click();

    cy.wait('@updateComment').then(({ request }) => {
      expect(findMention(contentOf(request.body)).attrs.id).to.equal('u-alice');
    });
    cy.get('.ProseMirror').first().should('have.text', 'My draft');
  });
});
