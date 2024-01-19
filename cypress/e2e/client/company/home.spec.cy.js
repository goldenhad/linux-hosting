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

});