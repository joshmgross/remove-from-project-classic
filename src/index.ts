import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/core";
import { graphql } from "@octokit/graphql";

async function run(): Promise<void> {
  try {
    // Inputs and validation
    const issueNumber = Number(core.getInput("issue-number"));
    if (Number.isNaN(issueNumber)) {
      throw new Error("issue-number must be a number");
    }

    const token = core.getInput("token", { required: true });
    const projectNumber = Number(core.getInput("project-number", { required: true }));

    const currentRepository = github.context.payload.repository;
    const projectOwner = core.getInput("project-owner") || currentRepository?.owner.login;
    if (!projectOwner) {
      throw new Error("project-owner must be specified, unable to determine from context");
    }

    const issueOwner = core.getInput("issue-owner") || currentRepository?.owner.login;
    const issueRepository = core.getInput("issue-repository") || currentRepository?.name;
    if (!issueOwner || !issueRepository) {
      throw new Error("issue-owner and issue-repository must be set, unable to determine from context");
    }

    const octokit = new Octokit({
      auth: token
    });

    // https://docs.github.com/en/rest/issues/issues#get-an-issue
    const issue = (
      await octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}", {
        owner: issueOwner,
        repo: issueRepository,
        issue_number: issueNumber
      })
    ).data;

    let databaseId = issue.id;

    // If the issue is a pull request, we need to get the database ID of the pull request
    if (issue.pull_request) {
      // https://docs.github.com/en/rest/pulls/pulls#get-a-pull-request
      const pr = (
        await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
          owner: issueOwner,
          repo: issueRepository,
          pull_number: issueNumber
        })
      ).data;
      databaseId = pr.id;
    }

    core.info(`${issue.pull_request ? "Issue" : "Pull request"} database ID: ${databaseId}`);

    const expectedType = issue.pull_request ? "PullRequest" : "Issue";

    const cards = await getCards(projectOwner, projectNumber, token);
    for (const card of cards) {
      if (expectedType === card.content.__typename && card.content?.databaseId === databaseId) {
        core.info(`Removing ${card.databaseId} from the project`);
        // https://docs.github.com/en/rest/projects/cards#delete-a-project-card
        await octokit.request("DELETE /projects/columns/cards/{card_id}", {
          card_id: card.databaseId
        });

        core.info("🚀 Card removed from project 🚀");
        return;
      }
    }

    // Card not found
    if (core.getBooleanInput("fail-if-not-found")) {
      throw new Error("Card not found");
    }

    core.info("Card not found in project");
  } catch (error) {
    core.setFailed(`❌ Action failed with error: ${error}`);
  }
}

run();

const GET_CARDS_QUERY = `query ($login: String!, $projectNumber: Int!) {
  organization(login: $login) {
    name
    project(number: $projectNumber) {
      databaseId
      name
      url
      columns(first: 10) {
        nodes {
          databaseId
          name
          cards {
            edges {
              node {
                databaseId
                content {
                  __typename
                  ... on Issue {
                    databaseId
                    number
                  }
                  ... on PullRequest {
                    databaseId
                    number
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

interface OrgWithProject {
  organization: {
    name: string;
    project: {
      databaseId: number;
      name: string;
      url: string;
      columns: {
        nodes: [
          {
            databaseId: number;
            name: string;
            cards: {
              edges: [
                {
                  node: Card;
                }
              ];
            };
          }
        ];
      };
    };
  };
}

interface Card {
  databaseId: number;
  content: {
    __typename: "Issue" | "PullRequest";
    databaseId: number;
    number: number;
  };
}

async function getCards(owner: string, project: number, token: string): Promise<Card[]> {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`
    }
  });
  const resp: OrgWithProject = await graphqlWithAuth(GET_CARDS_QUERY, {
    login: owner,
    projectNumber: project
  });

  core.info(`Project: ${resp.organization.project.name}`);

  const cards: Card[] = [];
  for (const column of resp.organization.project.columns.nodes) {
    for (const card of column.cards.edges) {
      cards.push(card.node);
    }
  }

  return cards;
}
