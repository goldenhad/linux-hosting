/// <reference types="cypress" />

/**
 * *******************************************
 *     Siteware Sidebar-Component Test (Company)
 * *******************************************
 * 
 * - Test reachability of all pages
 * - Test logout
 */

describe("Sidebar tests for company", () => {
  beforeEach(() => {
    // Init Tests to visit localhost
    cy.optin("http://localhost:3000/login");
    cy.sitewareLogin("test.firma@sugarpool.de", 123456);
    cy.visit("http://localhost:3000/usage");
  })
    
  /**
    * Menu links visible
  */
  it("Menu links visible", () => {
    cy.get("a[data-linkname=\"home\"]").should("have.length", 1);
    cy.get("a[data-linkname=\"profiles\"]").should("have.length", 1);
    cy.get("a[data-linkname=\"usage\"]").should("have.length", 1);
    cy.get("a[data-linkname=\"company\"]").should("have.length", 1);
  
    cy.get("span[data-name=\"profilemenu\"]").click();
    cy.get("a[data-linkname=\"account\"]").should("have.length", 1);
    cy.get("a[data-linkname=\"logout\"]").should("have.length", 1);
  
    cy.get("a[data-linkname=\"home\"]").should("have.length", 1);
  });

  /**
    * Home reachable
  */
  it("Profiles reachable", () => {
    cy.get("a[data-linkname=\"home\"]").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/")
  });
  
  /**
    * Profiles reachable
  */
  it("Profiles reachable", () => {
    cy.get("a[data-linkname=\"profiles\"]").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/profiles")
  });
  
  /**
    * Usage reachable
  */
  it("Usage reachable", () => {
    cy.get("a[data-linkname=\"usage\"]").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/usage")
  });
  
  /**
    * Company reachable
  */
  it("Company reachable", () => {
    cy.get("a[data-linkname=\"company\"]").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/company")
  });
  
  /**
    * Account reachable
  */
  it("Account reachable", () => {
    cy.get("span[data-name=\"profilemenu\"]").click();
    cy.get("a[data-linkname=\"account\"]").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/account")
  });
  
  /**
    * Logout working
  */
  it("Account reachable", () => {
    cy.get("span[data-name=\"profilemenu\"]").click();
    cy.get("a[data-linkname=\"logout\"]").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/login")
  });
    
});