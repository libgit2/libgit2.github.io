---
layout: default
---

# Init From the Ground Up

This is an example program that works similarly to `git init`.
Many of the options available to the git command line tool map easily to concepts in libgit2.

## Error handling

Every program needs a way to handle fatal errors.
This particular solution isn't actually very good, but it'll do for now.

```c
static void fail(const char *msg, const char *arg)
{
  if (arg)
    fprintf(stderr, "%s %s\n", msg, arg);
  else
    fprintf(stderr, "%s\n", msg);
  exit(1);
}
```

And what kind of command line tool would we be without a usage display?
This one doubles as a way of displaying errors.

```c
static void usage(const char *error, const char *arg)
{
  fprintf(stderr, "error: %s '%s'\n", error, arg);
  fprintf(stderr, "usage: init [-q | --quiet] [--bare] "
                  "[--template=<dir>] [--shared[=perms]] <directory>\n");
  exit(1);
}
```

## Argument Parsing

Most of the code in this sample has to do with parsing command-line arguments.
First up is a utility that will help with prefixed arguments (i.e. `--template=<dir>`).
The return value seems a bit weird, but it'll make sense later on.

```c
static size_t is_prefixed(const char *arg, const char *pfx)
{
  size_t len = strlen(pfx);
  return !strncmp(arg, pfx, len) ? len : 0;
}
```

The `--shared` option has a somewhat complicated argument. Here's the code to parse that.

```c
static uint32_t parse_shared(const char *shared)
{
  if (!strcmp(shared, "false") || !strcmp(shared, "umask"))
    return GIT_REPOSITORY_INIT_SHARED_UMASK;
  
  else if (!strcmp(shared, "true") || !strcmp(shared, "group"))
    return GIT_REPOSITORY_INIT_SHARED_GROUP;
  
  else if (!strcmp(shared, "all") || !strcmp(shared, "world"))
    return GIT_REPOSITORY_INIT_SHARED_ALL;
  
  else if (shared[0] == '0') {
    long val;
    char *end = NULL;
    val = strtol(shared+1, &end, 8);
    if (end == shared + 1 || *end != 0)
      usage("invalid octal value for --shared", shared);
    return (uint32_t)val;
  }
  
  else
    usage("unknown value for --shared", shared);
  
  return 0;
}
```

## Main Entry Point

Let's take the main function in pieces.
First, as C89 requires, we declare all of our variables at the top of the scope.

```c
int main(int argc, char *argv[])
{
  git_repository *repo = NULL;
  int no_option = 1, quiet = 0, bare = 0, initial_commit = 0, i;
  uint32_t shared = GIT_REPOSITORY_INIT_SHARED_UMASK;
  const char *template = NULL, *gitdir = NULL, *dir = NULL;
  size_t pfxlen;
  
```

Next, we do our global library initialization like good citizens:

```c
  git_threads_init();
```

Now it's time to parse all those arguments.
Let's take care of the simple cases first.

```c
  for (i = 1; i < argc; ++i) {
    char *a = argv[i];

    if (a[0] == '-')
      no_options = 0;

    if (a[0] != '-') {
      if (dir != NULL)
        usage("extra argument", a);
      dir = a;
    }
    else if (!strcmp(a, "-q") || !strcmp(a, "--quiet"))
      quiet = 1;
    else if (!strcmp(a, "--bare"))
      bare = 1;
```

Here's how that `is_prefixed` call come into play.
We use its return code to both detect a `--opt=val` argument, but also to find the `val` part of the string.

```c
    else if ((pfxlen = is_prefixed(a, "--template=")) > 0)
      template = a + pfxlen;
    else if (!strcmp(a, "--separate-git-dir"))
      gitdir = argv[++i];
    else if ((pfxlen = is_prefixed(a, "--separate-git-dir=")) > 0)
      gitdir = a + pfxlen;
    else if (!strcmp(a, "--shared"))
      shared = GIT_REPOSITORY_INIT_SHARED_GROUP;
    else if ((pfxlen = is_prefixed(a, "--shared=")) > 0)
      shared = parse_shared(a + pfxlen);
    else if (!strcmp(a, "--initial-commit"))
      initial_commit = 1;
    else
      usage("unknown option", a);
  }
  
  if (!dir)
    usage("must specify directory to init", NULL);
```

Now for the meat of the program; let's initialize that repository.
If we were called with no options, we can use the simplest API for doing this, since its defaults match those of the command line.

