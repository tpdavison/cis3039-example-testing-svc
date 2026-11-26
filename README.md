# Product service testing example

A TypeScript Product API built with Azure Functions. The example shows how to test domain rules and application behaviour in isolation by supplying dependencies such as a repository and a clock.

## Set up the project

Use Visual Studio Code with Git, Docker and the Dev Containers extension installed.

1. Start Docker and wait until it is running.
2. Open VS Code. In the Command Palette, select **Git: Clone**.
3. Paste the repository URL.

   ```text
   https://github.com/tpdavison/cis3039-example-testing-svc.git
   ```

4. Choose where to save the clone. Select **Open** when VS Code prompts you to open the cloned repository. The example is on `main`.
5. In the Command Palette, select **Dev Containers: Reopen in Container**.

The course image `ghcr.io/tpdavison/devops-labs:2026-latest` includes Node.js 22, npm and Azure Functions Core Tools 4. Open a terminal in VS Code and run the commands below from the repository root. See the [Dev Container configuration](.devcontainer/devcontainer.json).

Outside the container, use Node.js 22.12 or later within the Node.js 22 release line and npm. Running the HTTP service also requires Azure Functions Core Tools 4. The HTTP examples use `curl`.

Install the versions recorded in the lockfile.

```bash
npm ci
```

To check the service, tests and Vitest configuration without writing files, run this command.

```bash
npm run typecheck
```

To compile the service into `dist/`, run the build. The build excludes test files.

```bash
npm run build
```

## Run the tests

The unit tests run in Node.js after installation. You can run them with the Functions host stopped and without Azure credentials or a database.

| Command                 | What it does                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `npm test`              | Runs the unit tests once and returns an exit status suitable for CI. |
| `npm run test:watch`    | Reruns unit tests as you edit. Press **Ctrl+C** to exit.             |
| `npm run test:coverage` | Runs the unit tests and reports which production code they exercise. |

Vitest discovers `src/**/*.test.ts`. The example starts with seven passing tests and two exercises marked `it.todo`.

| Test file                                                          | What the examples show                                                                                                                                                                        | Student exercise                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`src/domain/product.test.ts`](src/domain/product.test.ts)         | Arrange, Act, Assert. Check the values of a valid Product and verify which fields are reported for whitespace IDs, negative prices and multiple invalid inputs.                               | Verify that a zero price is valid.                                           |
| [`src/app/upsert-product.test.ts`](src/app/upsert-product.test.ts) | Check saved state using a fresh in-memory fake and a fixed clock stub. Use a spy to check that validation prevents a save. Stub a rejected save to check that the failure reaches the caller. | Use the coverage report to find and test the invalid application clock case. |

Open `coverage/index.html` after a coverage run. The report covers production TypeScript under `src/`, including files the tests never import. Test files are excluded. Use the line and branch views to find behaviour the tests have yet to exercise. The example sets no minimum coverage percentage.

