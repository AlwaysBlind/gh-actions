const { Octokit } = require("@octokit/core");
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
  for (let name of names) {
    try {
      const resp = await octokit.request(
        "GET /repos/alwaysblind/{repo}/contents/syncable-file",
        { repo: name }
      );
      console.log(resp);
    } catch (e) {
      if (e.status === 404) {
        console.log(`Could not find file in repo ${name} 404`);
      } else {
        console.log("Unexpected error");
      }
    }
  }
};

getRepos();
