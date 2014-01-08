---
layout: toc
---

<h1>101 Libgit2 Samples</h1>

<h2 id="best_practices">Best Practices</h2>

<h3 id="best_practices_errors">Errors</h3>

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

<h3 id="best_practices_freeing">Freeing</h3>

Anytime libgit2 fills in a non-`const` pointer for you, you should be using a `_free` call to release the resource.

```c
git_repository *repo = NULL;
git_repository_init(&repo, "/tmp/…", false);
/* … */
git_repository_free(repo);
```

([`_free` APIs](http://libgit2.github.com/libgit2/#HEAD/search/_free))


<h2 id="repositories">Repositories</h2>

<h3 id="repositories_init_simple">Init (Simple)</h3>

```c
git_repository *repo = NULL;
/* With working directory: */
int error = git_repository_init(&repo, "/tmp/…", false);
/* …or bare: */
int error = git_repository_init(&repo, "/tmp/…", true);
```

([`git_repository_init`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_init))

<h3 id="repositories_init_options">Init (Options)</h3>

```c
git_repository_init_options opts = GIT_REPOSITORY_INIT_OPTIONS_INIT;
/* Customize options */
git_repository *repo = NULL;
int error = git_repository_init_ext(&repo, "/tmp/…", &opts);
```

([`git_repository_init_ext`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_init_ext),
[`git_repository_init_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_init_options))

<h3 id="repositories_clone_simple">Clone (Simple)</h3>

```c
git_repository *repo = NULL;
const char *url = "http://…";
const char *path = "/tmp/…";
int error = git_clone(&repo, url, path, NULL);
```

([`git_clone`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone))

<h3 id="repositories_clone_progress">Clone (Progress)</h3>

```c
typedef struct { /* … */ } progress_data;
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
progress_data d = {0};
git_clone_options opts = GIT_CLONE_OPTIONS_INIT;
git_checkout_opts checkout_opts = GIT_CHECKOUT_OPTS_INIT;

checkout_opts.checkout_strategy = GIT_CHECKOUT_SAFE_CREATE;
checkout_opts.progress_cb = checkout_progress;
checkout_opts.progress_payload = &d;
clone_opts.checkout_opts = checkout_opts;
clone_opts.remote_callbacks.transfer_progress = &fetch_progress;
clone_opts.remote_callbacks.payload = &d;

git_repository *repo = NULL;
int error = git_clone(&repo, url, path, &opts);
```

([`git_clone`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone),
[`git_clone_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_clone_options))


<h3 id="repositories_clone_repo">Clone (Repo)</h3>

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

<h3 id="repositories_clone_mirror">Clone (Mirror)</h3>

```c
git_repository *repo = NULL;
error = git_repository_init(&repo, "/tmp/…", true);

/* Create an 'origin' remote with the mirror fetch refspec */
git_remote *origin = NULL;
error = git_remote_create_with_fetchspec(&origin, repo, "origin",
                                         "http://…", "+refs/*:refs/*");

/* Set remote.origin.mirror = true for compatibility with git-core */
git_config *cfg = NULL;
error = git_repository_config(&cfg, repo);
error = git_config_set_bool(cfg, "remote.origin.mirror", true);

error = git_clone_into(repo, origin, NULL, NULL);
```

([`git_repository_init`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_init),
[`git_remote_create_with_fetchspec`](http://libgit2.github.com/libgit2/#HEAD/group/remote/git_remote_create_with_fetchspec),
[`git_repository_config`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_config),
[`git_config_set_bool`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_set_bool),
[`git_clone_into`](http://libgit2.github.com/libgit2/#HEAD/group/clone/git_clone_into))

<h3 id="repositories_opening_simple">Opening (Simple)</h3>

```c
git_repository *repo = NULL;
int error = git_repository_open(&repo, "/tmp/…");
```

([`git_repository_open`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_open))

<h3 id="repositories_opening_options">Opening (Options)</h3>

```c
git_repository *repo = NULL;
int error = git_repository_open_ext(&repo, "/tmp/…",
  GIT_REPOSITORY_OPEN_NO_SEARCH, NULL);
```

([`git_repository_open_ext`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_open_ext),
[`git_repository_open_flag_t`](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_open_flag_t))



<h2 id="objects">Objects</h2>

<h3 id="objects_shas_and_oids">SHAs and OIDs</h3>

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


<h3 id="objects_lookups">Lookups</h3>

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


<h3 id="objects_casting">Casting</h3>

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


<h2 id="blobs">Blobs</h2>

<h3 id="blobs_lookups">Lookups</h3>

```c
git_blob *blob = NULL;
int error = git_blob_lookup(&blob, repo, &oid);
```

(
  [`git_blob_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_lookup)
)

<h3 id="blobs_content">Content</h3>

```c
git_off_t rawsize = git_blob_rawsize(blob);
const void *rawcontent = git_blob_rawcontent(blob);

git_buf filtered_content = GIT_BUF_INIT;
int error = git_blob_filtered_content(
  &filtered_content,    /* output buffer */
  blob,                 /* blob */
  "README.md",          /* path (for attribute-based filtering) */
  true);                /* check if binary? */
git_buf_free(&filtered_content);
```

(
  [`git_blob_rawsize`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_rawsize),
  [`git_blob_rawcontent`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_rawcontent),
  [`git_blob_filtered_content`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_filtered_content)
)

<h3 id="blobs_create">Create</h3>

```c
git_oid oid = {{0}};
int error = git_blob_create_fromworkdir(&oid, repo, "README.md");
error = git_blob_create_fromdisk(&oid, repo, "/etc/hosts");

const char str[] = "# Hello there!";
error = git_blob_create_frombuffer(&oid, repo, str, strlen(str));
```

(
  [`git_blob_create_fromworkdir`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_create_fromworkdir),
  [`git_blob_create_fromdisk`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_create_fromdisk),
  [`git_blob_create_frombuffer`](http://libgit2.github.com/libgit2/#HEAD/group/blob/git_blob_create_frombuffer)
)


<h2 id="trees">Trees</h2>

<h3 id="trees_lookups">Lookups</h3>

Each commit has a tree:

```c
git_tree *tree = NULL;
int error = git_commit_tree(&tree, commit);
```

You can look them up by OID:

```c
git_tree *tree = NULL;
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

<h3 id="trees_tree_entries">Tree Entries</h3>

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

<h3 id="trees_walking">Walking</h3>

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

<h3 id="trees_treebuilder">Treebuilder</h3>

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


<h2 id="commits">Commits</h2>

<h3 id="commits_lookups">Lookups</h3>

```c
git_commit *commit;
int error = git_commit_lookup(&commit, repo, &oid);
```

(
  [`git_commit_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_lookup)
)

<h3 id="commits_properties">Properties</h3>

```c
const git_oid *oid             = git_commit_id(commit);
const char *encoding           = git_commit_message_encoding(commit);
const char *message            = git_commit_message(commit);
const char *summmary           = git_commit_summary(commit);
git_time_t time                = git_commit_time(commit);
int offset_in_min              = git_commit_time_offset(commit);
const git_signature *committer = git_commit_committer(commit);
const git_signature *author    = git_commit_author(commit);
const char *header             = git_commit_raw_header(commit);
const git_oid *tree_id         = git_commit_tree_id(commit);
```

(
  [`git_commit_id`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_id),
  [`git_commit_message_encoding`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_message_encoding),
  [`git_commit_message`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_message),
  [`git_commit_summary`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_summary),
  [`git_commit_time`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_time),
  [`git_commit_time_offset`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_time_offset),
  [`git_commit_committer`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_committer),
  [`git_commit_author`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_author),
  [`git_commit_raw_header`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_raw_header),
  [`git_commit_tree_id`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_tree_id)
)

<h3 id="commits_parents">Parents</h3>

```c
unsigned int count = git_commit_parentcount(commit);
for (unsigned int i=0; i<count; i++) {
  git_oid *nth_parent_id = git_commit_parent_id(commit);

  git_commit *nth_parent = NULL;
  int error = git_commit_parent(&nth_parent, commit, i);
  /* … */
}

git_commit *nth_ancestor = NULL;
int error = git_commit_nth_gen_ancestor(&nth_ancestor, commit, 7);
```

(
  [`git_commit_parentcount`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_parentcount),
  [`git_commit_parent_id`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_parent_id),
  [`git_commit_parent`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_parent),
  [`git_commit_nth_gen_ancestor`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_nth_gen_ancestor)
)

<h3 id="commits_create">Create</h3>

```c
git_signature *me = NULL
int error = git_signature_now(&me, "Me", "me@example.com");

const git_commit *parents[] = {parent1, parent2};

git_oid new_commit_id = {{0}};
error = git_commit_create(
  &new_commit_id,
  repo,
  "HEAD",                      /* name of ref to update */
  me,                          /* author */
  me,                          /* committer */
  "UTF-8",                     /* message encoding */
  "Flooberhaul the whatnots",  /* message */
  tree,                        /* root tree */
  2,                           /* parent count */
  parents);                    /* parents */
```

(
  [`git_signature_now`](http://libgit2.github.com/libgit2/#HEAD/group/signature/git_signature_now),
  [`git_commit_create`](http://libgit2.github.com/libgit2/#HEAD/group/commit/git_commit_create)
)


<h2 id="references">References</h2>

<h3 id="references_lookups_full_name">Lookups (full name)</h3>

```c
git_reference *ref = NULL;
int error = git_reference_lookup(&ref, repo, "refs/heads/master");
```

([`git_reference_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_lookup))

<h3 id="references_lookups_short_name">Lookups (short name)</h3>

```c
git_reference *ref = NULL;
int error = git_reference_dwim(&ref, repo, "master");
```

([`git_reference_dwim`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_dwim))

<h3 id="references_lookups_resolved">Lookups (resolved)</h3>

Get the object pointed to by a symbolic reference (or a chain of them).

```c
git_oid oid = {{0}};
int error = git_reference_name_to_id(&oid, repo, "HEAD");
```

([`git_reference_name_to_id`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_name_to_id))

<h3 id="references_listing">Listing</h3>

```c
git_strarray refs = {0};
int error = git_reference_list(&refs, repo);
```

([`git_reference_list`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_list))

<h3 id="references_foreach_refs">Foreach (refs)</h3>

```c
typedef struct { /* … */ } ref_data;

int each_ref_cb(git_reference *ref, void *payload)
{
  ref_data *d = (ref_data*)payload;
  /* … */
}

ref_data d = {0};
int error = git_reference_foreach(repo, each_ref_cb, &d);
```

([`git_reference_foreach`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_foreach))

<h3 id="references_foreach_names">Foreach (names)</h3>

```c
typedef struct { /* … */ } ref_data;

int each_name_cb(const char *name, void *payload)
{
  ref_data *d = (ref_data*)payload;
  /* … */
}

ref_data d = {0};
int error = git_reference_foreach_name(repo, each_name_cb, &d);
```

([`git_reference_foreach_name`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_foreach_name))

<h3 id="references_foreach_glob">Foreach (glob)</h3>

```c
typedef struct { /* … */ } ref_data;

int each_name_cb(const char *name, void *payload)
{
  ref_data *d = (ref_data*)payload;
  /* … */
}

ref_data d = {0};
int error = git_reference_foreach_glob(repo, "refs/remotes/*", each_name_cb, &d);
```

([`git_reference_foreach_glob`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_foreach_glob))

<h3 id="references_iterator_all">Iterator (all)</h3>

```c
git_reference_iterator *iter = NULL;
int error = git_reference_iterator_new(&iter, repo);

git_reference *ref = NULL;
while (!(error = git_reference_next(&ref, iter))) {
  /* … */
}

if (error != GIT_ITEROVER) {
  /* error */
}
```

(
  [`git_reference_iterator_new`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_iterator_new),
  [`git_reference_next`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_next)
)

<h3 id="references_iterator_glob">Iterator (glob)</h3>

```c
git_reference_iterator *iter = NULL;
int error = git_reference_iterator_glob_new(&iter, repo, "refs/heads/*");

const char *name = NULL;
while (!(error = git_reference_next_name(&name, iter))) {
  /* … */
}

if (error != GIT_ITEROVER) {
  /* error */
}
```

(
  [`git_reference_iterator_glob_new`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_iterator_glob_new),
  [`git_reference_next_name`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_next_name)
)

<h3 id="references_create_direct">Create (direct)</h3>

```c
git_reference *ref = NULL;
int error = git_reference_create(&ref, repo,
      "refs/heads/direct",       /* name */
      &oid,                      /* target */
      true);                     /* force? */
```

([`git_reference_create`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_create))

<h3 id="references_create_symbolic">Create (symbolic)</h3>

```c
git_reference *ref = NULL;
int error = git_reference_symbolic_create(&ref, repo,
      "refs/heads/symbolic",     /* name */
      "refs/heads/master",       /* target */
      true);                     /* force? */
```

([`git_reference_symbolic_create`](http://libgit2.github.com/libgit2/#HEAD/group/reference/git_reference_symbolic_create))


<h2 id="tags">Tags</h2>

<h3 id="tags_lookups_annotations">Lookups (annotations)</h3>

```c
git_tag *tag = NULL;
int error = git_tag_lookup(&tag, repo, &oid);
```

([`git_tag_lookup`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_lookup))

<h3 id="tags_listing_all">Listing (all)</h3>

```c
git_strarray tags = {0};
int error = git_tag_list(&tags, repo);
```

([`git_tag_list`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_list))

<h3 id="tags_listing_glob">Listing (glob)</h3>

```c
git_strarray tags = {0};
int error = git_tag_list_match(&tags, "v0.*", repo);
```

([`git_tag_list_match`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_list_match))

<h3 id="tags_foreach">Foreach</h3>

```c
typedef struct { /* … */ } tag_data;

int each_tag(const char *name, git_oid *oid, void *payload)
{
  tag_data *d = (tag_data*)payload;
  /* … */
}

tag_data d = {0};
int error = git_tag_foreach(repo, each_tag, &d);
```

([`git_tag_foreach`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_foreach))

<h3 id="tags_annotation_properties">Annotation Properties</h3>

```c
const git_oid *target_id = git_tag_target_id(tag);
git_otype target_type = git_tag_target_type(tag);
const char *tag_name = git_tag_name(tag);
const git_signature *tagger = git_tag_tagger(tag);
const char *message = git_tag_message(tag);
```

(
  [`git_tag_target_id`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_target_id),
  [`git_tag_target_type`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_target_type),
  [`git_tag_name`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_name),
  [`git_tag_tagger`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_tagger),
  [`git_tag_message`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_message)
)

<h3 id="tags_create_lightweight">Create (lightweight)</h3>

```c
git_oid oid = {{0}};
git_object *target = NULL;

int error = git_revparse_single(&target, repo, "HEAD^{commit}");
error = git_tag_create_lightweight(
      &oid,       /* target ID (see docs) */
      repo,       /* repository */
      "v2.3.4",   /* name */
      target,     /* target */
      false);     /* force? */
```

(
  [`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
  [`git_tag_create_lightweight`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_create_lightweight)
)

<h3 id="tags_create_annotated">Create (annotated)</h3>

```c
git_oid oid = {{0}};
git_object *target = NULL;
git_signature *tagger = NULL;

int error = git_revparse_single(&target, repo, "HEAD^{commit}");
error = git_signature_now(
      &tagger,            /* output */
      "Ben Straub",       /* name */
      "bs@github.com");   /* email */
error = git_tag_create(
      &oid,               /* new object id */
      repo,               /* repo */
      "v2.3.4",           /* name */
      target,             /* target */
      tagger,             /* name/email/timestamp */
      "Released 10/5/11", /* message */
      false);             /* force? */
```

(
  [`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single),
  [`git_signature_now`](http://libgit2.github.com/libgit2/#HEAD/group/signature/git_signature_now),
  [`git_tag_create`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_create)
)

<h3 id="tags_peeling">Peeling</h3>

```c
git_object *dereferenced_target = NULL;
int error = git_tag_peel(&dereferenced_target, tag);
```

(
  [`git_tag_peel`](http://libgit2.github.com/libgit2/#HEAD/group/tag/git_tag_peel)
)


<h2 id="status">Status</h2>

<h3 id="status_iterating_simple">Iterating (Simple)</h3>

```c
typedef struct { /* … */ } status_data;

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

<h3 id="status_iterating_options">Iterating (Options)</h3>

```c
typedef struct { /* … */ } status_data;

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


<h3 id="status_iterating_manual">Iterating (Manual)</h3>

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



<h2 id="diff">Diff</h2>

<h3 id="diff_index_to_workdir">Index to Workdir</h3>

Like `git diff`.

```c
git_diff *diff = NULL;
int error = git_diff_index_to_workdir(&diff, repo, NULL, NULL);
```

([`git_diff_index_to_workdir`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_index_to_workdir))

<h3 id="diff_head_to_index">HEAD to Index</h3>

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

<h3 id="diff_head_to_workdir">HEAD to Workdir</h3>

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

<h3 id="diff_commit_to_its_parent">Commit to Its Parent</h3>

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


<h3 id="diff_rename_detection">Rename detection</h3>

```c
git_diff_find_options opts = GIT_DIFF_FIND_OPTIONS_INIT;
opts.flags = GIT_DIFF_FIND_RENAMES |
             GIT_DIFF_FIND_COPIES |
             GIT_DIFF_FIND_FOR_UNTRACKED;

int error = git_diff_find_similar(diff, &opts);
```

([`git_diff_find_options`](http://libgit2.github.com/libgit2/#HEAD/type/git_diff_find_options),
[`git_diff_find_similar`](http://libgit2.github.com/libgit2/#HEAD/group/diff/git_diff_find_similar))

<h3 id="diff_iterating_deltas">Iterating Deltas</h3>

```c
typedef struct { /* … */ } diff_data;

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

<h3 id="diff_generating_a_patch">Generating a Patch</h3>

A patch represents the text diff of two blobs.

```c
git_patch *patch = NULL;
int error = git_patch_from_diff(&patch, diff, 0);
```

([`git_patch_from_diff`](http://libgit2.github.com/libgit2/#HEAD/group/patch/git_patch_from_diff))


<h2 id="config">Config</h2>

<h3 id="config_files">Files</h3>

```c
char path[1024] = {0};
int error = git_config_find_global(path, 1024);
error = git_config_find_xdg(path, 1024);
error = git_config_find_system(path, 1024);
```

(
  [`git_config_find_global`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_find_global),
  [`git_config_find_xdg`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_find_xdg),
  [`git_config_find_system`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_find_system)
)

<h3 id="config_opening">Opening</h3>

```c
git_config *cfg = NULL;
int error = git_config_open_default(&cfg);
/* or */
error = git_repository_config(&cfg, repo);
```

Once you have a config instance, you can specify which of its levels to operate at:

```c
git_config *sys_cfg = NULL;
int error = git_config_open_level(&sys_cfg, cfg, GIT_CONFIG_LEVEL_SYSTEM);
```

(
  [`git_config_open_default`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_open_default),
  [`git_repository_config`](http://libgit2.github.com/libgit2/#HEAD/group/repository/git_repository_config),
  [`git_config_open_level`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_open_level)
)

<h3 id="config_values_simple">Values (Simple)</h3>

Raw entries are available:

```c
const git_config_entry *entry = NULL;
int error = git_config_get_entry(&entry, cfg, "diff.renames");
```

Or you can let libgit2 do the parsing:

```c
int32_t i32val;
int64_t i64val;
int boolval;
const char *strval;
error = git_config_get_int32(&i32val, cfg, "foo.bar");
error = git_config_get_int64(&i64val, cfg, "foo.bar");
error = git_config_get_bool(&boolval, cfg, "foo.bar");
error = git_config_get_string(&strval, cfg, "foo.bar");
```

Setting values is fairly straightforward.
This operates at the most specific config level; if you want to set a global or system-level value, use `git_config_open_level`.

```c
error = git_config_set_int32(cfg, "foo.bar", 3);
error = git_config_set_int64(cfg, "foo.bar", 3);
error = git_config_set_bool(cfg, "foo.bar", true);
error = git_config_set_string(cfg, "foo.bar", "baz");
```

(
  [`git_config_get_entry`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_get_entry),
  [`git_config_get_int32`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_get_int32),
  [`git_config_get_int64`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_get_int64),
  [`git_config_get_bool`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_get_bool),
  [`git_config_get_string`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_get_string),
  [`git_config_set_int32`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_set_int32),
  [`git_config_set_int64`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_set_int64),
  [`git_config_set_bool`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_set_bool),
  [`git_config_set_string`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_set_string)
)

<h3 id="config_values_multi">Values (Multi)</h3>

Some configuration entries can have multiple values, like `core.gitProxy`.

```c
/* replace values by regex, perhaps many of them */
int error = git_config_set_multivar(cfg,
    "core.gitProxy",           /* config entry name */
    ".*example\.com.*",        /* regex to match */
    "'cat' for example.com");  /* new value */

/* adding a value means replacing one that doesn't exist */
int error = git_config_set_multivar(cfg, "core.gitProxy",
    "doesntexist", "'foo bar' for example.com");
```

Multivars are read either with a foreach loop:

```c
typedef struct { /* … */ } multivar_data;

int foreach_cb(const git_config_entry *entry, void *payload)
{
  multivar_data *d = (multivar_data*)payload;
  /* … */
}

multivar_data d = {0};
int error = git_config_get_multivar_foreach(cfg, "core.gitProxy",
    NULL, foreach_cb, &d);
```

Or an iterator:

```c
git_config_iterator *iter;
git_config_entry *entry;

int error = git_config_multivar_iterator_new(&iter, cfg,
    "core.gitProxy", "regex.*");
while (git_config_next(&entry, iter) == 0) {
  /* … */
}
git_config_iterator_free(iter);
```

(
  [`git_config_set_multivar`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_set_multivar),
  [`git_config_get_multivar`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_get_multivar),
  [`git_config_multivar_iterator_new`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_multivar_iterator_new),
  [`git_config_next`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_next),
  [`git_config_free`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_free)
)

<h3 id="config_iterating">Iterating</h3>

```c
git_config_iterator *iter;
git_config_entry *entry;
int error = git_config_iterator_new(&iter, cfg);
while (git_config_next(&entry, iter) == 0) {
  /* … */
}
```

(
  [`git_config_iterator_new`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_iterator_new),
  [`git_config_next`](http://libgit2.github.com/libgit2/#HEAD/group/config/git_config_next),
)


<h2 id="revwalk">Revwalk</h2>

<h3 id="revwalk_simple">Simple</h3>

```c
git_revwalk *walker;
int error = git_revwalk_new(&walker, repo);
error = git_revwalk_push_range(walker, "HEAD~20..HEAD");

git_oid oid;
while (!git_revwalk_next(&oid, walker)) {
  /* … */
}
```

(
  [`git_revwalk_new`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_new),
  [`git_revwalk_push_range`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_push_range),
  [`git_revwalk_next`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_next)
)

<h3 id="revwalk_pushing_and_hiding">Pushing and Hiding</h3>

```c
/* Pushing marks starting points */
error = git_revwalk_push_head(walker);
error = git_revawlk_push_ref(walker, "HEAD");
error = git_revawlk_push_glob(walker, "tags/*");

/* Hiding marks stopping points */
error = git_revwalk_hide(walker, &oid);
error = git_revwalk_hide_glob(walker, "tags/v0.*");
```

(
  [`git_revwalk_push_head`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_push_head),
  [`git_revwalk_push_ref`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_push_ref),
  [`git_revwalk_push_glob`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_push_glob),
  [`git_revwalk_hide`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_hide),
  [`git_revwalk_hide_glob`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_hide_glob)
)

<h3 id="revwalk_with_options">With Options</h3>

```c
/* Set sorting mode */
git_revwalk_sorting(walker, GIT_SORT_TIME | GIT_SORT_REVERSE);

/* Only walk the first-parent path */
git_revwalk_simplify_first_parent(walker);
```

(
  [`git_revwalk_sorting`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_sorting),
  [`git_revwalk_simplify_first_parent`](http://libgit2.github.com/libgit2/#HEAD/group/revwalk/git_revwalk_simplify_first_parent)
)


<h2 id="checkout">Checkout</h2>

<h3 id="checkout_strategies">Strategies</h3>

`git_checkout_options` isn't actually very optional.
The defaults won't be useful outside of a small number of cases.
The best example of this is `checkout_strategy`; the default value does nothing to the work tree.
So if you want your checkout to check files out, choose an appropriate strategy.

* `NONE` is the equivalent of a dry run; no files will be checked out.
* `SAFE` is similar to `git checkout`; unmodified files are updated, and modified files are left alone.
  If a file was present in the old HEAD but is missing, it's considered deleted, and won't be created.
* `SAFE_CREATE` is similar to `git checkout-index`, or what happens after a clone.
  Unmodified files are updated, and missing files are created, but files with modifications are left alone.
* `FORCE` is similar to `git checkout --force`; all modifications are overwritten, and all missing files are created.

Take a look at the [checkout header](https://github.com/libgit2/libgit2/blob/HEAD/include/git2/checkout.h#files) for extensive explanation of the checkout flags.

<h3 id="checkout_simple">Simple</h3>

```c
/* Checkout from HEAD, something like `git checkout HEAD` */
int error = git_checkout_head(repo, &opts);

/* Checkout from the index */
error = git_checkout_index(repo, &opts);

/* Checkout a different tree */
git_object *treeish = NULL;
error = git_revparse_single(&treeish, repo, "feature_branch1");
error = git_checkout_tree(repo, treeish, &opts);
```

(
  [`git_checkout_head`](http://libgit2.github.com/libgit2/#HEAD/group/checkout/git_checkout_head),
  [`git_checkout_index`](http://libgit2.github.com/libgit2/#HEAD/group/checkout/git_checkout_index),
  [`git_checkout_tree`](http://libgit2.github.com/libgit2/#HEAD/group/checkout/git_checkout_tree),
  [`git_revparse_single`](http://libgit2.github.com/libgit2/#HEAD/group/revparse/git_revparse_single)
)

<h3 id="checkout_paths">Paths</h3>

This limits the checkout operation to only certain paths, kind of like `git checkout … -- path/to/a path/to/b`.

```c
char *paths[] = { "path/to/a.txt", "path/to/b.txt" };
opts.paths.strings = paths;
opts.paths.count = 2;
int error = git_checkout_head(repo, &opts);
```

([`git_strarray`](http://libgit2.github.com/libgit2/#HEAD/type/git_strarray))

<h3 id="checkout_progress">Progress</h3>

```c
typedef struct { /* … */ } progress_data;
void checkout_progress(
            const char *path,
            size_t completed_steps,
            size_t total_steps,
            void *payload)
{
  progress_data *pd = (progress_data*)payload;
  int checkout_percent = total_steps > 0
      ? (100 * completed_steps) / total_steps
      : 0;
  /* Do something with checkout progress */
}

/* … */
progress_data d = {0};
git_checkout_opts opts = GIT_CHECKOUT_OPTS_INIT;
opts.progress_cb = checkout_progress;
opts.progress_payload = &d;

int error = git_checkout_head(repo, &opts);
```

(
  [`git_checkout_opts`](http://libgit2.github.com/libgit2/#HEAD/type/git_checkout_opts),
  [`git_checkout_progress_cb`](http://libgit2.github.com/libgit2/#HEAD/type/git_checkout_progress_cb)
)

<h3 id="checkout_notify">Notify</h3>

```c
typedef struct { /* … */ } notify_data;
static int checkout_notify(
          git_checkout_notify_t why,
          const char *path,
          const git_diff_file *baseline,
          const git_diff_file *target,
          const git_diff_file *workdir,
          void *payload)
{
  notify_data *d = (notify_data*)payload;
  /* … */
}

/* … */
notify_data d = {0};
git_checkout_opts opts = GIT_CHECKOUT_OPTS_INIT;
opts.notify_cb = checkout_notify;
opts.notify_payload = &d;

int error = git_checkout_head(repo, &opts);
```

(
  [`git_checkout_opts`](http://libgit2.github.com/libgit2/#HEAD/type/git_checkout_opts),
  [`git_checkout_notify_t`](http://libgit2.github.com/libgit2/#HEAD/type/git_checkout_notify_t)
)
