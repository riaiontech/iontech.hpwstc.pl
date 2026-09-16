# IONTECH Professional Computing Catalog

GitHub Pages-ready static website generated from the supplied IONTECH workstation and thin-client catalog.

## Repository structure

Upload these items directly to the root of your GitHub repository:

- index.html
- admin.html
- 404.html
- robots.txt
- assets/
- Data/
- README.md

The folder name is intentionally **Data** with a capital D to match this package.

## GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/(root)` → Save.

## Admin

Open `/admin.html`. The demo admin uses browser localStorage, so edits are local to the browser/device. It is not a secure shared CMS. Use Export Backup to save changes and Import Backup to restore them.

Demo password is defined in `assets/admin.js` and should be changed before use.
