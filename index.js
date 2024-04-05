#!/usr/bin/env node
const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");

function cloneRepository(cloneUrl, repoName) {
    console.log(`Cloning ${repoName}...`);
    execSync(`git clone ${cloneUrl}`, { stdio: 'inherit' });
}

async function cloneRepositories(username, token) {
    const octokit = new Octokit({ auth: token });

    try {
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({ username });
        
        repos.forEach((repo) => {
            const cloneUrl = `https://${username}@github.com/${repo.full_name}.git`;
            cloneRepository(cloneUrl, repo.full_name);
        });

        console.log("All repositories cloned successfully!");
    } catch (error) {
        console.error("Error fetching or cloning repositories:", error);
    }
}

function main() {
    const username = process.argv[2];
    const token = process.argv[3];

    if (!username || !token) {
        console.error("Usage: node clone_repos.js <username> <token>");
        console.error("Usage: clone_repos <username> <token>");
        console.error("Make sure to provide your GitHub username and personal access token.");
        console.error("You can generate a personal access token here: https://github.com/settings/tokens");
        process.exit(1);
    }

    cloneRepositories(username, token);
}

main();
