import yaml from "js-yaml";
import fs from "fs";
const github = require("@actions/github");
console.log("Hello world");

import dotenv from "dotenv";
dotenv.config();
const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
console.log(token);

let { graphql } = require("@octokit/graphql");

const main = async () => {
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payoad :${payload}`);
  graphql = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });

  async function fetchData() {
    try {
      const result = await graphql(query);
      return result.repositoryOwner.repositories.edges.map(
        (edge) => edge.repository
      );
    } catch (error) {
      console.log("ERROR while fetching data from GitHub: ", error);
    }
  }

  const repos = await fetchData();
  if (repos) {
    const syncObject = getSyncObject(repos);
    dumpYaml(syncObject);
  }
};

const query = `query {
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
}`;

main();

function getSyncObject(repos) {
  return repos.reduce((acc, repo) => {
    console.log(repo);
    if (shouldSync(repo)) {
      return { ...acc, ["alwaysblind/" + repo.name]: ["syncable-file"] };
    }
    return acc;
  }, {});
  //   let syncObject = {};
  //   repos.forEach((repo) => {
  //     if (shouldSync(repo)) {
  //       syncObject[repo.name] = ["syncable-file"];
  //     }
  //   });
  //   return syncObject;
}

const shouldSync = (repo) => {
  return repo.file1?.text.startsWith("#enable-sync");
};

const dumpYaml = (reposToSync) => {
  const reposYaml = yaml.dump(reposToSync);
  const fileName = ".github/sync.yml";
  fs.writeFile(fileName, reposYaml, (err) => {
    if (err) {
      console.log("Error while writing file");
    } else {
      console.log("successfully wrote file");
      console.log(fs.readFileSync(fileName, "utf8"));
    }
  });
};
