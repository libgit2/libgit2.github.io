---
layout: default
---

# This Month in libgit2

## Changes since v0.20

### Reflog messages when updating a reference

For every change to a reference with a log, we must append information about the change to its log. Up to now we have left it up to the user of the library to do so, but this is not enough, as feeding the log is not optional and must be done under the reference's lock to make sure we don't race with a different update.

Functions which update references now take a signature and a message argument. This information will be put into the reflog along with the source and destination ids. If NULL is passed for either, a default will be used if it's available.

This  means that for a NULL signature, the default for the repository will be used (or unkown/unkown if there is none) and for a NULL message, the branch namespace will write about the branch operation. The reference namespace is generic, so it will use an empty message instead.

These reflogs are written to following the same rules as git: HEAD and branches (local and remote-tracking) always get them, other references must be activated explicitly (subject to `core.logallrefupdates`). Thanks to the LibGit2Sharp team for their tests in this area.


### Race conditions when updating references

Up to now, there was no way to make sure that a reference's current value is the expected one during an update. That is, to make sure that someone else hasn't changed the reference since we looked it up.

The reference creation functions have gained `_matching()` conterparts which let you specify what the expected value is. Similarly, the reference modification functions now check that the current value is the one in the reference object. If this is not the case, they return `GIT_EMODIFIED`.

### More forgiving revision walker

The revision walker would only accept pushing commits. This has been changed to accept committ-ish objects; that is, it now accepts tags which point to a commit.

It also used to return an error if a user tried to push a glob which were not all commits. This made it rather less useful than it could be, as `git_revwalk_push_glob("refs/tags/")` would return an error for any repository that had tagged trees or blobs. It now ignores pushes (or hides) for incorrect object types if these come from a glob listing.

### SSH agent support

There is now support for asking a running ssh-agent process for the credentials, via `git_cred_ssh_key_from_agent()`.

### 'oid' vs 'id'

Many places still mentioned 'oid' when referring to an id. These have been changed to 'id'. 'oid' is reserved for the data type.

### Returning strings

Strings are tricky in C. All functions returning a string (which are not accessors) do so via `git_buf`, which is a lot more confortable to handle than the buffer + length combination.

### Revert

Applying a revert of a commit can now be done with a `git_revert()` call.

### Index collisions

When adding a path to the index, we now check whether its path would represent a collision with any other existing ones (e.g. adding a directory with the same name as a file).

### Recursive fetching

The submodule code now accepts 'on-demand' as valid for 'submodule.*.fetchRecurseSubmodules'.

### Faster commit parsing

The commit parsing code tried to figure out how many parents a commit had before doing anything else in order to make sure we allocate the right amount of memory to hold them all. This is however highly inefficient, as in 99% of the time we allocate enough on the first try and it meant we were going over the same data twice for no gain.

We now ony parse the commit once, visibly improving the performance of a long revwalk.

### Better librt check

The check whether to link against librt is now made independent of the OS. This way we don't try to link against it on Android, which has the functionlity in its standard library.

### Overwriting the current branch

Trying to force-create (i.e. overwrite) the current branch is now an error.

### Supported features

`git_libgit2_capabilities()` has been renamed to `git_libgit2_features()` to avoid overloading the meaning of the `GIT_CAP` namespace. It now returns a combination of `GIT_HAS_` values.

### Anonymous remotes

"In-memory" remotes have been renamed to "anonymous", which expresses the difference more clearly. Its constructor now also has the url and fetch refspec parameters in the same order as the rest.

### Option structs

The option structs (and their initializers) have been renamed to have "options" instead of "opts" in their name.
