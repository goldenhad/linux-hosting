/// <reference types="cypress" />

/**
 * *******************************************
 *         Siteware Register-Page Test
 * *******************************************
 * 
 * - Test ability of the user to register
 *  -> As company
 *  -> As Singleuser
 * - Test wrong inputs and corresponding reaction
 * - Test reachability of the login page
 * - Test reachability of the legal pages
 */

describe("Reigster-Page tests", () => {
  beforeEach(() => {
    // Init Tests to visit localhost
    cy.visit("http://localhost:3000/register");
    cy.setCookie("mailbuddy-opt-consent", "1");
    cy.setCookie("mailbuddy-opt-analytics-consent", "1");
  })

  /**
    * Check if all possible inputs are visible
    */
  it("Register displays all inputs and submit button", () => {
    cy.get("#basic_firstname").should("have.length", 1);
    cy.get("#basic_lastname").should("have.length", 1);
    cy.get("#basic_email").should("have.length", 1);
    cy.get("#basic_username").should("have.length", 1);
    cy.get("#basic_password").should("have.length", 1);
    cy.get("#basic_passwordwdhl").should("have.length", 1);
    cy.get("#basic_usecase").should("have.length", 1);

    cy.get("#basic_street").should("have.length", 1);
    cy.get("#basic_city").should("have.length", 1);
    cy.get("#basic_postalcode").should("have.length", 1);

    cy.get("#basic_agb").should("have.length", 1);

    cy.get("button[type=submit]").should("have.length", 1);
  });


  /**
    * Check if all usecase displays additional input
    */
  it("Register displays additional content for companies", () => {
    cy.antselect("#basic_usecase", "Für mein Unternehmen")

    cy.get("#basic_company").should("have.length", 1);
  });


  /**
   * Test if users can reach the register page
   */
  it("Login reachable", () => {
    cy.contains("Login").should("have.length", 1);
    cy.contains("Login").click();
    cy.url().should("eq", "http://localhost:3000/login");
  });

  /**
   * Test if users can reach the Datenschutz page
   */
  it("Datenschutz reachable", () => {
    cy.contains("Datenschutz").should("have.length", 1);
    cy.contains("Datenschutz").click();
    cy.url().should("eq", "http://localhost:3000/privacy");
  });

  /**
   * Test if users can reach the Impressum page
   */
  it("Impressum reachable", () => {
    cy.contains("Impressum").should("have.length", 1);
    cy.contains("Impressum").click();
    cy.url().should("eq", "http://localhost:3000/legal");
  });

  
  
})
    