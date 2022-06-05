from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport
import os
import asyncio
import yaml
from dotenv import load_dotenv

REPO_OWNER = "alwaysblind"


load_dotenv()

token = os.getenv("GH_PAT")

# Select your transport with a defined url endpoint
transport = AIOHTTPTransport(
    url="https://api.github.com/graphql", headers={"Authorization": f"Bearer {token}"}
)

# Create a GraphQL client using the defined transport
client = Client(transport=transport, fetch_schema_from_transport=True)

query = gql(
    """query {
  repositoryOwner(login: "alwaysblind") {
    repositories(first: 100) {
      totalCount
      edges {
        repository: node {
          name
          file1: object(expression: "HEAD:syncable-file") {
            id
            ... on Blob {
              text
            }
          }
        }
      }
    }
  }
}"""
)


async def main():
    response = await client.execute_async(query)
    repos = [
        x["repository"] for x in response["repositoryOwner"]["repositories"]["edges"]
    ]
    repos = [x for x in repos if x.get("file1", None) is not None]
    sync = {
        f"{REPO_OWNER}/{repo['name']}": "syncable-file"
        for repo in repos
        if repo["file1"]["text"]
    }
    with open("sync.yaml", "w") as f:
        print(f"Writing sync file {sync} to file")
        yaml.dump(sync, f)


def should_sync(repo):
    return (
        repo.get("file1", None) is not None
        and repo["file1"]["text"].st == "syncable-file"
    )


if __name__ == "__main__":
    asyncio.run(main())
