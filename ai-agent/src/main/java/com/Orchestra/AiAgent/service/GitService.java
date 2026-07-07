package com.Orchestra.AiAgent.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
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

    /**
     * Clone repo and check out workBranch: if it already exists on the remote the
     * agent continues on top of it, otherwise it is created from defaultBranch HEAD.
     * Returns local path.
     */
    public Path cloneAndCheckout(String gitLink, String defaultBranch, String workBranch) throws GitAPIException, IOException {
        Path workDir = Files.createTempDirectory("orchestro-ai-");
        try (Git git = Git.cloneRepository()
                .setURI(gitLink)
                .setDirectory(workDir.toFile())
                .setCredentialsProvider(credentials)
                .call()) {
            boolean existsOnRemote = git.getRepository()
                .findRef("refs/remotes/origin/" + workBranch) != null;
            if (existsOnRemote) {
                git.checkout()
                    .setCreateBranch(true)
                    .setName(workBranch)
                    .setStartPoint("origin/" + workBranch)
                    .call();
            } else {
                git.checkout().setName(defaultBranch).call();
                git.checkout().setCreateBranch(true).setName(workBranch).call();
            }
        }
        return workDir;
    }

    /** Stage all changes, commit, push. Returns false if nothing changed. */
    public boolean commitAndPush(Path repoPath, Long taskId, String workBranch) throws GitAPIException, IOException {
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
                .setRefSpecs(new RefSpec(workBranch + ":" + workBranch))
                .setCredentialsProvider(credentials)
                .call();
            log.info("Pushed branch {} for task {}", workBranch, taskId);
            return true;
        }
    }
}
