# Remove from Project (Classic)

An action to remove an issue from a classic/V1 project board.

## Inputs

- `issue-number` - The number of the issue or pull request to remove
- `project-owner` - The organization that contains the project
- `project-number` - The number of the project board
- `token` - An authentication token with access to the project board and issue/pull request

`issue-owner` and `issue-repository` can be specified if the issue or pull request does not exist in the workflow's repository.

Use `fail-not-found: true` if you want the action to fail if the issue or pull request does not exist on the project board.

## Usage

### Remove an issue from a project board

```yaml
- name: Post message
  uses: joshmgross/remove-from-project-classic@main
  with:
    issue-number: 1234
    project-owner: github
    project-number: 5678
    token: ${{ secrets.PROJECT_TOKEN }}
```

## Not supported (yet)

- User and repository project boards
- Project cards that are not issues or pull requests
