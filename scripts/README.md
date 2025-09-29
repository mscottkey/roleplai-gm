# Administrative Scripts

This directory contains scripts for performing administrative tasks that require the Firebase Admin SDK.

## Setting an Admin User

The `set-admin.mjs` script is used to grant a user administrative privileges by setting a custom claim on their Firebase Authentication account.

### Prerequisites

1.  **Node.js**: You must have Node.js installed on your local machine.
2.  **Firebase Admin SDK**: This script requires the `firebase-admin` package. It's already listed in your `package.json`.
3.  **Service Account Key**: You need a service account key from your Firebase project.
    *   Go to your Firebase Console.
    *   Navigate to **Project Settings** (click the gear icon ⚙️).
    *   Go to the **Service accounts** tab.
    *   Click the **Generate new private key** button.
    *   A JSON file will be downloaded. Rename this file to `service-account.json` and place it in the root directory of this project. **Do not commit this file to version control.**

### Usage

Run the script from your terminal in the project's root directory, passing the email of the user you want to make an admin as an argument.

```bash
node scripts/set-admin.mjs user@example.com
```

Replace `user@example.com` with the actual email address of the target user.

If successful, the script will print a success message. The user will gain admin access the next time they sign in or their authentication token is refreshed (which typically happens every hour).
