# Siteware

Welcome to the repository for the Siteware AI Assistant project. Siteware enables you to leverage defined AI assistants
to enhance your work experience.

## Setup

To setup the project you need to add an environment file `.env`, the following content:

| Variable                                  | Expected value                                                                |
|-------------------------------------------|-------------------------------------------------------------------------------|
| `OPENAIAPIKEY`                            | API key for openai                                                            |
| `PEPPER`                                  | Pepper used to encrypt user data                                              |
| `NEXT_PUBLIC_FIREBASE_API_KEY`            | Firebase public API key                                                       |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`        | Firebase authentication domain                                                |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`         | Firebase project ID                                                           |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`     | Firebase storage bucket ID                                                    |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase message sender ID                                                    |
| `NEXT_PUBLIC_FIREBASE_APP_ID`             | Firebase app ID                                                               |
| `MAILHOST`                                | Host of the mailserver used by the app                                        |
| `MAILPORT`                                | Port of the mailserver used by the app                                        |
| `MAILUSER`                                | Username of the account used for sending emails                               |
| `MAILPASS`                                | Password of the account used for sending emails                               |
| `MAILENC`                                 | Salt used for encoding the user data in the database                          |
| `BASEURL`                                 | Url on which this app is reacheable. (Used for link construction)             |
| `NEXT_PUBLIC_STRIPEPUB`                   | Stripe public key. Used for all invoicing and checkout related user interaction |
| `STRIPEPRIV`                              | Stripe private key.                                                           |
| `CHATRAPUBKEY`                            | Chatra API key used for integration of the chatra tool                        |
| `SENTRY_AUTH_TOKEN`                       | Sentry authentication token                                                   |
| `SENTRY_IGNORE_API_RESOLUTION_ERROR`      | Sentry option                                                                 |

## Starting the application

The application can be started using the npm commands defined in the `package.json`

| Command | Explanation                                         |
|---------|-----------------------------------------------------|
| `dev`   | Starts the development environment of the application |
| `build` | Builds the nextjs application                       |
| `start` | Launches the builded application                    |
| `lint`  | Checks the code for linting errors                  |
| `test`  | Runs cypress tests                                  |
| `analyze` | Analyzes the package size of the nextjs build       |

## Creating new assistants
