# Remove from Project (Classic)

An action to remove an issue from a classic/V1 project board.

## Inputs

- `issue-number` - The number of the issue or pull request to remove
- `project-number` - The number of the project board
- `token` - An authentication token with access to the project board and issue/pull request

`project-owner` can be set if the project board is not in the current organization.

`issue-owner` and `issue-repository` can be specified if the issue or pull request does not exist in the workflow's repository.

Use `fail-not-found: true` if you want the action to fail if the issue or pull request does not exist on the project board.

## Usage

### Remove an issue from a project in the current organization

```yaml
- uses: joshmgross/remove-from-project-classic@main
  with:
    project-number: 123
    issue-number: 10
    token: ${{ secrets.PROJECT_TOKEN }}
```

### Remove an issue form a project another organization

```yaml
- uses: joshmgross/remove-from-project-classic@main
  with:
    project-owner: github
    project-number: 456
    issue-number: 16
    token: ${{ secrets.PROJECT_TOKEN }}
```

### Remove an issue from a separate repository

```yaml
- uses: joshmgross/remove-from-project-classic@main
  with:
    project-number: 123
    issue-owner: actions
    issue-repository: cache
    issue-number: 32
    token: ${{ secrets.PROJECT_TOKEN }}
```

## Not supported yet

- User and repository project boards
- Project cards that are not issues or pull requests
