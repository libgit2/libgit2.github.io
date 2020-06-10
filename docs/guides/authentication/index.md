---
layout: default
---

# Authenticating against a server

One of the big issues you have to deal with when working with
other people using Git is authenticating to the server you want to
fetch from or push to. In this post we'll explore how libgit2 deals
with presenting the different authentication possibilities across
transport and platforms.

The first place where you can specify the username and password to use
is in the URL. This can be useful in cases where these are always
known, e.g. in specialised scripts which perform some very specific
task. For most uses, however, you do want the ability to specify
the username and password (or keypair) during the request. An
application might want to even go and ask the human sitting at the
computer for the credentials to the server or it might retrieve the
credentials from its own storage area. To handle this cases, you need
to specify a callback in order for libgit2 to be able to call your
code when it needs to find out about the user's credentials.

The callback is provided via the `credentials` field in the
`git_remote_callbacks` structure. This structure is embedded in both
`git_fetch_options` and `git_push_options` so you can specify it to
both operations.

When libgit2 connects to the server, it may ask for the user's
credentials before performing the operation (this is always the case
for SSH). libgit2 will try to get the information from two places:

1. The URL. If there is a username/password combination in it, it will
   try to use that first. For SSH, it will use that username during
   the initial query as well.
2. The caller-provided credentials callback. This callback gets the
   url and the username from the URL. This can be used to pre-fill a
   dialog with the data already in the URL.

If the server doesn't accept the credentials from the callback, it
will be called again. The callback drives the authentication loop. It
will get called until it returns credentials accepted by the server or
it returns an error code.

If the connection is over SSH, libgit2 needs to know which username
will be used before it can know which authentication methods are
available. If one is not provided on the URL, libgit2 will ask the
credentials callback as well, with a supported credential type of
`GIT_CREDTYPE_USERNAME`. libgit2 can then query the server for which
authentication types it supports and will call the credentials
callback again with those types. SSH servers won't allow a username to
be changed within one session, so the username in the URL or provided
in the callback must be the one which is used for whichever
credentials are returned (the RFC leaves this open, but servers in
practice behave this way).

The credentials are returned using the same pattern which libgit2 uses
for its API: the first parameter is an output parameter and the `int`
return value determines success or failure. A typicall callback would
hand off control to the UI (or other retrieval method) to gather
information and then chain the return code to one of the credential
object's constructors. For example, if an application is only
interested in supporting user/password authentication, it can do something like:

```C
int credentials_cb(git_cred **out, const char *url, const char *username_from_url,
                   unsigned int allowed_types, void *payload)
{
    int error;
	const char *user, *pass;

    /*
     * Ask the user via the UI. On error, store the information and return GIT_EUSER which will be
	 * bubbled up to the code performing the fetch or push. Using GIT_EUSER allows the application
	 * to know it was an error from the application instead of libgit2.
     */
    if ((error = ask_user(&user, &pass, url, username_from_url, allowed_types)) < 0) {
        store_error(error);
        return GIT_EUSER;
    }

	return git_cred_userpass_plaintext_new(out, user, pass);
}
```
