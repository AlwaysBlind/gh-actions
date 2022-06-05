var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const getRepoNames = () => __awaiter(this, void 0, void 0, function* () {
    const resp = yield octokit.request("GET /user/repos", {
        user: "alwaysblind",
    });
    const names = resp.data.map((repo) => repo.name);
    return names;
});
const getContent = (repoName) => __awaiter(this, void 0, void 0, function* () {
    try {
        const resp = yield octokit.request("GET /repos/alwaysblind/{repo}/contents/syncable-file", { repo: repoName });
        const content = Buffer.from(resp.data.content, "base64").toString();
        return content;
    }
    catch (e) {
        if (e.status === 404) {
            console.log(`Could not find file in repo ${repoName} 404`);
        }
        else {
            console.log("Unexpected error");
        }
    }
});
const shouldSync = (content) => {
    if (!content) {
        return false;
    }
    const processedContent = content.trim().toLowerCase();
    return !processedContent.startsWith("#enablesync");
};
const getSyncObject = (names) => __awaiter(this, void 0, void 0, function* () {
    let reposToSync = {};
    for (let name of names) {
        const content = yield getContent(name);
        if (shouldSync(content)) {
            reposToSync[name] = ["syncable-file"];
        }
    }
    return reposToSync;
});
const dumpYaml = (reposToSync) => {
    const reposYaml = yaml.dump(reposToSync);
    const fileName = ".github/sync.yml";
    fs.writeFile(fileName, reposYaml, (err) => {
        if (err) {
            console.log("Error while writing file");
        }
        else {
            console.log("successfully wrote file");
            console.log(fs.readFileSync(fileName, "utf8"));
        }
    });
};
const writeSyncFile = () => __awaiter(this, void 0, void 0, function* () {
    const names = yield getRepoNames();
    const syncObject = yield getSyncObject(names);
    dumpYaml(syncObject);
});
writeSyncFile();
//# sourceMappingURL=test.js.map