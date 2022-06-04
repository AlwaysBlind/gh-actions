const { Octokit } = require("@octokit/core");
const readline = require("readline");
const yaml = require("js-yaml");
const fs = require("fs");
console.log("Hello world");

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.GH_PAT;
console.log(token);

const octokit = new Octokit({ auth: token });

const getRepos = async () => {
  const resp = await octokit.request("GET /user/repos", {
    user: "alwaysblind",
  });
  console.log(resp);
  const urls = resp.data.map((repo) => repo.url);
  console.log(urls);
  const names = resp.data.map((repo) => repo.name);
  console.log(names);
  let reposToSync = {};
  for (let name of names) {
    try {
      const resp = await octokit.request(
        "GET /repos/alwaysblind/{repo}/contents/syncable-file",
        { repo: name }
      );
      console.log(resp);
      const content = Buffer.from(resp.data.content, "base64").toString();
      console.log(content);
      const processedContent = content.trim().toLowerCase();

      if (!processedContent.startsWith("#enablesync")) {
        reposToSync["alwaysblind/" + name] = ["syncable-file"];
        console.log("Will not sync file");
        continue;
      }
      reposToSync["alwaysblind/" + name] = ["syncable-file"];
    } catch (e) {
      if (e.status === 404) {
        console.log(`Could not find file in repo ${name} 404`);
      } else {
        console.log("Unexpected error");
      }
    }
  }
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

getRepos();
