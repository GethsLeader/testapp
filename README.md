TestApp
=======

Description
-----------

Simple test application for test Angular framework and other chained stuff xD

Technology stack
----------------

* __Angular__ as frontend framework
* __TypeScript__ as ts compiler
* __Babel__ as js compiler
* __Less__ as styles compiler
* __Webpack__ as bundler
* __Jasmine__ as tests framework

Install
-------

##### TypeScript:

```
npm install -g typescript

npm link typescript
```

##### Webpack:

```
npm install -g webpack

npm link webpack
```

##### Less:

```
npm install -g less

npm link less
```

##### Internal modules:

```
npm install
```

Build
-----

##### Full single-run build:

```
npm run build
```

##### Development webpack server (at `http://localhost:8000`) with code-watch ability:

```
npm run watch
```

Test
----

If application was build/watch with __test__ in environment variables __WEBPACK_ENV__ or __NODE_ENV__ tests will available at:
* `http://localhost:8001` for development webpack server;
* `dist/specs.html` for single-run build.