---
layout: default
---

# Security Information

Information about security advisories affecting libgit2 and the releases that
provide resolution.

In case you think to have found a security issue with libgit2, please do not
open a public issue. Instead, you can report the issue to the private mailing
list [security@libgit2.org](mailto:security@libgit2.org).

* **[libgit2 v0.26.7](https://github.com/libgit2/libgit2/releases/tag/v0.26.7)** and **[libgit2 v0.27.5](https://github.com/libgit2/libgit2/releases/tag/v0.27.5)**, October 5th, 2018  

  - Submodule URLs and paths with a leading "-" are now ignored. This is due to
    the recently discovered CVE-2018-17456, which can lead to arbitrary code
    execution in upstream git. While libgit2 itself is not vulnerable, it can be
    used to inject options in an implementation which performs a recursive clone
    by executing an external command.

  - Submodule URLs and paths with a leading "-" are now ignored. This is due to
    the recently discovered CVE-2018-17456, which can lead to arbitrary code
    execution in upstream git. While libgit2 itself is not vulnerable, it can be
    used to inject options in an implementation which performs a recursive clone
    by executing an external command.

  - When running repack while doing repo writes, `packfile_load__cb()` could see
    some temporary files in the directory that were bigger than the usual, and
    makes memcmp overflow on the p->pack_name string. This issue was reported
    and fixed by bisho.

  - The fix to the unbounded recursion introduced a memory leak in the config
    parser. While this leak was never in a public release, the oss-fuzz project
    reported this as issue 10127. The fix was implemented by Nelson Elhage and
    Patrick Steinhardt

  - When parsing "ok" packets received via the smart protocol, our parsing code
    did not correctly verify the bounds of the packets, which could result in a
    heap-buffer overflow. The issue was reported by the oss-fuzz project, issue
    9749 and fixed by Patrick Steinhardt.

  - The parsing code for the smart protocol has been tightened in general,
    fixing heap-buffer overflows when parsing the packet type as well as for
    "ACK" and "unpack" packets. The issue was discovered and fixed by Patrick
    Steinhardt.

  - Fixed potential integer overflows on platforms with 16 bit integers when
    parsing packets for the smart protocol. The issue was discovered and fixed
    by Patrick Steinhardt.

  - Fixed potential NULL pointer dereference when parsing configuration files
    which have "include.path" or "includeIf..path" statements without a value.

* **[libgit2 v0.26.6](https://github.com/libgit2/libgit2/releases/tag/v0.26.6)** and **[libgit2 v0.27.4](https://github.com/libgit2/libgit2/releases/tag/v0.27.4)**, August 6th, 2018  
This is a security release fixing out-of-bounds reads when processing
smart-protocol "ng" packets. The issue was discovered by the oss-fuzz project,
issue 9406.

* **[libgit2 v0.26.5](https://github.com/libgit2/libgit2/releases/tag/v0.26.5)** and **[libgit2 v0.27.3](https://github.com/libgit2/libgit2/releases/tag/v0.27.3)**, July 9th, 2018  
These releases fix out-of-bounds reads when reading objects from a packfile.
This corresponds to CVE-2018-10887 and CVE-2018-10888, which were both reported
by Riccardo Schirone.<br/><br/>
A specially-crefted delta object in a packfile could trigger an integer overflow
and thus bypass our input validation, potentially leading to objects containing
copies of system memory being written into the object database.

* **[libgit2 v0.26.4](https://github.com/libgit2/libgit2/releases/tag/v0.26.4)**, June 4th, 2018  
Fixes insufficient validation of submodule names (CVE-2018-11235, reported by
Etienne Stalmans) same as v0.27.1.

 * **[libgit2 v0.27.1](https://github.com/libgit2/libgit2/releases/tag/v0.27.1)**, May 29th, 2018  
Ignores submodule configuration entries with names which attempt to perform path
traversal and can be exploited to write to an arbitrary path or for remote code
execution. `libgit2` itself is not vulnerable to RCE but tool implementations
which execute hooks after fetching might be. This is CVE-2018-11235.<br/><br/>
 It is forbidden for a `.gitmodules` file to be a symlink which could cause a Git
implementation to write outside of the repository and and bypass the fsck checks
for CVE-2018-11235.

 * **[libgit2 v0.26.2](https://github.com/libgit2/libgit2/releases/tag/v0.26.2)**, March 8th, 2018  
Fixes memory handling issues when reading crafted repository index files. The
issues allow for possible denial of service due to allocation of large memory
and out-of-bound reads.<br/><br/>
 As the index is never transferred via the network, exploitation requires an
attacker to have access to the local repository.

 * **[libgit2 v0.26.1](https://github.com/libgit2/libgit2/releases/tag/v0.26.1)**, March 7th, 2018  
Updates the bundled zlib to 1.2.11. Users who build the bundled zlib are
vulnerable to security issues in the prior version.<br/><br/>
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
