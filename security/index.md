---
layout: default
---

# Security Information

Information about security advisories affecting libgit2 and the releases that
provide resolution.

In case you think to have found a security issue with libgit2, please do not
open a public issue. Instead, you can report the issue to the private mailing
list [security@libgit2.org](mailto:security@libgit2.org).

 * **[libgit2 v0.26.2](https://github.com/libgit2/libgit2/releases/tag/v0.26.2)**, March 8th, 2018  
Fixes memory handling issues when reading crafted repository index files. The
issues allow for possible denial of service due to allocation of large memory
and out-of-bound reads.

As the index is never transferred via the network, exploitation requires an
attacker to have access to the local repository.

 * **[libgit2 v0.26.1](https://github.com/libgit2/libgit2/releases/tag/v0.26.1)**, March 7th, 2018  
Updates the bundled zlib to 1.2.11. Users who build the bundled zlib are
vulnerable to security issues in the prior version.

This does not affect you if you rely on a system-installed version of zlib. All
users of v0.26.0 who use the bundled zlib should upgrade to this release.

* **[libgit2 v0.24.6](https://github.com/libgit2/libgit2/releases/tag/v0.24.6)** and **[libgit2 v0.25.1](https://github.com/libgit2/libgit2/releases/tag/v0.25.1)**, January 9th, 2017  
Includes two fixes, one performs extra sanitization for some edge cases in
the Git Smart Protocol which can lead to attempting to parse outside of the
buffer.<br><br>
The second fix affects the certificate check callback. It provides a `valid`
parameter to indicate whether the native cryptographic library considered the
certificate to be correct. This parameter is always `1`/`true` before these
releases leading to a possible MITM.<br><br>
This does not affect you if you do not use the custom certificate callback
or if you do not take this value into account. This does affect you if
you use pygit2 or git2go regardless of whether you specify a certificate
check callback.

* **[libgit2 v0.22.1](https://github.com/libgit2/libgit2/releases/tag/v0.22.1)**, January 16, 2015  
Provides additional protections on symbolic links on case-insensitive
filesystems, particularly Mac OS X HFS+.
[Further reading](http://www.edwardthomson.com/blog/another-libgit2-security-update.html).

* **[libgit2 v0.21.3](https://github.com/libgit2/libgit2/releases/tag/v0.21.3)**, December 18, 2015  
Updates protections on the git repository on case-insensitive filesystems,
including Windows NTFS and Mac OS X HFS+: CVE 2014-9390.
[Further reading](https://git-blame.blogspot.co.uk/2014/12/git-1856-195-205-214-and-221-and.html).
