#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");

function generateScriptExtension() {
  return os.platform() === "win32" ? "bat" : "sh";
}

function cloneRepository(cloneUrl, repoName) {
  console.log(`Cloning ${repoName}...`);
  execSync(`git clone ${cloneUrl}`, { stdio: "inherit" });
}

async function listAllRepositories(octokit) {
  let repos = [];
  let page = 1;

  while (true) {
    const response = await octokit.repos.listForAuthenticatedUser({
      per_page: 100, // Fetch 100 repositories per page
      page: page++,
    });

    if (response.data.length === 0) {
      break; // No more repositories to fetch
    }

    repos = repos.concat(response.data);
  }

  return repos;
}

function listCloneCommands(repos, username) {
  const commands = repos.map((repo) => `git clone https://${username}@github.com/${repo.full_name}`).join("\n");
  fs.writeFileSync(`clone-all-repos.${generateScriptExtension()}`, commands);
  console.log(`Commands to clone all repositories listed in clone-all-repos.${generateScriptExtension()}`);
}

async function cloneRepositories(username, token, justList, justMyRepos) {
  const octokit = new Octokit({ auth: token });

  try {
    let repos = await listAllRepositories(octokit);

    if (justMyRepos) {
      repos = repos.filter((repo) => repo.owner.login === username);
    }

    if (justList) {
      return listCloneCommands(repos, username);
    }

    repos.forEach((repo) => {
      const cloneUrl = `https://${username}@github.com/${repo.full_name}`;
      cloneRepository(cloneUrl, repo.full_name);
    });

    console.log("All repositories cloned successfully!");
  } catch (error) {
    console.error("Error fetching repositories:", error);
  }
}

function main() {
  const username = process.argv[2];
  const token = process.argv[3];
  const justList = process.argv[4] === "--just-list";
  const justMyRepos = process.argv[5] === "--just-my-repos";

  if (!username || !token) {
    console.error("Usage: clone_repos <username> <token> [--just-list] [--just-my-repos]");
    console.error("Make sure to provide your GitHub username and personal access token.");
    console.error("You can generate a personal access token here: https://github.com/settings/tokens");
    process.exit(1);
  }

  cloneRepositories(username, token, justList, justMyRepos);
}

main();
