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

## Code Style

[Prettier](https://prettier.io/) is used to ensure consistent style. Single quote and wider print width (100) is used to be similar to the original code style of the project.

`pre-commit` hook to format staged changes is installed automatically when you run `npm install`, so you don't need to do anything. However, it's recommended to [configure your editor](https://prettier.io/docs/en/editors.html) to format on save, and forget about formatting.
