# Github action for syncing files

Right now it is hard coded for a file called syncable-file but should easily be extended to work for any filename input.


### An idea for a structured way to sync files


```yaml
# file: .github/sync.yaml
# repo: github.com/combinationab/truth-repo
# This is the repo running the github action
- example_file_key: src/example.proto # example-file to be synced to others
```



### 
```yaml
# file: /repo-sync.yaml
# repo: github.com/combinationab/syncable-repo
- repo: combinationab/truth-repo # I want to sync files from this truth-repo to my own repo with destination src/protos
  file: example_file_key
  destination: src/protos
  ```
  

