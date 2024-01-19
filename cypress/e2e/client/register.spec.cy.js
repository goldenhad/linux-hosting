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

describe("Register-Page tests", () => {
  beforeEach(() => {
    // Init Tests to visit localhost
    cy.optin("http://localhost:3000/register");
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
    * Check if company usecase displays additional input
    */
  it("Register displays additional content for companies", () => {
    cy.antselect("#basic_usecase", "Für mein Unternehmen");

    cy.get("#basic_company").should("have.length", 1);
  });

  /**
    * Check if singleuser usecase displays no additional input
    */
  it("Register displays additional content for companies", () => {
    cy.get("#basic_company").should("have.length", 0);
    cy.antselect("#basic_usecase", "Nur für mich persönlich");
    cy.get("#basic_company").should("have.length", 0);
  });


  /**
    * Check if registering does not work with missing data
    */
  it("Register fails with missing data", () => {
    cy.get("#basic_firstname").type("Max");
    cy.get("#basic_lastname").type("Mustermann");
    cy.get("#basic_email").type("test@sugarpool.de");
    //cy.get("#basic_username").type("testdummy");
    cy.get("#basic_password").type("123456");
    cy.get("#basic_passwordwdhl").type("123456");
    cy.antselect("#basic_usecase", "Nur für mich persönlich");

    cy.get("#basic_street").type("Teststraße 1");
    cy.get("#basic_city").type("Teststadt");
    cy.get("#basic_postalcode").type("000000");

    cy.get("#basic_agb").check();

    cy.get("button[type=submit]").click();
    cy.url().should("eq", "http://localhost:3000/register");
  });


  /**
    * Check if working sign up (singleuser)
    */
  it("Register works for singleuser", () => {
    cy.get("#basic_firstname").type("Max");
    cy.get("#basic_lastname").type("Mustermann");
    cy.get("#basic_email").type("test@sugarpool.de");
    cy.get("#basic_username").type("testdummy");
    cy.get("#basic_password").type("123456");
    cy.get("#basic_passwordwdhl").type("123456");
    cy.antselect("#basic_usecase", "Nur für mich persönlich");

    cy.get("#basic_street").type("Teststraße 1");
    cy.get("#basic_city").type("Teststadt");
    cy.get("#basic_postalcode").type("000000");

    cy.get("#basic_agb").check();

    cy.get("button[type=submit]").click();
    cy.url().should("eq", "http://localhost:3000/setup");

    // Delete the account after successfull redirect
    cy.visit("/account");
    cy.contains("Konto löschen").click();
    cy.get("#reauth_email").type("test@sugarpool.de");
    cy.get("#reauth_password").type("123456");
    cy.contains("Login").click();
    cy.contains("Konto entgültig löschen").click();
    cy.url().should("eq", "http://localhost:3000/login");
  });

  /**
    * Check if working sign up (company)
    */
  it("Register works for company", () => {
    cy.get("#basic_firstname").type("Max");
    cy.get("#basic_lastname").type("Mustermann");
    cy.get("#basic_email").type("test@sugarpool.de");
    cy.get("#basic_username").type("testdummy");
    cy.get("#basic_password").type("123456");
    cy.get("#basic_passwordwdhl").type("123456");
    cy.antselect("#basic_usecase", "Für mein Unternehmen");

    cy.get("#basic_company").type("Testunternehmen");

    cy.get("#basic_street").type("Teststraße 1");
    cy.get("#basic_city").type("Teststadt");
    cy.get("#basic_postalcode").type("000000");

    cy.get("#basic_agb").check();

    cy.get("button[type=submit]").click();
    cy.url().should("eq", "http://localhost:3000/setup");

    // Delete the account after successfull redirect
    cy.visit("/account");
    cy.contains("Konto löschen").click();
    cy.get("#reauth_email").type("test@sugarpool.de");
    cy.get("#reauth_password").type("123456");
    cy.contains("Login").click();
    cy.contains("Konto entgültig löschen").click();
    cy.url().should("eq", "http://localhost:3000/login");
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
    