# Cloudflare Pages Deployment Instructions

To deploy this static Hugo site to Cloudflare Pages, follow these steps:

1. Log in to your Cloudflare account (marco@marcovanthiel.nl)
2. Navigate to the Cloudflare dashboard
3. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
4. Select GitHub as your Git provider and authenticate if needed
5. Select the repository **marcovanthiel/marcovanthiel-static**
6. Configure your build settings:
   - **Project name**: marcovanthiel
   - **Production branch**: main
   - **Framework preset**: Hugo
   - **Build command**: hugo --minify
   - **Build directory**: public
   - **Environment variables**:
     - HUGO_VERSION: 0.92.2

7. Click **Save and Deploy**

After deployment, your site will be available at a *.pages.dev URL. You can then configure your custom domain (marcovanthiel.nl) in the Cloudflare Pages settings.

## Custom Domain Setup

1. In the Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: marcovanthiel.nl
4. Follow the verification steps
5. Update your DNS settings to point to Cloudflare Pages

## Continuous Deployment

With the GitHub integration, any changes pushed to the main branch will automatically trigger a new build and deployment.
