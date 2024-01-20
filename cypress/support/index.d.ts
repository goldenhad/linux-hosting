

declare namespace Cypress {
    interface Chainable {
        multiSelect(selector: string, text: string): void;
        antselect(selector: string, text: string): void;
        optin( baseurl: string ): void;
        sitewareLogin(username: string, password: string): void;
    }
}