```c
  if (no_options) {
    if (git_repository_init(&repo, dir, 0) < 0)
      fail("Could not initialize repository", dir);
  } else {
```

If the situation is more complex, you can use the extended API to handle it.
The fields in [the options structure](http://libgit2.github.com/libgit2/#HEAD/type/git_repository_init_options) are designed to provide much of what `git init` does.
Note that it's important to use the `_INIT` structure initializers; these structures have version numbers so future libgit2's can maintain backwards compatibility.

```c
    git_repository_init_options opts = GIT_REPOSITORY_INIT_OPTIONS_INIT;

    if (bare)
      opts.flags |= GIT_REPOSITORY_INIT_BARE;
    if (template) {
      opts.flags |= GIT_REPOSITORY_INIT_EXTERNAL_TEMPLATE;
      opts.template_path = template;
    }
```

Libgit2's repository is always oriented at the `.git` directory, so specifying an external git directory turns things a bit upside-down:

```c
    if (gitdir) {
      opts.workdir_path = dir;
      dir = gitdir;
    }
    if (shared != 0)
      opts.mode = shared;

    if (git_repository_init_ext(&repo, dir, &opts) < 0)
      fail("Could not initialize repository", dir);
  }
  
  if (!quiet) {
    if (bare || gitdir)
      dir = git_repository_path(repo);
    else
      dir = git_repository_workdir(repo);
    printf("Initialized empty Git repository in %s\n", dir);
  }
```

If we get this far, the initialization is done.
This example goes one step farther than git, by providing an option to create an empty initial commit.
The body of this function is [below](#toc_4).

```c
  if (initial_commit) {
    create_initial_commit(repo);
    printf("Created empty initial commit\n");
  }
```

Now to clean up our mess; C isn't your mother.
Unless the docs specifically say otherwise, any non-`const` pointer that's filled in by libgit2 needs to be freed by the caller.

```c
  git_repository_free(repo);
  git_threads_shutdown();
  return 0;
}
```

## Creating the Initial Commit

First, we declare all of our variables, which might give you a clue as to what's coming.

```c
static void create_initial_commit(git_repository *repo)
{
  git_signature *sig;
  git_index *index;
  git_oid tree_id, commit_id;
  git_tree *tree;
```

Next, we generate a commit signature using the values in the user's config, and timestamp of right now.

```c
  if (git_signature_default(&sig, repo) < 0)
    fail("Unable to create a commit signature. "
         "Perhaps 'user.name' and 'user.email' are not set.");
```

Now we store the index's tree into the ODB to use for the commit.
Since the repo was *just* initialized, the index has an empty tree.

```c
  if (git_repository_index(&index, repo) < 0)
    fail("Could not open repository index", NULL);
  if (git_index_write_tree(&tree_id, index) < 0)
    fail("Unable to write initial tree from index", NULL);
  git_index_free(index);
```

It's worth noting that this doesn't actually write the index to disk.
There's a separate call for that: [`git_index_write`](http://libgit2.github.com/libgit2/#HEAD/group/index/git_index_write).
All this code does is use the empty index to get the SHA-1 hash of the empty tree.

Okay, now we have the empty tree's SHA-1 hash, but we need an actual `git_tree` object to create a commit.

```c
  if (git_tree_lookup(&tree, repo, &tree_id) < 0)
    fail("Could not look up empty tree", NULL);
```

**Now** we're ready to write the initial commit.
Normally you'd look up `HEAD` to use as the parent, but this commit will have no parents.

```c
  if (git_commit_create_v(&commit_id, repo, "HEAD", sig, sig,
                          NULL, "Initial commit", tree, 0) < 0)
    fail("Could not create the initial commit", NULL);
```

And (of course) clean up our mess.

```c
  git_tree_free(tree);
  git_signature_free(sig);
}
```

## Fin

If you compile and run this program, you'll get output something like this:

```bash
$ mkdir ./foo
$ ./init --initial-commit ./foo
Initialized empty Git repository in /tmp/foo/
Created empty initial commit
$ cd foo
$ git log
commit 156cebb6100829b61b757d7ade498b664d20ee4b
Author: Ben Straub <bs@github.com>
Date:   Sat Oct 5 20:59:50 2013 -0700

    Initial commit
```

## What's next?
Go [back to the Learning center](/docs) for more, or check out [the API documentation](http://libgit2.github.com/libgit2/).
