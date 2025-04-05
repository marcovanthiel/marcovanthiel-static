# Marco van Thiel - Static Website

This repository contains a static version of the Marco van Thiel website, built with Hugo and ready for deployment to Cloudflare Pages.

## Features

- Fast, static website with no WordPress dependency
- Multilingual support (Dutch and English)
- Responsive design
- Project portfolio showcase
- Contact information

## Local Development

### Prerequisites

- [Hugo](https://gohugo.io/installation/) (v0.92.2 or later)
- Git

### Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/marcovanthiel.git
   cd marcovanthiel
   ```

2. Start the Hugo development server:
   ```
   hugo server -D
   ```

3. View the site at http://localhost:1313/

## Deployment

This site is configured for deployment to Cloudflare Pages.

### Cloudflare Pages Setup

1. Log in to the Cloudflare dashboard
2. Go to Pages > Create a project > Connect to Git
3. Select this repository
4. Configure with the following build settings:
   - Framework preset: Hugo
   - Build command: `hugo --minify`
   - Build directory: `public`
   - Environment variables:
     - HUGO_VERSION: 0.92.2

## Structure

- `content/`: Multilingual content (nl and en directories)
- `data/`: JSON data files for projects
- `static/`: Images and static assets
- `themes/marcotheme/`: Custom theme files
- `config.yaml`: Main Hugo configuration
- `config/_default/`: Menu configurations

## License

© 2025 Marco van Thiel. All rights reserved.
