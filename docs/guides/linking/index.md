---
layout: default
---

# How to Link Libgit2

There is no One True Way™ to use an open-source C library.
This article provides some guidance on how to use libgit2 with various build/project tools.


## CMake Options

If you're building from source, you'll need [CMake](http://www.cmake.org/) installed.
The CMake build system provides lots of options to configure the libgit2 build for your particular needs.
These are set by passing `-D<variable name>=<new value>` to CMake during the project-file generation step.
Here are some of the most useful:

* `BUILD_SHARED_LIBS` – This defaults to `ON`, which produces dynamic libraries (DLLs on Windows).
  Set it to `OFF` if you want the build to generate static libraries.
* `CMAKE_BUILD_TYPE` – This selects the build configuration; available options are `Debug` (the default), `Release`, and `RelWithDebInfo`.
  In the case of Visual Studio and other multi-configuration project systems, this selects the default build configuration.
* `BUILD_CLAR` – Selects whether the unit-test suite is built.
  This defaults to `ON`; set to `OFF` for a faster build.
* `THREADSAFE` – Selects whether libgit2 tries to be threadsafe.
  This defaults to `OFF`, but unless you **know** your application will only be single-threaded, it's recommended you turn it `ON`.
* `LIBGIT2_FILENAME` – Sets the basename of the output binary.
  For example, if this is set to `foo`, the output will be something like `foo.dll` or `foo.so`.
  This option is useful to know what version of libgit2 was built, if your build system doesn't embed information like that into the binary.
* `STDCALL` – (MSVC Only) The CLR and Win32 APIs expect the `stdcall` calling convention, but libgit2 by default uses the `cdecl` convention.
  Set this to `ON` if you're working with Win32 or the CLR.
* `STATIC_CRT` – (MSVC Only) By default, libgit2 will link to a DLL version of the C runtime.
  Set this to `ON` if you want the runtime functions linked statically.

## Makefile Projects

CMake can generate makefiles for GCC, Clang, MinGW, and many other environments.

### Building from Source

First, create a directory for your build files to live:

```bash
$ mkdir build
$ cd build
```

Next, use CMake to generate the makefiles.
Check out the [CMake](#toc_1) section above for some of the flags and options available.

```bash
$ cmake -G 'Unix Makefiles' ..
-- The C compiler identification is Clang 5.0.0
-- Check for working C compiler: /usr/bin/cc
-- Check for working C compiler: /usr/bin/cc -- works
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
-- Found OpenSSL: /usr/lib/libssl.dylib;/usr/lib/libcrypto.dylib (found version "0.9.8y")
http-parser was not found or is too old; using bundled 3rd-party sources.
-- Found zlib: /usr/lib/libz.dylib
-- Found PythonInterp: /opt/boxen/homebrew/bin/python (found version "2.7.3")
-- Configuring done
-- Generating done
-- Build files have been written to: /tmp/libgit2/build
```

Next up is to build the binaries.
You can have CMake do this:

```bash
$ cmake --build .
```

…or do it yourself:

```bash
$ make
```

Either way, the binaries will end up in the `build` directory (or wherever the Makefile was generated).

### Using Built Binaries

The binaries that are output from this process are dependent on the build system you're using.
On posix-type systems, the output is typically a `libgit2.so` (or `libgit2.a` if you built statically).

Using these files is dependent on your application's project system.
For a Makefile-based build, this is what you'll need:

```
CFLAGS += -I/path/to/libgit2/include
LDFLAGS += -L/path/to/libgit2/binaries
LIBRARIES += -lgit2
```

## Visual Studio

If your application is a Visual Studio project, this is probably the route you'll want to go.

### Building from Source

First, you'll need a directory for all the project and build files to go.

```
C:\libgit2> mkdir build

    Directory: C:\libgit2


Mode                LastWriteTime     Length Name
----                -------------     ------ ----
d----         10/6/2013  11:05 AM            build2

C:\libgit2> cd build
```

Next you'll need to generate the Visual Studio project files using CMake.

```
C:\libgit2\build> cmake -G "Visual Studio 11" ..
-- The C compiler identification is MSVC 17.0.60610.1
-- Check for working C compiler using: Visual Studio 11
-- Check for working C compiler using: Visual Studio 11 -- works
-- Detecting C compiler ABI info
-- Detecting C compiler ABI info - done
zlib was not found; using bundled 3rd-party sources.
-- Found PythonInterp: C:/Python27/python.exe (found version "2.7.3")
-- Configuring done
-- Generating done
-- Build files have been written to: C:/libgit2/build
```

CMake can generate files that target various versions of Visual Studio:

* VS 2010 – `Visual Studio 10`
* VS 2012 – `Visual Studio 11`
* VS 2013 – `Visual Studio 12` (presumed - which version?)

There are lots of options for the CMake project-generation step; see the [CMake](#toc_1) section above for details.
You can also specify `Visual Studio XX Win64` to build 64-bit binaries.

This will generate a `libgit2.sln` and several project files, all of which have `Debug`, `Release`, and `RelWithDebInfo` configurations.
You have many options on how to build them.


1. Just add the `git2.vcxproj` to your own solution. This allows the Visual Studio build system to determine  dependencies and output directories.
  It's not advised to tinker with the project settings, though; this file may need to be overwritten when you update the libgit2 sources.

2. Open the solution in Visual Studio, select your project configuration, and build.

3. Cmake knows how to build the project:

	```
	C:\libgit2\build> cmake --build .
	```

	…or you can use MSBuild:

	```
	C:\libgit2\build> msbuild libgit2.sln
	```

Any of these will build a `git2.dll` and `git2.lib` import library into a directory under `build` with the same name as your configuration; the default debug build will output to the `build\Debug` directory.

### Using Built Binaries

If you built libgit2 as a DLL (the default), you can bundle the produced DLL with your project, and use the `git2.dll` import library to have the linker load the DLL for you.
Or you can write your own calls to `LoadLibrary`.

If libgit2 is built as a static library, just link in the `git2.lib` file.


## Xcode

***TODO***

