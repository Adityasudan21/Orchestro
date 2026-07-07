package com.Orchestra.AiAgent.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ResetCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.api.errors.RefAlreadyExistsException;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.transport.RefSpec;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@Slf4j
public class GitService {

    private final UsernamePasswordCredentialsProvider credentials;
    private final PersonIdent author;

    public GitService(
        @Value("${ai-agent.github.token}") String githubToken,
        @Value("${ai-agent.git.author-name}") String authorName,
        @Value("${ai-agent.git.author-email}") String authorEmail
    ) {
        this.credentials = new UsernamePasswordCredentialsProvider("x-access-token", githubToken);
        this.author = new PersonIdent(authorName, authorEmail);
    }

    /** Clone repo, checkout baseBranch, create aiBranch. Returns local path. */
    public Path cloneAndCheckout(String gitLink, String baseBranch, String aiBranch) throws GitAPIException, IOException {
        Path workDir = Files.createTempDirectory("orchestro-ai-");
        try (Git git = Git.cloneRepository()
                .setURI(gitLink)
                .setDirectory(workDir.toFile())
                .setCredentialsProvider(credentials)
                .call()) {
            checkoutBase(git, baseBranch);
            try {
                git.checkout().setCreateBranch(true).setName(aiBranch).call();
            } catch (RefAlreadyExistsException e) {
                // Branch already exists locally (retry after crash) — reset to base HEAD.
                git.checkout().setName(aiBranch).call();
                git.reset().setMode(ResetCommand.ResetType.HARD).setRef("origin/" + baseBranch).call();
            }
        }
        return workDir;
    }

    private void checkoutBase(Git git, String baseBranch) throws GitAPIException {
        try {
            git.checkout().setName(baseBranch).call();
        } catch (GitAPIException e) {
            // Not the default branch — create a local branch tracking the remote one.
            git.checkout()
                .setCreateBranch(true)
                .setName(baseBranch)
                .setStartPoint("origin/" + baseBranch)
                .call();
        }
    }

    /** Stage all changes, commit, push. Returns false if nothing changed. */
    public boolean commitAndPush(Path repoPath, Long taskId, String aiBranch) throws GitAPIException, IOException {
        try (Git git = Git.open(repoPath.toFile())) {
            git.add().addFilepattern(".").call();
            git.add().setUpdate(true).addFilepattern(".").call(); // stage deletions too
            var status = git.status().call();
            if (status.getAdded().isEmpty() && status.getChanged().isEmpty() && status.getRemoved().isEmpty()) {
                log.warn("No changes made by agent for task {}", taskId);
                return false;
            }
            git.commit()
                .setMessage("feat: AI agent implementation for task-" + taskId)
                .setAuthor(author)
                .setCommitter(author)
                .call();
            git.push()
                .setRemote("origin")
                .setRefSpecs(new RefSpec(aiBranch + ":" + aiBranch))
                .setCredentialsProvider(credentials)
                .call();
            log.info("Pushed branch {} for task {}", aiBranch, taskId);
            return true;
        }
    }
}
