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
  
  it("login displays two inputs and button", () => {
    cy.get("#basic_email").should("have.length", 1);
    cy.get("#basic_password").should("have.length", 1);
    cy.get("button[type=submit]").should("have.length", 1);
  });

  it("user can sign in", () => {
    cy.get("#basic_email").type("m.krebs@sugarpool.de");
    cy.get("#basic_password").type("abcdefg");
    cy.get("button[type=submit]").then((signingbutton) => {
      signingbutton.trigger("click");

      cy.url().should("eq", "http://localhost:3000/");
    })
  });

  it("sign in wrong data", () => {
    cy.get("#basic_email").type("m.krebs@sugarpool.de");
    cy.get("#basic_password").type("wrongpassword1337");
    cy.get("button[type=submit]").then((signingbutton) => {
      signingbutton.trigger("click");

      cy.url().should("eq", "http://localhost:3000/login");
      cy.get(".ant-alert-message").should("have.length", 1);
    })
  });
})
  