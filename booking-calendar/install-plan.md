# Deployment Plan to DigitalOcean Droplet (Revised)

This plan outlines the steps to deploy your Node.js webhook application to a DigitalOcean droplet, incorporating Ubuntu 24.10, `dotenvx` for secrets, and Caddy as the reverse proxy.

## 1. Droplet Provisioning & Initial Setup

*   Create a new **Ubuntu 24.10 (LTS)** Droplet on DigitalOcean.
*   Add your SSH key for secure access.
*   Configure a basic firewall (UFW) to allow SSH, HTTP, and HTTPS.

## 2. Node.js Environment Setup

*   SSH into your Droplet.
*   Install Node.js and npm using `nvm` (Node Version Manager) for flexibility.
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    source ~/.bashrc # or ~/.zshrc depending on your shell
    nvm install --lts
    nvm use --lts
    ```
*   Install `pm2` globally: A production process manager for Node.js applications.
    ```bash
    npm install -g pm2
    ```

## 3. Code Deployment

*   Clone your Git repository onto the Droplet (e.g., into `/var/www/booking-calendar`).
    ```bash
    sudo mkdir -p /var/www/booking-calendar
    sudo chown -R $USER:$USER /var/www/booking-calendar
    git clone <your-repo-url> /var/www/booking-calendar
    cd /var/www/booking-calendar
    ```
*   Install project dependencies:
    ```bash
    npm install
    ```
*   Build the TypeScript project:
    ```bash
    npm run build
    ```

## 4. Secure Environment Variables with `dotenvx`

*   **On your Local Machine (before deployment):**
    *   Ensure `dotenvx` is installed globally (`npm install -g @dotenvx/dotenvx`).
    *   Encrypt your `google-credentials.json` into a `.env.vault` file. From your project root, run:
        ```bash
        dotenvx run -- dotenvx encrypt GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/google-credentials.json
        ```
        This command will generate a `DOTENV_KEY` in your terminal output. **Save this key securely!**
    *   **Crucially:** Ensure your `.gitignore` includes `google-credentials.json` and `.env`.
    *   **Commit `.env.vault` to your Git repository.**
*   **On the Droplet:**
    *   The `dotenvx` package will be installed as a dependency with `npm install`.
    *   The `DOTENV_KEY` (from the previous step) must be set as an environment variable for your PM2 process. We'll configure this in PM2's ecosystem file.

## 5. Application Management with PM2

*   Create a PM2 ecosystem file (e.g., `ecosystem.config.js`) in your project root on the Droplet. This file will define your application and its environment variables, including `DOTENV_KEY`.
    ```javascript
    // ecosystem.config.js
    module.exports = {
      apps : [{
        name   : "booking-webhook",
        script : "./dist/index.js",
        env: {
          "NODE_ENV": "production",
          "DOTENV_KEY": "your_dotenv_key_here" // REPLACE WITH YOUR ACTUAL DOTENV_KEY
        }
      }]
    };
    ```
    (Remember to replace `"your_dotenv_key_here"` with your actual `DOTENV_KEY`).
*   Start your application using PM2:
    ```bash
    pm2 start ecosystem.config.js
    ```
*   Configure PM2 to start on boot:
    ```bash
    pm2 startup systemd
    pm2 save
    ```

## 6. Caddy Reverse Proxy Setup

*   **Install Caddy on the Droplet:**
    ```bash
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy
    ```
*   **Configure Caddyfile:** Create/edit `/etc/caddy/Caddyfile` with your domain and proxy settings:
    ```caddy
    yourdomain.com {
        reverse_proxy localhost:3000
    }
    ```
    (Replace `yourdomain.com` with your actual domain).
*   **Enable and Start Caddy:** Caddy typically starts automatically after installation, but ensure it's enabled:
    ```bash
    sudo systemctl enable caddy
    sudo systemctl start caddy
    ```

## 7. Domain and DNS Configuration

*   Point your domain's A record to your DigitalOcean Droplet's IP address.

## 8. Final Webhook Registration

*   Once your domain is pointing to the Droplet and Caddy is configured, your permanent webhook URL will be `https://yourdomain.com/api/calendar-webhook`.
*   Run the `register-webhook.ts` script *one last time* from your local machine, but update `YOUR_WEBHOOK_URL` to this permanent domain.
    ```bash
    npm run register-webhook
    ```
