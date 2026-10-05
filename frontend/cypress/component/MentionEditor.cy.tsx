/* eslint-disable import/extensions */
import React, { useEffect, useState } from 'react';
import TipTapEditor from '../../src/components/TipTapEditor/TipTapEditor';
import { IUserInfo } from '../../src/types';
import { mentionUsers, BRAND_PURPLE, MOD_ENTER } from '../fixtures/mentionUsers';

const PLACEHOLDER = 'Add a comment… Type @ to mention a teammate';

const mountEditor = (onSubmit = cy.stub().as('onSubmit'), users: IUserInfo[] = mentionUsers) => {
  cy.mount(
    <div style={{ padding: 20, width: 600 }}>
      <TipTapEditor
        onSubmit={onSubmit}
        onCancel={() => {}}
        users={users}
        aiOptimizeAction="optimizeText"
        placeholder={PLACEHOLDER}
        submitOnModEnter
      />
    </div>
  );
};

const editor = () => cy.get('.ProseMirror');
const items = () => cy.get('[data-testid="mention-item"]');
const chips = () => editor().find('span[data-type="mention"]');

describe('TS-21 @ mention in TipTapEditor', () => {
  it('AC1/AC2: shows a card with avatar, name and email, capped at 8 rows', () => {
    mountEditor();
    editor().click().type('Hi @');

    cy.get('[data-testid="mention-list"]')
      .should('be.visible')
      .and('have.css', 'background-color', 'rgb(255, 255, 255)')
      .and('contain', 'Project members');
    items().should('have.length', 11);
    items().first().should('contain', 'Alice Wang').and('contain', 'alice.wang@example.com');
    items().first().find('div, img').should('exist'); // avatar
    cy.get('.mention-list__items')
      .should('have.css', 'max-height', '366px')
      .then(($list) => {
        expect($list[0].scrollHeight).to.be.greaterThan($list[0].clientHeight);
      });
  });

  it('AC3: filters by name or email, ignoring case, and shows an empty state', () => {
    mountEditor();
    editor().click().type('@ALI');
    items().should('have.length', 2);
    items().eq(0).should('contain', 'Alice Wang');
    items().eq(1).should('contain', 'Natalie Brown');

    editor().type('{selectall}{backspace}@xiao');
    items().should('have.length', 1).and('contain', 'Chloe Li');

    editor().type('{selectall}{backspace}@zzz');
    cy.get('[data-testid="mention-list"]').should('contain', 'No matching members');
    items().should('not.exist');
  });

  it('AC2: two members with the same name are told apart by email', () => {
    mountEditor();
    editor().click().type('@alex');
    items().should('have.length', 2);
    items().eq(0).should('contain', 'alex.chen@example.com');
    items().eq(1).should('contain', 'alexc.design@example.com');
    items().eq(1).click();
    chips().should('have.attr', 'data-id', 'u-alex-2');
  });

  it('AC4/AC5/AC6: arrow keys and Enter insert the highlighted member as a chip with an id and a space', () => {
    mountEditor();
    editor().click().type('Hi @');
    editor().type('{downarrow}{downarrow}{uparrow}');
    items().eq(1).should('have.class', 'is-selected');
    editor().type('{enter}');

    cy.get('[data-testid="mention-list"]').should('not.exist');
    chips()
      .should('have.length', 1)
      .and('have.attr', 'data-id', 'u-alex')
      .and('have.css', 'color', BRAND_PURPLE);
    editor().type('ok').should('have.text', 'Hi @Alex Chen ok');
  });

  it('AC4: Tab also inserts the highlighted member', () => {
    mountEditor();
    editor().click().type('@ben');
    // cy.type() cannot press Tab; the open list covers the editor, hence force.
    editor().trigger('keydown', { key: 'Tab', force: true });
    chips().should('have.attr', 'data-id', 'u-ben');
  });

  it('AC4: the highlight scrolls into view when moving past the 8th row', () => {
    mountEditor();
    editor().click().type('@');
    editor().type('{downarrow}'.repeat(8));
    items().eq(8).should('have.class', 'is-selected');
    cy.get('.mention-list__items').then(($list) => {
      const listBox = $list[0].getBoundingClientRect();
      const itemBox = $list.find('.is-selected')[0].getBoundingClientRect();
      expect(itemBox.top).to.be.at.least(listBox.top - 1);
      expect(itemBox.bottom).to.be.at.most(listBox.bottom + 1);
    });
  });

  it('AC4: hovering moves the highlight and clicking inserts', () => {
    mountEditor();
    editor().click().type('@');
    items().eq(2).trigger('mouseover');
    items().eq(2).should('have.class', 'is-selected');
    items().eq(0).should('not.have.class', 'is-selected');
    items().eq(2).click();
    chips().should('have.attr', 'data-id', 'u-ben');
  });

  it('AC4 (#9): Esc closes the list and the keys go back to the editor', () => {
    mountEditor();
    editor().click().type('Hi @al');
    cy.get('[data-testid="mention-list"]').should('be.visible');
    editor().type('{esc}');
    cy.get('[data-testid="mention-list"]').should('not.exist');

    editor().type('{enter}');
    chips().should('not.exist');
    editor().find('p').should('have.length', 2);
    editor().find('p').first().should('have.text', 'Hi @al');
  });

  it('AC5: Backspace removes the whole chip', () => {
    mountEditor();
    editor().click().type('Hi @ben{enter}');
    chips().should('have.length', 1);
    editor().type('{backspace}{backspace}');
    chips().should('not.exist');
    editor().should('have.text', 'Hi ');
    cy.get('[data-testid="mention-list"]').should('not.exist');
  });

  it('#10: members loaded after the editor opened are listed', () => {
    function LateUsers() {
      const [users, setUsers] = useState<IUserInfo[]>([]);
      useEffect(() => {
        setTimeout(() => setUsers(mentionUsers), 200);
      }, []);
      return (
        <TipTapEditor
          onSubmit={() => {}}
          onCancel={() => {}}
          users={users}
          aiOptimizeAction="optimizeText"
        />
      );
    }
    cy.mount(<LateUsers />);
    cy.wait(400);
    editor().click().type('@ben');
    items().should('have.length', 1).and('contain', 'Ben Zhou');
  });

  it('#12: shows the placeholder and submits with Cmd/Ctrl + Enter', () => {
    mountEditor(cy.stub().as('onSubmit').resolves());
    cy.get('[data-testid="editor-placeholder"]').should('have.text', PLACEHOLDER);
    editor().click().type('Ping @ben{enter}');
    cy.get('[data-testid="editor-placeholder"]').should('not.exist');

    editor().type(MOD_ENTER);
    cy.get('@onSubmit').should('have.been.calledOnce');
    cy.get('@onSubmit')
      .its('firstCall.args.0')
      .then((content) => {
        const mention = content.content[0].content.find((node) => node.type === 'mention');
        expect(mention.attrs).to.include({ id: 'u-ben', label: 'Ben Zhou' });
      });
    cy.get('[data-testid="editor-placeholder"]').should('be.visible');
  });

  it('#13: keeps the content when submitting fails', () => {
    mountEditor(cy.stub().as('onSubmit').rejects(new Error('Network Error')));
    editor().click().type('Do not lose me');
    cy.contains('button', 'Submit').click();
    cy.get('@onSubmit').should('have.been.calledOnce');
    editor().should('have.text', 'Do not lose me');
    cy.contains('button', 'Submit').should('not.be.disabled');
  });
});
