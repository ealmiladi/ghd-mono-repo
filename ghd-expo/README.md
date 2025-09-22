# Welcome to your BlazeFast app 👋

This is an [Expo](https://expo.dev) project pre-configured with [BlazeFast](https://blazefa.st). BlazeFast is a starter framework for Firebase web and mobile apps.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Setup your project directories

   ```bash
    npx expo prebuild --clean
   ```

This will set up `ios` and `android` for you to run your project on a simulator or device.

## Configure Firebase

- Verify you have enabled the proper sign-in methods in the Firebase console. You *must* enable Google sign-in, even if you don't offer it as an authentication method.
- Verify you've deployed the BlazeFast starter cloud functions and BlazeFast security rules to your Firebase project.

## Run your app

When you're ready, run:

```bash
npm run ios
```

Similarly, you can run:

```bash
npm run android
```
