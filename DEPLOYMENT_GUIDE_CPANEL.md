# 🚀 Deploying NEVRA to cPanel

Your app is built and ready! Follow these steps to put it online.

### Step 1: Locate Build Files
1. Go to your project folder: `Z:\NEVRA\dist`
2. You should see:
   - `index.html`
   - `assets/` (folder)
   - `.htaccess`
   - `CNAME`

### Step 2: Zip the Build
1. Select **ALL** files inside the `dist` folder.
2. Right-click -> **Send to** -> **Compressed (zipped) folder**.
3. Name it `nevra-build.zip`.

### Step 3: Upload to cPanel
1. Log in to your **cPanel**.
2. Go to **File Manager**.
3. Open `public_html` (or the folder for your subdomain).
4. **Delete** any existing files (like default index.php) to avoid conflicts.
5. Click **Upload** and select your `nevra-build.zip`.
6. Go back to File Manager.
7. Right-click `nevra-build.zip` -> **Extract**.
8. Delete the zip file after extraction.

### Step 4: Verify .htaccess (Crucial!)
1. In File Manager, click **Settings** (top right).
2. Check **Show Hidden Files (dotfiles)** and Save.
3. Ensure you see `.htaccess` in your folder.
   - *Why?* This file tells the server to let React handle the routing. Without it, refreshing pages like `/chat` will give a 404 error.

### Step 5: Environment Variables
Since this is a static build, your API keys (Supabase, Clerk, etc.) are already "baked in" to the code.
- **Note:** If you change any keys in `.env.local`, you must run `npm run build` again and re-upload.

### Step 6: Test It!
Visit your domain. Your NEVRA app should be live! 
- Try refreshing the page while on `/chat` to ensure the `.htaccess` is working.
