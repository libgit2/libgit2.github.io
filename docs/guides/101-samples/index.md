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



## Objects

### SHAs and OIDs

SHA-1 hashes are usually written as 40 characters of hexadecimal.
These are converted to a binary representation internally, called `git_oid`, and there are routines for converting back and forth.

```c
/* Convert a SHA to an OID */
const char *sha = "4a202b346bb0fb0db7eff3cffeb3c70babbd2045";
git_oid oid = {{0}};
int error = git_oid_fromstr(&oid, sha);

/* Make a shortened printable string from an OID */
char shortsha[10] = {0};
git_oid_tostr(shortsha, 9, &oid);

/* Or libgit2 can allocate a buffer for you */
char *newsha = git_oid_allocfmt(&oid);
/* … */
free(newsha);
```

([`git_oid_fromstr`](http://libgit2.github.com/libgit2/#HEAD/group/oid/git_oid_fromstr),
[`git_oid_tostr`](http://libgit2.github.com/libgit2/#HEAD/group/oid/git_oid_tostr),
[`git_oid_allocfmt`](http://libgit2.github.com/libgit2/#HEAD/group/oid/git_oid_allocfmt))


### Lookups

There are four kinds of objects in a Git repository – commits, trees, blobs, and tag annotations.
Each type of object has an API for doing lookups.

```c
git_commit *commit;
int error = git_commit_lookup(&commit, repo, &oid);

git_tree *tree;
error = git_tree_lookup(&tree, repo, &oid);

git_blob *blob;
error = git_blob_lookup(&blob, repo, &oid);

git_tag tag;
error = git_tag_lookup(&tag, repo, &oid);
```

([`git_commit_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_lookup),
[`git_tree_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_lookup),
[`git_blob_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_lookup),
[`git_tag_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_lookup))


### Casting

`git_object` acts like a "base class" for all of these types.

```c
git_object *obj;
int error = git_object_lookup(&obj, repo, &oid, GIT_OBJ_ANY);
if (git_object_type(obj) == GIT_OBJ_COMMIT) {
  /* This is relatively safe */
  git_commit *commit = (git_commit*)obj;
}
/* etc. */
```

([`git_object_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/object/git_object_lookup),
[`git_object_type`](http://libgit2.github.com/libgit2/#HEAD/group/object/git_object_type),
[`git_otype`](http://libgit2.github.com/libgit2/#HEAD/type/git_otype))


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


## Trees

### Lookups

Each commit has a tree:

```c
git_tree *tree;
int error = git_commit_tree(&tree, commit);
```

You can look them up by OID:

```c
git_tree *tree;
int error = git_tree_lookup(&tree, repo, &oid);
```

Trees can contain trees:

```c
const git_tree_entry *entry = git_tree_entry_byindex(tree, 0);
if (git_tree_entry_type(entry) == GIT_OBJ_TREE) {
  git_tree *subtree = NULL;
  int error = git_tree_lookup(&subtree, repo, git_tree_entry_id(entry));
}
```

([`git_commit_tree`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_tree),
[`git_tree_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_lookup),
[`git_tree_entry_byindex`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_byindex),
[`git_tree_entry_type`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_type))

### Tree Entries

```c
git_object *obj = NULL;
int error = git_revparse_single(&obj, repo, "HEAD^{tree}");
git_tree *tree = (git_tree *)obj;

size_t count = git_tree_entrycount(tree);
git_tree_entry *entry = git_tree_entry_byindex(tree, 0);

const char *name = git_tree_entry_name(entry); /* filename */
git_otype objtype = git_tree_entry_type(entry); /* blob or tree */
git_filemode_t mode = git_tree_entry_filemode(entry); /* *NIX filemode */

git_tree_entry *entry2 = NULL;
error = git_tree_entry_bypath(&entry2, tree, "a/b/c.txt");
git_tree_entry_free(entry2); /* caller has to free this one */
```

([`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
[`git_tree_entrycount`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entrycount),
[`git_tree_entry_byindex`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_byindex),
[`git_tree_entry_name`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_name),
[`git_tree_entry_type`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_type),
[`git_tree_entry_filemode`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_filemode),
[`git_tree_entry_bypath`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_bypath),
[`git_tree_entry_free`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_entry_free))

### Walking

```c
typedef struct { /* … */ } walk_data;

int walk_cb(const char *root,
            const git_tree_entry *entry,
            void *payload)
{
  walk_data *d = (walk_data*)payload;
  /* … */
}

git_object *obj = NULL;
int error = git_revparse_single(&obj, repo, "HEAD^{tree}");
git_tree *tree = (git_tree *)obj;

walk_data d = {0};
error = git_tree_walk(tree, GIT_TREEWALK_PRE, walk_cb, &d);
```

([`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
[`git_tree_walk`](http://libgit2.github.com/libgit2/#HEAD/group/tree/git_tree_walk),
[`git_treewalk_mode`](http://libgit2.github.com/libgit2/#HEAD/type/git_treewalk_mode),
[`git_treewalk_cb`](http://libgit2.github.com/libgit2/#HEAD/type/git_treewalk_cb))

### Treebuilder

```c
git_treebuilder *bld = NULL;
int error = git_treebuilder_create(&bld, NULL);

/* Add some entries */
git_object *obj = NULL;
error = git_revparse_single(&obj, repo, "HEAD:README.md");
error = git_treebuilder_insert(NULL, bld,
                               "README.md",        /* filename */
                               git_object_id(obj), /* OID */
                               0100644);           /* mode */
git_object_free(obj);
error = git_revparse_single(&obj, repo, "v0.1.0:foo/bar/baz.c");
error = git_treebuilder_insert(NULL, bld,
                               "a/b/d.c",
                               git_object_id(obj),
                               0100644);
git_object_free(obj);

git_oid oid = {{0}};
error = git_treebuilder_write(&oid, repo, bld);
git_treebuilder_free(bld);
```

([`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
[`git_object_free`](http://libgit2.github.com/libgit2/#HEAD/group/object/git_object_free),
[`git_treebuilder_create`](http://libgit2.github.com/libgit2/#HEAD/group/treebuilder/git_treebuilder_create),
[`git_treebuilder_insert`](http://libgit2.github.com/libgit2/#HEAD/group/treebuilder/git_treebuilder_insert),
[`git_treebuilder_write`](http://libgit2.github.com/libgit2/#HEAD/group/treebuilder/git_treebuilder_write),
[`git_treebuilder_free`](http://libgit2.github.com/libgit2/#HEAD/group/treebuilder/git_treebuilder_free))
