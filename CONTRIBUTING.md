# Contributing to marked-extensions

## Dev Commands

Install and build:

```bash
npm install
```

Start a watcher:

```bash
npm run watch
```

## Changesets

[Changesets](https://github.com/atlassian/changesets) are used to automate version bumping and releasing the packages.

If you contribute anything that results in a version bump, you ned to write a changeset describing the changes.

To write a changeset, run `npx changeset` and follow the instructions shown. A new changeset will be added to `.changesets/`.

When changesets are pushed to `master`, a PR will be created automatically to keep track of the next version bump. Merging the PR bumps the versions, and release the affected packages.

See [Adding a changeset](https://github.com/atlassian/changesets/blob/main/docs/adding-a-changeset.md) for more.
