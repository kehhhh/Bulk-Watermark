# Update Signing Keys

This directory contains the cryptographic keys used for signing app updates.

## Files

- `update-key.key` - **PRIVATE KEY** (Never commit this!)
- `update-key.key.pub` - Public key (safe to commit)

## Important Security Notes

⚠️ **The private key (`update-key.key`) should NEVER be committed to Git!**

The `.gitignore` is configured to exclude `*.key` files automatically.

## GitHub Secrets Setup

To enable signed updates in GitHub Actions, you need to add these secrets to your repository:

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `TAURI_SIGNING_PRIVATE_KEY` - Contents of `update-key.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - The password you used when generating the key

## Generating New Keys

If you need to regenerate keys:

```bash
npm run tauri signer generate -- -w src-tauri/keys/update-key.key
```

⚠️ **Warning**: Changing keys will break updates for existing installations!
