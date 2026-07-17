# Certificates domain

Student certificates UI for `/dashboard/certificates`.

## Scope

- Placeholder catalog only (`lib/dashboard/mock-certificates.ts`)
- No PDF generation, QR codes, downloads, or LinkedIn sharing
- `verificationUrl` and `downloadUrl` always `null`

## Architecture

- Server page loads `CertificatesView`
- Client for search, filter, sort, and selected preview state
- DTO shape mirrors future certificate API responses

## Extending

Flip `futureFeatures` and fill nullable URLs when backend/storage lands.
Do not invent download links or certificate artwork.
