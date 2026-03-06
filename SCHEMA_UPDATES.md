# Database Schema Updates: Collaboration & Sharing

This document outlines the database schema changes introduced to support collaborative Space sharing and granular Page permissions.

## 1. New Enums
* **`SpaceMemberRole`**: Defines the role of a user within a joined space.
  * `ADMIN`: Can manage the space and its members (currently reserved for the space author or future delegated admins).
  * `MEMBER`: A standard user who has joined the space.
* **`PageVisibility`**: Defines the access level of a specific page within a space.
  * `PRIVATE`: Only the space author (and admins) can view or edit.
  * `VIEW_ONLY`: Joined members can view the page content but cannot edit it.
  * `EDITABLE`: Joined members can both view and edit the page content. (Default for new pages).

## 2. New Model: `SpaceMember`
A new join table `SpaceMember` has been created to establish a many-to-many relationship between `User` and `Space`. This represents the act of a user "Joining" a space.
* **Fields**:
  * `id`: Unique identifier for the membership record.
  * `spaceId`: Links to the `Space` being joined.
  * `userId`: Links to the `User` joining the space.
  * `role`: Enum `SpaceMemberRole`, defaulting to `MEMBER`.
  * `createdAt` / `updatedAt`: Standard timestamps.

## 3. Modifications to Existing Models
* **`Page`**:
  * Added field `visibility` of type `PageVisibility` with a default value of `EDITABLE`. This allows the UI to enforce read-only or hidden states for non-author members.
* **`User`**:
  * Added a `joinedSpaces` relation pointing to the new `SpaceMember` model.
* **`Space`**:
  * Added a `members` relation pointing to the new `SpaceMember` model.

## Will this affect anything existing?
**No.** These changes are strictly additive.
* Existing spaces and pages remain unchanged.
* Existing pages will default to `EDITABLE` (meaning if you eventually share the space, they behave normally).
* Your desktop Electron application (`turbo-yummy`) will remain entirely unaffected, as Prisma simply ignores fields in the database that aren't explicitly queried. If you sync the Prisma schema to the desktop app later, it will gain access to these collaboration features as well.
