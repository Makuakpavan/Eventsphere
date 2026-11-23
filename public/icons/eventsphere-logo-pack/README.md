# EventSphere logo pack

- `logo/eventsphere-logo.svg`: editable vector logo
- `logo/eventsphere-logo-transparent.png`: transparent wordmark
- `logo/eventsphere-logo-white.png`: white-background wordmark
- `icons/`: 192px and 512px square app icon variants

## Use in the Next.js app
Copy `logo/eventsphere-logo.svg` to `public/eventsphere-logo.svg`, then use:
`<Image src="/eventsphere-logo.svg" alt="EventSphere" width={240} height={84} priority />`

For the PWA, copy a 192px and 512px icon into `public/icons/` and update the paths in
`public/manifest.webmanifest`. Keep the existing assets backed up until you check desktop and mobile.
