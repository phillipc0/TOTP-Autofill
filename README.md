# TOTP Autofill (Firefox & Chrome MV3 Extension)

Browser Add-On that automatically fills in 2FA codes for each website

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

1. Visit: https://addons.mozilla.org/de/firefox/addon/totp-autofill/ or search for "TOTP Autofill" in the extension
   store
2. Click Add to Firefox (Optionally: Allow in private windows) and confirm

### Install manually with .zip/.xpi file (Chrome & Alternative)

Warning: You will **not** receive any automatic updates using this method.

1. Visit [GitHub Releases](https://github.com/phillipc0/TOTP-Autofill/releases)
2. Download the .zip/.xpi file of the newest release
3. For **Chrome**:
    1. Unpack the .zip file into a permanent location
    2. Visit `chrome://extensions` and enable developer mode (top-left)
    3. Click load extension and select the folder containing the extension files
4. For **Firefox**, either:
    1. Drag the .xpi file from the file explorer into a Firefox window and confirm
    2. Open the .xpi file with Firefox and confirm

## Development

To temporarily build the extension yourself and change its functionality:

1. Clone/Fork the repository
2. Do your changes to the code
3. For:
    1. Firefox: Visit `about:debugging` and click on load temporary add-on, there select the manifest.json
    2. Chrome: Visit `chrome://extensions` and click on load extension, there select the folder containing the
       manifest.json

## Feature Requests

Simply create an Issue in GitHub and respond to any comments by me.

## License

MPL2.0
