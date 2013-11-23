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
git_repository *repo = NULL;
git_repository_init(&repo, "/tmp/…", false);
/* … */
git_repository_free(repo);
```

([`_free` APIs](http://libgit2.github.com/libgit2/#HEAD/search/_free))


## Repositories

### Init (Simple)

```c
git_repository *repo = NULL;
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
git_repository *repo = NULL;
int error = git_repository_init_ext(&repo, "/tmp/…", &opts);
```

([`git_repository_init_ext`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_init_ext),
[`git_repository_init_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_init_options))

### Clone (Simple)

```c
git_repository *repo = NULL;
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

git_repository *repo = NULL;
int error = git_clone(&repo, url, path, &opts);
```

([`git_clone`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone),
[`git_clone_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_clone_options))


### Clone (Repo)

```c
git_repository *repo = NULL;
error = git_repository_init(&repo, "/tmp/…", false);
/* Customize the repo */

git_remote *origin = NULL;
error = git_remote_create(&origin, repo, "origin", "http://…");
/* Customize the remote, set callbacks, etc. */

git_checkout_opts co_opts = GIT_CHECKOUT_OPTS_INIT;
error = git_clone_into(repo, origin, &co_opts, "master");
```

([`git_clone_into`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone_into))


### Opening (Simple)

```c
git_repository *repo = NULL;
int error = git_repository_open(&repo, "/tmp/…");
```

([`git_repository_open`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_open))

### Opening (Options)

```c
git_repository *repo = NULL;
int error = git_repository_open_ext(&repo, "/tmp/…",
  GIT_REPOSITORY_OPEN_NO_SEARCH, NULL);
```

([`git_repository_open_ext`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_open_ext),
[`git_repository_open_flag_t`](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_open_flag_t))



## Diff

### Index to Workdir

Like `git diff`.

```c
git_diff *diff = NULL;
int error = git_diff_index_to_workdir(&diff, repo, NULL, NULL);
```

([`git_diff_index_to_workdir`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_index_to_workdir))

### HEAD to Index

Like `git diff --cached`.

```c
git_object *obj = NULL;
int error = git_revparse_single(&obj, repo, "HEAD^{tree}");

git_tree *tree = NULL;
error = git_tree_lookup(&tree, repo, git_object_id(obj));

git_diff *diff = NULL;
error = git_diff_tree_to_index(&diff, repo, tree, NULL, NULL);
```

([`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
[`git_tree_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_lookup),
[`git_diff_tree_to_index`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_tree_to_index))

### HEAD to Workdir

Like `git diff HEAD`.

```c
git_object *obj = NULL;
int error = git_revparse_single(&obj, repo, "HEAD^{tree}");

git_tree *tree = NULL;
error = git_tree_lookup(&tree, repo, git_object_id(obj));

git_diff *diff = NULL;
error = git_diff_tree_to_workdir_with_index(&diff, repo, tree, NULL);
```

([`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
[`git_tree_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_lookup),
[`git_diff_tree_to_workdir_with_index`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_tree_to_workdir_with_index))

### Commit to Its Parent

Like `git show <commit>`.

```c
git_object *obj = NULL;
int error = git_revparse_single(&obj, repo, "committish");

git_commit *commit = NULL;
error = git_commit_lookup(&commit, repo, git_object_id(obj));

git_commit *parent = NULL;
error = git_commit_parent(&parent, commit, 0);

git_tree *commit_tree = NULL, *parent_tree = NULL;
error = git_commit_tree(&commit_tree, commit);
error = git_commit_tree(&parent_tree, parent);

git_diff *diff = NULL;
error = git_diff_tree_to_tree(
          &diff, repo, commit_tree, parent_tree, NULL);
```

([`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
[`git_commit_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_lookup),
[`git_commit_parent`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_parent),
[`git_commit_tree`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_tree),
[`git_diff_tree_to_tree`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_tree_to_tree))


### Rename detection

```c
git_diff_find_options opts = GIT_DIFF_FIND_OPTIONS_INIT;
opts.flags = GIT_DIFF_FIND_RENAMES |
             GIT_DIFF_FIND_COPIES |
             GIT_DIFF_FIND_FOR_UNTRACKED;

int error = git_diff_find_similar(diff, &opts);
```

([`git_diff_find_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_diff_find_options),
[`git_diff_find_similar`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_find_similar))

### Iterating Deltas

```c
int each_file_cb(const git_diff_delta *delta,
                 float progress,
                 void *payload)
{
  diff_data *d = (diff_data*)payload;
  /* … */
}

int each_hunk_cb(const git_diff_delta *delta,
                 const git_diff_hunk *hunk,
                 void *payload)
{
  diff_data *d = (diff_data*)payload;
  /* … */
}

int each_line_cb(const git_diff_delta *delta,
                 const git_diff_hunk *hunk,
                 const git_diff_line *line,
                 void *payload)
{
  diff_data *d = (diff_data*)payload;
  /* … */
}

diff_data d = {0};
int error = git_diff_foreach(diff,
                             each_file_cb,
                             each_hunk_cb,
                             each_line_cb,
                             &d);
```

([`git_diff_foreach`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_foreach),
[`git_diff_file_cb`](http://libgit2.github.com/libgit2/#HEAD/type/git_diff_file_cb),
[`git_diff_hunk_cb`](http://libgit2.github.com/libgit2/#HEAD/type/git_diff_hunk_cb))

### Generating a Patch

A patch represents the text diff of two blobs.

```c
git_patch *patch = NULL;
int error = git_patch_from_diff(&patch, diff, 0);
```

([`git_patch_from_diff`](http://libgit2.github.com/libgit2/#HEAD/group/patch/git_patch_from_diff))


## Status

### Querying

```c
git_status_list *status = NULL;
git_status_options opts = GIT_STATUS_OPTIONS_INIT;
int error = git_status_list_new(&status, &opts);
```

([`git_status_list_new`](http://libgit2.github.com/libgit2/#HEAD/group/status/git_status_list_new))

### Iterating (Simple)

```c
int status_cb(const char *path,
              unsigned int status_flags,
              void *payload)
{
  status_data *d = (status_data*)payload;
  /* … */
}

status_data d = {0};
int error = git_status_foreach(repo, status_cb, &d);
```

([`git_status_foreach`](http://libgit2.github.com/libgit2/#HEAD/group/status/git_status_foreach),
[`git_status_cb`](http://libgit2.github.com/libgit2/#HEAD/type/git_status_cb))

### Iterating (Options)

```c
int status_cb(const char *path,
              unsigned int status_flags,
              void *payload)
{
  status_data *d = (status_data*)payload;
  /* … */
}

git_status_options opts = GIT_STATUS_OPTIONS_INIT;
status_data d = {0};
int error = git_status_foreach_ext(repo, &opts, status_cb, &d);
```

([`git_status_foreach_ext`](http://libgit2.github.com/libgit2/#HEAD/group/status/git_status_foreach_ext),
[`git_status_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_status_options),
[`git_status_cb`](http://libgit2.github.com/libgit2/#HEAD/type/git_status_cb))


### Iterating (Manual)

```c
git_status_options opts = GIT_STATUS_OPTIONS_INIT;
git_status_list *statuses = NULL;
int error = git_status_list_new(&statuses, repo, &opts);

size_t count = git_status_list_entrycount(statuses);
for (size_t i=0; i<count; ++i) {
  const git_status_entry *entry = git_status_byindex(statuses, i);
  /* … */
}
```

([`git_status_list_new`](http://libgit2.github.com/libgit2/#HEAD/group/status/git_status_list_new),
[`git_status_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_status_options),
[`git_status_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_status_options),
[`git_status_list_entrycount`](http://libgit2.github.com/libgit2/#HEAD/group/status/git_status_list_entrycount),
[`git_status_byindex`](http://libgit2.github.com/libgit2/#HEAD/group/status/git_status_byindex),
[`git_status_entry`](http://libgit2.github.com/libgit2/#HEAD/type/git_status_entry))
