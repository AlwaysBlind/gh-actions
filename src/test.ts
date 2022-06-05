const { Octokit } = require("@octokit/core");
const readline = require("readline");
const yaml = require("js-yaml");
const fs = require("fs");
console.log("Hello world");

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
console.log(token);

const octokit = new Octokit({ auth: token });

const getRepoNames = async () => {
  const resp = await octokit.request("GET /user/repos", {
    user: "alwaysblind",
  });
  const names = resp.data.map((repo) => repo.name);
  return names;
};

const getContent = async (repoName) => {
  try {
    const resp = await octokit.request(
      "GET /repos/alwaysblind/{repo}/contents/syncable-file",
      { repo: repoName }
    );
    const content = Buffer.from(resp.data.content, "base64").toString();
    return content;
  } catch (e) {
    if (e.status === 404) {
      console.log(`Could not find file in repo ${repoName} 404`);
    } else {
      console.log("Unexpected error");
    }
  }
};

const shouldSync = (content) => {
  if (!content) {
    return false;
  }
  const processedContent = content.trim().toLowerCase();
  return !processedContent.startsWith("#enablesync");
};

const getSyncObject = async (names) => {
  let reposToSync = {};
  for (let name of names) {
    const content = await getContent(name);
    if (shouldSync(content)) {
      reposToSync[name] = ["syncable-file"];
    }
  }
  return reposToSync;
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

const writeSyncFile = async () => {
  const names = await getRepoNames();
  const syncObject = await getSyncObject(names);
  dumpYaml(syncObject);
};

writeSyncFile();
