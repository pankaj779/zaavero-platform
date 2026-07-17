# Settings domain

Student settings UI for `/dashboard/settings`.

## Scope

- Appearance theme via existing `next-themes` provider
- Notification/privacy toggles are local UI state only
- Security, OAuth linking, and danger-zone actions disabled

## Architecture

- Server page loads `SettingsView`
- Client only for theme, toggles, and select placeholders
- Preferences live on `StudentProfileDto.preferences`