The optional `npm run test:integration` command looks for `tests/integration/**/*.test.ts` in a separate run. This service ships with an empty integration suite, so that command reports no tests and exits with status 1. The frontend owns the integration test that calls this API through its HTTP adapter. See the [frontend testing example](https://github.com/tpdavison/cis3039-example-testing-app).

## Follow the code

| Location                                                           | Responsibility                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [`src/domain/`](src/domain/)                                       | Defines Product validation and the `ProductRepo` port, which describes the storage operations the application needs.           |
| [`src/app/`](src/app/)                                             | Lists and saves Products through the port. The caller supplies the repository and, for upsert, the clock.                      |
| [`src/infra/`](src/infra/)                                         | Implements the port with `FakeProductRepo`, a working in-memory adapter. A real storage adapter could implement the same port. |
| [`src/config/composition-root.ts`](src/config/composition-root.ts) | Wires the HTTP service to a shared, seeded fake and supplies the application clock.                                            |
| [`src/functions/`](src/functions/)                                 | Parses HTTP requests, calls the use cases and maps outcomes to HTTP responses.                                                 |

The Product factory returns field-specific issues for invalid inputs. The upsert use case returns those expected validation failures and lets unexpected failures, such as a rejected repository save, reach the HTTP handler. The handler returns HTTP 400 for invalid requests and a generic HTTP 500 for unexpected errors.

## Run the HTTP service locally

If `local.settings.json` is missing, copy the template. Keep your existing file if you already have one.

```bash
cp local.settings.template.json local.settings.json
```

Git ignores the local settings file. The template selects the Node.js worker and leaves `AzureWebJobsStorage` empty. The Functions host may log a storage health warning with these settings. The HTTP routes and in-memory repository can run without a storage account.

Start the Functions host.

```bash
npm start
```

`npm start` cleans and rebuilds `dist/` before starting the Functions host. Keep this terminal open. From a second terminal in the same environment, use the port printed by the host. The default is `7071`.

```bash
curl -i http://localhost:7071/api/products
```

Expect HTTP 200 and an array of Products. Each entry has `id`, `name`, `pricePence`, `description` and an ISO 8601 `updatedAt` timestamp. A fresh host starts with these records.

| ID      | Name          | Price in pence |
| ------- | ------------- | -------------: |
| `p-001` | Seeded Widget |         `1299` |
| `p-002` | Seeded Gadget |         `2599` |

Seed timestamps vary between starts. Use the known IDs and values when checking seed data, since the API does not promise a particular order. Writes are held in the worker's memory. Restarting the host discards changes and restores the two seed records.

Both `POST` and `PUT` to `/api/products` create or replace a Product using the `id` in the request body. Send `id`, `name` and `description` as nonblank strings and `pricePence` as a non-negative safe integer. The service supplies `updatedAt`. Try the valid sample first.

```bash
curl -i -H 'Content-Type: application/json' --data-binary @samples/product-post.json http://localhost:7071/api/products
```

Expect HTTP 200 and the saved `product-123`. Run the GET command again to see the new Product. Then try the invalid sample.

```bash
curl -i -H 'Content-Type: application/json' --data-binary @samples/product-post-invalid.json http://localhost:7071/api/products
```

Expect HTTP 400 for a negative price. Stop the host with **Ctrl+C** when finished.

## Add Vitest to another TypeScript service

1. Check the Node.js and TypeScript versions your project already uses. This example uses matching versions of Vitest and its V8 coverage provider. On a compatible Node.js 22 project, install the same versions and keep the updated lockfile.

   ```bash
   npm install --save-dev vitest@5.1.2 @vitest/coverage-v8@5.1.2
   ```

2. Use [the isolated test configuration](vitest.config.mts) as a starting point. Select the Node environment, specify the test file pattern and limit coverage to your own production sources. Add the test scripts alongside your existing build and start scripts. Vue component tests need a Vue-aware setup and a DOM environment.
3. Keep the production TypeScript settings. Exclude test files from the build and use a separate `noEmit` configuration that extends the production configuration and includes the tests. Have your typecheck command check both. Exclude test files, configuration and coverage output from your publish package. See [the build config](tsconfig.json), [test config](tsconfig.test.json) and [publish exclusions](.funcignore).
4. Write tests against your own public behaviour. Use the dependencies your code already accepts and assert the result shape it actually returns. Run typechecking, tests and coverage before adding a test step to an existing workflow.

## Work in your own private copy

A local clone is enough to explore, run or edit the example on your machine. To push your changes or practise CI, create an empty **private** GitHub repository with a name of your choice. Leave GitHub's README, licence and `.gitignore` options unselected so you can push the history you already cloned.

Replace the placeholder URL with your private repository's HTTPS URL. If you already work in your own private copy, continue there.

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_PRIVATE_REPOSITORY.git
```

Check that both `origin` URLs point to your private repository.

```bash
git remote -v
```

Check that the current branch is `main`.

```bash
git branch --show-current
```

Once both checks match, push your branch.

```bash
git push -u origin main
```

If you add CI in your private copy, build first with `npm run build`, then use `npm test` to check behaviour. The [Week 9 build workflow](https://github.com/tpdavison/cis3039-example-cicd-svc/blob/main/.github/workflows/build.yml) is a starting point.
