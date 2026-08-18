# Install Wizard Scores on an iPhone

Wizard Scores is a Progressive Web App (PWA). You publish it as a private-use website, open it once in Safari, and add it to the iPhone Home Screen. It then launches in its own app-like window and works offline.

No App Store account, Apple developer account, Mac, Xcode, or app review is required.

## What you need

- An iPhone with Safari
- A free GitHub account: <https://github.com/signup>
- Internet access during publishing and the first installation
- GitHub Desktop on the Windows PC: <https://desktop.github.com/download/>
- This project folder:
  `C:\Users\sanderkloet\OneDrive - Microsoft\1. Team\10. Me\Pers\Wizard`

GitHub Pages publishes the application over HTTPS, which iOS requires for reliable installation and offline support. The application source will be hosted on GitHub, but game names, bids, tricks, and scores stay only in the browser storage on the iPhone.

## If the application is already published

If the repository and GitHub Pages site already exist, skip directly to [Install it on the iPhone](#install-it-on-the-iphone). You can find the site address in the repository on GitHub under **Settings > Pages** or in **Actions > Deploy Wizard Scores**.

The address normally looks like one of these:

- `https://YOUR-GITHUB-NAME.github.io/wizard/`
- `https://YOUR-GITHUB-NAME.github.io/REPOSITORY-NAME/`

Do not use `http://localhost:4173` on the iPhone. That address refers to the device on which it is opened, not to the development server on this PC.

## Part 1: Publish the application

These steps are required only for the first installation or when creating a new GitHub repository.

### 1. Install and sign in to GitHub Desktop

1. Download and install GitHub Desktop from <https://desktop.github.com/download/>.
2. Open GitHub Desktop.
3. Select **File > Options > Accounts**.
4. Sign in to your GitHub account.
5. Complete the authorization in the browser if prompted.

### 2. Add this project to GitHub Desktop

1. In GitHub Desktop, select **File > Add local repository**.
2. For **Local path**, choose:
   `C:\Users\sanderkloet\OneDrive - Microsoft\1. Team\10. Me\Pers\Wizard`
3. If GitHub Desktop says this directory is not a Git repository, select **create a repository**.
4. Use these values:
   - **Name:** `wizard`
   - **Description:** `Offline Wizard card game scorekeeper`
   - **Local path:** keep the parent location selected by GitHub Desktop
   - **Git ignore:** `None`
   - **License:** `None`
5. Before confirming, verify that GitHub Desktop will use the existing `Wizard` folder and will not create a second nested folder such as `Wizard\wizard`.
6. Select **Create repository**.

After creation, the changed-files list should include the `app` folder, `.github/workflows/deploy-pages.yml`, and the project documentation. If those files are not visible, stop and use **File > Add local repository** again with the original `Wizard` folder.

### 3. Make the first commit

1. In the lower-left **Summary** field, enter `Initial Wizard Scores app`.
2. Confirm that the files under `app/` and `.github/workflows/deploy-pages.yml` are selected.
3. Select **Commit to main**.

The deployment workflow listens to the `main` branch. If GitHub Desktop shows another branch name, select **Branch > Rename**, enter `main`, and confirm before publishing.

### 4. Publish the repository

1. Select **Publish repository** in GitHub Desktop.
2. Keep the repository name as `wizard`, or choose another short name.
3. Choose repository visibility:
   - **Public** is the simplest option and works with free GitHub Pages accounts.
   - **Private** Pages availability and access controls depend on the GitHub plan. If Pages deployment is unavailable, change the repository to public or use another HTTPS static host.
4. Select **Publish repository**.
5. Select **View on GitHub** after publishing.

Making the repository public exposes only the application code and documentation. It does not upload games or scores from the iPhone.

### 5. Enable GitHub Pages with GitHub Actions

1. Open the repository on GitHub in a desktop browser.
2. Select **Settings** in the repository navigation.
3. In the left sidebar, select **Pages** under **Code and automation**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Return to the repository and select the **Actions** tab.
6. Open the workflow named **Deploy Wizard Scores**.
7. If no run has started, select **Run workflow**, choose `main`, and select **Run workflow** again.
8. Wait for the workflow to show a green check mark. The first deployment normally takes a few minutes.

The included workflow publishes the contents of `app/`; there is no build command or package installation.

### 6. Find and test the public address

1. Open the successful **Deploy Wizard Scores** workflow run.
2. Open the `deploy` job or its deployment link.
3. Select the published URL. It should open the Wizard Scores home screen.
4. Alternatively, find the URL under **Settings > Pages**.
5. Check that the URL begins with `https://` and keep it available to open on the iPhone. Sending it to yourself by email or message is fine.

If GitHub shows a 404 page immediately after a successful deployment, wait one or two minutes and refresh once.

## Part 2: Install it on the iPhone

Use Safari for installation. Opening the address inside an email, chat, or another app's embedded browser may not show the required Home Screen option.

1. On the iPhone, open **Safari**.
2. Enter or paste the GitHub Pages address in Safari's address bar.
3. Wait until the Wizard Scores home screen is fully visible.
4. Tap the **Share** button in Safari. Its icon is a square with an upward arrow.
5. Scroll down in the share sheet and tap **Add to Home Screen**.
6. If **Add to Home Screen** is not visible:
   - Scroll to the bottom and tap **Edit Actions**.
   - Add **Add to Home Screen** to the favorites, then return to the share sheet.
7. On the preview screen, keep the name **Wizard Scores**, or shorten it to **Wizard**.
8. Tap **Add** in the upper-right corner.
9. Return to the Home Screen and tap the Wizard icon.

The installed app should open without Safari's address bar. It is now ready to use like a normal app.

## Part 3: Verify offline use

Do this once after installation so you know the app is ready for a game without internet access.

1. Launch Wizard from its Home Screen icon while still online.
2. Wait a few seconds on the home screen so the offline files can finish caching.
3. Close the app.
4. Turn on **Airplane Mode** from Control Center.
5. Launch Wizard again from the Home Screen icon.
6. Start or resume a game and open **Rules & FAQ**.
7. Confirm that both scoring and the rules reference work.
8. Turn Airplane Mode off afterward.

If it does not open offline, reconnect to the internet, open the installed app once more, wait about ten seconds, close it, and repeat the check.

## Updating the application later

When files are changed on this PC:

1. Open GitHub Desktop and select the Wizard repository.
2. Review the changed files.
3. Enter a short summary such as `Improve score entry`.
4. Select **Commit to main**.
5. Select **Push origin**.
6. On GitHub, open **Actions** and wait for **Deploy Wizard Scores** to finish with a green check mark.
7. On the iPhone, connect to the internet and launch Wizard.
8. Close and relaunch the app after a few seconds. The service worker applies the new version after it has downloaded it.

You do not need to remove and reinstall the Home Screen icon for normal updates. Existing games remain stored on the iPhone unless Safari website data is cleared or the app's local data is deleted.

## Protecting game data

Wizard Scores stores all game data locally on the iPhone. It is not synchronized to GitHub, iCloud, or another phone.

Before clearing Safari data, resetting the iPhone, or moving to a replacement phone:

1. Open Wizard.
2. On the home screen, tap **Export backup**.
3. Save the exported file to iCloud Drive, Files, or another secure location.

The current version exports data for safekeeping and inspection but does not yet provide an in-app import command. Games therefore do not automatically transfer to a replacement phone. Removing only the Home Screen icon normally does not clear Safari website data, but exporting a backup first is still the safest approach before maintenance.

## Troubleshooting

### Add to Home Screen is missing

- Confirm the page is open in Safari, not Chrome or an in-app browser.
- Tap **Share**, scroll to the bottom, and use **Edit Actions**.
- Confirm the page uses an `https://` address, not `localhost` or a local file.
- If the iPhone is managed by an employer or school, a device policy may disable web-app installation.

### The GitHub Pages site shows 404

- Confirm **Settings > Pages > Source** is set to **GitHub Actions**.
- Open **Actions > Deploy Wizard Scores** and verify that the latest run has a green check mark.
- Confirm the repository's default/deployed branch is named `main`.
- Use the exact URL shown under **Settings > Pages**, including the repository name and trailing path.
- Wait a few minutes after the first successful deployment and retry.

### The deployment workflow fails

1. Open **Actions > Deploy Wizard Scores**.
2. Open the failed run and expand the step marked with a red cross.
3. Confirm `.github/workflows/deploy-pages.yml` exists in the repository on the `main` branch.
4. Confirm Pages is configured to use **GitHub Actions**.
5. Select **Re-run all jobs** after correcting the setting.

### The app opens in Safari instead of as an app

Delete only the Home Screen icon, then repeat the installation from Safari using **Share > Add to Home Screen**. Do not create a normal bookmark or Safari favorite.

### The installed app still shows an older version

1. Connect the iPhone to the internet.
2. Open Wizard and leave it open for ten seconds.
3. Close it from the app switcher.
4. Reopen it from the Home Screen icon.

If it remains stale, remove the Home Screen icon and add it again from Safari. Avoid clearing all Safari website data unless necessary because that can erase locally stored games.

### The Home Screen icon still shows the old design

iOS stores the icon when **Add to Home Screen** is performed and does not reliably replace it during normal application updates. After an icon update is deployed:

1. Connect the iPhone to the internet.
2. Open the published Wizard Scores address directly in Safari and refresh the page.
3. Remove the existing Wizard icon from the Home Screen. Choose **Delete Bookmark** or **Remove from Home Screen**, depending on the iOS version.
4. In Safari, tap **Share > Add to Home Screen**.
5. Confirm the preview shows the new blue, red, and yellow Wizard icon, then tap **Add**.

Removing only the Home Screen icon does not normally clear the website's saved games. Do not clear Safari history or website data to refresh an icon.

### Offline mode does not work

- Open the published HTTPS site while online before testing offline.
- Launch the installed app online once and wait several seconds.
- Verify that the latest GitHub Actions deployment succeeded.
- Reconnect, reload the Safari page, reinstall the Home Screen app, and test again.

### Scores or an active game disappeared

Game data belongs to the exact website address. Opening a different repository URL, changing the repository name, switching between `http` and `https`, or clearing Safari website data creates a different or empty storage area. Return to the original GitHub Pages URL and use **Export backup** regularly.

## Installation checklist

- [ ] Project published to a GitHub repository
- [ ] Repository branch named `main`
- [ ] GitHub Pages source set to **GitHub Actions**
- [ ] **Deploy Wizard Scores** completed successfully
- [ ] Published `https://` address opens on the iPhone in Safari
- [ ] **Add to Home Screen** completed
- [ ] Wizard launches from its own Home Screen icon
- [ ] Offline launch and Rules & FAQ tested in Airplane Mode
- [ ] Local-only storage and the current export limitation understood
