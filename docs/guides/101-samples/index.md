---
layout: toc
---

# 101 Libgit2 Samples

## Best Practices

### Errors

Return codes from public APIs indicate general failure category.
For extended information, libgit2 keeps some data in thread-local storage:

```c
int error = git_repository_open(/*...*/);
if (error < 0) {
  const git_error *e = giterr_last();
  printf("Error %d/%d: %s\n", error, e->klass, e->message);
  exit(error);
}
```
([`giterr_last`](http://libgit2.github.com/libgit2/#HEAD/group/giterr/giterr_last))

### Freeing

Anytime libgit2 fills in a non-`const` pointer for you, you should be using a `_free` call to release the resource.

```c
git_repository *repo;
git_repository_init(&repo, "/tmp/…", false);
/* … */
git_repository_free(repo);
```

([`_free` APIs](http://libgit2.github.com/libgit2/#HEAD/search/_free))


## Repositories

### Init (Simple)

```c
git_repository *repo;
/* With working directory: */
int error = git_repository_init(&repo, "/tmp/…", false);
/* …or bare: */
int error = git_repository_init(&repo, "/tmp/…", true);
```

([`git_repository_init`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_init))

### Init (Options)

```c
git_repository_init_options opts = GIT_REPOSITORY_INIT_OPTIONS_INIT;
/* Customize options */
git_repository *repo;
int error = git_repository_init_ext(&repo, "/tmp/…", &opts);
```

([`git_repository_init_ext`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_init_ext),
[`git_repository_init_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_init_options))

### Clone (Simple)

```c
git_repository *repo;
const char *url = "http://…";
const char *path = "/tmp/…";
int error = git_clone(&repo, url, path, NULL);
```

([`git_clone`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone))

### Clone (Progress)

```c
int fetch_progress(
            const git_transfer_progress *stats,
            void *payload)
{
  progress_data *pd = (progress_data*)payload;
  /* Do something with network transfer progress */
}

void checkout_progress(
            const char *path,
            size_t cur,
            size_t tot,
            void *payload)
{
  progress_data *pd = (progress_data*)payload;
  /* Do something with checkout progress */
}

/* … */
git_clone_options opts = GIT_CLONE_OPTIONS_INIT;
git_checkout_opts checkout_opts = GIT_CHECKOUT_OPTS_INIT;

checkout_opts.checkout_strategy = GIT_CHECKOUT_SAFE_CREATE;
checkout_opts.progress_cb = checkout_progress;
clone_opts.checkout_opts = checkout_opts;
clone_opts.remote_callbacks.transfer_progress = &fetch_progress;

int error = git_clone(&repo, url, path, &opts);
```

([`git_clone`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone),
[`git_clone_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_clone_options))


### Clone (Repo)

```c
git_repository *repo;
error = git_repository_init(&repo, "/tmp/…", false);
/* Customize the repo */

git_remote *origin;
error = git_remote_create(&origin, repo, "origin", "http://…");
/* Customize the remote, set callbacks, etc. */

git_checkout_opts co_opts = GIT_CHECKOUT_OPTS_INIT;
error = git_clone_into(repo, origin, &co_opts, "master");
```

([`git_clone_into`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone_into))


### Opening (Simple)

```c
git_repository *repo;
int error = git_repository_open(&repo, "/tmp/…");
```

([`git_repository_open`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_open))

### Opening (Options)

```c
git_repository *repo;
int error = git_repository_open_ext(&repo, "/tmp/…",
  GIT_REPOSITORY_OPEN_NO_SEARCH, NULL);
```

([`git_repository_open_ext`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_open_ext),
[`git_repository_open_flag_t`](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_open_flag_t))



## Diff

### Worktree to Index

```c

```

### HEAD to Index

```c

```

### Commit to Its Parent

```c

```

### Diffstat

```c

```
