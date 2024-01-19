/// <reference types="cypress" />

/**
 * *******************************************
 *         Siteware Login-Page Test
 * *******************************************
 * 
 * - Test ability of the user to login
 * - Test wrong inputs and corresponding reaction
 * - Test reachability of the register page
 * - Test reachability of the legal pages
 */

describe("Login-Page tests", () => {
  beforeEach(() => {
    // Init Tests to visit localhost
    cy.visit("http://localhost:3000/login");
    cy.setCookie("mailbuddy-opt-consent", "1");
    cy.setCookie("mailbuddy-opt-analytics-consent", "1");
    cy.wait(2000);
  })
  
  /**
   * Check if all possible inputs are visible
   */
  it("Login displays two inputs and button", () => {
    cy.get("#basic_email").should("have.length", 1);
    cy.get("#basic_password").should("have.length", 1);
    cy.get("button[type=submit]").should("have.length", 1);
  });

  /**
   * Test if users can reach the reset password page
   */
  it("Password reset reachable", () => {
    cy.get("a:contains('Passwort vergessen')").should("have.length", 1);
    cy.contains("Passwort vergessen").click();
    cy.url().should("eq", "http://localhost:3000/forgot/password");
  });

  /**
   * Test if users can reach the register page
   */
  it("Register reachable", () => {
    cy.contains("Jetzt registrieren").should("have.length", 1);
    cy.contains("Jetzt registrieren").click();
    cy.url().should("eq", "http://localhost:3000/register");
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

  /**
   * Test if users can sign in with correct data
   */
  it("User can sign in", () => {
    cy.get("#basic_email").type("m.krebs@sugarpool.de");
    cy.get("#basic_password").type("abcdefg");
    cy.get("button[type=submit]").then((signingbutton) => {
      signingbutton.trigger("click");

      cy.url().should("eq", "http://localhost:3000/");
    })
  });

  /**
   * Test if users can't sign in with incorrect data
   * and if the app displays an error message
   */
  it("Sign in wrong data", () => {
    cy.get("#basic_email").type("m.krebs@sugarpool.de");
    cy.get("#basic_password").type("wrongpassword1337");
    cy.get("button[type=submit]").then((signingbutton) => {
      signingbutton.trigger("click");

      cy.url().should("eq", "http://localhost:3000/login");
      cy.get(".ant-alert-message").should("have.length", 1);
    })
  });
})
  