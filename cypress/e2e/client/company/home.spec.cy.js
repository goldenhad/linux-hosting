/// <reference types="cypress" />

/**
 * *******************************************
 *     Siteware Home-Page Test (Company)
 * *******************************************
 * 
 * - Test ability of the user to see the home page
 * - Test availibility of the assistants
 * - Test category functionality
 * - Test fav feature
 */

describe("Home-Page tests for company", () => {
  beforeEach(() => {
    // Init Tests to visit localhost
    cy.optin("http://localhost:3000/login");
    cy.sitewareLogin("test.firma@sugarpool.de", 123456);
  })

  /**
   * Test if all current configurators are available
   */
  it("Assistantcards visible", () => {
    cy.get(".ant-card").should("have.length", 7);
  });

  /**
   * Test Dialog reachable
   */
  it("Dialog reachable", () => {
    cy.get("a[attribute-assistantname=\"dialog-link\"]").should("have.length", 1);
    cy.get("a[attribute-assistantname=\"dialog-link\"]").click();
    cy.url().should("eq", "http://localhost:3000/assistants/dialog");
    cy.contains("Wie soll der Dialog fortgesetzt werden?").should("have.length", 1);
  });

  /**
   * Test Monolog reachable
   */
  it("Monolog reachable", () => {
    cy.get("a[attribute-assistantname=\"monolog-link\"]").should("have.length", 1);
    cy.get("a[attribute-assistantname=\"monolog-link\"]").click();
    cy.url().should("eq", "http://localhost:3000/assistants/monolog");
    cy.contains("Worum soll es in der E-Mail gehen?").should("have.length", 1);
  });

  /**
   * Test Excel reachable
   */
  it("Excel reachable", () => {
    cy.get("a[attribute-assistantname=\"excel-link\"]").should("have.length", 1);
    cy.get("a[attribute-assistantname=\"excel-link\"]").click();
    cy.url().should("eq", "http://localhost:3000/assistants/excel");
    cy.contains("Wie lautet deine Frage?").should("have.length", 1);
  });

  /**
   * Test fav function
   */
  it("Test fav", () => {
    // Click the fav button for the two assistant cards
    cy.get("span[data-favname=\"monolog-fav\"]").click();
    cy.get("span[data-favname=\"dialog-fav\"]").click();
    // Switch to the fav tab
    cy.get("li[data-function=\"fav\"]").click();
    // Test that only two cards are visible
    cy.get(".ant-card").should("have.length", 2);
    // Switch back to all cards
    cy.get("li[data-function=\"all\"]").click();
    // Validate that all cards are visible
    cy.get(".ant-card").should("have.length", 7);
    // Unfav cards
    cy.get("[data-favname=\"monolog-fav\"]").click();
    cy.get("span[data-favname=\"dialog-fav\"]").click();
  });


});