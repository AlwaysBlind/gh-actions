"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@octokit/core");
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
console.log("Hello world");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const token = process.env.GH_PAT || process.env.GITHUB_TOKEN;
console.log(token);
const octokit = new core_1.Octokit({ auth: token });
let { graphql } = require("@octokit/graphql");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    graphql = graphql.defaults({
        headers: {
            authorization: `token ${token}`,
        },
    });
    function fetchData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield graphql(query);
                return result.repositoryOwner.repositories.edges.map((edge) => edge.repository);
            }
            catch (error) {
                console.log("ERROR while fetching data from GitHub: ", error);
            }
        });
    }
    const repos = yield fetchData();
    if (repos) {
        const syncObject = getSyncObject(repos);
        dumpYaml(syncObject);
    }
});
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
            return Object.assign(Object.assign({}, acc), { ["alwaysblind/" + repo.name]: ["syncable-file"] });
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
    var _a;
    return (_a = repo.file1) === null || _a === void 0 ? void 0 : _a.text.startsWith("#enable-sync");
};
const dumpYaml = (reposToSync) => {
    const reposYaml = js_yaml_1.default.dump(reposToSync);
    const fileName = ".github/sync.yml";
    fs_1.default.writeFile(fileName, reposYaml, (err) => {
        if (err) {
            console.log("Error while writing file");
        }
        else {
            console.log("successfully wrote file");
            console.log(fs_1.default.readFileSync(fileName, "utf8"));
        }
    });
};
//# sourceMappingURL=graphql.js.map