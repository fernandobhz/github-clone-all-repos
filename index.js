#!/usr/bin/env node

const fs = require("fs");
const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");

function cloneRepository(cloneUrl, repoName) {
  console.log(`Cloning ${repoName}...`);
  execSync(`git clone ${cloneUrl}`, { stdio: "inherit" });
}

function listCloneCommands(repos, username) {
  const commands = repos.map((repo) => `git clone https://${username}@github.com/${repo.full_name}`).join("\n");
  fs.writeFileSync("clone-all-repos.txt", commands);
  console.log("Commands to clone all repositories listed in clone-all-repos.txt");
}

async function cloneRepositories(username, token, listCommands) {
  const octokit = new Octokit({ auth: token });

  try {
    const { data: repos } = await octokit.repos.listForUser({ username });

    if (listCommands) {
      listCloneCommands(repos, username);
    } else {
      repos.forEach((repo) => {
        // Check if the user is the owner of the repository
        if (repo.owner.login === username) {
          const cloneUrl = `https://${username}@github.com/${repo.full_name}`;
          cloneRepository(cloneUrl, repo.full_name);
        }
      });
      console.log("All repositories cloned successfully!");
    }
  } catch (error) {
    console.error("Error fetching repositories:", error);
  }
}

function main() {
  const username = process.argv[2];
  const token = process.argv[3];
  const listCommands = process.argv[4] === "--just-list";

  if (!username || !token) {
    console.error("Usage: clone_repos <username> <token> [--just-list]");
    console.error("Make sure to provide your GitHub username and personal access token.");
    console.error("You can generate a personal access token here: https://github.com/settings/tokens");
    process.exit(1);
  }

  cloneRepositories(username, token, listCommands);
}

main();
