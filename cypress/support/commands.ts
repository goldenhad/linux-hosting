/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }


Cypress.Commands.add( "multiSelect", ( selector , text) => {
  cy.get(`.ant-select${selector} > .ant-select-selector > .ant-select-selection-overflow`).click();
  cy.get(`.ant-select${selector} .ant-select-selection-search input`).clear()
  cy.get(`.ant-select${selector} .ant-select-selection-search input`).invoke("attr", "id").then((selElm) => {
    const dropDownSelector = `#${selElm}_list`;
    cy.get(`.ant-select${selector} .ant-select-selection-search input`).type(`${text}`);
    cy.get(dropDownSelector).next().find(".ant-select-item-option-content").click()
  })
});
  
Cypress.Commands.add( "antselect", ( selector , text) => {
  cy.get(selector).click();
  cy
    .get(".ant-select-dropdown :not(.ant-select-dropdown-hidden)")
    .find(".ant-select-item-option")
    .each((el) => {
      if (el.text() === text) {
        cy.wrap(el).click();
      }
    });
})

Cypress.Commands.add( "optin", ( baseurl: string ) => {
  cy.visit(baseurl);
  cy.setCookie("mailbuddy-opt-consent", "1");
  cy.setCookie("mailbuddy-opt-analytics-consent", "1");
});


Cypress.Commands.add( "sitewareLogin", ( username , password) => {
  cy.visit("http://localhost:3000/login");
  cy.get("#basic_email").type(username);
  cy.get("#basic_password").type(password);
  cy.get("button[type=submit]").then((signingbutton) => {
    signingbutton.trigger("click");
  });

  cy.url().should("eq", "http://localhost:3000/");
});