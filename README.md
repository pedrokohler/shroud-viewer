# Shroud of Turin — Deep Zoom Viewer

Interactive deep-zoom viewer for high-resolution Shroud of Turin imagery, built with [OpenSeadragon](https://openseadragon.github.io/).

## Live site

**GitHub Pages:** [https://pedrokohler.github.io/shroud-viewer/](https://pedrokohler.github.io/shroud-viewer/)

Deep-zoom tiles and gallery thumbnails are served from Google Cloud Storage (`storage.googleapis.com/shroud_images`).

## Local development

1. Generate tiles (requires Python 3 + Pillow): `python3 generate_tiles.py`
2. Serve the folder: `python3 -m http.server 8080`
3. Open `http://localhost:8080`

## Image sources

Photographs from [Wikimedia Commons — Shroud of Turin](https://commons.wikimedia.org/wiki/Category:Shroud_of_Turin) (public domain / CC BY 4.0).

## GCS deployment

- Bucket: `gs://shroud_images`
- CORS: see `cors.json` (allows `https://pedrokohler.github.io` and localhost)
- Public read: `roles/storage.objectViewer` for `allUsers`

```bash
gcloud storage cp -r tiles/ gs://shroud_images/tiles/
gcloud storage cp -r images/ gs://shroud_images/images/
```
