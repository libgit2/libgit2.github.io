---
layout: default
---

# How to Link Libgit2

There is no One True Way™ to use an open-source C library.
This article provides some guidance on how to use libgit2 with various build/project tools.
Here's what you'll need:

* If you want to run the unit tests, you'll need a Python interpreter in your path.
  Check the [Clar](https://github.com/vmg/clar#how-does-clar-work) documentation for more on this requirement.
* If you're building from source, you'll need [CMake](http://www.cmake.org/) installed.

## CMake Options

**IMPORTANT:** It's recommended you use the `-DTHREADSAFE=ON` CMake flag for any situation where you don't *know* your application is single-threaded.

## Makefile Projects

CMake can generate makefiles for GCC, Clang, MinGW, and many other environments.


### Building from Source

### Using Built Binaries

## Visual Studio

This is the way most Windows developers will go.

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

### Building from Source

### Using Built Binaries

