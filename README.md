# TOTP Autofill (Firefox MV2 Extension)

Firefox Add-On that automatically fills in 2FA codes for each website

## Disclaimer

**This Extension should not be used for websites which require a secure login.**

TOTP Codes are specifically designed to act as a second factor,
which is weakened by storing it on the same device you are logging in from
and storing it unencrypted in browser storage.
The Extension was **not rigorously tested for security**
and cannot guaranty the TOTP secrets are secured from malicious websites or other applications.

## Features

- Automatically finds relevant input fields
- Allows a different TOTP secret for each website (fqdn)
- Custom TOTP size and time period allowed
- Settings page to manage all configured websites

## Installation

### Install over Firefox Extensions (Recommended)

1. Visit: [URL] or search for "TOTP Autofill" in the extension store
2. Click Add to Firefox (Optionally: Allow in private windows) and confirm

### Install manually with .xpi file

1. Visit GitHub Releases [URL]
2. Download the .xpi file of the newest release
3. Either:
    1. Drag the file from the file explorer into a Firefox window and confirm
    2. Open the file with Firefox and confirm

## Development

To temporarily build the extension yourself and change its functionality:

1. Clone/Fork the repository
2. Do your changes to the code
3. Visit `about:debugging` in Firefox and click on load temporary add-on, there select the manifest.json

## Feature Requests

Simply create an Issue in GitHub and respond to any comments by me.

## License

I still do not understand what to put here.
